# WEB-04 — Direct messages

## Data and migration

`direct_messages` stores sender, receiver, text, sender-scoped request UUID and creation time. A unique `(sender_id, request_key)` prevents repeated sends. Participant FKs use RESTRICT to preserve history; existing member deletion will fail rather than silently erase messages. A separately reviewed retention/deletion policy remains under P10.

The migration was generated using Supabase CLI 2.119.0: `server/supabase/migrations/20261004160911_direct_messages.sql`. The application's existing checksum ledger executes this same SQL as `0011_direct_messages`; there is one source, not two copies. Fresh isolated setup is now 11 versions / 38 public application tables. Existing 10-version data upgrades through one new migration; repeat setup applies zero changes. Older upgrade/rehearsal fixtures were updated to model the new final version.

RLS is enabled, PUBLIC and existing `anon`/`authenticated` grants are revoked, and no direct client policies are granted. The application uses its existing trusted PostgreSQL backend owner/bypass role and application JWT; Supabase `auth.uid()` is not assumed to equal an application JWT user. Live migration review must verify the backend role. There is no runtime DDL, automatic live migration or Supabase client write path.

## API

All endpoints use JWT authentication and verify the current owner exists in `users`. Claims such as ADMIN do not allow reading another conversation. Reading/sending requires exactly one ACCEPTED connection between the two participants, matching the existing profile's Message button boundary. Missing, pending, rejected or ambiguous connections are denied; historical messages are retained, not deleted.

| Endpoint | Response |
| --- | --- |
| GET `/api/messages/conversations` | `{ownerId, conversations:[{friend:{id,full_name,profession},lastMessage}]}`; only owner's accepted connections with stored messages, newest first |
| GET `/api/messages/:targetId?before=:messageId` | `{ownerId,targetId,friend,messages,before}`; latest 50 in ascending display order; `before` is oldest row ID when an older page exists |
| POST `/api/messages/:targetId` | Body `{content,requestKey}`; response `{ownerId,targetId,message,replay}` only after COMMIT |

Every message contains `id,sender_id,receiver_id,content,request_key,created_at`. Times are UTC with six fractional digits. Pagination compares native PostgreSQL timestamp/UUID tuples using the cursor row in SQL, avoiding JavaScript millisecond truncation and lost rows at timestamp ties. A cursor from another conversation is denied.

Text must be nonempty after trimming and at most 4000 characters; the web uses the same conservative UTF-16 length cap. Same owner/key/content/recipient returns the original message; changed content/recipient for a used key conflicts. A transaction lock serializes the request key, another pair lock serializes against the connection decision routes, and failed INSERT/COMMIT rolls back. Owner comes from JWT, never the request body. Reads are repeatable-read/read-only and all responses are private/no-store.

The old API wrapper names remain for compatibility but the active web page uses the new typed service; sending requires a request key. Mobile messaging was not implemented or marked complete.

## Web

PublicProfile navigates to `/messages?recipient=<profileId>`. MessagesPage resolves that recipient through the authorized thread API, including an empty new conversation. Conversation buttons change the URL recipient. Lists expose loading/error/empty/retry states; users can refresh to receive new messages. There is no realtime, read receipt, attachment, notification or email feature in this package.

Typed validation checks participants, receipt key/text, owner/target, dates, order, duplicate rows and cursor. Screens clear/hide data and drafts on owner/token/recipient changes and ignore late/unmounted replies. Sending and older-page reads use a synchronous lock. A confirmed send clears its intent and then reloads the thread and conversations; a later read failure does not repeat the send.

Before a send, the exact key/text is stored in sessionStorage under the owner/recipient pair. An uncertain response retains this intent, locks editing and retries with the same key. On reload/refresh a matching committed row clears it. If it is older than the loaded page, repeating the original key still recovers the original receipt. Confirmed old-context responses clear storage only when its stored key still matches, protecting a newer intent. Unsent ordinary drafts are not persisted. Pending text stays in that browser tab's session until confirmed/closed; cross-account rendering is scoped.

## Verification and release boundary

- `node server/test/messages-contract.mjs`: active Express + real web bearer transport + isolated PostgreSQL 17. Fresh/10→11/repeat migration, RLS client read/write denial even after explicit grants, participants/accepted connection, unrelated ADMIN denial, 12 same-key sends/one row, replay/conflict, separate conversations, 50/7 cursor pages including timestamp ties, GET no writes, post-INSERT rollback/retry and history-preserving FK.
- `node test/messages.mjs`: actual TSX and typed service under controlled hooks. Send, lost ACK/session reload/same key, synchronous duplicate guard, receipt followed by read failure, committed-row recovery, owner/token/route/unmount late-response suppression, errors/empty states and malformed participant/cursor/receipt responses.
- `node server/test/isolated-smoke.mjs`, `meeting-contract.mjs`, `support-flow.mjs`, `payment-flow.mjs` and `connections-contract.mjs`: existing migration/flow regression. All databases/gateway fixtures are isolated.
- `npm run check`, `npm run build`, staged diff check.
- Playwright CLI: actual MessagesPage/auth store/router/API in a loopback Vite harness using isolated HTTP/PG response fixtures. Initial read error/retry, selected empty recipient, send response failure after simulated commit and reload recovery into one message/updated conversation verified. Screenshot: untracked `output/playwright/messages-recovered.png`, visually inspected. This is component browser verification, not production E2E.

Source delivery does **not** apply the migration to live Supabase or deploy production. P09 live schema transition and Sprint 6 security/release gates remain open. Apply the new migration only through the reviewed environment-specific schema transition before enabling this source against that database. No SMTP, production payment or live database test ran.

Reference: [Supabase RLS and grants](https://supabase.com/docs/guides/database/postgres/row-level-security).
