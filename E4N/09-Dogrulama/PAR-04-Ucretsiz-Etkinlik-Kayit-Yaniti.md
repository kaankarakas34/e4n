# PAR-04 — Ücretsiz etkinlik kaydı yanıtı

## 3 Ekim teslimi — `fea3644`

Bağlı `/events/:id/register` ilk kayıt için success=true/ticket_needed/price; zaten mevcut attendance kaydı için success=true/Already registered döndürür. EventDetail bu açık success=true sözleşmesini kullanır; null/boş/success=false veya string true başarılı kayıt sayılmaz. HTTP/API hatası ve bozuk yanıt kalıcı role=alert verir; otomatik yeniden gönderim yok.

Bekleyen tek kayıt isteği ref ile korunur; aynı tick iki tıklama bir API çağrısıdır. Context sequence etkinlik/kullanıcı/rol değişiminde eski sonuçların registered/alert durumunu değiştirmesini engeller; unmount sonrasında state setter yok. Etkinlik değişiminde önceki ödeme modalı ve kayıt hatası kapanır. `ticket_needed` e-posta teslimi sayılmaz; açık kayıt yanıtından sonra yalnız “Etkinlik kaydınız doğrulandı” mesajı var. Ücretli kayıt hâlâ PaymentModal action yolunu kullanır; ikinci PAID kayıt yazması geri gelmedi.

## Doğrulama

`node test/event-payment-notification.mjs`: null/bozuk/false/string true ve API reject kayıt açmaz; görünür hata ve elle recovery; success=true/ticket_needed=true ve Already registered yanıtı doğru, mail iddiası yok. Aynı tick iki submit tek çağrı; route/user/role değişimi eski sonucu atar; unmount setter sıfır. Önceki üç rol ödeme bildirimi, taze attendees/error/retry ve ücretsiz yol kontrolleri de geçti.

`node test/payment-modal-lifecycle.mjs`, `npm run check`, `git diff --check` başarılı. React hook cleanup ve Promise/ref sınırı incelendi. Commit uzak yönetilen dala push edildi; ağaç temiz. Bileşen/hooks/API/window kontrollü testidir; bu tur backend değişmedi, izole HTTP suite tekrar çalıştırılmadı. Gerçek tarayıcı/ödeme/DB/mail/deploy yok.

## Açık sınırlar ve devam

İstemci pending kilidi farklı sekmeleri veya sunucu eşzamanlılığını çözmez. Server attendance PRESENT hâlâ ön kayıt/gerçek katılım ayrımı değildir (H17/P26). E-posta teslimi, hak/fiyat/D07 ve kapsamlı güvenlik/Sprint6 açık; ana PAR04/P26 tamamlanmadı.

Kayıt/ödeme bildirimlerinin bağımsız teknik hata parçaları teslim edildi. Sonraki bağımsız iş PAR04 aktif web/mobil grup detay ve admin grup kartı navigasyon/kaynak/hata sözleşmesi; önce mevcut route'u ve üyelik/başkan/admin okuma sınırlarını doğrula, yeni grup/hak kuralı seçme. Mobil ayrı dirty/no-remote kaynak olduğundan yalnız kendi yaması ve kontrollü test kanıtını yönetilen dala kaydet.
