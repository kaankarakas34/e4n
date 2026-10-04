# Personal reports v1 (WEB-01 / E4N-133)

GET /api/reports/me?dateRange=30d uses the authenticated JWT id only.
Allowed ranges: 7d, 30d, 90d, 1y (365 days). Default: 30d.
Other query parameters, duplicate ranges, unsupported values: 400.
Anonymous: 401; missing owner row: 404; failed read: 500, no partial report.
Cache-Control: private, no-store.

The PostgreSQL transaction is REPEATABLE READ READ ONLY. Bounds come from
the same database transaction: [now - days, now). Rolling elapsed days,
not calendar months or local midnight. ISO timestamps in the response.
No new migrations, runtime DDL, score calculation or mutations.

| Field | Source and scope | Date | Meaning |
| --- | --- | --- | --- |
| referralsGiven | referrals.giver_id = owner | created_at | All statuses in creation cohort |
| referralsReceived | referrals.receiver_id = owner | created_at | All statuses in creation cohort |
| successful | Same directional cohort | created_at | Current SUCCESSFUL status, not closure date |
| volume | Sum of successful amount values | created_at | Recorded business volume, not payments or collected income |
| knownVolume | Same, nonnegative known amounts | created_at | Exact decimal text, not a floating point sum |
| missingAmounts | SUCCESSFUL rows with NULL/negative amount | created_at | If > 0, volume is null; known subtotal still available |
| meetingsCompleted | one_to_ones requester OR partner = owner, COMPLETED | meeting_date | Completed activity, not one_to_one_requests |
| visitorsHosted | visitors.inviter_id = owner, ATTENDED/JOINED | visited_at | Recorded attended visitors, not invites |
| educationHours | education.user_id = owner, sum(hours) | completed_date | Recorded hours, not invented CEU credits |
| performance | users.performance_score/color | Current stored row | Independent of selected period; null remains unknown |

Empty supported datasets return true 0. Missing timestamps cannot be placed
in a period and are excluded. There is no monthly score, recalculation,
badge award, PDF generation or synthetic activity trend in this endpoint.
ADMIN keeps the existing AdminReports page; its broader audit is separate.
The web client validates owner, range, metric types, decimal strings and
unknown-total consistency before rendering. It discards old context reads,
including owner, token, range, ABA transitions and unmount.

Verification:

- node server/test/personal-reports-contract.mjs: actual web transport,
  bearer token, Express, isolated PostgreSQL 17 and 10 schema migrations.
- node test/personal-reports.mjs: actual TSX and typed service under
  controlled hooks/transport, not a browser substitute.
- npm run check and npm run build.

Mobile consumer: E4N-134, separately tracked. Live Supabase schema rehearsal
and production deployment remain separate gates.
