# PAR-04 — Admin destek yazma doğrulaması

Tarih: 3 Ekim 2026. Commit: `5f7b04f`, yönetilen dala push.

## Değişiklik

AdminSupportTickets reply ve status işlemleri ortak ref kilidi kullanır. Aynı tick ikinci istek engellenir, pending buton/textarea kapalı. ADMIN oturumu, render detay sequence ve hedef doğrulanmadan API çağrılmaz. Geç ACK başka talep/hesap taslağı veya görünümüne uygulanmaz. Oturumda notice/pending görünümü sıfırlanır.

Yalnız `success === true` ACK. Belirsiz sonuçta taslak korunur; kontrol için GET düğmesi sunulur. Kesin başarısızlık iddiası yoktur: ağ hatasında sunucu yazmış olabilir. Onay sonrası yazma tekrar edilmeden detay/liste paralel yenilenir; read error kendi retry kontrolünde görünür, ACK bildirimi ayrı kalır. Status optimistic varsayımla değiştirilmez, server detail tekrar okunur. Aynı oturum liste refresh bütün ekranı gizlemez; liste loading/eski listeyi gizleme korunur.

## Kanıt

- `node test/admin-support-list.mjs`: gerçek TSX transpile ve enjekte hook/API; null/malformed/false/string ACK/reject, taslak koruma, status sahte değişmez, same-tick reply+status kilidi, başarılı ACK sonrası iki GET hatası ve yalnız GET retry, gerçek server status fixture, hedef switch/close/session/unmount geç sonuç. Önceki liste/detay sınır regresyonları da geçti.
- `npm run check`: exit 0.
- `npm run build`: exit 0; mevcut chunk ve eski browsers veri uyarıları başarısızlık değil.
- `git diff --check`: başarılı.

## Sınır ve devam

Gerçek DOM/tarayıcı, HTTP/DB ve Expo kanıtı değil. POST message server transaction sonrası 201 success=true; PUT status success=true fakat affected-row kontrolü yok. Client kilidi server idempotency sağlamaz. Canlı yazma/gerçek ödeme/production deploy yapılmadı. PAR-02/04 ana kabul açık; kapsamlı güvenlik Sprint6. Sonraki kullanıcı SupportTickets liste read/session, sonra detay/yazma.
