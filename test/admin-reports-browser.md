# Isolated report browser verification

Start the local frontend with `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5178 --strictPort`.

Use Playwright CLI with a separate session:

1. `playwright-cli -s=e4n-report open about:blank`
2. `playwright-cli -s=e4n-report run-code --filename test/admin-reports-browser-fixture.cjs`
3. Snapshot; verify the failed load alert and absence of KPIs.
4. Click the snapshot reference for **Tekrar dene**.
5. `playwright-cli -s=e4n-report run-code --filename test/admin-reports-browser-verify.cjs`
6. Snapshot and click **Trafik Işıkları**, then **Katılım Raporu**; confirm their tables.
7. Return to **Genel Bakış**, resize to 390 × 844 and repeat the verification. Repeat at 1280 × 900.
   Run `playwright-cli -s=e4n-report run-code --filename test/admin-reports-browser-unavailable.cjs` to verify unknown revenue/breakdown/loss/conversion are labeled rather than displayed as zero.
8. `playwright-cli -s=e4n-report close`; stop the local Vite process.

The fixture intercepts all nonlocal requests. API responses are synthetic: the first stats read is 503, the retry returns zero revenue. Other origins and unknown API paths are blocked. The synthetic token is checked by the fixture; it is not a real authentication or authorization test. The harness mounts the actual report component and CSS but does not test application routing/login or backend/database correctness.

On 2026-10-02: failure/retry, actual zero, unavailable score, tab switching and both widths passed. The initial empty-series contract rendered positive chart dimensions; the current fixture follows the updated backend contract with `availability: false`. Both charts now show **Veri yok** and render no series or chart containers. Retry and no horizontal page overflow passed at 1280 and 390 pixels. Screenshots/logs go to ignored `output/playwright/` and `.playwright-cli/`.
