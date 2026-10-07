# PAR-04 — Ödeme penceresi yaşam döngüsü

## 2 Ekim teslimi — `fcc8f24`

PaymentModal önceden popup kapanınca isProcessing durumunda kalıyordu. Message listener modal kapanınca/unmount'ta temizlenmiyordu; gecikmiş ödeme API yanıtı kapanan ekran adına popup açabiliyor; async onSuccess reject sonucu yakalanmıyordu.

- Modal kapanışı/unmount mevcut denemeyi geçersiz kılar; listener ve pencere kapanma zamanlayıcısı temizlenir. Kapanmış ekranın gecikmiş API yanıtı popup veya başarı bildirimi üretmez.
- Aynı anda yalnız bir ödeme submit'i API'ye gider. Sonuç/fail/error sonrası işlem durumu bırakılır; tekrar açılışta takılı kilit kalmaz.
- Popup kapalı/engelli/yazma hatası ve başarısız bildirim tüketicisi görünür hata verir. Kapalı pencere ödeme başarısızlığı sayılmaz; “sonuç doğrulanamadı, tekrar ödeme yapmadan işlem durumunu kontrol edin” mesajı gösterilir.
- Message yalnız bu denemenin popup kaynağından alınır. İlk terminal mesajda listener/timer kaldırılır; aynı bildirim iki kez onSuccess çalıştırmaz.
- onSuccess void veya Promise<void> olabilir; doğrudan ve 3D yanıt tüketicisinin reject'i yakalanır. Hata alanı role=alert.

## Doğrulama

`node test/payment-modal-lifecycle.mjs`: gerçek bileşen, kontrollü hooks/window/API ile success/fail, başka pencere kaynağını atma, pencere kapalı/engelli/yazma hatası, modal kapama/yeniden açma/unmount kaynak temizliği, gecikmiş API yanıtını atma, art arda submit tek çağrı, direct/3D async callback reject. Timer ve listener sayıları finalde sıfır.

`node test/membership-own-read.mjs`, `node test/membership-failure-ui.mjs`, `npm run check`, `git diff --check` başarılı. React hook cleanup ve async callback incelendi. Commit push, temiz yönetilen ağaç. Test gerçek tarayıcı/3D sağlayıcı testi değildir; canlı ödeme/DB/e-posta/dağıtım çağrısı yok.

## Açık sınırlar ve devam

Popup source kontrolü invoice/origin/provider/oturum doğrulaması değildir; güvenlik ve ödeme uzlaşması E4N-120/Sprint6 ile açık. Mevcut ücret/dönem/indirim/hak politikaları değişmedi; D07 kararı yok. Pencere kapatmak sunucuda işlemi iptal etmez; otomatik yeniden ödeme yapılmaz.

Sonraki bağımsız inceleme: PaymentModal diğer çağıranları EventDetail ve ziyaretçi kayıt akışındaki onSuccess sözleşmesi; sunucu action zaten yazıyor mu, istemci tekrar yazıyor mu, hata sahte başarı mı? Mevcut kayıt/bilet/katılım anlamını ve D07 haklarını değiştirmeden önce kaynak eşlemesi yap. Ana PAR04 ve ödeme sistemi bütünü tamamlanmadı.
