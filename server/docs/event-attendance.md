# Administrator event attendance

## Scope

An existing database ADMIN can explicitly observe an existing registration for a started PUBLISHED or COMPLETED non-education event. This flow does not assign president powers, charge a payment, send mail, or calculate scores. REGISTERED retracts the observation; registration totals and tickets remain unchanged. Historical PRESENT rows are not backfilled into evidence.

## API and web

- GET /api/admin/events/:id/attendance-snapshot: private/no-store; current database role; read-only repeatable-read event, participants and last 50 observations plus totalHistory. More than 1000 participants returns 503, not a partial success. Legacy six attendance statuses remain readable.
- PUT /api/admin/events/:id/attendance/:userId: exact body {expectedStatus, expectedVersion, reason, requestId, status}; status REGISTERED/PRESENT/ABSENT, UUID requestId, nonnegative integer revision, trimmed reason 1–500 characters.
- Current ADMIN and event/attendance locks; same request replay acknowledges once. Changed request payload or stale status/revision returns 409. No new registration is created. Future/cancelled/draft/education events cannot receive new observations.
- Attendance update and append-only history insert share one transaction; history failure rolls back attendance. Responses redact database errors. Snapshot and acknowledgement are checked against current owner/event and command.
- Admin Events → Participants → Yoklama ve geçmiş. Select person, state and reason; save and reload. Lost response uses GET reconciliation without a second PUT. Failed reconciliation blocks a new save until read recovery. Account/event changes discard stale UI responses. Future events are read-only.

## Data and boundaries

Migration 20261008092049_event_attendance_verification.sql is version 0022_event_attendance_verification. The ledger preserves actor name/ID, event/attendance/person IDs, before/after state, reason, revision and database time. No source foreign keys: evidence survives source deletion. RLS is enabled; PUBLIC/anon/authenticated table and trigger function privileges revoked, including inherited default grants. UPDATE, DELETE and TRUNCATE are rejected by triggers. This is not a guarantee against database-owner trigger removal or DDL.

The ledger audits this new API only. Retained legacy bulk attendance or direct SQL writes are not fully audited by this delivery. A matching last manual state supplies verified_at; it is not proof that every writer was audited. Legacy records without matching manual evidence stay explicitly uncertain. Scoring correction policy and legacy-writer consolidation remain open.

## Acceptance and rollout

See E4N/09-Dogrulama/P26-Yonetici-Yoklama-Duzeltme-Veri-API-Web-2026-10-08.md. Fresh browser 55/0; combined API evidence 33 whole-run suites plus separately repaired isolated-smoke =34 passed; original failed reports retained. Build/diff PASS. Fresh22/repeat0/0021 upgrade retains legacy records; synthetic restore47 tables passes. No live Supabase mutation, production deployment, payment or mail.

Production must separately review/adopt 0021 and 0022 before exposing the new writer. No schema mutation is performed inside HTTP handlers. Parent P26 remains In Progress for rights, ticket/provider and product-policy gates; this delivery is not whole release acceptance.
