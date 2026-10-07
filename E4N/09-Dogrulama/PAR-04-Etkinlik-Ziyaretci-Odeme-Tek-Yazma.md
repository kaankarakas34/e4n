# PAR-04 — Etkinlik ve ziyaretçi ödeme bildirimleri

## 2 Ekim teslimi — `a292747`

Bağlı `server/src/index.js` POST payment success callback kayıtlı `event_registration` action için attendance ve gerekiyorsa event_tickets yazar; `visitor_registration` action için public_visitors kaydı oluşturur. PaymentModal ardından onSuccess bildirir. Önceden EventDetail tekrar `registerForEvent(...payment_status=PAID)`, VisitorPaymentPage tekrar PAID public visitor başvurusu gönderiyordu. Bu ikinci yazmalar kaldırıldı; sunucu callback politika/SQL'i değiştirilmedi.

### Etkinlik

Ödeme bildirimi yalnız `/events/:id` taze okumasını başlatır. Kayıtlısınız yalnız gerçek yanıtın attendees kaydından türetilir; bildirim bunu true yapmaz. Mesaj ödeme bildiriminin alındığını söyler, ödeme onayı veya bilet e-postası teslimi iddia etmez. Eski kart okuma öncesi kaldırılır; hata/bozuk veya yanlış etkinlik yanıtı alert/tekrar; gecikmiş eski yanıt yeni route kaydını ezmez. Açık ücretsiz kayıt kullanıcı eylemi korunur.

### Ziyaretçi

Ücretli callback tekrar başvuru göndermez; modal/pending form kapanır ve “Ödeme bildirimi alındı” durum ekranına geçilir. Ödeme/başvuru sonucunun bu ekranda doğrulanmadığı ve tekrar ödeme öncesi yöneticiyle kontrol gerektiği açık. Sahte Başvurunuz Alındı/ödeme/kayıt/e-posta başarı iddiası yok. Doğrulanmış ücretsiz davetiye açık form gönderimi önceki FREE yolu ile korunur.

## Kanıt

- `node test/event-payment-notification.mjs`: MEMBER/PRESIDENT/ADMIN bildirimi sıfır ikinci kayıt yazması; taze attendees yok/var, okuma hata/tekrar, null/wrongid/bozuk alan yanıtı, gecikmiş eski route yanıtı ve açık ücretsiz kayıt tek yazma.
- `node test/visitor-payment-notification.mjs`: ödeme action gövdesi; bildirim sıfır ikinci PAID başvurusu, nötr sonuç, kapanan modal; doğrulanmış ücretsiz davetiye FREE/0 tek başvuru.
- `node test/payment-modal-lifecycle.mjs`, `npm run check`, `git diff --check` başarılı. React hook/cleanup incelendi; commit push/temiz yönetilen ağaç.

Gerçek bileşenler kontrollü hooks/form/API/window ile çalıştırıldı. Bu tur HTTP callback, gerçek tarayıcı veya provider testi yok; canlı Supabase/ödeme/e-posta/dağıtım yok.

## Açık işler

attendance PRESENT hâlâ ön kayıt/gerçek katılım ayrımını kaybetmektedir (H17/P26); fiyat/kayıt/hak D07, transaction ownership/provider/invoice/origin ve callback güvenliği Sprint6 işleri açık. Attendees görünümü ödeme uzlaşması değildir. Ziyaretçi için güvenilir ödeme/başvuru durumunu gösterecek doğrulanmış okuma akışı ayrıca gerekiyor; bu teslim onu varmış gibi göstermez. Ücretsiz kayıt e-posta başarı metni bu tur düzeltilmedi.

Sonraki bağımsız iş: kalan etkinlik/ziyaretçi kayıt ekranlarında API hata→boş/başarı ve token yükleme/yanıt sınırlarını incele; doğrulanmış sonuç okuması gerektiren değişiklikleri açık D07/Sprint6 bağımlılıklarıyla ayır. Ana PAR04/P26 kapsamı bitmedi.
