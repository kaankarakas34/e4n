# PAR-04 — Ziyaretçi davetiye kontrolü

## 2 Ekim teslimi — `bbc9e45`

VisitorPaymentPage davetiye kontrolündeki ağ/API hatasını geçersiz davetiye sayıp ödeme adımına geçiriyordu. Kontrol sürerken de form gönderilebiliyordu. Hata artık ücret gerekliliği sayılmaz.

- URL token render sırasında okunur; ilk effect öncesinde ve doğrulama yüklenirken kayıt/ödeme engellenir.
- Ağ/API/bozuk yanıt ve alan türü hatası görünür alert/tekrar; ücretsiz veya ücretli işlem başlamaz.
- Yalnız boolean valid ve valid=true için dolu email yanıtı kullanılır; inviter_name/error alanları string olmalıdır. Açık valid=false başarılı yanıtı eski ücretli seçeneği korur; ekranda sabit 6 saatlik sona erme iddiası kaldırıldı.
- Token değişiminde eski modal/pending form kaldırılır; eski token'ın gecikmiş doğrulaması yeni token sonucunu veya e-posta alanını ezmez. Kapanışta doğrulama geçersiz kılınır.
- Ücretsiz kayıt yalnız mevcut token'ın taze valid=true sonucuyla başlar; no-token normal ücretli yol korunur. Ücret/hak/D07 politikası seçilmedi.

## Test

`node test/visitor-payment-notification.mjs`: ilk render/yükleme, ağ hatası, null/bozuk kök/valid/email/isim/hata türleri, kapalı submit/ödeme modalı, başarılı retry, açık valid=false, token değişimi ve gecikmiş yanıt; önceki ücretsiz FREE/0 ve sıfır ikinci PAID yazması regresyonları geçti.

`node test/payment-modal-lifecycle.mjs`, `npm run check`, `git diff --check` başarılı. React effect cleanup ve türetilmiş token sınırları incelendi. Commit push/temiz yönetilen ağaç. Kontrollü gerçek bileşen/form/API testidir; gerçek HTTP/tarayıcı/provider testi değil. Canlı Supabase/ödeme/mail/dağıtım yok.

## Bağlı API sınırı ve sıradaki iş

Kaynakta `/api/visitor-invite/verify` JWT doğrulama ve inviter DB sorgusunu aynı try/catch içinde tutuyor; her hata HTTP400/valid=false oluyor. Ortak request helper HTTP hatasını Error'a çevirir. Bu nedenle gerçek 400 geçersizliği ile DB sorgu hatası bu tur ayrıştırılmış sayılmaz; ikisi de ekranda kontrol edilemedi olarak bloklanır. Testteki başarılı valid=false dalı gerçek mevcut endpoint'in invalid JWT sonucunu temsil etmez.

Sonraki bağımsız teknik iş: bağlı doğrulama handler'ında invalid JWT/type ve DB/API arızası için farklı sonuç sözleşmesini kurup izole HTTP testinde kanıtla; istemciye doğrulanmış invalid sonucu yalnız bu sözleşmeyle taşı. Token sahipliği/veri gizliliği/Sprint6 ve D07 ana koşulları açık; ana PAR04 bitmedi. Ücretsiz submit yanıtının bozuk kök→sahte başarı ve çift gönderim sınırı da ayrıca denetlenecek.
