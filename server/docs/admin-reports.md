# WEB-02 / E4N-135 — Admin report v1

GET /api/admin/reports?dateRange=30d returns one consistent snapshot for
the three web AdminReports tabs. The authenticated claim and existing
users row must both have ADMIN role. A deleted or demoted administrator
is rejected even with a previously issued ADMIN token.

7d, 30d, 90d, 1y=365 elapsed days; default30d. Duplicate/unknown range or
other query parameters:400. Anonymous401; nonadmin/missing admin403;
query failure500, no partial report. Cache-Control:private,no-store.
REPEATABLE READ READ ONLY, same DB now [start,end), no runtime DDL,
score writes or new migrations.

| Section | Source | Date meaning |
| --- | --- | --- |
| stock | users all accounts; groups/power_teams ACTIVE | Current rows, independent of period and entitlement |
| new_accounts | Existing users | created_at, not net growth/deleted user history |
| events | events | start_at, only in selected elapsed period |
| meetings | one_to_ones COMPLETED | meeting_date; requests not completed activity |
| visitor_records | visitors | visited_at; all recorded statuses |
| attended_visitors | visitors ATTENDED/JOINED | visited_at |
| joined_visitors | visitors JOINED | Recorded status, not a new conversion/entitlement rule |
| volumes | referrals all statuses, successful amount sums | created_at cohort, current status; not closure/payment date |
| monthly | Same referral/account cohorts | UTC month; first/last buckets clipped to selected range |
| performance | users stored score/color | Current values, no period average or recalculation |
| attendance | attendance joined to events | event.start_at; not attendance.created_at |

Volumes have total/internal/external/unclassified metrics. Unknown legacy
types belong to unclassified. Decimal sums remain strings. Any successful
NULL/negative amount makes its total unknown (null); known subtotal and
missing count remain visible. No rows is real0. Missing activity timestamps
cannot be assigned to a range. Missing attendance is not inferred ABSENT.
Missing score/color remains unknown. No arbitrary TRY currency, lost
member statistic, fixed20% target, invented chart or monthly score rules.

Web service validates version, owner/range/bounds, counts, decimal types,
expected UTC month sequence, monthly/category/total consistency, account
and performance/attendance id consistency before rendering. Lifecycle
guards cover user/role/token/range/retry, ABA and unmount. Three tabs use
the same source. Unused group/geo endpoint dependencies are removed.

## Compatibility inventory

Old /reports/stats remains in use by mobile app/admin/index.tsx and
app/admin/reports.tsx; it is not silently retargeted to this new contract.
Old /reports/stats,/charts,/traffic-lights,/attendance-stats wrappers have
no remaining web page caller after this delivery. Legacy endpoints remain
for separate P08/P40/mobile compatibility and Sprint6 access audit.
AdminDashboard uses member/group/team lists and the event store, not
this new report. Legacy /admin/stats/* is separate compatibility scope.
JOINED and legacy CONVERTED are not treated as interchangeable or
rewritten; this report only counts the recorded JOINED flag.
This web completion does not mean every report in every platform is done.

## Gates

node server/test/admin-reports-contract.mjs: actual web bearer/Express/
isolated PostgreSQL17,10 migrations; source/decimal/unknown/range/role/
demotion, event date, future/request exclusions, empty, GET unchanged,
injected read failure500 then200. Captures isolated payloads in output.

node test/admin-reports.mjs: actual TSX+typed service with controlled hooks
and transport; all tabs/lifecycle/malformed/consistency. Browser verification
uses captured isolated payloads, distinct from the real HTTP/PG test.
npm run check, npm run build, staged git diff check.
No live Supabase writes, production deployment, payment or SMTP.
