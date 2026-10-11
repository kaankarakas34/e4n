import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-sec01-${randomUUID().slice(0, 8)}`;
const dbName = 'e4n_isolated_test';
const dbUser = 'e4n_isolated_test';
const dbPassword = 'local_fixture_only';
let pool;
let containerStarted = false;

function docker(args, { input, timeout = 30_000 } = {}) {
  const result = spawnSync('docker', args, {
    cwd: serverDir,
    encoding: 'utf8',
    input,
    timeout,
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Docker ${args[0]} failed: ${(result.stderr || result.error?.message || '').trim()}`);
  }
  return result.stdout.trim();
}

async function waitForPostgres() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = spawnSync('docker', ['exec', container, 'pg_isready', '-U', dbUser, '-d', dbName], {
      encoding: 'utf8', timeout: 5_000, windowsHide: true,
    });
    if (result.status === 0) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Isolated PostgreSQL did not become ready within 30 seconds');
}

async function main() {
  docker([
    'run', '--rm', '-d', '--pull=never', '--name', container,
    '-e', `POSTGRES_USER=${dbUser}`,
    '-e', `POSTGRES_PASSWORD=${dbPassword}`,
    '-e', `POSTGRES_DB=${dbName}`,
    '-p', '127.0.0.1::5432', 'postgres:17',
  ], { timeout: 60_000 });
  containerStarted = true;
  await waitForPostgres();

  const portOutput = docker(['port', container, '5432/tcp']);
  const port = Number(portOutput.match(/127\.0\.0\.1:(\d+)/)?.[1]);
  if (!Number.isInteger(port) || port <= 0) throw new Error('Could not determine isolated loopback port');

  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.SUPABASE_DB_URL;
  process.env.DOTENV_CONFIG_PATH = path.join(serverDir, 'test', '.nonexistent-env');
  process.env.DB_HOST = '127.0.0.1';
  process.env.DB_PORT = String(port);
  process.env.DB_USER = dbUser;
  process.env.DB_PASSWORD = dbPassword;
  process.env.DB_NAME = dbName;
  process.env.NODE_ENV = 'test';
  process.env.VERCEL = '1';

  ({ default: pool } = await import('../src/config/db.js'));
  let databaseReady = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      databaseReady = true;
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  if (!databaseReady) throw new Error('Isolated PostgreSQL did not accept a SQL connection');

  // 1. Apply 28 versioned migrations cleanly
  const { applyVersionedSchema } = await import('../src/config/versioned-schema.js');
  const migrationResult = await applyVersionedSchema();
  assert.equal(migrationResult.applied.length, 28, 'Expected 28 migrations applied');
  const idempotencyCheck = await applyVersionedSchema();
  assert.equal(idempotencyCheck.applied.length, 0, 'Subsequent run must apply 0 migrations');

  // 2. Query all public tables
  const { rows: tableRows } = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> 'schema_migrations'
    ORDER BY table_name
  `);
  assert.equal(tableRows.length, 50, `Expected 50 application tables, found ${tableRows.length}`);
  const tableNames = tableRows.map(r => r.table_name);

  // 3. Set up Supabase roles if not present
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
      END IF;
    END $$;
  `);

  // 4. Apply Complete Security Plan (from server/supabase_security_plan.sql)
  const planSql = readFileSync(path.join(serverDir, 'supabase_security_plan.sql'), 'utf8');
  await pool.query(planSql);

  // 5. Query RLS status and privileges across all 50 tables
  const { rows: rlsRows } = await pool.query(`
    SELECT c.relname AS table_name,
           c.relrowsecurity AS rls_enabled,
           c.relforcerowsecurity AS rls_forced,
           pg_catalog.pg_get_userbyid(c.relowner) AS owner
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname <> 'schema_migrations'
    ORDER BY c.relname
  `);

  const rlsMap = new Map(rlsRows.map(r => [r.table_name, r]));

  // Verify that ALL 50 tables now have RLS enabled (0 exceptions)
  assert.equal(rlsRows.filter(r => r.rls_enabled).length, 50, 'All 50 tables must have RLS enabled');

  // 6. Test privileges for 'anon' and 'authenticated' on each table
  const auditReport = [];
  const sensitiveDeniedTables = [];

  for (const tableName of tableNames) {
    const isBlog = ['blogs', 'blog_categories'].includes(tableName);
    const rls = rlsMap.get(tableName);

    const privResult = await pool.query(`
      SELECT 
        has_table_privilege('anon', $1, 'SELECT') AS anon_select,
        has_table_privilege('anon', $1, 'INSERT') AS anon_insert,
        has_table_privilege('anon', $1, 'UPDATE') AS anon_update,
        has_table_privilege('anon', $1, 'DELETE') AS anon_delete,
        has_table_privilege('authenticated', $1, 'SELECT') AS auth_select,
        has_table_privilege('authenticated', $1, 'INSERT') AS auth_insert,
        has_table_privilege('authenticated', $1, 'UPDATE') AS auth_update,
        has_table_privilege('authenticated', $1, 'DELETE') AS auth_delete
    `, [tableName]);

    const p = privResult.rows[0];

    // For non-blog tables (48 tables): RLS must be ENABLED and all anon/auth privileges must be false
    if (!isBlog) {
      assert.equal(rls.rls_enabled, true, `Table ${tableName} must have RLS enabled`);
      assert.equal(p.anon_select, false, `Table ${tableName} must have anon SELECT revoked`);
      assert.equal(p.anon_insert, false, `Table ${tableName} must have anon INSERT revoked`);
      assert.equal(p.anon_update, false, `Table ${tableName} must have anon UPDATE revoked`);
      assert.equal(p.anon_delete, false, `Table ${tableName} must have anon DELETE revoked`);
      assert.equal(p.auth_select, false, `Table ${tableName} must have authenticated SELECT revoked`);
      assert.equal(p.auth_insert, false, `Table ${tableName} must have authenticated INSERT revoked`);
      assert.equal(p.auth_update, false, `Table ${tableName} must have authenticated UPDATE revoked`);
      assert.equal(p.auth_delete, false, `Table ${tableName} must have authenticated DELETE revoked`);
      sensitiveDeniedTables.push(tableName);
    } else {
      // Blog tables: SELECT granted, mutations revoked
      assert.equal(rls.rls_enabled, true, `Table ${tableName} must have RLS enabled`);
      assert.equal(p.anon_select, true, `Table ${tableName} must have anon SELECT granted`);
      assert.equal(p.auth_select, true, `Table ${tableName} must have authenticated SELECT granted`);
      assert.equal(p.anon_insert, false, `Table ${tableName} must have anon INSERT revoked`);
      assert.equal(p.anon_update, false, `Table ${tableName} must have anon UPDATE revoked`);
      assert.equal(p.anon_delete, false, `Table ${tableName} must have anon DELETE revoked`);
      assert.equal(p.auth_insert, false, `Table ${tableName} must have authenticated INSERT revoked`);
      assert.equal(p.auth_update, false, `Table ${tableName} must have authenticated UPDATE revoked`);
      assert.equal(p.auth_delete, false, `Table ${tableName} must have authenticated DELETE revoked`);
    }

    auditReport.push({
      tableName,
      rlsEnabled: rls.rls_enabled,
      isBlog,
      privileges: p,
      category: classifyTable(tableName),
    });
  }

  assert.equal(sensitiveDeniedTables.length, 48, 'Expected 48 non-blog tables with revoked access and RLS');

  // 7. Verify SET LOCAL ROLE denial in transaction
  const client = await pool.connect();
  try {
    for (const testRole of ['anon', 'authenticated']) {
      await client.query('BEGIN');
      await client.query(`SET LOCAL ROLE ${testRole}`);

      // Probe sensitive tables - must throw 42501 (permission denied)
      const sensitiveProbes = ['users', 'payment_transactions', 'invoice_files', 'group_applications', 'email_configurations'];
      for (const table of sensitiveProbes) {
        const { rows: colRows } = await pool.query(
          "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position LIMIT 1",
          [table]
        );
        const colName = colRows[0].column_name;

        await client.query('SAVEPOINT sp1');
        await assert.rejects(
          client.query(`SELECT * FROM ${table} LIMIT 1`),
          err => err.code === '42501',
          `Role ${testRole} must be denied SELECT on ${table}`
        );
        await client.query('ROLLBACK TO SAVEPOINT sp1');

        await client.query('SAVEPOINT sp2');
        await assert.rejects(
          client.query(`INSERT INTO ${table} DEFAULT VALUES`),
          err => err.code === '42501',
          `Role ${testRole} must be denied INSERT on ${table}`
        );
        await client.query('ROLLBACK TO SAVEPOINT sp2');

        await client.query('SAVEPOINT sp3');
        await assert.rejects(
          client.query(`UPDATE ${table} SET ${colName} = ${colName}`),
          err => err.code === '42501',
          `Role ${testRole} must be denied UPDATE on ${table}`
        );
        await client.query('ROLLBACK TO SAVEPOINT sp3');

        await client.query('SAVEPOINT sp4');
        await assert.rejects(
          client.query(`DELETE FROM ${table}`),
          err => err.code === '42501',
          `Role ${testRole} must be denied DELETE on ${table}`
        );
        await client.query('ROLLBACK TO SAVEPOINT sp4');
      }
      await client.query('ROLLBACK');
    }
  } finally {
    client.release();
  }

  // 8. Test Database Owner (API connection) privileges:
  // The Express API connects as postgres/dbUser which owns the tables and has full access.
  const ownerProbe = await pool.query('SELECT count(*)::int AS count FROM users');
  assert.equal(typeof ownerProbe.rows[0].count, 'number', 'DB owner must have full SELECT access');

  // 9. Verify that blogs and blog_categories have RLS enabled and published-only policy in effect
  const { rows: updatedBlogRls } = await pool.query(`
    SELECT relname, relrowsecurity FROM pg_class
    WHERE relname IN ('blogs', 'blog_categories')
  `);
  assert(updatedBlogRls.every(r => r.relrowsecurity === true), 'All blog tables must have RLS enabled by the security plan');

  // Verify that an anon client can view published blogs but cannot view drafts, and cannot insert/update
  const blogClient = await pool.connect();
  try {
    // Insert a published blog and a draft blog as db owner
    const pubId = randomUUID();
    const draftId = randomUUID();
    await blogClient.query(`
      INSERT INTO blogs (id, title, slug, content, status) VALUES
      ($1, 'Published Blog', 'published-blog', 'Content', 'published'),
      ($2, 'Draft Blog', 'draft-blog', 'Secret Content', 'draft')
    `, [pubId, draftId]);

    // Now test with anon role
    await blogClient.query('BEGIN');
    await blogClient.query('SET LOCAL ROLE anon');

    const anonBlogs = await blogClient.query('SELECT id, title, status FROM blogs');
    assert.equal(anonBlogs.rows.length, 1, 'Anon must see exactly 1 published blog');
    assert.equal(anonBlogs.rows[0].id, pubId, 'Anon must see the published blog only');

    // Anon cannot insert a blog
    await blogClient.query('SAVEPOINT sp_blog_ins');
    await assert.rejects(
      blogClient.query("INSERT INTO blogs (title, slug, content) VALUES ('Hacked', 'hacked', 'Hacked')"),
      err => err.code === '42501',
      'Anon must not be able to insert blogs'
    );
    await blogClient.query('ROLLBACK TO SAVEPOINT sp_blog_ins');

    // Anon cannot update blogs
    await blogClient.query('SAVEPOINT sp_blog_upd');
    await assert.rejects(
      blogClient.query("UPDATE blogs SET title = 'Hacked' WHERE id = $1", [pubId]),
      err => err.code === '42501',
      'Anon must not be able to update blogs'
    );
    await blogClient.query('ROLLBACK TO SAVEPOINT sp_blog_upd');

    // Anon cannot delete blogs
    await blogClient.query('SAVEPOINT sp_blog_del');
    await assert.rejects(
      blogClient.query('DELETE FROM blogs WHERE id = $1', [pubId]),
      err => err.code === '42501',
      'Anon must not be able to delete blogs'
    );
    await blogClient.query('ROLLBACK TO SAVEPOINT sp_blog_del');

    await blogClient.query('ROLLBACK');
  } finally {
    blogClient.release();
  }

  // 10. Audit functions for search_path mutable warning (Supabase lint 0011_function_search_path_mutable)
  const { rows: functionRows } = await pool.query(`
    SELECT p.proname AS function_name,
           pg_get_functiondef(p.oid) AS definition,
           prosecdef AS is_security_definer,
           proconfig AS config
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname NOT LIKE 'pg_%'
    ORDER BY p.proname
  `);

  const mutableSearchPathFunctions = functionRows.filter(f => !f.config || !f.config.some(c => c.startsWith('search_path=')));

  // Write audit output
  const outputData = {
    timestamp: new Date().toISOString(),
    totalTables: tableNames.length,
    rlsStatus: {
      totalEnabled: 50,
      baselineSecuredTables: sensitiveDeniedTables.length,
      cmsEnhancedTables: 2,
    },
    tables: auditReport,
    functionsAudited: functionRows.length,
    functionsWithMutableSearchPath: mutableSearchPathFunctions.map(f => f.function_name),
    architecture: {
      type: 'API-Owner (Express / Node.js) with Complete PostgREST Denial',
      dbOwnerBypass: true,
      anonDirectAccess: 'DENIED_ON_ALL_APPLICATION_TABLES',
      authenticatedDirectAccess: 'DENIED_ON_ALL_APPLICATION_TABLES',
      cmsPolicy: 'SELECT_ONLY_FOR_PUBLISHED_CONTENT',
    },
  };

  const reportPath = path.join(serverDir, 'docs/sec-01-rls-access-report.json');
  writeFileSync(reportPath, JSON.stringify(outputData, null, 2));

  console.log(`SEC-01 PASS: 50/50 tables verified. 48 sensitive tables RLS + REVOKE ALL. 2 CMS tables RLS + published-only policy verified. Output written to ${reportPath}`);
}

function classifyTable(tableName) {
  if (['users', 'company_tax_registry', 'normal_membership_role_transition', 'email_configurations'].includes(tableName)) {
    return 'CRITICAL_CREDENTIALS_AND_PII';
  }
  if (['payment_transactions', 'invoice_files'].includes(tableName)) {
    return 'FINANCIAL_AND_TRANSACTIONAL';
  }
  if (['group_applications', 'group_application_mail', 'group_membership_history', 'shuffle_execution_history', 'user_score_history', 'web_job_runs', 'support_mutations', 'direct_messages', 'tickets', 'ticket_messages'].includes(tableName)) {
    return 'SENSITIVE_WORKFLOW_AND_AUDIT';
  }
  if (['blogs', 'blog_categories'].includes(tableName)) {
    return 'PUBLIC_CMS_CONTENT';
  }
  if (['education', 'courses', 'lessons', 'materials', 'exams', 'questions', 'exam_attempts', 'enrollments', 'achievements', 'user_achievements'].includes(tableName)) {
    return 'LMS_MODULE_POSTPONED';
  }
  return 'CORE_OPERATIONAL_RELATIONS';
}

main().catch(error => {
  console.error('SEC-01 Contract Failed:', error);
  process.exitCode = 1;
}).finally(async () => {
  if (pool) await pool.end().catch(() => {});
  if (containerStarted) {
    try {
      spawnSync('docker', ['rm', '-f', container], { stdio: 'ignore' });
    } catch {}
  }
});
