# Membership record consistency

GET /api/membership-records returns the current actor's account and explicitly owned payment, invoice and reminder records. GET /api/admin/membership-records returns the bounded account catalog and NULL-owner payment count; GET /api/admin/membership-records/:id returns the selected account's records. Current database role, strict UUID/query validation, private no-store responses and one read-only repeatable-read snapshot protect the contract.

No ownership inference from action_data, currency inference, account state transitions, payment calls or reminders are performed. End time is compared with snapshot asOf separately from raw account_status. Each detail returns last100 stable rows plus full counts. Admin catalog over5000 fails explicitly. Provider receipts, secrets and file bytes are excluded; invoice downloads reuse the existing authorized route.

Web routes /membership-records and /admin/membership-records are linked from membership/admin subscriptions. Actor-role-token epochs discard stale responses; selection clears old details. Invoice blobs are size checked. Mutable rights and product policies remain outside this delivered record package.

Focused test: node server/test/membership-records-contract.mjs. Full acceptance:32 suites; real browser34 cases. Evidence and limitations: E4N/09-Dogrulama/P30-P31-Uyelik-Odeme-Kayit-Butunlugu-2026-10-07.md.
