# E4N SEO — İlk teknik başlangıç kanıtı

Tarih: 11 Ekim 2026 (Europe/Istanbul)
Görev: [E4N-289 / EP-01](https://linear.app/e4n/issue/E4N-289/e4nseo-ep-01-teknik-denetim-ve-baslangic-envanteri), In Progress
Proje: https://linear.app/e4n/project/e4n-seo-c47b071086ca
Plan: [[E4N/07-Sprintler/E4N-SEO-Sprint-ve-Gorev-Plani-2026-10-11]]

## Teslim ve sınır

Proje, 6 milestone sprint, 16 epic ve epic içi görev kontrol listeleri oluşturuldu. 24 epic ve 32 uygulanabilir alt görev planlandı. Linear EP-17 yaratılırken ücretsiz issue kotasını reddetti. EP-17..24 ve alt görevler ayrı issue olarak oluşturulmadı; tüm kabul/bağımlılıklar [Linear backlog belgesinde](https://linear.app/e4n/document/e4n-seo-6-sprint-24-epic-ve-uygulanabilir-gorev-backlogu-8a1714f48957) saklandı. Kota açılınca aynı anahtarlarla aktarılır; mevcut görevler silinmez/taşınmaz.

İlk bağımsız çalışma AUD-01: 30 salt okunur canlı HTTP isteği, 19 sitemap URL'si, 27 HTML yanıtı; 0 ağ hatası. HTML + orijinal response byte'ları, SHA-256, UTC kontrol saati ve URL envanteri saklandı. Tarayıcı renderı ve Search Console sonucu değildir. Canlı yazma, mail, ödeme, DB veya dağıtım yapılmadı.

## Doğrulanmış bulgular

| Öncelik | Kanıt | Etki / sonraki iş |
|---|---|---|
| P0 | 27 HTML örneğinde başlangıç title aynı; canonical ana sayfa; H1=0 ve anchor=0 | Ana içerik JS renderına bağımlı. TECH-01 rota bazlı HTML/metadata/canonical ve AUD-02 render karşılaştırması. Google indeks sonucu varsayılmaz. |
| P0 | /seo-audit-missing-20261011 HTTP 200; yönlendirme yok; index kısıtı ham HTML/header'da yok | Soft 404 riski; TECH-02 gerçek 404. Mevcut client NotFound noindex davranışı renderda ayrıca kontrol edilir. |
| P0 | /public-events, /egitim, /degerlendirme-basvurusu HTTP 200; sunucu redirect zinciri yok | Kaynakta client Navigate/legacy akışları var; gerçek HTTP 301 planı gerekiyor. Özellikle /egitim ve /degerlendirme-basvurusu sitemap içinde. |
| P1 | Canlı sitemap 19 statik URL; kaynak lastmod tümü 2026-08-27; dinamik etkinlik/blog URL'leri listelenmiyor | Canonical index yayınlarıyla otomatik harita ve gerçek değişim tarihi; dinamik kayıtlar araştırılmadan eksiksizlik iddiası yok. |
| P1 | /auth/login, /auth/register ve /dashboard başlangıç HTML'si ana sayfa canonical ile 200 | Özel/auth indeks politikasını render/header seviyesinde doğrula; robots.txt izinleri yetki bariyeri değildir. |
| P1 | robots.txt ve sitemap.xml HTTP 200, sitemap deklarasyonu mevcut; search botlarına Allow | Temel erişim var; tam CDN/WAF ve gerçek bot erişimi test edilmedi. |
| P1 | HTTP → HTTPS ve apex → www yönlendirmeleri gözlendi | Zincir kodları baseline.json içinde; route legacy redirect'lerinden ayrı. |

JSON-LD başlangıç HTML'de mevcut (1 script); bu tek başına doğrulama veya Event/Article uygunluğu PASS anlamına gelmez. Kaynak index.html Organization/WebSite ve BlogPostPage Article modeli incelendi; tam schema doğrulaması AUD-02/TECH-03 kapsamında.

Kaynak: index.html sabit ana sayfa canonical; src/components/SEO.tsx ve sayfalarda Helmet; vercel.json genel /(.*) → /index.html rewrite; public/sitemap.xml statik liste. Bu bulgular canlı ham yanıtları açıklıyor; kaynak checkout ile canlı sürümün birebir aynı olduğu varsayılmadı.

## Marka ve ölçüm bağımlılıkları

- E4N-288 güncel karar: loncalar herkese açık WhatsApp toplulukları. Yönetilen checkout'taki bu değişiklik henüz canlıya dağıtılmamış; SEO bunu geri almaz.
- LandingPage/NasilCalisir kaynakları ayda 1 online + 1 yüz yüze anlatıyor. Master planın önceki 3 toplantı modeli iddiası doğrulanmadan yeni vaat yazılmayacak (BRAND-01).
- GA4 G-F7E2G1MSXK kaynakta mevcut; gerçek property/olay kabulü, GSC 90 günlük sorgu ve CRM kaynak verisi elde değil. Performans veya dönüşüm hedefi uydurulmadı (MET-01/02).
- Ek Excel dosyası sağlanmadı. 324/216/30/90/58/45/22 havuzlarının bütün satırları elde olduğu kabul edilmedi. Master plandaki güncel Google rapor iddiaları doğrulanmayı bekliyor.

## Kanıt dosyaları ve kontrol

- e4n_seo_http_audit.py: salt okunur tekrarlanabilir HTTP denetimi.
- E4N-SEO-HTTP-2026-10-11/baseline.json: 30 URL durum, redirect, metadata, SHA-256, timestamp.
- E4N-SEO-HTTP-2026-10-11/url-inventory.csv: URL envanteri.
- Aynı dizindeki *.txt ve *.txt.bin: okunabilir ham yanıt ve orijinal byte'lar.
- İlk çalışmada metin görünümündeki karakter sorunu üzerine orijinal byte saklama/UTF-8 kontrolü eklendi ve örneklem yeniden çalıştırıldı; nihai kanıt ikinci çalışmadır. Bu denetim uygulama davranışını değiştirmedi.

Google JavaScript SEO resmi rehberi: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics (11 Ekim kontrolü). Google JS işleyebilir; ham HTML'de içerik olmaması tek başına indekslenmeme kanıtı değildir. Özgün metadata, tutarlı canonical ve anlamlı HTTP durumları için kaynak esas alındı.

## Kalan kapsam

AUD-02 render/bot/schema/mobil denetimi, GSC URL Inspection/CrUX erişimi, ARC-01 sorgu–URL haritası ve BRAND-01 doğrulaması. AUD-01 ham HTTP başlangıç kısmı teslim edildi; EP-01 ve Sprint 1 kapanmadı. İlk teknik uygulama hedefi TECH-01/02, denetim ve mimari kapısından sonra. Kota ayrı issue aktarımını engelliyor; mevcut görev ve checklist üzerinden araştırma devam edebilir.

