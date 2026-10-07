# WEB-07 etkinlik kişisel kayıt paketi

## 5 Ekim WEB-07 — güncel devam noktası

E4N-141 Done / 5774b40 push: etkinlik kişisel kayıt API+web paketi tamamlandı. Liste/detail is_registered JWT sahibi+DB mevcut kullanıcı sınırı true/false/null; listeye diğer katılımcı kimlikleri eklenmedi. Katılacağım sekmesi ve Kayıtlı rozeti, refresh; EventDetail uncertain POST sonrası read-only recovery ve ACK/read-error ayrımı, account/token scope birlikte teslim edildi. [[E4N/09-Dogrulama/WEB07-Etkinlik-Kisisel-Kayit-API-Web-Paketi|Kanıt]]. Kayıt/ödeme mevcut detay navigasyonunda; yeni doğrudan liste butonu yok.

İzole PG17/HTTP gerçek TS API+fake mail, smoke, build/diff/syntax PASS. Gerçek UserEvents/EventDetail + captured fixture tarayıcı: read retry, lost response/recovery tek POST; mine1→owner switch0; ACK/read500/retry tek POST; screenshot kontrolü PASS. Production E2E değil. Kendi browser/Vite/konteynerler kapandı. HEAD/origin 5774b40; yalnız output kanıtları untracked. Şema13/41, canlı uygulanmadı.

Linear **85 = 29 Done / 15 In Progress / 41 Backlog**. Web/ortak **25/72=%34,7**; mobil **4/12=%33,3**; LMS0/1 ayrı. Ana/alt görev sayımıdır, ürün/ekran hazır yüzdesi değildir. P39/P26 kaynak kanıtı eklendi ama ana hedefler kapanmadı. P26 registration/attendance ayrımı, ticket/payment/capacity/FE hedefleri ile SEC mevcut attendee/online-link erişim sınırları açık. Mevcut attendance satırı is_registered demektir; gerçekleşen katılım değildir. Ürün kuralları D01–D10 uydurulmadı.

Sonraki bağımsız web paketi seçilirken P30/P31/P39/P40 açık kapsamı ve gerçek ekran/API eksiklerini yeniden oku; P34 metin bağımlılıkları P21/P27 içerdiğinden champion dönem/üyelik politikası seçme. P09 gerçek yedek+geçiş ve P35 eski fatura dosyaları açık; source-only teslimleri canlı kabul sayma. Mobil/LMS son aşama. Done E4N133/135/136/137/138/140/141 yeniden yapılmaz. Art arda gelen heartbeatler bu paket çalışırken yeni paralel iş başlatmadı.

# WEB-07 — personal event registration read and web recovery

## Contract

`GET /api/events` and `GET /api/events/:id` now return `is_registered`: true/false only for the signed JWT subject if that UUID still exists in users; otherwise null. Query userId, roles or another participant's identity do not select the subject. Responses are private/no-store. List filters retain parameterized bindings after the added owner parameter. No attendee identities were added to the list.

This flag deliberately reflects the existing attendance-based registration contract, including ABSENT rows. It does not claim the person attended, that a payment succeeded, or that P26's target separate registration/ticket model has been implemented. No migration or product rule was introduced; schema stays 13 versions/41 tables.

## Web

UserEvents uses that boolean for the Katılacağım filter and Kayıtlısınız badge, with explicit refresh. Missing/nonboolean flags remain unknown instead of an empty personal list. Its never-rendered direct registration handler was removed; registration continues through existing EventDetail navigation.

EventDetail uses the same owner flag and scopes reads/writes by event, user, role and token. Existing synchronous pending lock and context generation guard remain. A successful POST ACK is followed by a fresh GET; an ACK is not replaced with a read failure or silently sent again. Failed/uncertain POST disables resubmission until Kaydımı kontrol et reads the current state. An ACK followed by false state remains blocked for reconciliation. Unknown registration flags disable authenticated registration. Paid PaymentModal flow remains separate.

## Verification

- `node server/test/event-registration-contract.mjs`: PASS. Disposable loopback PG17, fresh13/repeat0; own true/false/null, other users/query spoof/deleted/invalid JWT, list filters/cache and read-only behavior; actual transpiled TS API bearer transport through Express; registration and replay one row/no repeated fake SMTP call; injected read500 and recovery. Fake nodemailer is installed before Express import; no real email.
- `node server/test/isolated-smoke.mjs`: PASS, including previous participant count 0/2/edit2/admin removal1 and existing application contract regressions.
- `npm run build`: PASS (existing bundle-size/browser-data warnings only); `git diff --check` and Node syntax check PASS.
- Actual UserEvents + EventDetail components in local Playwright, captured isolated fixture: list read500/retry; lost POST response after fixture commit, disabled resend, GET-only recovery, one POST; personal tab1, other event hidden, account switch0 and no old badge. ACK followed by detail read500 then GET retry also retained one POST and reached Kayıtlısınız. Screenshots under output/playwright/event-registration-*.png. This is fixture browser acceptance, not production E2E.

## Remaining gates

Existing attendance/register endpoint business rules, PRESENT placeholder semantics, ticket/payment/capacity/FE races, and existing attendee/online-link authorization are separate P26/SEC release work. This package does not complete those goals. Mobile/LMS deferred. No live Supabase writes, deployment, real SMTP or payment test. Production schema adoption and release acceptance remain open.