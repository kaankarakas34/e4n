# E4N SEO / AUD-02 — Render, schema ve mobil performans denetimi

Tarih: 12 Ekim 2026, Europe/Istanbul. Tarayıcı/Lighthouse kanıtları 22:46–22:54 civarı yerel saat.
Görev: [E4N-289](https://linear.app/e4n/issue/E4N-289/e4nseo-ep-01-teknik-denetim-ve-baslangic-envanteri), Sprint 1.
Kaynak checkout: codex/e4n-sprint1-foundation; başlangıç HEAD 8fc91be. Devam notunda son canlı ürün 6705726, asset index-CemrhYzB.js. Canlı DOM ve HTTP yanıtları bağımsız ölçüldü; checkout/live eşitliği varsayılmadı.

## Teslim durumu

Güncel yerel denetim teslim edildi: sitemap'teki 23 URL + 6 temsilî kontrol + footer'da keşfedilen 4 ek yol = 33 farklı URL; 29 ana satırda ağ hatası yok. Ham HTTP ile render edilmiş metadata/başlık/link/schema karşılaştırıldı. 390×844 görünümde 6 sayfa ölçüldü; 2 sayfanın ekran görüntüsü ayrıca görsel incelendi. Ana sayfa ve üyelik için Lighthouse 12.8.2 mobil laboratuvar ölçümü alındı.

Search Console doğrulanmış property/URL Inspection ve CrUX gerçek kullanıcı verisi erişilebilir değil. Rich Results giriş engeli nedeniyle resmî PASS yok. EP-01/Sprint 1 Done yapılmadı; dış kanıt ve düzeltme doğrulamaları açık. Uygulama kodu, canlı veri ve yayın değişmedi; yalnız denetim betiği ve kanıt/doküman üretildi.

## Doğrulanmış bulgular ve uygulama sırası

| Öncelik | Bulgu ve kanıt | Mevcut görev |
|---|---|---|
| P0 | 29 ham HTML örneğinde H1/link yok; başlangıç title/canonical ana sayfanın. Güncel sayfalar JS çalışınca içerik ve rota title üretir. | TECH-01: kamu sayfalarının render stratejisi; Google indekslenmediği iddia edilmez. |
| P0 | 19/29 ana örnekte iki canonical ve çoğunda iki description var. /uyelik renderında ana sayfa + /uyelik birlikte. Lighthouse canonical audit score=0, “Multiple conflicting URLs” raporu. Ek şehir yolları da iki canonical. | TECH-01: metadata tek sahibi, rota bazlı tek canonical/description; ham ve render tutarlı. |
| P0 | /seo-audit-missing-20261012 HTTP 200; render NotFound ve noindex, follow üretir. | TECH-02: gerçek sunucu 404. Mevcut client noindex koruması var; hata sayfası tamamen index açıkmış gibi raporlanmaz. |
| P0 | /degerlendirme-basvurusu → /auth/register; /egitim → /uyelik; /public-events → /etkinlikler; /is-agi-rehberi → /blog client yönleniyor, ilk HTTP 200. İlk iki URL sitemap içinde. | TECH-02/ARC-01: gerçek 301 ve sitemap temizliği. Eski sıralama/GSC verisi olmadan URL silme kararı yok. |
| P1 | 5 yasal/bilgilendirme URL'si gerçek içerik sunuyor fakat ana sayfa title/canonical devralıyor: /on-bilgilendirme-formu, /kullanim-kosullari, /cerez-politikasi, /mesafeli-satis-sozlesmesi, /iptal-ve-iade-kosullari. | TECH-01/ARC-01: özgün metadata ve index kararı. Bunlar placeholder/boş sayfa değildir. |
| P1 | Sık kullanılan kamu sayfalarında 3 H1: header/logo, esas içerik ve footer/logo. Bazı yasal sayfalarda ek gömülü logo başlığı da var. | TECH-01: marka logosunun semantik etiketi; esas sayfa başlığını netleştir. Bu tek başına Google sıralama cezası kanıtı değildir. |
| P1 | Ana sayfa laboratuvar performansı 32/100; LCP 16,12 s, TBT 1360 ms; render gecikmesi LCP'nin %96'sı. Üyelik 48/100; LCP 12,17 s, TBT 344 ms. | TECH-04: ilk render, JS ve üçüncü taraf yükleri; görsel/font optimizasyonu. |
| P1 | Ana sayfa aktarım 3044 KiB; yaklaşık 1011 KiB kullanılmayan JS, modern görsel ile 1246 KiB olası tasarruf. GTM/Google scriptleri 886 ms ve Facebook 709 ms ana thread blocking. | TECH-04: ölçüme dayalı kaynak/üçüncü taraf optimizasyonu; analitik sökme kararı verilmedi. |
| P1 | /logo.png HTTP 200 fakat Content-Type text/html. /e4n-logo.png ve /biz_kimiz_network.png gerçek PNG. Kaynak BlogPostPage yayıncı logosunda /logo.png kullanıyor. | TECH-03: gerçek görsel URL ve author/publisher modeli. Canlı Article örneği olmadığı için canlı Article şeması PASS değil. |
| P2 | Lighthouse erişilebilirlik 89/100 her iki örnekte; adlandırılmamış buton ve kontrast sorunları var. | TECH-04/CRO-01: somut düğüm detayları Lighthouse dosyalarında. |

## Doğru veya korunacak davranışlar

- 6 mobil sayfada ölçülen scrollWidth=390, viewport=390; yatay taşma yok. Üyelik ve etkinlik ekranı görsel kontrolünde içerik blokları okunabilir. Bu ölçüm bütün cihazların garantisi değildir.
- Şehir sayfaları /networking/istanbul, /networking/ankara ve /networking/izmir görünür bilgi sunuyor; renderda noindex, follow var ve sitemap dışında. Bilinçli yerel pilot politikası korunur; gerçek yerel organizasyon/veri kapısı olmadan index açılmaz.
- Robots/sitemap ve llms kaynakları erişilebilir; robots Allow özel veri yetkisi değildir. Auth ve dashboard örneklerinde login yönlendirmesi vardır; anonim kişisel veri erişimi denenmedi.
- Olmayan sayfada render noindex vardır. Gerçek HTTP 404 düzeltmesinde bu koruma kaybolmamalı.
- Açık WhatsApp lonca metinleri ve ziyaretçi/abonelik/grup ayrımı güncel kamu sayfalarında görüldü; önceki lonca kararını geri çeviren değişiklik yok.

## Schema sınırı ve SSS kontrolü

29 ana DOM örneğinde JSON-LD parse hatası=0. Organization/WebSite başlangıç graph'ı var; AboutPage ve FAQPage ilgili sayfalarda renderda oluşuyor. Bu ayrıştırma sonucu Rich Results sertifikası değildir.

SSS şeması 25 Question/Answer içeriyor. İlk görünümde 2 yanıt açık; diğerleri gerçek kullanıcı arayüzündeki accordionlar açılarak incelendi: 25/25 şema yanıtı DOM metniyle eşleşti. Tüm soru ve acceptedAnswer alanları dolu. Zengin görünüm uygunluğu/politika veya indekslenme iddia edilmedi.

Canlı /etkinlikler “Planlanmış Etkinlik Bulunmuyor” sunuyor; /blog'da detay bağlantısı keşfedilmedi. Bu nedenle gerçek yayımlanmış Event/Article URL'sinde uçtan uca test henüz yok. Sahte etkinlik/makale kaydı oluşturulmadı. Kaynak EventDetail'da eventStatus sabit Scheduled, fiziksel adres/konum için fallback kullanılıyor; gerçek etkinlik olduğunda status/katılım/konum uyumu TECH-03/EVT-01'de doğrulanmalı.

## Mobil laboratuvar sonuçları

| URL | Performans | SEO kontrol skoru | Erişilebilirlik | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|
| / | 32 | 100 | 89 | 7,34 s | 16,12 s | 1360 ms | 0 |
| /uyelik | 48 | 92 | 89 | 8,66 s | 12,17 s | 344 ms | 0,076 |

Lighthouse 12.8.2, mobile, 412×823, simulated throttling, RTT 150 ms, throughput 1638,4 Kbps, CPU 4×. Her URL için bir başlangıç koşusu; gerçek kullanıcı CrUX ve INP değildir. TBT INP olarak raporlanmaz. Ana sayfanın SEO=100 skoru diğer URL'lerin canonical veya tam schema doğrulamasını kanıtlamaz. Paralelde bir salt okunur tarayıcı oturumu vardı; makine/üçüncü taraf değişkenleri tek koşunun hassasiyet sınırıdır. Sonraki uygulama aynı konfigürasyonda kıyaslanmalı; gerçek kullanıcı hedefi için CrUX/GSC gerekir.

## Dış servis erişim kontrolü

- GSC anonim istek: property görünümü yerine /search-console/about; doğrulanmış kullanıcı/mülk verisi alınamadı.
- PSI mobil API: HTTP 429 RESOURCE_EXHAUSTED, günlük quota=0; aynı çağrı tekrar döngüsüne sokulmadı. Alan verisi alınamadı; CrUX PASS yok.
- Google Rich Results aracı açıldı; test sayfası “Bir sorun oluştu — Giriş yapıp tekrar deneyin” gösterdi. Google testi tamamlanmadı. Giriş/captcha atlatılmadı.

## Kanıt ve tekrar çalıştırma

Tek detay paketi: E4N/09-Dogrulama/E4N-SEO-AUD02-2026-10-12/.

- browser-audit.json ve url-render-comparison.csv: 29 ham/render satırı + 6 mobil ölçüm + sitemap/robots/llms.
- discovered-routes.json: 3 şehir sayfası ve rehber alias'ı.
- schema-followup.json ve faq-visible-check.json: kaynak görselleri, yasal içerik örnekleri ve 25/25 SSS yanıt eşleşmesi.
- lighthouse-home.json ve lighthouse-uyelik.json: iki tam rapor, düğüm/istek/ölçüm detayları.
- summary.json/checks.json: süzülmüş sonuçlar. manifest-sha256.json: kalıcı kanıt hash'leri.
- mobile-*.png: altı ekran görüntüsü; gsc-access.json, psi-mobile.json ve rich-results-access.log: erişim sınırlamaları.
- test/seo-aud02-browser-audit.js: CLI denetim betiği; takip betikleri output/playwright/e4n-seo-aud02-2026-10-12 altında ve kanıt paketine kopyalandı.

Başarılı kontroller: 29 ana istekte 0 ağ hatası; 4 ek yol ölçümü; 25 SSS yanıtı eşleşmesi; 6/6 taşma ölçümü; iki Lighthouse koşusu runtimeError yok; node --check denetim betiği. Bunlar ürünün tüm SEO kabulü PASS anlamına gelmez. Uygulama kodu değişmediğinden tip/build/sürüm kapısı çalıştırılmadı.

İlk schema takip koşusu, mobilde gizli header H1'ı beklediği için timeout oldu; denetim seçicisi main h1 olarak düzeltildi ve başarılı final veri alındı. Bu araç hatası ürün render başarısızlığı olarak sayılmadı.

Resmî referanslar (12 Ekim kontrolü):
- [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics): canonical tekliği/tutarlılığı, anlamlı HTTP ve JS render farkı.
- [Google Event schema](https://developers.google.com/search/docs/appearance/structured-data/event): gerçek görünür etkinlik ve katılım bilgisi.
- [PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/about): laboratuvar ve alan verisi ayrımı.

## Sıradaki teslim

ARC-01 / E4N-291 mevcut URL–sorgu/index/redirect mimari kararı; ardından E4N-290 içinde TECH-01 canonical/metadata/render + TECH-02 HTTP/sitemap ve TECH-04 performans paketi. GSC URL Inspection, gerçek kullanıcı verisi ve gerçek yayımlanmış Event/Article testi açık bağımlılıklardır; yeni küçük düzeltme görevi üretilmez.
