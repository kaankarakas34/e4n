# WEB-11 — administrative group settings

Migration 0014 adds missing meeting_time and meeting_link columns with IF NOT EXISTS. Existing values are preserved; no group, membership or status is changed. The source schema now has 14 versions / 41 tables. Existing version checksums are unchanged. Production adoption remains subject to P09/P11 rehearsal and release review.

The existing POST /api/groups and PUT /api/groups/:id handlers now run transactions and check the authenticated user's current database role, including role revocation since token issuance. Only current ADMIN users can write. Deleted users, invalid ids, unknown query/fields, missing update targets and invalid inputs fail explicitly. SQL errors roll back and return generic errors. These operations send no mail or notifications and do not change admission, capacity, profession or shuffle rules.

Supported existing settings are name, meeting_day, meeting_time, meeting_link, status, meeting_dates and visitor email subject/template. Omitted update fields retain stored values; explicit empty optional text/time clears the field. ACTIVE/DRAFT are the existing statuses. Dates must be real YYYY-MM-DD values, at most 366 entries, then deduplicated/sorted. Time accepts HH:mm or HH:mm:ss. Links require HTTP(S), no embedded credentials. Text lengths are bounded. Power-team descriptions are excluded from group edits.

Web creation supplies a UUID retained for retries in the open creation dialog. Advisory locking and the group primary key serialize duplicate submissions: same id/content returns the existing row, conflicting content returns 409. Closing/resetting the dialog starts a new creation intent; this does not introduce a unique-name rule. Legacy clients without an id retain server-generated UUID behavior. Updates retain existing assignment semantics, and exact repeated updates have no additional side effects.

AdminGroups distinguishes failed/empty reads and retries, limits actions to its account context, and retains the creation UUID after an uncertain response. AdminGroupDetail renders the validated server-saved row rather than the submitted draft, blocks duplicate saves and hides stale results/modals after account or token changes. Its edit panel scrolls within the viewport so save controls remain reachable. Existing membership, assignments, deletion, power-team and shuffle routes remain separate.

## Verification — 5 October 2026

- Actual Express and PostgreSQL17 contract PASS: fresh 14 migrations/repeat0; existing optional-column upgrade preserves configured values; current DB admin and revoked-role checks; concurrent same-UUID create yields one row, same-content replay200/201 and conflict409; strict date/time/link validation; partial update preserves DRAFT/link/dates; missing target404 and injected rollback; actual TypeScript create/update/readback.
- Isolated smoke PASS: fresh bootstrap, older version upgrade, known legacy adoption and checksum/order guards; 41 tables. Existing baseline findings remain audit evidence.
- WEB09 group read compatibility contract PASS on historical missing-column and restored-column fixtures. Other contract bootstrap assertions updated to version14.
- Actual AdminGroups/AdminGroupDetail in Playwright with captured isolated fixtures and stubbed alert display: list retry, lost-create-response retry with the same UUID, write failure/retry, saved DRAFT/time/metadata and delayed write reply after account change PASS. Screenshots inspected. This is fixture acceptance, not production E2E.
- TypeScript check, production build, syntax and diff checks PASS; existing bundle/browser-data warnings remain.
- No live Supabase write/migration, deployment, real mail or payment test. P30/P31/P39/P40/D01–D10 and comprehensive security acceptance remain open.
