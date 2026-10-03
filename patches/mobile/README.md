# Mobile changes awaiting repository integration

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
