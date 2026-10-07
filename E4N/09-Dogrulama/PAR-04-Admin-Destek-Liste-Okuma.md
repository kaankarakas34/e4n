# PAR-04 — Admin destek liste okuması

3 Ekim 2026; commit `829af97`, yönetilen dala push.

## Teslim

getTickets yanıtı array; her satır id/user_id, subject/status ve geçerli created_at/updated_at, opsiyonel metin tipleriyle doğrulanır. GET/ağ/geçersiz veri görünür hata ve retry; kesin0/boş yalnız doğrulanmış[]. Eski liste retry ve kullanıcı/rol değişiminde gizlenir. Bilinmeyen status açıkça gösterilir.

ADMIN dışı liste isteği yok. Render context ve request sequence/unmount ile eski liste yanıtı atılır; yeni context seçim/mesaj/draft temizler. Eski detail/send/status callback'leri yeni session'da istek veya sonuç yazmaz; bu ortak session sınırı aynı-ticket hedef/ACK/pending tam çözümü değildir.

## Test

`node test/admin-support-list.mjs`: gerçek TSX controlled hooks/API; initial loading, gerçek empty/count, reject/null/object/invalid row/id/metin/tarih ve retry; eski admin görünümü ve detail click, cleanup öncesi rol değişimi yanıtı ve unmount. Başarılı.

`npm run check` ve staged diff başarılı. Gerçek DOM/tarayıcı/HTTP/DB/mobil değildir. Sunucu rol politikası değişmedi, canlı işlem/ödeme/dağıtım yok. Ana PAR02/04 ve Sprint6 güvenlik açık.

## Sıradaki işler

Detay yanıtının ticket/messages doğrulaması, loading/error/retry ve aynı oturumda hedef değişimi hâlâ açık. Reply/status sadeceawait ile başarı sayılıyor; pending/strict ACK ve refresh başarısızlığını yazma sonucundan ayırma ayrı paket. Liste refresh old detail'i tam doğrulamaz; gerçek sentetik rol/DB kabulü yapılmadan ana görev kapanmaz.
