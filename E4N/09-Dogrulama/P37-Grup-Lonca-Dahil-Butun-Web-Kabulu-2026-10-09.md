# P37 — Grup ve lonca dahil bütün mevcut web teknik kabulü

9 Ekim 2026. Test edilen commit: d3c6e96a313349ae195895eccdc5782183e14126.

## Kabul zinciri
Tek test:web-rehearsal komutu: tüm API/veri → production build → taze ana web browser/finalDB → taze kapalı grup browser/finalDB → taze lonca browser/finalDB → kaynak eşleşmesi ve owned-fixture cleanup. Üç browser paketi ayrı izole PG17/Express/Vite fixture kullanır; tek DB snapshot iddiası yok. Eski raporlar başarı yerine birleştirilmedi.

- API/veri: 39/39,0FAIL.
- Ana web: 89/89; kapalı grup: 7; lonca: 6. Toplam 102 browser/finalDB kontrolü,0FAIL.
- Build/type/statik route PASS. Son grup/lonca onay-ret-çıkarma, eski REQUESTED görünürlüğü, kayıp ACK ve GET uzlaştırması bütün kabul kapsamına girdi.
- Commit/kaynak SHA256 başta-sonda eşit: f3419dc995ce30ff8aa9c480606c388b31319c7db132ff19a0d1ff81b359170e; 328 dosya. dirty=false→false. Canonical server/migrations artık hash kapsamındadır.
- Ana ve her roster fixture cleanup PASS. Eksik provenance, izolasyon beyanı veya cleanup kabulü başarısız yapar.

## Raporlar
- Root: output/web-rehearsal/2026-10-09T07-15-13-091Z/report.json.
- API: output\web-acceptance\2026-10-09T07-15-13-892Z\report.json.
- Ana browser: output\web-browser\2026-10-09T07-20-46-634Z\browser-report.json.
- Grup: output\group-roster\2026-10-09T07-23-52-945Z\report.json.
- Lonca: output\guild-roster\2026-10-09T07-24-50-638Z\report.json.
- Kalıcı Git kanıtı: server/docs/web-rehearsal-group-guild-2026-10-09.json.
- İlk root38PASS/1FAIL korunur: output/web-rehearsal/2026-10-09T07-10-13-424Z/report.json. Eski smoke test500 beklentisi, mevcut API400 sözleşmesine göre düzeltildi; bu ilk tur kabul değildir.

## Açık kapılar
technicalPass=true, releaseReady=false. Bu doğrulama yeni ürün teslimi veya yeni Done görevi sayılmaz; E4N-109 In Progress. D07 grace/shuffle ve D08/diğer ürün kuralları, gerçek şema/veri geçişi, sağlayıcı kabulü, geniş Sprint6SEC ve nihai ürün kapsamı açık. Retention/dönem/puan-ban modeli uydurulmadı. Testte korunan eski defect baselinelarının PASS olması düzeltildikleri anlamına gelmez. Mobil7/LMS8 ertelenmiş. Canlıwrite/deploy/gerçekmail/payment yok.
