# PAR-03 — Etkinlik katılım kaynağı ve bilinmeyen değer

3 Ekim 2026; commit `32ee55a` yönetilen dala push edildi.

## Kaynak bulgusu

`server/src/index.js` bağlı GET `/api/events` events ve group_name seçer; attendees alanını eklemez. GET `/api/events/:id` ise attendance/users JOIN sonucunu attendees olarak ekler. UserEvents liste kaynağında olmayan attendees alanını optional some/length ile kullanıp kişisel kayıt sayısı ve katılımcı sayısını0, kalan kontenjanı dolu kapasite gösteriyordu. Bu statik kaynak kanıtıdır; bu tur HTTP/veritabanı testi yapılmadı.

## Teslim

Eksik/geçersiz attendees için katılım tabı sayısı Bilinmiyor; tab açıldığında kayıt yok mesajı yerine doğrulanamadı ve tekrar deneme. Anon kullanıcıya giriş gereği gösterilir. Doğrulanmış attendees=[] ile0 ve gerçek boş mesajı korunur. Tab sayısı listede gösterilen yaklaşan etkinliklerle aynı kapsamda hesaplanır.

Kartta katılım sayısı, kapasite ve kalan sayı yalnız doğrulanmış değerle gösterilir. Eksik/geçersiz kapasite sonsuz kabul edilmez; katılım yokluğu0 değildir. Katılımcı sayısı kapasiteyi aştığında kalan0 uydurulmaz. İş kuralı/status/hak tanımı değiştirilmedi.

## Test ve sınır

`node test/user-event-attendance.mjs`: gerçek TSX kontrollü hooks/store ile eksik/null/object/geçersiz satır/kimlik; unknown tab/alert/retry; gerçek boş ve kayıtlı kullanıcı; geçmiş etkinlik kapsamı; anon; geçersiz ve çelişkili kapasite. Başarılı.

`node test/event-read-screens.mjs`, `npm run check`, `git diff --check` başarılı. Gerçek DOM/tarayıcı/HTTP/DB/cihaz kanıtı değildir. Canlı Supabase/ödeme/dağıtım yok.

## Açık işler

Mevcut liste API'si kişisel kayıt verisini sağlamadığından aktif ortamda katılım tabı bilinmiyor gösterebilir. Kullanıcının kendi kaydını JWT kimliğiyle okuyan sözleşme; attendance status anlamı, mobil kaynak eşlemesi ve izole rol/veri testi ayrı açık iştir. Diğer katılımcıların verisini toplamak için detay/participants çağrıları çoğaltılmadı. Render'a bağlı olmayan handleRegister aktif akış sayılmaz. PAR02/03 ana kabulü tamamlanmadı. Sprint6 güvenlik ertelemesi korunur.

Sonraki bağımsız iş EventDetail okuma hata/yanıt/hedef/oturum ve katılım-kontenjan gösterimi.
