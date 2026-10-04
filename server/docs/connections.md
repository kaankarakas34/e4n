# WEB-03: profiles and connection requests

## Routes and compatibility

All routes use the existing application JWT middleware, resolve the owner from the current database, and return `Cache-Control: private, no-store`.

| Route | Contract |
| --- | --- |
| GET `/api/user/profiles/:targetId` | Version 1 owner/target snapshot: profile, relationship state, visibility flags, common active groups |
| GET `/api/user/friends/check/:targetId` | Owner/target IDs and `NONE`, `SELF`, `PENDING_SENT`, `PENDING_RECEIVED`, `FRIEND` or `REJECTED` |
| GET `/api/user/friends/requests?type=incoming` | Pending requests addressed to the JWT owner, ordered by creation and ID; flat sender name/profession |
| GET `/api/user/friends/requests?type=outgoing` | Owner's sent requests, all stored statuses; default remains outgoing |
| POST `/api/user/friends/request` | Existing `{targetId}` body; create or replay the same outgoing pending request |
| POST `/api/user/friends/request/:senderId/accept` | Receiver alone accepts a pending request or replays the same accepted result |
| POST `/api/user/friends/request/:senderId/reject` | Receiver alone rejects a pending request or replays the same rejected result |

The decision route parameter remains the **sender user ID**, preserving the existing client convention. Mutation receipts include `success`, `ownerId`, `targetId`, `requestId`, resulting relationship `status`, and `replay`. No affected row means failure, never an empty success.

Self requests and malformed IDs return 400; nonexistent targets/received requests return 404; conflicting terminal decisions, reverse requests and ambiguous legacy pairs return 409. Rejected requests cannot be resubmitted under the existing policy. Crossed requests are not automatically accepted. No new unfriend, note storage, notification, or retry policy was introduced. Legacy `note` payloads remain ignored as before; the web no longer offers an unsupported note flow.

## Database and boundaries

Uses the existing `friend_requests`, `users`, `groups`, `group_members` tables; no migration or runtime DDL. Mutations take a transaction advisory lock over the normalized, sorted pair, then lock both directions with `FOR UPDATE`. This serializes creation when neither row exists and subsequent decisions. Transactions roll back on failures, and a response is sent only after COMMIT. The lock applies to these application routes; separate direct database writers must use the same convention or a separately reviewed database constraint.

Reads use repeatable-read read-only transactions. The profile serializer allows only named fields. Contact fields are returned for self, accepted connections or a current database ADMIN. Billing fields are returned for self or a current database ADMIN. Groups contain only the intersection where both memberships and the group are ACTIVE. Passwords, tokens, role and unrelated memberships are never serialized by the new profile route.

The older `/api/users/:id`, user discovery and other legacy routes are separate existing interfaces. Their broader visibility is **not** claimed fixed by this package; the planned comprehensive security audit remains open. `/api/user/friends` retains its same-group/team discovery meaning. Mobile screens were not modified.

## Web behavior

`connections.ts` validates response owner/target, states, IDs, fields and mutation receipts. PublicProfile uses one snapshot rather than separate user/friend/group calls. Both PublicProfile and FriendRequestsWidget clear stale data and ignore late replies after owner/token/route changes and unmount. Synchronous mutation locks prevent double actions. After a confirmed write, the current profile/list is read again. Errors are visible and refreshable; a failed list is not presented as an empty list.

Connect, accept and reject buttons are wired. Flat sender names are rendered correctly. Unsupported online status, placeholder statistics/badges, guessed city and public billing displays are removed. Existing self editor and meeting component are retained; this package does not claim to add persistence for legacy unsupported bio/website fields. The existing messages link remains; its missing message API is a subsequent web package.

## Verification

- `node server/test/connections-contract.mjs`: isolated PostgreSQL 17 + active Express application + real web bearer transport. Tests owner/contact/billing/common-group boundaries, invalid/missing/self users, both-direction creation races, recipient restrictions, opposite decision races, terminal replay/conflicts, uppercase IDs, malformed legacy pairs, post-INSERT rollback/retry and no GET writes.
- `node test/connections.mjs`: actual TSX and typed service with controlled hooks; send/decision actions, duplicate guard, read-after-write, errors/retry, owner/token/route/unmount late-response rejection, empty versus failed list, malformed/foreign/leaked responses.
- `npm run check`, `npm run build`.
- Playwright CLI: actual PublicProfile and FriendRequestsWidget mounted with the real auth store/router/transport in a local Vite harness. Network responses are captured from the isolated HTTP/PG test. Verified load failure/retry, pending profile and real sender name, acceptance revealing contact without billing, repeated acceptance and refreshed empty request list. Screenshot: untracked `output/playwright/connections-accepted.png`. This is an isolated component browser check, not a production end-to-end test.

No live Supabase writes, production deployment, SMTP or payment tests were performed. Test container, browser and local Vite process are stopped after verification.

Lock reference: [PostgreSQL 17 explicit locking](https://www.postgresql.org/docs/17/explicit-locking.html#ADVISORY-LOCKS).
