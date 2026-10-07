# PAR-03 — Kullanıcı destek yazma sözleşmesi

3 Ekim 2026 heartbeat, commit `c917bae`, yönetilen dala push.

## Sözleşme

Kaynak server/src/index.js create /tickets 201 ticket row döndürür: success flag yok. İstemci ticket/id/user_id=oturum/subject=gönderilen/OPEN/date doğrular. Reply /tickets/:id/messages 201 success=true; yalnız boolean true kabul edilir.

Create/reply ortak senkron ref kilidi ve pending. Form/draft girdileri pending kapalı. Belirsiz sonuçta taslak ve modal korunur, yalnız GET ile kontrol verilir; ağ hatası kesin yazılmadı anlamına gelmez. Onay sonrası form temizlenir ve kayıt bildirimi read error'dan bağımsız kalır. GET retry POST tekrar etmez. Modal version close/reopen ve reply hedef/detail version başka taslağın temizlenmesini engeller. Eski oturum/unmount sonuçları state/read yazmaz. Mevcut CLOSED reply yasağı handlerda da korunur.

## Test kanıtı

- node test/user-support-read.mjs: gerçek TSX hook/API enjeksiyonuyla create malformed/success-flag-only/wrong-owner/wrong-subject/wrong-status/reject, reply null/false/string/reject, draft koruma, same-tick create/reply kilidi, iki işlem için ACK sonrası GET hata/retry ve tek yazma, modal close/reopen/eski callback, session/unmount/target sınırları. Önceki read regresyonları da geçti.
- node test/admin-support-list.mjs: başarılı.
- npm run build: tsc + vite exit0 (mevcut browsers/chunk uyarıları).
- git diff --check: başarılı.

## Sınır

Gerçek DOM/HTTP/DB/Expo/server idempotency kanıtı değil. Canlı Supabase yazması/production deploy/ödeme yok. Ana PAR02/03 ve Sprint6 açık. Sonraki kaynak getMyMeetingRequests catch=>[] ve MeetingRequestsList console-only hatası: read sözleşmesi, loading/error/retry, session/sequence/owner doğruluğu. Status API success wrapper ve tek pending ayrı devam paketi.
