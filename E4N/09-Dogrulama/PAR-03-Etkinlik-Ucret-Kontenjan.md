# PAR-03 — Etkinlik ücret ve kontenjan doğruluğu

3 Ekim 2026; commit `33607d8`, yönetilen dala push edildi.

## Teslim

EventDetail sabit Ücretsiz/Sınırlı Sayıda alanları doğrulanmış API değeriyle gösterilir. Fiyat number veya PostgreSQL tarzı pozitif decimal string olabilir. Null/undefined/boş/metin/boolean/negatif/sonsuz/scientific string bilinmeyendir; ücretsiz veya0 ödeme tutarı sayılmaz. Yalnız doğrulanmış0 ücretsizdir. Para birimi üç büyük harfli kaynak koduyla gösterilir; dönüşüm yapılmaz.

Mevcut PaymentModal tutarı TL olarak gösterir, currency parametresi almaz. Paid etkinlik yalnız doğrulanmış TRY ile bu modala açılır; diğer veya eksik para biriminde görünür hata/tekrar ve kullanıcı kayıt düğmesi kilitlidir. Bu geçici istemci sınırıdır, sunucu/ödeme sağlayıcısı para birimi desteğinin tam denetimi değildir. Ödeme modalına Number(price)||0 fallback gönderilmez.

Pozitif safe integer kapasite kişi sayısıyla gösterilir. Eksik/geçersiz kapasite Bilinmiyor; varsayılan veya sonsuz uydurulmaz. Hak, fiyat, kota ve iş kuralı belirlenmedi.

## Test

`node test/event-payment-notification.mjs`: önceki üç rol/FREE ACK/duplicate/stale/unmount ve detay okumaları; yeni eksik/geçersiz fiyat ücretsiz/modal0 değildir, numeric/decimal string TRY tam tutarla açılır ve FREE yazması yapmaz, USD/eksik currency modalı engeller,0 ücretsiz, kapasite geçerli/bilinmeyen testleri başarılı.

`npm run check` ve `git diff --check` başarılı. Kontrollü gerçek TSX/hooks/API testi; gerçek DOM/tarayıcı/HTTP/DB/ödeme veya sağlayıcı doğrulaması değildir. Canlı Supabase yazması, ödeme, e-posta, dağıtım yok.

## Açık ve sonraki iş

Sunucu tutar otoritesi, ödeme sağlayıcısı/callback, farklı currency desteği ve ana PAR02/03/Sprint6 kabulü açık. Modalın kontrollü açılması gerçek checkout kabulü değildir. UserEvents liste kartlarında eksik price hâlâ Ücretsiz fallback; sıradaki bağımsız iş ortak fiyat okuma/gösterim sözleşmesi. Kişisel katılım API'si ve D01–D10 kararları açık.
