# Fresh non-education web rehearsal

## Command

From the repository root:

    npm --prefix server run test:web-rehearsal -- "<installed Playwright CLI JavaScript entry>"

The CLI path is explicit. Direct node invocation also accepts --playwright-cli or E4N_PLAYWRIGHT_CLI. The command runs all API/data suites, then the production build, then starts its own disposable PG17/Express/Vite fixture and runs the actual web acceptance driver. No prior browser report is reused. The browser driver receives the exact new fixture descriptor instead of the shared current-fixture pointer.

## Evidence

output/web-rehearsal/<timestamp>/report.json links each child report and captures stage logs, commit, working-tree dirty state and SHA256 of source, migrations, tests/tools, package lockfiles and application configs. A changed source digest or commit rejects combined acceptance. In a dirty checkout, the base commit alone does not identify tested code: use the captured digest. Committing the same source afterward does not make the earlier dirty run a clean-commit run.

A workspace-exclusive output/web-rehearsal.lock prevents duplicate rehearsal child work. Its descriptor includes run ID, PID and start time. An existing lock is an error; the runner does not delete another owner's lock. Successful completion closes the owned browser/API/Vite/database fixture and removes its own lock. Logs/report preserve failed stages. Early fixture failures or interrupted processes require inspecting their ownership and cleanup result before a retry.

## Interpretation

technicalPass requires successful API/data, build, fresh browser/final database state, unchanged source and successful fixture cleanup. releaseReady remains false. Current D policies, historical data interpretation, real production schema adoption/provider validation, broad Sprint6 security and product release gates are separate. The isolated-smoke suite intentionally checks retained known defect baselines; its success does not mean those product defects are fixed. 177 owned route definitions are not 177 browser end-to-end cases. Mobile Sprint7 and course/education/exam Sprint8 are excluded.

The runner uses no production deployment or live migration operation. Tests create isolated databases and fake mail/payment services, remove production database/service credentials from inherited child environments, and require loopback fixture endpoints. This is a rehearsal of existing implementations, not production data or payment-provider sandbox acceptance.

See the matching Obsidian P37 consolidated rehearsal note for the latest factual run outcome.
