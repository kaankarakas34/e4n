# WEB-08 — owner-scoped web activity calendar

`GET /api/calendar/web?from=<ISO instant>&to=<ISO instant>` requires the existing JWT middleware. Both dates must be canonical ISO instants, ordered, and at most 43 days apart. Other query parameters are rejected. The owner must still exist in users; the client cannot select another owner. Responses are private/no-store.

The API reads a repeatable-read, read-only snapshot: the owner's ACCEPTED/COMPLETED one-to-one meetings and invited visitors, plus PUBLISHED/COMPLETED public events or events in an ACTIVE group with an ACTIVE membership for that owner. An admin token does not bypass this personal scope. Only id, start_at, type, title and location are returned. Education is excluded. More than 1,000 items returns 503 instead of truncating the calendar.

Activities uses WebCalendarPanel, typed transport and DTO validation. Local civil dates determine day placement and a contiguous Monday-first grid, including adjacent-month dates. Month changes load the exact visible range; selection shows an agenda with event-detail links. Loading, empty and failed reads are distinct. Retry and activity refresh reload the snapshot. Account, token and range changes immediately hide old rows and ignore old responses.

The existing `/api/calendar` contract remains available to legacy consumers; this package does not migrate mobile or education screens. It introduces no schema migration or product policy. The isolated schema remains 13 versions / 41 tables; live database migration and production acceptance remain separate work.

## Verification — 5 October 2026

- `node server/test/web-calendar-contract.mjs`: disposable PostgreSQL 17, real Express API and compiled TypeScript transport. PASS owner/status/group/range/privacy, deleted or malformed owner, forbidden owner override, DTO rejection, November reload, read failure/recovery and read-only record counts.
- Date assertions: Istanbul midnight boundary, September 28–November 1 October grid, continuous days and leap years.
- `npm run check` and `npm run build`: PASS. Existing bundle-size and browser-data warnings remain.
- Playwright: actual WebCalendarPanel with captured isolated API fixtures; failed read/retry, October 8 agenda at 00:30, adjacent days, November navigation and fresh range, event links and account data replacement. Screenshots visually inspected. This is a fixture browser acceptance test, not production E2E.
- No live Supabase writes, deployment, payment or SMTP effects.
