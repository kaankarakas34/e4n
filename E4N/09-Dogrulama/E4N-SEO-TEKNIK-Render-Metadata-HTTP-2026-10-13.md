# E4N SEO — Statik render, metadata ve HTTP temeli

Teslim: 13 Ekim 2026. Çalışma: 12–13 Ekim. E4N-291 / ARC-01 ve E4N-290 / TECH-01..04.
Başlangıç: 30e49df / codex/e4n-sprint1-foundation. Uygulama yerelde doğrulandı ve 13 Ekim 2026 üretime yayımlandı; aşağıdaki canlı kabul bölümü güncel durumdur.

## Çıktı

- 26 gerçek kamu sayfası build sırasında React bileşenlerinden HTML'e çıkarılıyor. Ana metin/linkler JavaScript öncesinde bulunuyor. Build kişisel veri veya canlı API/DB sorgusu kullanmıyor.
- RouteMetadata + Helmet aynı metadata sahipliği üzerinden çalışıyor; ham HTML ve renderda tek canonical/description/H1 doğrulandı. Parametreler canonical'a girmez. Logo belge başlığı olarak kullanılmıyor.
- 22 canonical/index URL'li sitemap tek katalogdan üretiliyor; 3 şehir pilotu ve üye rehberi noindex. Yönlenen /egitim ve /degerlendirme-basvurusu sitemapten çıktı.
- Mevcut alias'lar için 45 adet 301; 61 açık client rotası + API rewrite. Genel /(.*) fallback kaldırıldı; 404.html çıktı. /api yönlendirmesi, 235 API rotası ve iki cron korunuyor.
- Eski başvuruda refId varsa ziyaretçi yolu, yoksa normal kayıt; tüm query parametreleri korunuyor. Blog alias'ında gerçek slug çözümleniyor.
- Özel alanlar noindex shell/header; bilinmeyen kamu yolu 404. Dinamik Event/Article yolları canonical'sız genel content shell'den mevcut client akışına giriyor: gerçek kayıt bazlı server metadata/404 ve sitemap entegrasyonu sonraki yayıncılık kabulünde açık.
- Ana entry ilk teknik build'de 2352,75 KB / gzip634,57 KB iken 351,62 KB / gzip105,37 KB oldu. Hesap/yönetim ve ikincil sayfalar ayrı chunk'lara taşındı; ilgili prerender sayfada modulepreload var.
- İki hero görseli kaynak PNG'leri korunarak WebP'ye çevrildi: 1.479.391 → 190.512 byte. Boyut/decode/lazy bilgileri eklendi; dev inspector üretimden çıkarıldı. Font stylesheet ilk renderı bloklamadan yükleniyor; hash'li assetler immutable cache alıyor.
- Organization/WebSite/Breadcrumb şemaları; Article yayıncı logosu gerçek PNG'ye, eksik yazar Organization fallback'ine düzeltildi. JSON-LD kapanış-script enjeksiyonuna karşı kaçışlandı. Gerçek Event/Article ve Rich Results kabulü henüz yok.

## Etiket sahipliği

GTM-TBGGZH47'nin kamu yapılandırmasında GA4 G-F7E2G1MSXK ve Pixel1850698832727063 doğrulandı. Aynı sağlayıcılar HTML'den ayrıca başlatılıyordu; başlatma GTM container'ına tek sahip olarak bırakıldı, kimlikler korundu. Container ilk paint sonrası idle dönemde yüklenir; gtag/dataLayer kuyruğu mevcut.

İlk izde Facebook2 PageView, final izlerde Facebook1 PageView görüldü. Final izlerde GA4 hâlâ2 page_view gönderiyor; container/enhanced-measurement ayarları ve hesap düzeyindeki ölçüm kabulü MET-01/02 kapsamında açık. Etiket yönetici hesabında ayar değiştirilmedi. Localhost test istekleri gerçek tag sağlayıcılarına normal sayfa izleme istekleri üretti; üyelik/ödeme/e-posta/veritabanı mutasyonu yapılmadı.

## Doğrulama

| Kapı | Kanıt |
|---|---|
| Build / TypeScript / API sahipliği | npm run build PASS;235 rota,33 provider;Vite client+SSG build PASS |
| Değişen TSX/TS lint | Hedefli ESLint PASS; repository-wide lint çalıştırılmadı |
| Build sözleşmesi |26 sayfada tek title/canonical/description/H1;raw içerik/link/schema;sitemap;özel/dinamik/404;inspector yok PASS |
| Tarayıcı |26 kamu sayfası;6 yönlendirme örneği;anon dashboard→login;özel noindex;4 mobil/taşma;0 pageerror PASS |
| SPA metadata |İstanbul noindex→üyelik index geçişinde tek canonical/description/H1 PASS |
| Yerel HTTP |26 gzip/CSP sayfa;özel noindex;bilinmeyen404;JSON-LD enjeksiyon kaçışı PASS |
| Konfigürasyon |Vercel'in ilan ettiği Draft4 şemasıyla mevcut instance:0 hata. Şemanın kullanılmayan experimental dalları meta-doğrulanmadı;AjV bunu reddetti. Yerel sözleşme ve yayın sonrası platform kabulü ayrıdır. |

Sınır: scripts/seo-preview.mjs Vercel config'in yerel modeli; global güvenlik başlıkları, gzip ve immutable asset cache uygulanır. Event yanıtı/supabase browser okumaları anonim, salt okunur fixture; gerçek DB ve üretim Vercel routing testi değil.

## Mobil laboratuvar

| URL | Performans | SEO kontrolü | Erişilebilirlik | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|
| / |59|100|95|3,77s|1151ms|0|
| /uyelik |77|100|95|2,15s|820ms|0,081|

Lighthouse12.8.2 mobile412×823, simulated RTT150ms/1638,4Kbps/CPU4×; CSP+gzip yerel sunucu, diğer tarayıcılar kapalı. Laboratuvar TBT, gerçek INP değildir. Ana sayfa LCP/TBT hâlâ hedef iyileştirme alanıdır; üçüncü taraf/container yükü sürüyor. CrUX/Core Web Vitals PASS denmedi. Önceki üretim32/48 koşularıyla farklı host/cache/API koşulları nedeniyle doğrudan yüzde iyileşme hesabı yapılmadı.

Ölçüm geçmişinde paralel browser ve sıkıştırmasız model sonuçları korunur; final tablo yalnız CSP+gzip modeline ait. Vercel'in CDN sıkıştırma davranışı [resmî CDN kaynağıyla](https://vercel.com/docs/how-vercel-cdn-works) kontrol edildi. Statik404 yaklaşımı [Vercel SSG404](https://vercel.com/kb/guide/custom-404-page) kaynağına dayanır.

## Kanıt / kalan kapsam

Tek paket: E4N/09-Dogrulama/E4N-SEO-TEKNIK-2026-10-13/; browser-result.json,spa-result.json,http-contract.json,summary.json,iki final Lighthouse raporu,4 ekran görüntüsü,build/lint/contract logları ve SHA256 manifesti. İlk denemelerde SSR browser-target/top-level-await ve SPA'da eski heading'i erken kontrol eden test beklemesi düzeltildi; final kabul geçerli koşulara ait.

URL planı: [[E4N/07-Sprintler/E4N-SEO-Sorgu-URL-Mimarisi-2026-10-12]]:30 aday (10 kullanıcı önerisi+20 türetilen),18 küme ve ilk15 içerik adayının sahipliği. Tam GSC/SERP birleştirme ve yeni URL yayın kararı açık; Excel'de sağlanmayan satırlar gerçek veri diye sunulmadı.

E4N-290/E4N-291 In Progress. Statik temel yerel kabulü teslim; üretim yayını ve aynı URL/301/404/özel alan kabulü, GSC/Rich Results/CrUX, dinamik gerçek kayıt testi ve kalan tag/performance işi açık. Yeni küçük düzeltme issue'su oluşturulmadı. Mobil alt depodaki mevcut değişiklikler pakete dahil değil.


## Üretim yayını ve kabul — 13 Ekim 2026

Kod `0ae32d3`; Vercel e4n / production / READY: `dpl_CgvtNatN3Rpt9AmfRsrnit9SZ5xX`. Test edilen üretim build’i skip-domain sonrası promote edildi; https://www.event4network.com üzerinde beklenen `index-Dgi8bxxD.js` doğrulandı. Mobil alt depo değişiklikleri vercelignore ile dışarıda, API/DB kodu ve cron değişmedi; DDL veya form/ödeme/mail mutasyonu çalıştırılmadı.

Platform kontrolü cleanUrls ile `/api/index.js` hedefinin 404 verdiğini yakaladı; hedef `/api/index` olarak düzeltildi. [Vercel cleanUrls/rewrite sözleşmesi](https://vercel.com/docs/project-configuration/vercel-json) doğrulandı ve extension guard eklendi. İlk canlı browser turunda ana sayfanın yönetici etkinlik okuması 401 verdi; mevcut `getPublicEvents()` kullanıldı. Gerçek endpoint sahibi server/src/index.js salt SELECT okumasıdır; aynı adlı kullanılmayan eski router bu kabulün sahibi değildir.

| Kontrol | Canlı sonuç |
|---|---|
| Ham HTML |26 sayfa200;tek canonical/H1;şehir/rehber noindex;22 sitemap URL |
| Browser |26 renderda tek canonical/description/H1;6 adet301,refId/query/slug korunur;bilinmeyen404 |
| Erişim |auth noindex/canonical0;dashboard→login;anon admin401 |
| Mobil |4 sayfa390×844;taşma yok;H1tek |
| Runtime/API |0 yakalanmamış pageerror;3 kamu `/api/events` okuması200;admin çağrısı yok;health200/ok/DBsuccess |
| Yerel yayın kapısı |full build/type/API235;26 build sözleşmesi;hedefli LandingPage lint PASS |

Kanıt aynı paketin `production/` altındadır:release.json,http/browser/stage/routing-stage sonuçları,buildlog,4 mobil görsel ve SHA256 manifesti. HTTP-only kontroller ile runtime/kamu veri akışı birlikte doğrulandı; prod browser’da API mock kullanılmadı. İlk turdaki401 düzeltildi, final browser eventReads yalnız200.

Üretim yayını/platform kabulü artık teslim. E4N-290/291 In Progress kalır: gerçek dinamik Event/Article server metadata/404/sitemap ve schema/Rich Results, GSC, CrUX/INP, GA4 çift page_view ve kalan performans/niyet kabulü açık. Gerçek yayımlanmış kayıt uydurulmadı; Google indeksleme veya CWV PASS denmedi.
