# Mobile changes awaiting repository integration

`admin-dashboard-real-stats.patch` replaces the local dashboard's static 54/1/2 with existing `/reports/stats` record counts, loading/error/retry and unavailable values. Already applied locally; reverse-check passed. Mobile TypeScript before/after and `node test/mobile-admin-dashboard.mjs <admin/index.tsx-path>` passed. Client ADMIN guard is covered, but the existing reports API still allows authenticated MEMBER requests; its role policy remains an open audit item. No production integration or device acceptance is implied.

`admin-professions-load-error.patch` records only the local admin profession screen change. Already applied locally: failed or malformed loads show a persistent alert/retry; stale rows and false empty messages are hidden, true empty remains. Mobile TypeScript before/after and `node test/mobile-professions.mjs <professions.tsx-path>` passed. Reverse-check verified this patch against the local source. Production repository integration and device verification remain open; the mobile repository still has no remote and existing unrelated changes are preserved.

`admin-applications-load-error.patch` records only the change to the existing mobile admin applications screen. It has already been applied to the local mobile source. Do not apply it there again.

The mobile repository has extensive existing modified/untracked sources and no Git remote. Those sources were preserved; no unrelated mobile files were staged or committed. This patch is tracked on the managed E4N branch for review and later integration into the authoritative mobile repository.

On the matching pre-change mobile source, apply with `git apply <patch-path>`. On the edited local source, `git apply --reverse --check <patch-path>` verifies the patch matches without modifying files.

Verification: mobile `node node_modules/typescript/bin/tsc --noEmit` before/after passed. From the managed repository, `node test/mobile-applications.mjs <mobile-applications.tsx-path>` verifies actual component behavior with controlled hooks/API responses: both request failures, malformed response, retry and real empty data. It is not a React Native device/render or authentication test. Production mobile integration and device verification remain open.
