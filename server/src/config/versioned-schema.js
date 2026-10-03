import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './db.js';
import { runMigrations } from './migrate.js';
import { readPublicSchemaCatalog } from './schema-catalog.js';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const initSource = readFileSync(path.join(serverDir, 'init.sql'), 'utf8');
const seedMarker = '-- SEED DATA (Örnek Veriler)';
if (!initSource.includes(seedMarker)) throw new Error('init.sql seed boundary was not found');
const initSql = initSource.split(seedMarker)[0];
const runtimeSource = readFileSync(path.join(serverDir, 'migrations/0002_runtime_extensions.js'), 'utf8');
const legacySql = readFileSync(path.join(serverDir, 'migrations/0003_legacy_tables.sql'), 'utf8');
const notificationSql = readFileSync(path.join(serverDir, 'migrations/0004_notifications_contract.sql'), 'utf8');
const publicVisitorInviterSql = readFileSync(path.join(serverDir, 'migrations/0005_public_visitor_inviter.sql'), 'utf8');
const registrationConsentsSql = readFileSync(path.join(serverDir, 'migrations/0006_registration_consents.sql'), 'utf8');

const meetingRequestsSql = readFileSync(path.join(serverDir, 'migrations/0007_meeting_requests.sql'), 'utf8');
const paymentInitiationSql = readFileSync(path.join(serverDir, 'migrations/0008_payment_initiation.sql'), 'utf8');
const supportMutationsSql = readFileSync(path.join(serverDir, 'migrations/0009_support_mutations.sql'), 'utf8');

function checksum(source) {
  return createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex');
}

const versions = [
  { version: '0001_init_schema', checksum: checksum(initSql), apply: client => client.query(initSql) },
  { version: '0002_runtime_extensions', checksum: checksum(runtimeSource), apply: client => runMigrations(client) },
  { version: '0003_legacy_tables', checksum: checksum(legacySql), apply: client => client.query(legacySql) },
  { version: '0004_notifications_contract', checksum: checksum(notificationSql), apply: client => client.query(notificationSql) },
  { version: '0005_public_visitor_inviter', checksum: checksum(publicVisitorInviterSql), apply: client => client.query(publicVisitorInviterSql) },
  { version: '0006_registration_consents', checksum: checksum(registrationConsentsSql), apply: client => client.query(registrationConsentsSql) },
  { version: '0007_meeting_requests', checksum: checksum(meetingRequestsSql), apply: client => client.query(meetingRequestsSql) },
  { version: '0008_payment_initiation', checksum: checksum(paymentInitiationSql), apply: client => client.query(paymentInitiationSql) },
  { version: '0009_support_mutations', checksum: checksum(supportMutationsSql), apply: client => client.query(supportMutationsSql) },
];

// Captured twice from init.sql without demo seeds on isolated PostgreSQL 17.11.
// This is only a known legacy Docker starting point, not the live Supabase schema.
const legacyInitCatalogChecksum = 'd7a001bc5a1dbb9361108c811ae610f8266da31a5e84fdc0530949f8ae616f09';
const legacyInitSourceChecksum = 'e0946a07494ee6bbce09bfc0d7c5bb934d0937b1db7d7b902d1b5090ced9c947';

// Rehearsal only. Live Supabase requires a separately reviewed migration path.
export async function applyVersionedSchema({ dbPool = pool, adoptLegacyInit = false } = {}) {
  const client = await dbPool.connect();
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
    let adoptedLegacyInit = false;
    if (appliedRows.length === 0) {
      const { rows } = await client.query(`
        SELECT COUNT(*)::int AS count FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> 'schema_migrations'
      `);
      if (rows[0].count !== 0) {
        if (!adoptLegacyInit) throw new Error('Existing unversioned schema requires reviewed baseline adoption');
        if (versions[0].checksum !== legacyInitSourceChecksum) {
          throw new Error('init.sql changed since the legacy adoption baseline was reviewed');
        }
        const catalog = await readPublicSchemaCatalog(client);
        if (checksum(JSON.stringify(catalog)) !== legacyInitCatalogChecksum) {
          throw new Error('Existing schema does not match the known init.sql baseline');
        }
        await client.query('INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
          [versions[0].version, versions[0].checksum]);
        appliedByVersion.set(versions[0].version, versions[0].checksum);
        adoptedLegacyInit = true;
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
    return { applied: newlyApplied, adoptedLegacyInit, totalVersions: versions.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
