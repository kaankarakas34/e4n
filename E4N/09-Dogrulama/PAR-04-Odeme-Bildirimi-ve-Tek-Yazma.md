# PAR-04 — Ödeme bildirimi ve ikinci üyelik yazması

## 2 Ekim teslimi — `645509b`

Bağlı kaynak akışı:

1. MembershipPage seçilen plan/user_id/amount ile PaymentModal `action.type=membership` verir.
2. PaymentModal `/payment/pay` çağrısına action gönderir. Sunucu payment_transactions içine PENDING işlem/action_data kaydeder.
3. `server/src/index.js` POST `/api/payment/sipay-callback/success` kaydedilmiş işlemi bulur; SUCCESS/PAID tekrarını atlar; üyelik action'ında users plan/bitiş/account_status/tutarını günceller ve işlem commit edilir.
4. Popup bildirimi veya doğrudan ödeme yanıtı PaymentModal onSuccess çağırır.
5. Önceki MembershipPage onSuccess ayrıca store create/renew çalıştırıyordu. Bu ikinci yazma mevcut tarih/cache'e göre üyeliği tekrar değiştirebilir; provider kaydıyla doğrulanmış tek aktivasyon sayılmaz.

Tarayıcıdaki ikinci create/update/renew ve yönetici koleksiyon yenilemesi kaldırıldı. onSuccess yalnız gösterilen kaydı gizler, kendi /users/me okumasını yeniden tetikler ve modalı kapatır. Mesaj “Ödeme bildirimi alındı. Güncel üyelik bilgilerinizi kontrol edin.”; bildirim doğrudan ödeme/aktivasyon kanıtı sayılmaz. İstemci ödeme tutarı/bildirimi artık bu callback üzerinden üyelik hakkı yazamaz. Sunucu mevcut dönem/aktivasyon politikası değiştirilmedi; D07 kararı seçilmedi.

## Doğrulama

- `node test/membership-failure-ui.mjs`: ADMIN/MEMBER/PRESIDENT, cache dolu/boş altı senaryoda callback sıfır membership mutation ve sıfır admin fetch; modal kapanır, yalnız bildirim mesajı. Önceki MemberProfile create/renew/expire hata kontrolleri de geçti.
- `node test/membership-own-read.mjs`: ödeme bildirimi sonrası kart gizlenir, taze kendi kayıt okuması; bu okuma başarısızsa alert/tekrar; tekrar başarılıysa kayıt görünür. Kimlik/gecikmiş yanıt ve veri yok testleri geçti.
- `npm run check`, `git diff --check` başarılı. Commit uzak yönetilen dala gönderildi; ağaç temiz.

Kontrollü gerçek bileşen/store/API testidir; provider, HTTP callback veya tarayıcı testi yapılmadı. Canlı Supabase/ödeme/e-posta/dağıtım çağrısı yok. Sunucu tekrarı ve geç failure için önceki izole baseline vardır (`server/test/isolated-smoke.mjs`); bu tur tekrar çalıştırılmadı ve yeni sunucu düzeltmesi iddia edilmez.

## Önceki rol kaydının düzeltmesi

Önceki okuma/cache notlarında “/memberships ADMIN only” ve “MEMBER için ADMIN mutation uyumsuzluğu” yazılmıştı. Bağlı monolit `server/src/index.js` GET/POST/PUT membership route'ları yalnız authenticateToken kullanıyor; bu middleware JWT doğruluyor, ADMIN rolü veya hedef user_id sahipliği uygulamıyor. Önceki ifade kaynakla desteklenmiyor ve geri çekildi. Bu tur bu yolların HTTP rol sonucu ölçülmedi; 403 veya 200 kanıtı iddia edilmez. MemberProfile'a eklenen ADMIN görüntüleme/işlem girişi bir istemci sınırıdır, sunucu sınırı değildir. Kaynak bulgusu E4N-120/Sprint 6 kabul girdisine kaydedildi; tüm API yetkilendirme işi tamamlanmadı.

## Kalan sınırlar ve sıradaki bağımsız iş

Ödeme bildirimi tek başına invoice/oturum/sahiplik ve provider doğrulaması değildir. GET success callback yalnız mesaj gönderir; PaymentModal message listener origin/source/işlem bağı kurmaz. Üyelik tarihçesi/işlem sahipliği, SUCCESS sonrası FAILED çelişkisi, dönem/yenileme/indirim tutarı ve idempotency tamamı açık; D07 ve kapsamlı güvenlik işleri kapanmaz.

Sonraki bağımsız teknik denetim: PaymentModal popup kapanma, message listener temizliği, modal/unmount ve işlem durumunun takılı kalması; ürün fiyat/hak kararı veya canlı ödeme testi olmadan kontrollü lifecycle doğrulaması. Ardından kalan web/mobil API farklarına devam.
