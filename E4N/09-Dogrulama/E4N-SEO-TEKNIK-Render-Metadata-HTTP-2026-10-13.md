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


## Dinamik içerik ve Search Console teslimi — 13 Ekim 2026

Kod839ae5e; aynı test edilen üretim build’i stage→promote; Vercel READY `dpl_A8ju4Nd24jfR67N1uWsKK2aNCG5D`. `/blog/:slug`, `/event/:id`, `/sitemap.xml` salt SELECT yapan ayrı içerik fonksiyonuna bağlandı. Public/published blog; public PUBLISHED/COMPLETED/CANCELLED etkinlik dışında kayıt okunmaz. DB/DDL/mail/ödeme mutasyonu yapılmadı; 7 gerçek tamamlanmış etkinlik korundu, sahte yayın oluşturulmadı. Özel etkinliğin anonim HTTP yanıtı404/noindex; mevcut authenticated client/API akışı korunur.

Tekil içerik ilk HTML’de başlık/metin/iç link/canonical/robots/Breadcrumb; blog Article metadata ve güvenli allowlist HTML temizliği server/client ortaktır. Blog nofollow/noindex/none seçimi korunur. Olmayan/taslak/özel kayıt404 ve canonical yok; DB hatası503/retry60/noindex, hata ayrıntısı kullanıcıya sızmaz. Tamamlanan/iptal etkinlikte kayıt/ek bilet/misafir ödeme kapatılır. Sitemap 22 statik+7 gerçek public arşiv=29; sadece öz canonical,include_in_sitemap,index blog; gerçek blog lastmod,etkinlikte güvenilir modified timestamp bulunmadığı için lastmod uydurulmaz.

Platform kapısında statik sitemap’in rewrite’ı gölgelemesi yakalandı; dist/sitemap.xml kaldırılıp seed sitemap-static.xml ayrıldı ve guard eklendi. sanitize-html2.18/htmlparser2 ESM-CJS karışımı Vercel require hook’unda startup hatası verdi; güncel güvenlik sürümü korunarak sanitizer+parser esbuild ile tek sunucu modülüne paketlendi, sözleşme testi aynı derlenmiş modülü çalıştırır. Eski sanitizer sürümü güvenlik audit’i nedeniyle kullanılmadı/yayımlanmadı. Stage noindex başlığının platform kaynaklı olduğu [Vercel response-header dokümanıyla](https://vercel.com/docs/headers/response-headers) doğrulandı; gerçek production içerik yanıtında noindex bulunmadı.

| Kabul | Sonuç |
|---|---|
| Yerel kapı |full build/type/API235;26 statik HTML sözleşmesi;10 dinamik public/archive/noindex/private/draft/missing vaka;HEAD/405/503,SQL parametre,HTML güvenliği,lifecycle PASS |
| Hedefli lint |5 TS/TSX dosyası:0 error,4 hook dependency/ref warning; geniş repo lint çalıştırılmadı |
| Üretim HTTP |29 sitemap;7 gerçek public etkinlik HTML200/tek canonical/H1/Breadcrumb;2 olmayan kayıt404/noindex/canonical0;healthok/admin401 |
| Üretim browser |7 COMPLETED etkinlik:tek canonical/H1,alan metadata,Breadcrumb ve disabled kayıt;2 eksik kayıttaURL korunur/noindex/canonical0;0 pageerror;390×844 arşiv taşma yok;API mock yok |
| Google canlı üyelik testi |13.10.2026 12:34:24;fetch başarılı;tarama/index izniEvet;canonical www.../uyelik;1 geçerli Breadcrumb |
| Search Console işlemleri |uyelik indeksleme isteği kabul/sırada;sitemap başarıyla işlendi,29 keşfedilen sayfa;gerçek indekslenme doğrulanmadı |

Search Console sc-domain:event4network.com mevcut kullanıcı oturumuyla erişildi. İlk görünüm3 indexed/3 nonindexed;CWV mobil/desktop veri yok. Üyelik önce Google’a bilinmeyen URL idi; Google canlı fetch ve sıraya alındı onayı kanıtlandı. Sitemap ilk gönderimde geçici Getirilemedi görünümü vardı; ayrıntı sonrasında başarıyla işlendi ve29 URL keşfi doğrulandı, güncel sonuç başarılıdır. Tekrarlı submission yapılmadı.

7 gerçek arşivde Event schema üretilmedi: doğrulanmış fiziksel mekân veya public sanal konum bilgisi yetersiz; İstanbul/ana sayfa/özel online_link fallback’i uydurulmaz. [Google Event koşulları](https://developers.google.com/search/docs/appearance/structured-data/event) kapsamında gerçek konum/program ve uygunluk tamamlanınca canlı Rich Results kabulü yapılmalı; salt sanal etkinliğin Google Event deneyimi uygunluğu iddia edilmedi. Gerçek published blog yok; Article/HTML/blog robots kabulü izole fixture ile doğrulandı, ilk gerçek yayın kontrolü açıktır.

Kanıt aynı paket `dynamic/`:14 dosya+SHA256manifest;prod/browser/stage/contracts/GSC sonuçları,3 Google görüntüsü,mobil arşiv ve kapı logları. E4N-290 In Progress; E4N-295’in tam duyuru/program/özet/izinli medya/CRO kapsamı teslim değil. Sıradaki gerçek etkinlik konum/program ve ilk rehber yayını/Article-RichResults; Google gerçek indekslenme,CrUX/INP ve kalanGA4/perf açık.

## Güncel yayın — onaylı ilk yazı ve arşiv politikası / 13 Ekim 2026

- Kullanıcı kararı: “kaynak yok bi de onları indexlemene geerk yok”. Tam yedi eski etkinlik ID'si contentMetadata.excludedEventIds içinde noindex, follow; HTTP200 ile içerik korunur ve sitemapten çıkarılır. Yeni etkinliklerin tamamına blanket noindex uygulanmaz. Kod02b1356; ayrı release dpl_DHN4C74JqFiEGaKDP2zigkH7AagE doğrulanıp promote edildi. Etkinlik kayıtlarına yazma/silme yok.
- CMS kodce4da36; dpl_FS2LwCc7jxzfvoLJ66V4SfGaoyA1 canlı. Custom JWT + güncel DB ADMIN, parametreli allowlist, reviewConfirmed yayın kapısı, revision409, yayın sonrası slug koruması, geri alınabilir arşiv; author_id NULL/Organization. Supabase RLS/grant/DDL açılmadı. Public okumalar yalnız published server API üzerinden; özel users PostgREST join bağımlılığı kaldırıldı.
- Kullanıcı yerel önizleme için “Metin uygun; yayımla” dedi. Gerçek mevcut admin oturumuyla tek POST kaydı yayımlandı: fe1a5375-6d52-4811-9375-b5cd13945219; published_at2026-10-13T10:50:14.948Z. [Canlı yazı](https://www.event4network.com/blog/networking-etkinligine-hazirlik). Gövde onaylı901 kelimeyle birebir eşleşir; dört ürün iç bağlantısı ve iki birincil kaynak; kapak boş, sahte uzman/etkinlik iddiası yok.
- Gerçek üretim kabulü: APIpublished200; ham HTML200/tek H1/tek canonical/title-description/index,follow; BlogPosting+BreadcrumbList/datePublished/Organization. Sitemap23=22statik+1blog; yedi eski arşiv200/noindex/sitemapdışı. Gerçek client sayfa ve bloglistesi görünür; metadata ve iki şema korunur, error log0, masaüstü taşma yok.
- Google domain mülkü canlıtest13:52:05: akıllı telefon denetimi, fetchbaşarılı/taramaEvet/indeksEvet/canonicaldoğru/Breadcrumb1geçerli. İndeksleme isteği kabul, öncelikli tarama sırası. URL henüz Google dizininde değil; indekslenme PASS/garanti değildir. Bağımsız Article Rich Results kabulü yapılmadı.
- Teknik doğrulama: build/type,242rota/34provider/17legacy,statik26 ve dinamik10 sözleşme PASS; gerçek izole PostgreSQL15'te18 CMS HTTP isteği PASS. Hedefli lint0error/1mevcut hookwarning; geniş repo lint veya bütün backend suite koşulmadı. Canlı veri mutasyonu yalnız açıkça onaylı makale; izole fixture kayıtları üretime bağlanmadı.
- Mobil viewport390 istendi ancak Chrome ölçümü1920 kaldı; mobil390 kabulü PASS sayılmaz. Yeni kapak/upload, küme/pillar/ilgili içerik ve CRO yolculukları ayrıca açık. E4N-292 In Progress; E4N-290 ve diğer epikler tam kabul gerçekleşmeden kapanmaz.
- Tek kanıt publication/ altında JSON, ekran görüntüleri, gerekli loglar ve SHA256 manifesti. Eski29URL bölümleri tarihsel; güncel sitemap23.
