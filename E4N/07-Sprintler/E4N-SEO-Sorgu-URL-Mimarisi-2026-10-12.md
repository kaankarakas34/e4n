# E4N SEO — Sorgu/URL mimarisi ve teknik teslim

Tarih: 12–13 Ekim 2026. Görevler: E4N-291 / ARC-01 ve E4N-290 / TECH-01..04.

## Uygulanan URL politikası

Kamu sayfalarının mevcut adresleri korunur. src/seo/routeCatalog.json 26 gerçek sayfanın metadata/index/lastmod kaynağıdır; bunların 22'si sitemap'e girer. Şehir pilotları ve üye çalışma rehberi noindex'tir. Kayıt/giriş/panel/admin gibi özel akışlar ayrı noindex shell kullanır; kişisel içerik build sırasında üretilmez.

scripts/seo-routing.mjs mevcut React rotalarından 45 eski adres/alias için 301 ve 61 açıkça izinli client rotası için rewrite üretir. Genel /(.*) SPA fallback kaldırılır. Bilinmeyen adresler Vercel'in statik 404.html davranışına bırakılır. /api sahipliği ve cron yolları aynı kalır.

/degerlendirme-basvurusu?refId=... davetli ziyaretçi yoluna, refId yoksa normal kayda yönlenir; sorgu parametreleri korunur. /is-agi-rehberi/:slug gerçek slug ile /blog/:slug adresine gider. Yasal sayfalar gerçek içeriklidir; özgün metadata alır. Şehirlerin noindex'i gerçek yerel içerik/organizasyon kararı olmadan kaldırılmaz.

## 30 URL adayının değerlendirmesi

İlk 10 satır kullanıcının metnindeki URL önerileridir; sonraki 20 satır bu çalışmada mevcut sistem ve 18 konu kümesinden türetilen adaylardır. Bunlar Excel'den getirilen 30 satır olarak sunulmaz. Yeni aday sayfalar bu teknik pakette yayımlanmadı. Mevcut alias'ın hedefi, gerçek sayfa yayını ve GSC/bağlantı koruma kararı gelene kadar değiştirilmez.

| # | Aday | Güncel sahip / karar |
|---|---|---|
| 1 | /business-networking | Mevcut alias → /e4n-nedir korunur; genel kavram pillar'ı ayrı içerik niyetiyle hazırlanacak. |
| 2 | /is-insanlari-kulubu | Mevcut alias → /e4n-nedir; ticari kulüp/seçim niyeti araştırması sonrası yeni sayfa kararı. |
| 3 | /networking-etkinlikleri | Mevcut alias → /etkinlikler korunur; gelecek keşif rehberi gerçek takvimi kopyalamayacak. |
| 4 | /networking-etkinlikleri/istanbul | Mevcut alias → /networking/istanbul; noindex yerel pilot korunur. |
| 5 | /b2b-is-gelistirme | Mevcut alias → /kapali-gruplar; genel B2B pillar adayını gerçek ürün tanıtımından ayır. |
| 6 | /nitelikli-is-yonlendirmesi | Mevcut alias → /birebir-networking; yönlendirme/lead ayrımı için kaynaklı içerik hazırlanacak. |
| 7 | /e4n-nasil-calisir | Mevcut alias → /nasil-calisir; markalı model tek sayfada sahiplenilir. |
| 8 | /uyelik | Gerçek canonical/index; başvuru uygunluğu ve dönüşüm. |
| 9 | /loncalar | Mevcut alias → /topluluklarimiz; açık WhatsApp modeli. |
| 10 | /loncalar/girisimcilik | Mevcut alias → /topluluklarimiz; gerçek lonca hakkında özgün bilgi oluşmadan yeni sayfa yok. |
| 11 | / | Gerçek ana sayfa; marka ve katılım yolları. |
| 12 | /e4n-nedir | Gerçek markalı ekosistem sayfası; genel networking tanımıyla otomatik birleştirilmez. |
| 13 | /birebir-networking | Gerçek model rehberi; birebir görüşme niyetinin ana sahibi. |
| 14 | /networking-roi | Yeni aday; metodoloji/gerçek veriyle EP-15 altında. |
| 15 | /networking-modelleri | Yeni aday; tarafsız kaynaklı karşılaştırma için EP-15. |
| 16 | /linkedin-networking | Yeni aday; EP-21, gerçek talep önceliği sonrası. |
| 17 | /startup-networking | Yeni aday; EP-13, kurucu/startup niyetleri araştırılacak. |
| 18 | /ceo-networking | Yeni aday; EP-13, karar verici/kurucu niyeti ayrımı araştırılacak. |
| 19 | /referans-kulturu | Yeni aday; EP-09, nitelikli yönlendirme pillar'ıyla çakışma denetimi. |
| 20 | /networking-becerileri | Yeni aday; EP-14, uygulamalı teknik/şablon hub'ı. |
| 21 | /konusmacilar | Yeni aday; gerçek izinli biyografi/etkinlik bağlantısı şart. |
| 22 | /arastirmalar | Yeni aday; gerçek anonim/toplulaştırılmış veri ve metodoloji şart. |
| 23 | /kaynaklar | Yeni hub adayı; mevcut /blog ile menü/niyet kararı sonrası. |
| 24 | /topluluklarimiz | Gerçek canonical/index; açık WhatsApp loncaları. |
| 25 | /kapali-gruplar | Gerçek canonical/index; 35 kişi, uygunluk ve grup kabul modeli. |
| 26 | /shuffle | Gerçek canonical/index; dört aylık grup yenileme. |
| 27 | /katilim-ilkeleri | Gerçek canonical/index; ürün katılım kuralları. |
| 28 | /hakkimizda | Gerçek canonical/index; doğrulanmış marka bilgisi. |
| 29 | /iletisim | Gerçek canonical/index; kurumsal başvuru/iletişim yolları. |
| 30 | /uluslararasi-networking | Yeni aday; EP-23, talep/dil ve gerçek kapsam kapısı sonrası. |

## 18 kümenin sorgu sahipliği

| Küme | Birincil niyet | Güncel dönüşüm/sahip | Yeni yayın kararı |
|---|---|---|---|
| 01 Networking temelleri | Kavram ve örnek | /e4n-nedir marka; /uyelik dönüşüm | Genel /business-networking pillar araştırması; networking/business networking başlıkları birleştirme adayı. |
| 02 Etkinlikler | Hazırlık/keşif/kayıt | /etkinlikler gerçek takvim | Rehber içerikleri /blog altında; takvimin kopyası yok. |
| 03 İş kulübü/üyelik | Ticari seçim | /uyelik, /kapali-gruplar | /is-insanlari-kulubu pillar/karşılaştırma paketi. |
| 04 Referans/yönlendirme | Güven, lead, etik | /birebir-networking → /uyelik | /nitelikli-is-yonlendirmesi ve /referans-kulturu çakışması araştırılır. |
| 05 B2B | Müşteri/ortaklık/karar verici | /kapali-gruplar → /uyelik | /b2b-is-gelistirme kaynaklı pillar. |
| 06 CEO/C-level | Karar verici ağı | /uyelik | Kurucu/CEO ayrı niyet kararı; EP-13. |
| 07 Birebir | Uygulama/sorular/ajanda | /birebir-networking | Şablon ve soru destek paketi. |
| 08 Loncalar | Ücretsiz topluluk | /topluluklarimiz | Açık WhatsApp; iç lonca üyeliği vaadi yok. |
| 09 İstanbul | Gerçek yerel keşif | /networking/istanbul noindex | Gerçek yerel etkinlik/veri oluşunca yeniden index kararı. |
| 10 Beceriler | Tanışma/mesaj/takip | /birebir-networking, /etkinlikler | /networking-becerileri ve 5–10 içerik paketi. |
| 11 Startup | Mentor/kurucu topluluğu | /topluluklarimiz | /startup-networking talep ve uzmanlık kapısı. |
| 12 LinkedIn | Dijital iş ağı | /etkinlikler → /uyelik | EP-21 sınırlı pilot. |
| 13 ROI | Ölçümleme | /uyelik | /networking-roi; doğrulanmış veri ve metodoloji. |
| 14 Karşılaştırmalar | Model seçimi | /nasil-calisir, /uyelik | /networking-modelleri; kaynaklı tarafsız üretim. |
| 15 E4N marka | Gerçek model/süreç | /e4n-nedir, /nasil-calisir, /uyelik | Mevcut sayfalar korunur; mükerrer brand URL yok. |
| 16 Topluluk yönetimi | Moderasyon/onboarding | /topluluklarimiz, /rehber noindex | EP-22; üyeye özel rehber organik pillar değildir. |
| 17 Webinar/panel | Gerçek program/uzmanlık | /etkinlikler; /event/:id dinamik | Gerçek Event/konuşmacı arşivi EP-07/16 kapsamında. |
| 18 Uluslararası | İhracat/iş ortaklığı | /uyelik | EP-23, yeni talep/dil pilotu. |

## İlk 15 içerik adayının paket sırası

1–2 Networking Nedir + Business Networking: tek genel pillar birleştirme adayı; markalı /e4n-nedir ayrı.
3 İstanbul rehberi: yerel veri gelmeden şehir noindex'ini değiştirme.
4–5 İş İnsanları Kulübü + kulüp seçim rehberi: EP-08 ticari paket.
6–7 Nitelikli yönlendirme + referansla müşteri: EP-09 kaynaklı paket.
8 B2B müşteri bulma: EP-10.
9 Şirket sahipleri rehberi: EP-13.
10 Etkinliğe hazırlık: EP-06, /etkinlikler dönüşümü.
11 E4N nedir/nasıl çalışır: mevcut /e4n-nedir ve /nasil-calisir sahipliği.
12 Üyelik süreci: mevcut /uyelik sahipliği.
13 Girişimcilik loncası: açık WhatsApp /topluluklarimiz.
14 Birebir görüşme: mevcut /birebir-networking + destek şablonu.
15 BNI/diğer modeller: kaynaklı EP-15, tarafsız karşılaştırma.

Bunlar 15 ayrı yayın taahhüdü değildir. İlk üretim 5–10 adaylık pakete alınır; gerçek SERP/GSC niyet ve çakışma incelemesi ile nihai adet belirlenir. İsim benzerliğine bakarak yayında birleştirme/silme yapılmaz.

## Araştırma kanıtı ve sınırı

12 Ekim web örnekleminde kavram aramaları tanım/uygulama kaynaklarına, İstanbul etkinlik aramaları takvim/topluluk kaynaklarına, iş kulübü aramaları üyelik/dernek yapılarına yöneliyor. Bu gözlem genel rehber, canlı takvim ve üyelik sayfasının ayrı rollerini destekleyen bir çıkarımdır; Google'ın tam konumlu ilk 10 sonuç karşılaştırması veya arama hacmi ölçümü değildir.

Örnek kaynaklar: [KOSGEB Girişimcilik El Kitabı](https://webdosya.kosgeb.gov.tr/Content/Upload/Dosya/E-Dergi/2021/KOSGEB_Girisimcilik_El_Kitabi.pdf), [İstanbul networking keşfi](https://www.meetup.com/find/tr--istanbul/networking/), [İSTİAD](https://istiad.com/). MLM/network marketing hedeflenmez.

GSC sorgu/landing verisi ve gerçek backlink geçmişi elde değil. 324 kelime/216 içerik ve 30 URL'nin tüm Excel satırları sağlanmadı. Bu nedenle nihai yeni URL yayını ve bütün niyet birleştirme kabulü açık; E4N-291 tamamlandı sayılmaz. Teknik paket mevcut URL davranışını koruyan, kanıtlı düzeltmeleri uygular.

Teknik kanıt: [[E4N/09-Dogrulama/E4N-SEO-TEKNIK-Render-Metadata-HTTP-2026-10-13]].
