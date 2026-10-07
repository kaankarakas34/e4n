# PAR-03 — Ortak etkinlik fiyat gösterimi

3 Ekim 2026. Commit `f7cbbdd`, yönetilen dala push edildi.

## Teslim

UserEvents liste kartındaki price false/eksik → Ücretsiz fallback kaldırıldı. Detay ve liste aynı `src/utils/eventPrice.ts` sözleşmesini kullanır: doğrulanmış numeric/decimal string; gerçek0 Ücretsiz; pozitif tutar ve üç büyük harfli currency; eksik/geçersiz değer Bilinmiyor. TRY veya diğer currency kaynağı aynen gösterilir; dönüşüm yapılmaz. Detay ödeme modalının mevcut TRY açılış sınırı korunur. Yeni fiyat/ürün kuralı belirlenmedi.

## Doğrulama

- `node test/user-event-attendance.mjs`: gerçek liste TSX mevcut katılım/kapasite testleri; eksik/null/boş/boolean/negatif/geçersiz/scientific/sonsuz fiyat ücretsiz değildir; numeric/string0 ücretsiz; TRY/USD ondalık tutarı ve eksik currency ayrımı. Başarılı.
- `node test/event-payment-notification.mjs`: gerçek detay TSX ortak utility ile önceki üç rol/ACK/FREE/stale/unknown/currency/tutar testleri başarılı.
- `node test/event-read-screens.mjs`: üç ekran okuma regresyonu başarılı.
- `npm run check`, staged diff kontrolü başarılı.

Gerçek TSX ve ortak utility kontrollü hooks/API ile çalıştırıldı. DOM/tarayıcı/HTTP/veritabanı/ödeme/cihaz/mobil kabulü değildir. Canlı işlem, ödeme, e-posta veya dağıtım yok; ana görevler ve Sprint6 güvenlik açık.

## Sonraki bağımsız iş

Kaynak taramasında AdminEvents handleEdit `price: event.price || 0`, `currency: event.currency || TRY` görülüyor. Eksik kaynağı düzenleme formuna kesin0/TRY diye koymak kaydederken veri değişikliği doğurabilir. Form doğrulama ve API gövdesi bu tur değiştirilmedi; sonraki iş bu sınırı düzeltmek. Sayfa içinde kaynak kullanmayan handleRegister aktif akış sayılmıyor. Kişisel katılım API ve D kararları açık.
