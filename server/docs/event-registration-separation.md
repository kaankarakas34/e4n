# P26 — booking and actual attendance separation

New authenticated registrations persist attendance.status=REGISTERED, rather than PRESENT. The existing registration counter and is_registered flag still include that row. Concurrent registration, FE profession locking, ticket/payment state, ownership and replay semantics are preserved. Existing registration remains a row in attendance for compatibility; this is a semantic separation, not a new registration table.

Registration does not recalculate cached performance. Both existing frontend performance calculators exclude REGISTERED before selecting their last four attendance entries. Existing SQL report filters and score weights remain unchanged: REGISTERED is neither PRESENT nor ABSENT. Event completion leaves REGISTERED untouched, including when the date passes: no inferred no-show or points. Existing manual weekly attendance submission remains separate.

The admin participant window explicitly labels booking rows as “Kayıtlı — yoklama yapılmadı”, shows the registration total, and warns that legacy PRESENT has no registration/attendance provenance. The manager view also labels REGISTERED without calling it actual attendance. Historical PRESENT/ABSENT/LATE/SUBSTITUTE/MEDICAL rows, previously stored scores and verified payment records are not rewritten.

## Schema and rollout boundary

Supabase CLI created 20261008081425_event_registration_status.sql, registered as 0021. It expands the existing attendance_status_check only; table count, ACL/RLS and row identities stay unchanged. Apply the reviewed migration before using the new registration writer. No runtime DDL. Fresh schema, repeat0 and pre-0021 upgrade with existing attendance are tested on local PG17. A malformed status remains rejected by PostgreSQL.

A rollback that reinstates the old constraint must first handle REGISTERED rows through a reviewed path; do not relabel them PRESENT to make the constraint pass. Prefer forward recovery. Migration has not been applied to live Supabase.

## Acceptance and remaining P26 work

The registration contract covers actual Express/JWT/PG17/TypeScript: concurrency10, no spoofed owner/payment, FE race, ticket insertion rollback/retry, owned ticket reads, booking counters, report zero PRESENT/ABSENT, event completion/replay, unchanged cached score, last-four calculator isolation, migration preservation and invalid status rejection. Fake mail only. Whole-suite and fresh browser results are recorded in Obsidian.

P26 remains In Progress. Explicit event check-in/corrections and evidence provenance, historical ambiguous attendance review, multiple-ticket policy, pricing/rights, payment-provider sandbox acceptance and D-dependent scoring are still open. This package does not mark that entire XL scope Done. Mobile and LMS remain deferred.
