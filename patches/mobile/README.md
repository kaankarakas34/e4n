# Mobile changes awaiting repository integration

## P32-C / E4N-130: completed activity records

`completed-activities.patch` is already applied locally and depends on P32-B. The existing activities route now uses the shared workspace in activity mode: selected partner, actual local date/time, optional notes, keyed `/one-to-ones` write, validated ACK, same-key retry and owner-scoped completed ACTIVITY history. Scheduling requests remain separate. This fixes the prior `/activities` path/body mismatch. Device, authoritative mobile repository integration and release remain open.

The active server writes activity, requester score and history in one transaction; the existing formula and requester-only attribution remain. Replaying the same ID/content does not recalculate or append history. Migration 0010 creates the previously missing history table used by the existing calculator; requires migration before the changed server is used. No history backfill or new points policy is implied. Web completed activity reads now exclude requests/pending rows; the existing web create modal still needs its own write implementation. Legacy clients without requestId have no deduplication guarantee.

Verification covers real mobile service/transport against disposable Express/PostgreSQL, concurrent replay/one history, score-history failure rollback, owner/conflict/recipient boundaries, preserved formula and migration upgrade; actual mobile TSX/service and web read adapter tests, mobile TypeScript, web build, Android Metro export and patch reverse-check. Keys remain in memory; no reload recovery or production deployment.

## P32-B / E4N-129: meeting requests

`meeting-requests-lifecycle.patch` is already applied locally; do not reapply it there. It adds a reachable menu route and typed service for incoming/outgoing meeting requests, keyed request creation with validated local date/time, recipient-only pending accept/reject, validated ACKs, list/people error-retry-empty states and context/generation/unmount boundaries. Existing ACTIVITY rows are labelled separately from REQUEST rows; this package does not implement completed activity recording or scores. The existing `/activities` recording screen remains an open contract item.

Requires migration 0007 and the current `/one-to-ones` request/list/status API. Reuses the native UUID dependency introduced by P32-A. Same intent uses the same request ID after an ambiguous response; keys are in memory, without reload recovery. Accepted meetings open the same one-hour Google Calendar template as the web flow only on user action.

Verification passed: mobile TypeScript, `node test/mobile-meetings.mjs <mobile-root>` with actual screen/service and controlled RN hooks/transport; `node server/test/meeting-contract.mjs <mobile-root>` with actual mobile transport/service against disposable Express/PostgreSQL17, same-key single request, recipient/foreign/status boundaries, existing migration/race tests and unchanged legacy activity/score snapshots. Offline Android Metro export passed (1400 modules, exit 0); scoped patch reverse-check passed. No device acceptance, mobile repository integration or production release is implied.

## P32-A / E4N-128: support lifecycle

`support-lifecycle.patch` is already applied to the local mobile source; do not apply it there again. It replaces the member and admin support routes with a shared workspace and typed service: owner list/detail/create/reply, ADMIN reply/close/reopen, visible read errors/retry/true empty, validated acknowledgements, one synchronous mutation lock and same-key retry after ambiguous failure. Session/target/unmount guards discard stale results; closed members cannot reply. Keys are held in memory; reload recovery is not included.

The service requires the support API and migration 0009 from `a2823cb`. The direct `expo-modules-core` dependency uses the already installed Expo 54 version 3.0.29 for native UUIDs; no native SDK upgrade was performed.

Verification passed: mobile TypeScript, `node test/mobile-support.mjs <mobile-root>`, `node server/test/support-flow.mjs <mobile-root>` with actual mobile transport/service against disposable Express/PostgreSQL 17, and offline Android Metro export (1398 modules, exit 0). Controlled component tests cover member/admin flows, pending/retry, invalid owner/target/ACK and stale responses. The scoped patch reverse-check passed against the edited source.

Only this patch and reproducible tests are committed to the managed web branch. The separate mobile repository has no remote and contains prior changes; those changes and its gitlink are preserved. Authoritative mobile repository integration, device acceptance and release remain open. No live database writes, email, payments or production deployment were performed.

`admin-payment-history.patch` is already applied to local mobile subscriptions. It consumes the new ADMIN read-only `/payments/history` recorded-transaction list: persistent error/retry, true empty, real zero, unavailable amount/date/owner and neutral pending status. Title describes payment transactions, not membership entitlement. TypeScript before/after, `node test/mobile-payment-history.mjs <subscriptions.tsx-path>` and reverse-check passed. The API links users only by recorded user_id and omits action_data. Production repository integration and device acceptance remain open.

`admin-reports-load-error.patch` is already applied to local mobile reports. Persistent alert/retry replaces false zero metrics after failures; missing revenue/counts show unavailable, real zero remains zero. Mobile TypeScript before/after and `node test/mobile-admin-reports.mjs <admin/reports.tsx-path>` passed; reverse-check matches. It uses the existing reports API and does not change its role policy or financial formulas. Device and production repository integration remain open.

`admin-dashboard-real-stats.patch` replaces the local dashboard's static 54/1/2 with existing `/reports/stats` record counts, loading/error/retry and unavailable values. Already applied locally; reverse-check passed. Mobile TypeScript before/after and `node test/mobile-admin-dashboard.mjs <admin/index.tsx-path>` passed. Client ADMIN guard is covered, but the existing reports API still allows authenticated MEMBER requests; its role policy remains an open audit item. No production integration or device acceptance is implied.

`admin-professions-load-error.patch` records only the local admin profession screen change. Already applied locally: failed or malformed loads show a persistent alert/retry; stale rows and false empty messages are hidden, true empty remains. Mobile TypeScript before/after and `node test/mobile-professions.mjs <professions.tsx-path>` passed. Reverse-check verified this patch against the local source. Production repository integration and device verification remain open; the mobile repository still has no remote and existing unrelated changes are preserved.

`admin-applications-load-error.patch` records only the change to the existing mobile admin applications screen. It has already been applied to the local mobile source. Do not apply it there again.

The mobile repository has extensive existing modified/untracked sources and no Git remote. Those sources were preserved; no unrelated mobile files were staged or committed. This patch is tracked on the managed E4N branch for review and later integration into the authoritative mobile repository.

On the matching pre-change mobile source, apply with `git apply <patch-path>`. On the edited local source, `git apply --reverse --check <patch-path>` verifies the patch matches without modifying files.

Verification: mobile `node node_modules/typescript/bin/tsc --noEmit` before/after passed. From the managed repository, `node test/mobile-applications.mjs <mobile-applications.tsx-path>` verifies actual component behavior with controlled hooks/API responses: both request failures, malformed response, retry and real empty data. It is not a React Native device/render or authentication test. Production mobile integration and device verification remain open.
# P32-D / E4N-132: referral lifecycle

`referral-lifecycle.patch` is already applied to the local mobile source; do not apply it there again. It captures only `app/features/referrals.tsx` and new `utils/referrals-api.ts` relative to the dirty pre-package source. Existing unrelated files and the managed mobile gitlink remain untouched.

Web/mobile use the same typed domain service (only the transport import differs), current active group/team membership or `/user/friends` recipient selection, INTERNAL/EXTERNAL, HOT/WARM/COLD, description and optional estimated volume. The receiver can finalize pending referrals as successful with positive revenue or unsuccessful. Both platforms expose owner-scoped lists, search, direction, real status/count/volume, error/retry/empty and one synchronous mutation lock. Session, recipient scope and unmount guards discard stale responses. Creation reuses the same UUID for ambiguous retries; keys are in memory, without reload recovery. Creation replay after the receiver changes the recorded amount returns conflict and requires list reconciliation; it never inserts another referral.

Requires current referral API and existing migrations through 0010. No new migration, financial record, monthly score rule, entitlement rule or release is added. Current server user-group/member selection endpoints retain their existing authorization behavior; broader RLS/group access hardening remains in Sprint 6. Referral reads/writes and receiver decisions are verified for ownership.

Acceptance: `node test/referral-lifecycle.mjs <mobile-root>` actual web/mobile TSX and domain service with controlled hooks/transport; `node server/test/referral-contract.mjs <mobile-root>` actual web/mobile bearer transport against disposable Express/PostgreSQL17, scoped recipient sources, create race/replay, receiver/foreign boundaries, terminal race/replay, create/status score rollback. Store/API regression, web build, mobile TypeScript, offline Android export and scoped patch reverse-check passed. Controlled UI tests and Metro export do not replace browser DOM or device acceptance. Authoritative mobile repository integration and release remain open.
