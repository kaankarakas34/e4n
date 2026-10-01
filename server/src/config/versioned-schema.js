import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './db.js';
import { runMigrations } from './migrate.js';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const initSource = readFileSync(path.join(serverDir, 'init.sql'), 'utf8');
const seedMarker = '-- SEED DATA (Örnek Veriler)';
if (!initSource.includes(seedMarker)) throw new Error('init.sql seed boundary was not found');
const initSql = initSource.split(seedMarker)[0];
const runtimeSource = readFileSync(path.join(serverDir, 'src/config/migrate.js'), 'utf8');
const legacySql = readFileSync(path.join(serverDir, 'migrations/0003_legacy_tables.sql'), 'utf8');

function checksum(source) {
  return createHash('sha256').update(source).digest('hex');
}

const versions = [
  { version: '0001_init_schema', checksum: checksum(initSql), apply: client => client.query(initSql) },
  { version: '0002_runtime_extensions', checksum: checksum(runtimeSource), apply: client => runMigrations(client) },
  { version: '0003_legacy_tables', checksum: checksum(legacySql), apply: client => client.query(legacySql) },
];

// Rehearsal only: existing unversioned databases need a separately reviewed baseline adoption.
export async function applyVersionedSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(4020, 1)');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    const { rows: appliedRows } = await client.query('SELECT version, checksum FROM schema_migrations');
    const appliedByVersion = new Map(appliedRows.map(row => [row.version, row.checksum]));
    if (appliedRows.length === 0) {
      const { rows } = await client.query(`
        SELECT COUNT(*)::int AS count FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> 'schema_migrations'
      `);
      if (rows[0].count !== 0) {
        throw new Error('Existing unversioned schema requires reviewed baseline adoption');
      }
    }
    for (const version of appliedByVersion.keys()) {
      if (!versions.some(item => item.version === version)) throw new Error(`Unknown schema version: ${version}`);
    }
    let missingEarlierVersion = false;
    for (const item of versions) {
      if (!appliedByVersion.has(item.version)) missingEarlierVersion = true;
      else if (missingEarlierVersion) throw new Error(`Out-of-order schema history at ${item.version}`);
    }

    const newlyApplied = [];
    for (const item of versions) {
      const recorded = appliedByVersion.get(item.version);
      if (recorded) {
        if (recorded !== item.checksum) throw new Error(`Schema version checksum changed: ${item.version}`);
        continue;
      }
      await item.apply(client);
      await client.query('INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)', [item.version, item.checksum]);
      newlyApplied.push(item.version);
    }
    await client.query('COMMIT');
    return { applied: newlyApplied, totalVersions: versions.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
