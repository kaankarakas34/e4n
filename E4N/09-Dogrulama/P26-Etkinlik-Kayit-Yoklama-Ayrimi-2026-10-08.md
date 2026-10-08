# P26 — Etkinlik kayıt/yoklama ayrımı · 8 Ekim 2026

## Uygulanan bütün teknik kapsam

Yeni kayıt API'si REGISTERED tutar; kayıt PRESENT/ABSENT değildir. Migration0021 mevcut CHECK'e REGISTERED ekler; eski satırlar ve puanlar dönüştürülmez. Kayıt, bilet ve ödeme aynı eski transaction/owner/replay sözleşmesindedir. Kayıt yapınca cachedscore yeniden hesaplama kaldırıldı. İki web performans servisi kayıtları son dört yoklama paydasından dışlar. Etkinlik kapanışı kayıtları yok/var yapmaz.

Admin etkinlik penceresi toplam kaydı ve yoklaması yapılmamış kaydı açık etiketler; eski PRESENT kanıt belirsizliğini gösterir. Grup yöneticisi yeni kayıt durumunu gösterir. Sayaç/is_registered ve üye bilet/ödeme akışları korunur. Yeni fiyat/hak/puan kararı, geçmişe yönelik düzeltme, gerçek mail/ödeme, mobil/LMS veya canlı migration/deploy yok.

## Doğrulama

Bütün izole PG17/Express/JWT/TS API/veri paketi 33PASS0FAIL: output/web-acceptance/2026-10-08T08-16-50-617Z/report.json. Migrationfresh21/repeat0/20upgrade eski satırları aynı bırakıyor; invalid status23514. Gerçek contract: concurrency10/tekbilet, spoof/owner sınırı, FEyarış, insertrollback/retry; bookingcounter1 ama present0/absent0; cachedscore73 korunur; eventcompletion+replay REGISTERED; son4hesap12bookingeklenince değişmez. Sentetik restore46table/rowhash/catalog dahilPASS. check/build/syntax/diffPASS;174route/23provider/17legacykorunur. Testler managedworktree'deki commitöncesi değişiklikleri doğrular; raporbaseHEAD4bc6370'dır.

Tarayıcı ilk tur 08-22-20-410Z izoleusers/me ECONNRESET ile tamamlanmadı; kabul değildir. İkinci gerçek tarayıcı 38PASS0FAIL: output/web-browser/2026-10-08T08-25-39-153Z/browser-report.json. Gerçek admin kayıt/refresh tekPOST, sayaç2→3, ikiREGISTERED+birlegacyPRESENT, memberownread, önceki shuffle37/history/ödeme/fatura/mesaj/dosya/finalDB kabulü. Admin katılımcı ekranı gözle incelendi. Ownedfixtures kapalı; releaseReady=false.

## Kalan ana kabul

P26 InProgress: gerçek etkinlik check-in/düzeltme ve kaynak kanıtı, belirsiz eski yoklamalar, çoklu bilet/fiyat/hak ve provider sandbox kabulü açık. Kayıt/yoklama ayrı durumlar oldu; fiziksel katılım kanıtı otomatik icat edilmedi. Mevcut legacy weeklyyoklama ve raporPRESENT sayımı korunur; eski yanlış puanları geriye dönük temizlemez. D01–D10 eksik kurallar uydurulmadı. Canlı migration0021 önce ayrıca incelenmeli; eski CHECK'e rollback REGISTERED satırlarını PRESENT'e çevirmekle yapılmamalı.

Sonraki uygun P26 paket: mevcut admin etkinlik yetkisi altında açık yoklama ve düzeltme kanıtının API/veri/web akışı; yeni puan/çıkarma veya üyelik hak politikası seçmeden. Büyük üyelik/grup/shuffle paketlerinin D kapıları ayrı açık; mobilSprint7/LMS8enson.

## P26 teslim kaydı — 8 Ekim

Uygulama commit/push: 2fca79a · codex/e4n-sprint1-foundation. Linear E4N-98 açıklaması ve E4N-109 kabul kaydı güncellendi; P26 InProgress bırakıldı.33API/38browserPASS, owned fixtures kapalı. Canlı migration uygulanmadı.
