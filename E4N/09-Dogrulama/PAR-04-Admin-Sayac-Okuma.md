# PAR-04 — Admin sayaç okuma doğruluğu

3 Ekim 2026. Commit `675bc62`, `codex/e4n-sprint1-foundation` dalına push edildi.

## Değişiklik

Üye, grup ve lonca listeleri ayrı sayaç okuma durumlarına sahiptir. Yüklenirken sayı gösterilmez. HTTP/ağ hatası, liste olmayan yanıt veya geçersiz satır/kimlik görünür hata ve tekrar deneme gösterir. Başarılı boş liste 0, doğrulanmış liste uzunluğu gerçek sayı olarak gösterilir. Bir kaynağın hatası diğer kaynağın doğrulanmış sayısını silmez. Tekrar deneme üç sayacı yeniden okur; etkinlik listesini yeniden çağırmaz.

ADMIN dışı kullanıcı sayaç API'lerini çağırmaz. Kullanıcı/rol değişiminde eski değer gizlenir, eski yanıt render bağlamı ve effect cleanup sınırıyla atılır. Unmount sonrası state yazılmaz. Panelde kullanılmayan LMS okuması kaldırıldı. Mevcut etkinlik sayacı davranışı korunur.

## Testler

- `node test/admin-dashboard-counters.mjs`: gerçek TSX kontrollü hooks/API ile üç kaynağın reject/null/object/geçersiz satır/boş kimlik senaryoları; her biri için hata/tekrar ve gerçek sayı; doğrulanmış boş liste0; eski kullanıcı yanıtı cleanup öncesi bile gizli; ADMIN dışı çağrı yok; unmount gecikmiş yanıt atılır.
- `node test/event-read-screens.mjs`: mevcut üç ekran cache/hata/tekrar ve null description regresyonu başarılı.
- `npm run check` ve staged `git diff --check` başarılı.

## Sınırlar ve devam

Gerçek tarayıcı/DOM/HTTP/veritabanı/cihaz testi değildir. Sayılar hâlâ mevcut kaynak listelerin uzunluğudur; aktif üyelik tanımı, sayfalama veya yeni iş kuralı eklenmedi. Sunucu erişim politikası değişmedi. Canlı Supabase yazması, üretim dağıtımı veya ödeme yok. E4N-116/118 ve Sprint6 güvenlik ana kabulü açık.

Sonraki bağımsız iş UserEvents Katılacağım Etkinlikler filtresinin attendees kaynağını doğrulamak; kaynak yokluğunu kesin kayıt yok gibi göstermemek. Kullanılmayan kayıt handler'ı aktif ürün akışı sayılmaz.
