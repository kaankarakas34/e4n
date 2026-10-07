# PAR-04 — Admin etkinlik kapasite ve tarih

3 Ekim 2026. Commit `b3e6cee`, yönetilen dala push edildi.

## Teslim

Kapasite input raw değerini korur; parseInt ile12.5→12 yapılmaz. API öncesi pozitif safe integer kontrolü vardır; eksik/geçersiz edit kaynağı boş kalır. Yeni formun mevcut50 başlangıcı ve min1/required korunur; yeni kota/hak veya üst kapasite iş kuralı belirlenmedi.

Mevcut zorunlu iki tarih için yerel datetime formatı ve takvim bileşenleri doğrulanır; JS Date'in 30 Şubat gibi değeri sonraki aya taşıması kabul edilmez. Bitiş başlangıçtan önce olamaz; eşitliğe yeni minimum süre kuralı eklenmedi. Başarılı gövde mevcut yerel saat→ISO dönüşümünü kullanır. Geçersiz alan API çağrısı yapmadan görünür hata verir.

## Kanıt

`node test/admin-event-participants.mjs`: gerçek TSX kontrollü hooks/store; eksik/null/boş/0/negatif/kesir/metin/NaN/sonsuz/safe sınırı üstü kapasite no-write; fraction truncation yok; boş/geçersiz/takvimde olmayan/ters tarih no-write; valid12 ve tarihler doğru numeric/ISO gövdesi. Önceki katılımcı/fiyat/ACK/pending/rol/form regresyonları geçti. Eski create testleri artık gerçek input handler'larından geçerli tarih doldurur.

`npm run check`, staged diff başarılı. Gerçek DOM/tarayıcı/HTTP/veritabanı/ödeme/mobil testi değildir. Canlı işlem yok. Sunucu kapasite yarışı, son koltuk, rol/idempotency ve DB sınırları çözülmedi; ana PAR02/04 ve Sprint6 güvenlik açık.

## Sonraki bağımsız iş

AdminEvents kartı attendees?.length||0 kaynak alan yokken0 katılımcı sunuyor. Liste API'sinin type ve UI event_type eşlemesi ayrıca açık. Bunlar bu committe değişmedi. Kaynak alanları ve bilinmeyen gösterimi denetle; ürün etkinlik tür eşlemesini uydurma.
