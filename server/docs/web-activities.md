# WEB-10 — personal activity record summary

`GET /api/me/web-activities` reads the authenticated owner's newest ten existing records in a repeatable-read, read-only transaction. The owner must still exist. Query parameters are rejected; admin tokens receive the same personal scope. Responses are private/no-store.

Sources are participant one-to-one records, sent/received referrals, invited visitors and owner attendance records joined to events. Education is excluded. Rows are ordered by creation time descending, then type/id for deterministic ties. This is the newest-record summary, not a complete history or a calculated points/completion ledger. Only id/type/date/status/title/scheduled date/event id/referral direction are exposed; contacts, notes and amounts are absent. Deleted counterpart names remain null instead of dropping the owner's record.

ActivitySummary on Dashboard and Activities uses one typed transport. Accepted or pending meetings are described with their actual recorded status rather than as completed meetings. Referral direction and counterpart names are derived from owner identity. PRESENT attendance is described as a participation record because the existing registration endpoint also uses this status; it does not assert verified physical attendance. Unknown/null statuses have explicit fallbacks. Dates are absolute and date-only scheduled days are interpreted locally; future records cannot become negative 'days ago'. Existing source statuses are displayed without creating new scoring or membership rules.

Read failure, loading and successful empty state are distinct. Retry, refreshVersion after saved activity, token/account guards and ignored old responses protect the panel. Event and activity-panel links use existing routes. Legacy endpoints, mobile and LMS are untouched; P26 registration/attendance separation and P30 membership/points decisions remain open.

## Verification — 5 October 2026

- Disposable PostgreSQL17: 13 versioned migrations applied once, zero on repeat. Real Express API and compiled TypeScript transport PASS owner/auth/admin/query/cache scope, all four record sources, accepted/completed/pending future meetings, referral direction, education/private-other exclusions, deterministic ten-record cap, actual empty owner and read failure/recovery. Read record counts remain unchanged.
- DTO rejects wrong owner, duplicates, malformed dates, missing attendance target and wrong ordering.
- Actual ActivitySummary in Playwright with captured isolated fixtures: failure/retry, recorded status wording, sent/received counterpart, event/panel links, owner replacement and empty state PASS. Screenshots inspected; fixture acceptance is not production E2E.
- TypeScript check, production build, syntax and diff checks PASS; existing bundle/browser-data warnings remain.
- No schema change, live Supabase write, production deployment, real mail/payment test or D01–D10 policy decision.
