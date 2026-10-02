# Mobile changes awaiting repository integration

`admin-applications-load-error.patch` records only the change to the existing mobile admin applications screen. It has already been applied to the local mobile source. Do not apply it there again.

The mobile repository has extensive existing modified/untracked sources and no Git remote. Those sources were preserved; no unrelated mobile files were staged or committed. This patch is tracked on the managed E4N branch for review and later integration into the authoritative mobile repository.

On the matching pre-change mobile source, apply with `git apply <patch-path>`. On the edited local source, `git apply --reverse --check <patch-path>` verifies the patch matches without modifying files.

Verification: mobile `node node_modules/typescript/bin/tsc --noEmit` before/after passed. From the managed repository, `node test/mobile-applications.mjs <mobile-applications.tsx-path>` verifies actual component behavior with controlled hooks/API responses: both request failures, malformed response, retry and real empty data. It is not a React Native device/render or authentication test. Production mobile integration and device verification remain open.
