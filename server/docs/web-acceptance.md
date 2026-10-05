# Existing web acceptance bundle (P37)

Run `npm --prefix server run test:web-acceptance` from the managed checkout.
Node dependencies and Docker with PostgreSQL 17 are required. The runner executes
26 contract suites sequentially, including the 15 delivered WEB packages, route
ownership, admission/transfer/capacity, payment, meetings, referrals, support,
scheduled transactions and synthetic backup/restore. Referral verification uses
the actual **web** transport; it does not require a mobile checkout.

Each database suite owns a disposable local database. Payment and mail tests use
their existing fake adapters. The runner removes inherited database URLs and
service credentials from its child environment. It never applies a live schema,
sends real mail, charges a real payment or deploys an application.

## Evidence

Every run writes `output/web-acceptance/<UTC timestamp>/report.json` and a log per
suite. Results are saved after each suite; the complete report has `finishedAt`,
`passed` and `failed`. An interrupted report is incomplete. A nonzero child exit
or spawn error is FAIL, and any FAIL makes the runner exit nonzero. Keep failed
reports when fixing a fixture; rerun the bundle to record new evidence.

The recorded Git commit is the **base HEAD at run start**. When running with local
changes, identify those changes and the final commit in the delivery note; the
base hash alone does not identify the tested working tree. Logs are local
evidence, not published telemetry.

## Acceptance boundaries

PASS means the assertions of that existing contract passed. It does not mean all
routes, browsers, historical production records or future product rules passed.
The isolated smoke suite deliberately retains documented unresolved defect
baselines; a passing smoke run does not fix those defects.

`releaseReady` remains false even if all 26 suites pass. The report records:

- BLOCKED: remaining scoring/removal/ban, service/admission/company/membership
  decisions and exact shuffle payment/grace/restriction/reopening policy.
- OPEN: live schema rehearsal, group-scoped roles/direct database capacity
  invariant, historical attendance/tickets and complete shuffle/history/notify.
- NOT_RUN: a fresh whole-flow browser acceptance. Previous package browser
  fixtures are separate evidence, not a substitute for this gate.
- DEFERRED: Sprint 6 broad security and production release acceptance.
- EXCLUDED: Sprint 7 mobile and Sprint 8 course, education and exam work.

P37 remains In Progress until its full web acceptance gates are satisfied.
The bundle is an executable regression gate for the existing system, not a new
product feature or a completed release.

### Known baselines that prevent product acceptance

The smoke log explicitly records these existing behaviours as baselines, not
accepted target rules:

| Existing observation | Remaining gate |
| --- | --- |
| ACTIVE account without subscription plan/end date can request a group or power team | D07/D10 membership and rights policy |
| Status updates can leave two ACTIVE members with the same profession | D05 service classification and the complete conflict invariant |
| A user can have two ACTIVE closed-group records; removal deletes membership rows without placement history | P10/P17 membership model and placement history |
| Repeated visitor records increase the current score; traffic-light response has no month/source/rule version | D01–D04 monthly scoring, deduplication and removal policy |
| Shuffle notification endpoint is absent | Full shuffle/history/notification package |

Passing these baseline assertions is evidence that the limitation still exists.
Do not translate the suite PASS count into a web completion percentage.

## 5 October 2026 verification

- Initial bundle: `2026-10-05T18-02-09-651Z`, 22 PASS / 4 FAIL.
- Repaired bundle: `2026-10-05T18-07-12-950Z`, 26 PASS / 0 FAIL, exit 0.
- Both reports preserve their original results under `output/web-acceptance/`.
  Base HEAD: `6d7da316768433a4935c93060960705571af7b95`; local changes are the
  harness, npm script and fixture repairs delivered with this document.
- Document/invoice upgrade fixtures now reverse migrations 0015 and 0014 before
  replaying the earlier migration chain. The production history-order check
  remains intact. Visitor queue's transpiled fixture resolves the newly imported
  capacity validator. Referral suite accepts `--web-only` and exercises the real
  web transport without a mobile checkout; existing mobile mode is retained.
- These four failures were test fixture/runner integration failures, not proof
  of four new product defects. Runtime source, migration SQL and product policy
  are unchanged in this acceptance bundle.
- No fresh browser run or build was needed for these test/document-only changes.
  Whole browser acceptance and every gate listed above remain open.
