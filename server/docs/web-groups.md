# WEB-09 — personal groups and scheduled meetings

`GET /api/me/web-groups` is a personal, authenticated read-only snapshot. It rejects query parameters and derives the owner from the JWT; the user must still exist. An admin token has the same personal scope. Groups and membership must both be ACTIVE. Rosters contain only ACTIVE group-membership rows and expose id, name and profession; email, role, scores and meeting links are excluded. Private/no-store caching, repeatable-read read-only transaction and generic errors apply. More than 100 groups or 5,000 roster entries produces 503 rather than partial data.

Dashboard no longer loads the entire group catalog or invents a primary group from the first row. Its group header links to one combined group/roster/meeting panel. Multiple groups require an explicit selection; a sole group is shown directly. Dates are deduplicated, sorted and filtered to the next three scheduled days. Date-only entries are interpreted as local civil dates. Missing time or online-link metadata is shown as unspecified, without implying a physical meeting. Member links point to the existing profile route.

The typed response validates owner, groups, members, identifiers and dates. Failed reads show retry; successful empty reads show no active membership. Account/token changes, refresh and stale-response guards hide old group and roster data immediately.

This reads existing records; it does not implement new membership eligibility, payments, group admission, capacity, profession classifications or shuffle decisions. Legacy group/admin/mobile paths remain separate. P30 and P39 are not closed by this package.

## Schema compatibility finding

The 13-version isolated baseline creates groups before runtime extensions; its groups table lacks meeting_time and meeting_link although legacy administration references them. This reader uses to_jsonb optional-field access so the baseline reads safely with null time/unspecified online metadata, and existing schemas with these columns expose minimal metadata. No production migration was executed. The legacy administrative write mismatch remains for P09/P11/P39 review.

## Verification — 5 October 2026

- Disposable PostgreSQL 17, 13 migrations applied once and zero on repeat; actual Express and compiled TypeScript transport PASS. Owner/auth/query/cache/admin scope, active roster, requested/draft exclusions, revoked membership refresh, invalid DTO, malformed stored dates and injected query failure/recovery verified. Group-member records unchanged by reads.
- A second isolated fixture adds only optional meeting_time/meeting_link columns to verify both existing schema shapes; these changes are not source migrations or live changes.
- Actual GroupMembersWidget with captured isolated API fixtures in Playwright: error/retry, explicit group choice, correct active member profile links, sorted future dates, group/account replacement and revoked-membership empty state PASS. Screenshots inspected. This is fixture browser acceptance, not a production E2E run.
- TypeScript check, production build, syntax and diff checks pass; existing build size/browser-data warnings remain.
- No live Supabase writes, production deployment, mail or payment test.
