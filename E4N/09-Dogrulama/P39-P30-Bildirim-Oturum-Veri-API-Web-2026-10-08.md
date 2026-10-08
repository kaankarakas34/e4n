# P39/P30 — Bildirim ve oturum veri/API/web paketi



No migration or new notification producer. GET /api/notifications/web returns owner/version, latest50 ordered by created_at and id, total and all unread rows (including outside the window). Count/window share a single SQL statement snapshot. GET /api/notifications keeps its legacy array and user_id shape. Single/read-all writes require the current database account, reject foreign IDs with404, use a transaction and per-owner user lock, return canonical snapshot plus success compatibility. Query/body override is rejected; invalid IDs400; missing account401; SQL failures redacted and rolled back. Private/no-store. Replaying an already-read row does not UPDATE it again. New notifications created after read-all remain unread. Counts reflect the database at the response snapshot, not a realtime subscription.

## Web/session

Shared NotificationList in navigation and community dashboard: loading/error/empty separated, real unread total, last50 explanation, refresh, explicit accessible single/all read buttons, and MESSAGE link. No profile URL is guessed from human-readable notification text. Other types display their actual content; no missing entity target is invented. Existing producers/mail/shuffle policy unchanged.

Store clears synchronously on owner/token changes, drops stale read/write responses, sequences reads and serializes submit. Canonical ACK replaces local state. Unknown write result is reconciled with a GET; no automatic second PUT. Error does not claim an empty list or zero verified unread. A missing old row outside50 cannot prove single-read recovery; it remains an explicit uncertainty.

Auth refresh now distinguishes401/403 from cancellation/server/network errors, checks the captured owner/token before publishing success or clearing credentials, and cannot resurrect a logged-out account. Existing backend role checks remain in effect; this does not establish an expired credential as valid or replace the broad auth/RLS audit.

## Verification/remaining gates

Actual PostgreSQL17/Express contract covers65 unread/50 window, foreign isolation, eight concurrent replays, current-account checks, query/body rejection, trigger failure rollback/redaction, read-all/repeat, subsequent new unread and legacy array. Production TypeScript response guard tests reject false owner/version/count/duplicates/read ACK. Production auth store tests cover stale success/401 after account switch, logout resurrection, genuine401/403 and transient failure retention. Static/runtime ownership180 routes/27 providers/17 retained legacy. Schema23 migrations/47 tables unchanged.

Browser results and commit are recorded in the Obsidian delivery note. First general regression75PASS/4FAIL retained: three attendance scenarios timed out after reload into login, followed by failed finalDB because retraction was skipped. Focused attendance UI then5/5; its initial custom finalDB checker incorrectly required the unchanged president row also REGISTERED and failed. This is preserved, not a full-pass claim. First final browser startup /state timeout while build was running did not yield a complete browser result. No real mail/payment/live Supabase write or production deployment.

P39/P30/P37 stay In Progress; D decisions and live migration/provider/security/release gates remain open. Mobile7 and LMS8 deferred. General security audit is not declared complete.


## Son kabul

Güncel gerçek App/Vite→Express/JWT→izolePG17 browser79/79, bildirim finalDB65kayıt/0okunmamış. Özel bildirim5/5+finalDB PASS. API/data/typedguard, gerçek authstore ve actualroutecontract PASS. Güncel check/build teslim kaydında; tüm38API tekrar çalıştı denmez. Kanıt server/docs/notifications-web-acceptance-2026-10-08.json. Önceki75/4FAIL korunur; geçici ağ hatasının oturumu silmesi ve eski yanıtın hesap değiştirmesi production authstoreda testlenip giderildi. Kaynak23/47değişmedi.

Güncel productionbuild/check/diff PASS; build output/notifications-build-complete.log. 38 API paket runnerda kayıtlı; bu tur38topluAPI yeniden koşulmadı.
