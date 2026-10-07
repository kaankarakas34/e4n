# P39/P09/PAR02 — Toplantı gerçek API/DB sözleşmesi

3 Ekim 2026. Commit d95bdc3, yönetilen dala push. Bu teslim hata deneyi; hedef akışın tamamlanması veya hata düzeltmesi değildir.

## İzole yöntem ve kanıt

node server/test/meeting-contract.mjs: rastgele adlı atılabilir Docker PostgreSQL17, loopback rastgele port; tüm DB env override, .env yüklenmez, test cron kapalı. Altı sürümlü mevcut temiz şema kuruldu. Üç sentetik MEMBER ve yalnız requester/partner ilişkili bir meeting INSERT edildi. Gerçek Express ve JWT kullanıldı; gerçek api.ts TS transpile edilip aynı yerel Express'e bağlandı. Üretim URL veya satırı yok; teardown pool/server/container kapatır.

- GET anonim401; outgoing/incoming200 ve birer doğru row; unrelated200/[]; yön INCOMING/OUTGOING, requester_name ve requester/partner kimlikleri doğru. GET öncesi/sonrası bütün meeting row snapshot aynı.
- Temiz schema one_to_ones.updated_at alanı içermiyor. Status PUT ACCEPTED gerçek500, SQL updated_at yok hatası. Meeting satırı değiştirilmedi. İstemci updateMeetingStatus bu500'ü reject etti.
- GET pool sorgusuna kontrollü failure enjekte edildi: Express500; gerçek getMyMeetingRequests bunu [] yaptı. Sorgu hata sonucunun boş listeye çevrildiği kanıtlandı; query geri yüklendi, son snapshot aynı.
- DB default COMPLETED. API ve istemci bunu koruyor; mevcut MeetingRequestsList PENDING/ACCEPTED dışı status Red etiketine düşüyor (statik ekran bulgusu; bu runner DOM testi değil).

Komut exit0, node --check ve git diff --check başarılı. İlk test anonim401'in JSON olacağını varsaydı; gerçek Unauthorized text gövdesine göre parser düzeltildi ve iki ardışık başarılı deney alındı. Normal test modülü DATABASE_URL yok uyarısı kullanılmış izole DB env'leri geçersiz kılmaz. Son çıktıda migrations6.

## Sınırlar

Canlı Supabase şemasında updated_at var/yok bu tur ölçülmedi; bu mevcut sürümlü temiz kurulum hatasıdır. Canlı yazma/ödeme/mail/deploy yok. Status handler requester veya partner için UPDATE izni verir; hedef kabul/rol politikası ve puan etkisi değiştirilmedi. SQL hata yüzünden başarılı status/score/idempotency kabulü henüz yok. Passing baseline bu hataların giderildiği anlamına gelmez.

## Sonraki paket

1. Yeni sürümlü one_to_ones.updated_at migration (eski checksum değişmeden), temiz ve mevcut DB yükseltme/satır koruma/tekrar provası. P09 ve API sözleşmesinin teknik önkoşulu.
2. Status gerçek row ACK ve getMyMeetingRequests HTTP/shape/owner/unknown değer hata sözleşmesi.
3. MeetingRequestsList ve pages/MeetingRequests iki tüketici: error/retry/trueempty/context/sequence ve status unknown/COMPLETED gösterimi, ortak pending/read-refresh ayrımı.
4. Başarılı status rol/puan/idempotency hedefleri ilgili karar ve Sprint6 kapsamıyla açık tutulur.
