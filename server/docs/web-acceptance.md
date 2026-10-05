# Existing web acceptance bundle (P37)

Run `npm --prefix server run test:web-acceptance` from the managed checkout.
Node dependencies and Docker with PostgreSQL 17 are required. The runner executes
28 contract suites sequentially, including private profile/session isolation,
the 15 delivered WEB packages, route
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

`releaseReady` remains false even if all 28 suites pass. The report records:

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

## Full application browser fixture

A separate browser package now exercises the real application, rather than
standalone component mocks. In one terminal, start
`npm --prefix server run test:web-browser:fixture`. Wait for `WEB_BROWSER_READY`.
In another terminal run `npm --prefix server run test:web-browser -- <path-to-playwright-cli.js>`.
Use the installed Playwright CLI JavaScript entry (the CLI skill's cached
installation is suitable). No `@playwright/test` framework is required.

The fixture creates a disposable PostgreSQL 17 container, applies all 15 versions,
seeds admin/member/president/applicant accounts, a full group, a vacant group, an
event with two attendees, and an accepted connection. Vite loads the actual App
router and components, with environment file loading disabled and synthetic
Supabase client settings. Nodemailer is replaced with a local fake adapter.

The browser redirects the existing localhost:4005 API transport to the fixture's
actual loopback Express server. **Responses are not mocked.** Other network
origins, including analytics/fonts, are blocked. Native confirmation/alert
dialogs are deterministic in the fixture; native dialog behaviour itself is not
accepted by this test. Real email, payment, Supabase and deployment are absent.

The CLI driver records cases, method/path/status evidence, page errors and
screenshots in `output/web-browser/<timestamp>/`, then reads the final database
state through a secret-protected local control endpoint. It checks the applicant
remains REQUESTED after 409, the group remains 35 members plus president, two
attendance rows are preserved, uploaded PDF bytes match, and one message belongs
to the member/president pair. It closes its browser and requests fixture cleanup;
the fixture also has a 20-minute shutdown limit. Each run needs a fresh fixture.

### Browser evidence, 5 October

Final `2026-10-05T18-27-57-502Z/browser-report.json`: **21 PASS / 0 FAIL**.
This covers real admin/member login, admin dashboard/reports/member directory/
visitor queue/accounting/group catalog, event card **2 / 50** and participant
modal, group rejection and tabs, document upload/member download, personal
reports/groups/activities, selected-day calendar data, registered-event view,
message send, role switch hiding admin data, and final database state.

An initial browser setup stopped at a native confirmation dialog and used two
obsolete heading locators. Its CLI log and screenshots were retained; it is not
a complete test result. A subsequent rehearsal passed 20 cases; the final fresh
fixture additionally checked selected-day event data and persisted PDF bytes.
Base HEAD `b8058d4` identifies the base checkout; the browser helper additions are
local changes delivered with this section. No runtime source was changed.

**Observation at that run (resolved in the later profile package below):** actual member navigation logs a caught SQL failure in
the legacy `/api/users/:id` profile query: `one_to_ones.receiver_id` does not exist,
so it falls back to a basic profile. A 200 and rendered page do not prove the
profile metrics/last-meetings contract. Record this under P30/P40 and verify that
whole profile/dashboard package separately. The new typed report/calendar flows
passed their stated cases; they do not resolve that fallback.

This fresh browser evidence advances P37's existing-flow gate. Remaining target
rules, historical production data, profile metrics, all untested interactions
and broad security/release acceptance keep `releaseReady=false` and P37 open.

## Private profile and dashboard context package, 5 October

The active `/api/users/:id` reader now uses canonical `one_to_ones.partner_id`,
counts both directions, and returns the latest three meetings with stable date/id
ordering and counterpart names. Metrics retain their existing all-history scope;
no monthly scoring, money or rights policy is introduced. All ACTIVE groups are
returned without choosing an arbitrary primary group. The profile header consumes
those groups instead of displaying the hardcoded `Liderler Global` label.

The read-only repeatable-read snapshot verifies the current database actor: only
the owner or a current ADMIN receives the private profile. Anonymous, foreign,
deleted and demoted actors are checked; SQL failure returns a redacted error,
never a successful basic-profile fallback. The web transport validates owner,
target, metrics, groups and latest-meeting fields. Profile and dashboard requests
discard stale owner/role/token results; retry refreshes the current context.
Profile edit responses are re-read through the complete DTO before display.

`2026-10-05T18-46-10-332Z/report.json`: **28 PASS / 0 FAIL**. Two new suites
exercise actual PostgreSQL/Express/web transport and the real Zustand store's
delayed responses. The previous 26-suite evidence remains historical.
Production build and final TypeScript checking passed. Base HEAD is `7687799`;
runtime, consumers and test changes are the working tree delivered with this
section. No migration is added; source remains 15 versions / 41 application
tables plus its ledger. Broader membership/scoring/shuffle decisions and release
gates remain open; P30/P40/P37 are not marked DONE from this package alone.

Fresh final browser fixture `2026-10-05T18-52-51-923Z/browser-report.json`:
**23 PASS / 0 FAIL**, including the actual admin member profile's four meetings,
latest three counterpart rows, real ACTIVE group header, and rejection of a
member reading somebody else's private profile. The earlier 23-case run
`18-48-49-384Z` is preserved: its screenshot exposed the legacy hardcoded group
header, which was corrected and asserted in the final fresh run. The browser,
API, Vite and owned PostgreSQL fixture are closed after verification.
