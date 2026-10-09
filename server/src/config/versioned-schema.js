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
const scoreHistorySql = readFileSync(path.join(serverDir, 'migrations/0010_score_history.sql'), 'utf8');

const directMessagesSql = readFileSync(path.join(serverDir, 'supabase/migrations/20261004160911_direct_messages.sql'), 'utf8');

function checksum(source) {
  return createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex');
}

const documentsSql = readFileSync(path.join(serverDir, 'supabase/migrations/20261005055302_document_library.sql'), 'utf8');

const invoicesSql = readFileSync(path.join(serverDir, 'supabase/migrations/20261005062305_invoice_files.sql'), 'utf8');
const groupSettingsSql = readFileSync(path.join(serverDir, 'migrations/0014_group_meeting_settings.sql'), 'utf8');
const groupMembershipStateSql = readFileSync(path.join(serverDir, 'supabase/migrations/20261005141434_group_membership_state.sql'), 'utf8');
const groupCapacityInvariantSql = readFileSync(path.join(serverDir, 'supabase/migrations/20261007111807_group_capacity_invariant.sql'), 'utf8');
const subscriptionReminderDeliverySql = readFileSync(path.join(serverDir, 'supabase/migrations/20261007115111_subscription_reminder_delivery.sql'), 'utf8');
const webJobRunsSql = readFileSync(path.join(serverDir, 'supabase/migrations/20261007165758_web_job_runs.sql'), 'utf8');
const shuffleExecutionSql = readFileSync(path.join(serverDir, 'supabase/migrations/20261007172331_shuffle_execution_history.sql'), 'utf8');
const membershipHistorySql = readFileSync(path.join(serverDir, 'supabase/migrations/20261007181257_group_membership_history.sql'), 'utf8');
const eventRegistrationStatusSql = readFileSync(path.join(serverDir, 'supabase/migrations/20261008081425_event_registration_status.sql'), 'utf8');
const eventAttendanceVerificationSql = readFileSync(path.join(serverDir, 'supabase/migrations/20261008092049_event_attendance_verification.sql'), 'utf8');
const selfProfileFieldsSql = readFileSync(path.join(serverDir, 'supabase/migrations/20261008145443_self_profile_fields.sql'), 'utf8');
const groupMeetingAttendanceSql = readFileSync(path.join(serverDir, 'supabase/migrations/20261008191226_group_meeting_attendance.sql'), 'utf8');
const normalRegistrationSql=readFileSync(path.join(serverDir,'supabase/migrations/20261009083750_open_normal_registration.sql'),'utf8');
const membershipContextSql=readFileSync(path.join(serverDir,'supabase/migrations/20261009073843_membership_operation_context.sql'),'utf8');
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
  { version: '0010_score_history', checksum: checksum(scoreHistorySql), apply: client => client.query(scoreHistorySql) },
  { version: '0011_direct_messages', checksum: checksum(directMessagesSql), apply: client => client.query(directMessagesSql) },
  { version: '0012_document_library', checksum: checksum(documentsSql), apply: client => client.query(documentsSql) },
  { version: '0013_invoice_files', checksum: checksum(invoicesSql), apply: client => client.query(invoicesSql) },
  { version: '0014_group_meeting_settings', checksum: checksum(groupSettingsSql), apply: client => client.query(groupSettingsSql) },
  { version: '0015_group_membership_state', checksum: checksum(groupMembershipStateSql), apply: client => client.query(groupMembershipStateSql) },
  { version: '0016_group_capacity_invariant', checksum: checksum(groupCapacityInvariantSql), apply: client => client.query(groupCapacityInvariantSql) },
  { version: '0017_subscription_reminder_delivery', checksum: checksum(subscriptionReminderDeliverySql), apply: client => client.query(subscriptionReminderDeliverySql) },
  { version: '0018_web_job_runs', checksum: checksum(webJobRunsSql), apply: client => client.query(webJobRunsSql) },
  { version: '0019_shuffle_execution_history', checksum: checksum(shuffleExecutionSql), apply: client => client.query(shuffleExecutionSql) },
  { version: '0020_group_membership_history', checksum: checksum(membershipHistorySql), apply: client => client.query(membershipHistorySql) },
  { version: '0021_event_registration_status', checksum: checksum(eventRegistrationStatusSql), apply: client => client.query(eventRegistrationStatusSql) },
  { version: '0022_event_attendance_verification', checksum: checksum(eventAttendanceVerificationSql), apply: client => client.query(eventAttendanceVerificationSql) },
  { version: '0023_self_profile_fields', checksum: checksum(selfProfileFieldsSql), apply: client => client.query(selfProfileFieldsSql) },
  { version: '0024_group_meeting_attendance', checksum: checksum(groupMeetingAttendanceSql), apply: client => client.query(groupMeetingAttendanceSql) },
  { version: '0025_membership_operation_context', checksum: checksum(membershipContextSql), apply: client => client.query(membershipContextSql) },
  { version: '0026_open_normal_registration', checksum: checksum(normalRegistrationSql), apply: client => client.query(normalRegistrationSql) },
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
