# Shuffle execution history

Migration0019 records the actual existing /api/shuffle/save transaction; this is an execution log, not a new four-month schedule or historical reconstruction.

Each successful save stores a UUID, current actor identity/name, timestamp, optional expectedRevision, before/after workspace SHA256 revisions and before/after snapshots. Snapshots preserve group names/statuses, account id/name/role and every group membership state/role/joined_at (including REQUESTED and INACTIVE); email, password, phone and payment data are excluded. Counts refer to ACTIVE post-save placements and their groups. Deleted/renamed accounts/groups cannot rewrite these snapshots; actor references intentionally have no cascading FK.

The same group mutation lock and row locks enclose snapshot, existing global leadership role reset, ACTIVE membership archival, assignment upsert, capacity assertion, history insert and commit. History insert failure rolls the whole mutation back. Stale revision/replay rejects before writes; a successful web response includes executionId. Legacy callers may omit revision; their actual execution is still logged with expected_revision null. This does not make ambiguous retry idempotent for legacy callers.

History has RLS, revoked PUBLIC/anon/authenticated table access, stable newest-first index and trigger rejection of UPDATE, DELETE and TRUNCATE (23514). This protects normal SQL paths, not a privileged administrator capable of dropping/disabling triggers or changing the schema. It is not cryptographic tamper proof storage. Retention/administrative deletion policy remains undecided.

GET /api/admin/shuffle-history returns the last100 summaries. GET /api/admin/shuffle-history/:id returns one preserved detail. Both use current DBADMIN authorization within a repeatable-read read-only snapshot, private/no-store, no query parameters; missing detail404, malformed id400. Lists do not load all large JSON snapshots. The /admin/shuffle-history web page supports refresh, explicit record selection, before/after memberships and role changes, owner/role/token response isolation, empty/error/loading states. It links from /admin/shuffle.

Apply0019 before this application version. Snapshot limits:5000groups,10000accounts,50000membershiprows; over-limit fails without writes. All source data belongs to the current records; no old assignments or periods are invented. Existing pending-membership upsert and global role-reset semantics remain unchanged and are now observable. This is not approval of target leadership/group access rules. Undo is not exposed; reversal requires product and data review.

P29 remains open for canonical period/eligibility/history rules and notification delivery; D06/D07/D08/other pending rules remain open. No live schema write, deployment, real mail/payment, mobile or LMS changes. Validation uses disposable PG17 and actual Express/JWT/browser flows. See E4N/09-Dogrulama/P29-Atomik-Dagitim-ve-Kayit-Gecmisi-2026-10-07.md.

A real full-group browser run found the previous reset-roles-before-archive order caused a temporary36-member invariant violation in a35+president group. The transaction now archives ACTIVE memberships before resetting leadership, then inserts the target distribution; final global reset/archive semantics are unchanged. A dedicated full35+president contract covers the successful redistribution and preserved role snapshots.

## 8 October — keyed web submissions

The current web uses mandatory request IDs and source revisions with full-command fingerprints, owned immutable receipts, tab persistence and explicit identical retries. Keyed replay returns the original receipt without another role/archive/placement/history mutation, even after later source changes. Existing keyless callers keep stale-revision/legacy semantics. See [shuffle-submission.md](shuffle-submission.md) for the contract, verification and remaining policy/release limitations.

## 10 October — P29 atomic notification delivery and canonical period closing

In E4N-101 (P29), each successful shuffle execution transaction atomically issues member notifications:
- Every active assigned member receives a `SHUFFLE_COMPLETED` notification detailing their new group assignment and canonical period (e.g. T1, T2, T3) with `action_url: /groups/:groupId`.
- Any previously active member who could not be placed into a group receives an unassigned notification (`action_url: /chapter-management`).
- The execution count of delivered notifications is recorded in `after_snapshot.notificationsDelivered` and returned in keyed receipts (`notificationsDelivered: number`).
- Idempotent replay with an existing `requestId` returns the original receipt with `replayed: true` and skips duplicate notification insertion.

