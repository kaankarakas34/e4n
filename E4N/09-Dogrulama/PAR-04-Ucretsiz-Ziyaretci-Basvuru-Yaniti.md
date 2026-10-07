# PAR-04 — Ücretsiz ziyaretçi başvuru yanıtı

## 3 Ekim teslimi — `6213aca`

Kaynakta `/visitors/apply` kayıt/daha önce mevcut event kaydı için HTTP201 gerçek public_visitors satırını döndürür. VisitorPaymentPage önce yanıtı doğrulamadan başarı ekranını açıyordu. Başarı artık yalnız dolu string id içeren yanıtla gösterilir; null/bozuk veya HTTP/ağ hatasında kalıcı role=alert görünür ve otomatik tekrar başvuru yapılmaz.

FREE kayıt yalnız mevcut taze doğrulanmış davetiye yolundan gönderilir. Bu fonksiyondaki artık kullanılmayan PAID/tutar/kart fallback'i kaldırıldı. Aynı anda bekleyen bir başvuru varken ikinci submit API'ye gitmez. Form callback başvuru Promise'ını döndürür. Token değişiminde eski request sonucu başarı/hata ekranını açmaz; unmount sonrası React state yazması yok. Token değişince eski başarı/bildirim/hata ekranları temizlenir. Sonuç ekranı yalnız “Ziyaretçi başvurunuz kaydedildi” der; e-posta gönderilecek iddiası kaldırıldı.

## Kanıt

`node test/visitor-payment-notification.mjs`: null/boş/number/whitespace id hata; API reject görünür hata, elle sonraki geçerli id başarı; aynı tick iki submit tek çağrı; gecikmiş eski token sonucu atılır; unmount sonrası state setter çağrısı sıfır. FREE/0 kaynak/gövde ve önceki davetiye/ücretli bildirim sıfır ikinci PAID yazması kontrolleri geçti.

`node test/visitor-invite-api.mjs`, `npm run check`, `git diff --check` başarılı. React ref/effect cleanup, Promise ve alert sözleşmesi incelendi; commit push/temiz yönetilen ağaç. Bu tur sunucu değişmedi, izole HTTP testi yeniden çalıştırılmadı. Kontrollü gerçek bileşen/form/API testidir; gerçek tarayıcı/ödeme/DB/mail/dağıtım yok.

## Sınırlar ve devam

Tek ekran eşzamanlı gönderim kilidi sunucu idempotency değildir; farklı sekme veya belirsiz ağ sonucu sonrası elle tekrar hâlâ ayrı kayıt üretebilir. Sunucuda mevcut event_id eşlemesi yalnız ilgili dalda var; tüm başvuru tekrarlarını çözdüğü iddia edilmez. Gerçek id yanıtı ödeme onayı, başvuru kabulü veya hak ataması değildir. D07/Sprint6 ve ana PAR04 kapsamı açık.

Sonraki bağımsız iş: EventDetail ücretsiz kayıt yanıtı/çift gönderim ve ticket_needed→e-posta gönderildi iddiası. Mevcut server kayıt/repeat gövdesini doğrula; hata/bozuk yanıt/route değişimi ve oturum sınırını test et. Sonra kalan aktif web/mobil sözleşmelere devam.
