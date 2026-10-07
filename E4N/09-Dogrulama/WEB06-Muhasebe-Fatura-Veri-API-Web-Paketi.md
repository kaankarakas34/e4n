# WEB-06 — Muhasebe fatura veri/API/web paketi

## 5 Ekim WEB-06 — güncel devam noktası

E4N-140 Done / 519a3ec commit push tamamlandı. Muhasebe fatura kaydı + private kalıcı PDF + keyed upload/tek mail girişimi + sahip/ADMIN download + web retry/hesap değişim temizliği bütün paket teslim edildi. [[E4N/09-Dogrulama/WEB06-Muhasebe-Fatura-Veri-API-Web-Paketi|Doğrulama]]. İzole invoices-contract, smoke, documents-contract; check/build; gerçek bileşenle fixture tarayıcı kabulü PASS. Şema 13 sürüm / 41 tablo, canlı uygulanmadı.

Linear 84 = 28 Done / 15 In Progress / 41 Backlog. Web/ortak **24/71=%33,8**; mobil **4/12=%33,3**; LMS **0/1** ayrı son aşama. Bu ana/alt görev sayımıdır, ürün/ekran hazırlığı yüzdesi değildir. [[E4N/07-Sprintler/Web-Mobil-Ilerleme-2026-10-05|Sayım ve kalan hat]]. P35 In Progress: yeni faturalar tamam, eski dosya geçişi açık. P09/P39 kaynak teslim kanıtı güncellendi.

Aktif sıra eğitim dışı web + ortak API/veri → operasyon/web regresyonu/Sprint 6 güvenlik/sürüm → mobil/LMS. Sonraki bütün paket P39/P40 aktif web akışları veya P34 operasyon; kaynak/Linear bağımlılıklarını inceleyerek seç. D01–D10 kararı seçme; mevcut kullanıcı üyelik/grup/shuffle hedeflerini eski teknik düzeltmelerle tamamlandı sayma. E4N-133/135/136/137/138/140 Done tekrar seçilmez. Geçmişteki kurs/sınav next önerileri geçersizdir.

# WEB-06 / E4N-140 — accounting invoice file lifecycle

## Delivered

New private invoice_files table: MEMBER user FK or VISITOR public_visitors FK (exactly one), admin uploader, unique uploader/request_key, content fingerprint, filename, size, PDF bytes, email_state and created_at. Current target invoice URL/issued flag and stored file commit atomically. History remains retained when current pointer changes; FK RESTRICT prevents orphan invoice history. No payment, membership price, discount or D07 rule was invented.

Small PDF only, max3MiB; header/extension/filename checks, memory multipart. Permanent PostgreSQL bytea avoids Vercel temporary disk and external bucket orphan cleanup. New data is backend-only RLS/revoked PUBLIC/anon/authenticated grants. Existing trusted DB connection must own/bypass appropriately; live DB role is a P09 gate. CLI-created 20261005062305_invoice_files.sql loads as ledger0013. Fresh13 versions/41 tables; checksum history preserved; API has no DDL.

POST /admin/accounting/:type/:id/upload-invoice requires ADMIN JWT claim and current database ADMIN. Only current accounting-eligible MEMBER(subscription_plan/end date present) or VISITOR(paid source/form flag+kvkk) target accepted, preserving existing list criteria. Fields invoice PDF/requestKey; invalid input before side effects. Same admin/key serializes, same fingerprint replays, changed target/file409. Target row locks serialize pointer updates; older file rows remain downloadable history.

GET /invoices/:id verifies signed-in current database user: ADMIN any, MEMBER owner only; visitor invoice ADMIN only. Metadata check before loading bytes, exact size, attachment filename, application/pdf, nosniff, private/no-store. No public file URLs. Accounting list and existing delete route now verify current database ADMIN as well as claim; bytea never loaded by list. Receipt carries owner, target, key, file UUID and email state for typed client validation.

## Email outcome

The transaction claims ATTEMPTED before a single SMTP attempt; replays never resend. Attachment is a buffer, no temp file. sendEmail.success=true means SMTP submission succeeded, not proof of delivery to inbox. Failure/throw becomes UNKNOWN; no address NO_ADDRESS. Crash after commit/before or during notification leaves ATTEMPTED. File success is separate from email outcome; unknown email never becomes a failed file save or automatic duplicate email. There is no automatic retry/outbox worker; manual reconciliation of ATTEMPTED/UNKNOWN is future operational work. Failed outcome metadata update leaves ATTEMPTED. No real SMTP test was sent.

## Web

AdminAccounting keeps existing records/search/tabs/detail/delete UI. Upload supports one pending file/key in memory; synchronous operation lock and scope/epoch guard prevent duplicate operations and stale owner callbacks. Unknown5xx/network result exposes same-file/key retry, definitive4xx clears intent for correction. ACK clears intent before refreshing data; refresh error cannot resend saved invoice. Old owner data/modals hidden immediately on user/role/token change. Download uses bearer Blob, not a raw public anchor. Old URL displays legacy migration pending and isn't silently opened. After reload file/key are not persisted: verify current invoice before uploading again.

## Release and remaining P35 gates

No live Supabase changes or deployment. P35 parent stays open: actual legacy URL/file inventory, authorized source files, old bytes migration or unavailable-file decision, counts/rollback, live backup and migration rehearsal. Existing /uploads static infrastructure remains for historical compatibility pending review; this package does not certify all historical URLs private. Large files/external Storage, malware scanning, total retention quota and notification reconciliation are additional operational scope. Signature check isn't a malware scanner. Newly protected invoices are not counted as course/LMS work; mobile and LMS stay deferred.

## Verification

node server/test/invoices-contract.mjs PASS: disposable loopback PostgreSQL17, actual Express app; fresh13/repeat0/12→13, role/forged ADMIN claim/demotion/list/delete/download, MEMBER and VISITOR bytes, invalid/oversized file, 8 concurrent same-key uploads one file/SMTP call, replay/conflict, trigger failure after insert rolls back file+target and makes no SMTP call, retry, uncertain SMTP outcome with no resend, retained history/RESTRICT, default privilege revocation and RLS read/write denial after explicit grants. Nodemailer fake only, no real mail. Actual transpiled TS transport/service bearer+multipart+Blob also exercised.

node server/test/isolated-smoke.mjs PASS with13/41, legacy adoption/versioned upgrade and existing API regressions; node server/test/documents-contract.mjs PASS with new migration chain. npm run check/build PASS, git diff --check PASS; existing Vite size/browser warnings remain.

Playwright actual AdminAccounting/authStore/typed service in local Vite harness, captured isolated DB/API fixtures with simulated response failure: read error/retry, native file chooser, lost post-commit response, same-key retry and one visible completed invoice, authenticated download fatura.pdf, owner switch hides accounting. Screenshot output/playwright/invoices-recovered.png visually checked. Browser uses fixtures, not production browser→DB deployment proof.
