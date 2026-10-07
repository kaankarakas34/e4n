# PAR-04 — Admin etkinlik fiyat formu

3 Ekim 2026. Commit `2498b14`, yönetilen dal.

## Teslim

Mevcut etkinliği düzenlerken price||0/currency||TRY kaldırıldı. Eksik/geçersiz değer boş kalır, zorunlu alan ve submit öncesi ortak fiyat/currency doğrulaması yazmayı engeller. Ücretsiz için açık0 gerekir. Yeni etkinlik formunun mevcut0/TRY başlangıcı korunur; yeni fiyat kuralı belirlenmedi.

Ondalık numeric/string kaynak ve mevcut para birimi korunur; gövde numeric doğrulanmış tutar taşır. Kaynakta GBP gibi seçeneklerde olmayan geçerli kod varsa kendi seçeneğiyle korunur. Bu kodun checkout desteği olduğu iddia edilmez. Boş input parseFloat ile NaN yerine raw string kalır.

## Doğrulama

`node test/admin-event-participants.mjs`: gerçek TSX/hooks/store kontrollü test; eksik/null/boş/negatif/NaN/sonsuz/geçersiz fiyat edit alanı boş ve0 write; eksik/geçersiz currency blank/no-write; gerçek0, decimal USD ve kaynak GBP doğru payload; temizlenen fiyat no-write, açık0 sonrasıwrite. Önceki katılımcı/FREE olmayan genel hata/pending/eski rol/form regresyonları başarılı.

`node test/event-read-screens.mjs`, `npm run check`, staged diff başarılı. Gerçek DOM/tarayıcı/HTTP/DB/ödeme/mobil kanıtı değildir. Canlı işlem veya dağıtım yok. Sunucu tutar otoritesi/rol/idempotency/para birimi ve PAR02/04 ana kabulü açık; Sprint6 güvenlik ertelemesi korunur.

Sonraki bağımsız iş admin kapasite/tarih submit doğrulaması, eksik kaynağın varsayılan yazmaya dönüşmemesi. D kararları uydurulmaz.
