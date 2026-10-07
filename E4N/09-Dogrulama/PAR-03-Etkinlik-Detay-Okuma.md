# PAR-03 — Etkinlik detay okuma sınırları

3 Ekim 2026. Commit `ff24bb2`, yönetilen dala push edildi.

## Teslim

EventDetail okuması hedef/kullanıcı/rol ve son istek bağlamında uygulanır. Context değişir değişmez eski detay gizlenir; effect cleanup öncesi bile eski yanıt veya eski kayıt/ödeme callback'i yeni bağlamı değiştiremez. Unmount ve önceki sequence sınırı korunur. Ödeme bildirimi sonrası loading finally eski oturuma yazmaz.

Yanıt object/id/title/başlangıç tarihi/is_public ve gösterimde kullanılan opsiyonel metin alanları doğrulanır. Katılımcı listesi varsa her satırın object ve boş olmayan string id olması gerekir. Eksik katılım kesin kayıtsız kabul edilmez: görünür alert/tekrar okuma, kullanıcı için yeni kayıt düğmesi kilitli. Gerçek[] ile kayıt işlemine devam edilebilir. Mevcut FREE success=true ACK ve tek pending korunur.

## Kanıt

`node test/event-payment-notification.mjs`: önceki MEMBER/PRESIDENT/ADMIN bildirim/no-second-write, FREE strict ACK/repeat/error/duplicate/route-user-role/unmount regresyonları; yeni malformed katılımcı/metin/tarih/public, cleanup öncesi eski görünüm/callback/late read sınırı ve eksik katılım tekrar okuma testleri geçti.

`npm run check` ve `git diff --check` başarılı. Test gerçek TSX'i kontrollü hooks/router/auth/API ile çalıştırır. Gerçek DOM/tarayıcı/HTTP/veritabanı/ödeme/e-posta/cihaz testi değildir. Canlı işlem veya dağıtım yapılmadı.

## Açık sınırlar

Sunucu rol/veri sahipliği, katılım status/hak tanımı, kişisel kayıt API'si ve ana PAR02/03 kabulü açık. Context koruması sunucuya gönderilmiş yazmayı geri almaz. Kapsamlı güvenlik Sprint6'da.

Kaynakta sidebar ücret her etkinlik için sabit Ücretsiz, kapasite sabit Sınırlı Sayıda; ödeme amount Number(price)||0. Bunlar bu committe değişmedi. Sonraki bağımsız iş doğrulanmış ücret/para birimi/kapasite ve bilinmeyen fiyatın0 olmaması; ödeme açılışını kontrollü doğrulamak. İş fiyatı veya yeni hak kuralı uydurulmaz.
