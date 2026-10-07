# Mevcut E4N'den hedef E4N'ye değişiklik matrisi

**1 Ekim 2026.** Bu sayfa [[E4N/07-Sprintler/Gelistirme-Yol-Haritasi|sprint/epic planının]] ürün değişikliği yüzüdür. Dayanak [[E4N/02-Mevcut-Sistem/Tam-Sistem-Haritasi|mevcut sistem]], [[E4N/07-Hata-Denetimi/Mevcut-Hata-ve-Calisma-Durumu|H01–H18]] ve [[E4N/06-Gap-Analizi/Gap-Matrisi|R01–R15 farkları]]. “Kaldırmayı değerlendir” bir silme kararı değildir: gerçek kullanım, veri ve eski bağlantı etkisi görülmeden ekran, endpoint veya tablo silinmez. Kod/canlı DB bu planla değişmedi.

## Koru

| Parça | Neden korunur | Yapılacak uyarlama / Linear |
|---|---|---|
| Mevcut E4N web + Express API + Supabase PostgreSQL temel yapısı | Canlı üretim ve 34 tablo bu omurgada; yeni altyapı zorunluluğu kanıtlanmadı. | Sürümlü migration ve test düzeneği P04/P09; mevcut veri eşlemesi P10. |
| `users` hesapları ve var olan üyelik/ödeme/etkinlik kayıtları | 23 hesap, 5 ödeme, 6 etkinlik ve diğer canlı veri korunmalı; geçmiş uydurulmamalı. | Tek üyelik/hak ayrımı P12/P14/P25; geçiş provası P36. |
| `groups` ve `power_teams` ayrımı | Kapalı grup ile açık loncanın ayrı veri ve arayüz temeli zaten var. | Kurallar ve haklar P15–P20. |
| Mevcut üyelik, grup, etkinlik, başkan, admin ve ödeme ekranlarının işe yarayan parçaları | Kullanıcı akışları yeniden sıfırdan tasarlanmadan geliştirilebilir. | Doğrulanmış bileşenleri P30–P32 içinde kullan; kırık çağrıları P39'da kapat. |
| Blog, eğitim, destek, hukuk sayfaları ve eski URL yönlendirmeleri | İlk E4N hedefinin merkezi değiller, fakat mevcut içerik/bağlantı etkisi var; silme gerekçesi yok. | Aktiflik ve ürün kararı P08/P41 ile ayrı değerlendirilsin. |
| Pardus Business Chamber'ın E4N'den ayrı oluşu | R13 kesin karar. | Site anlatımı P33; E4N üyelik/ödeme şemasına taşınmaz. |

## Değiştir

| Alan | Bugün | Hedef davranış | İş / karar |
|---|---|---|---|
| Üyelik ve hak | `users` abonelik alanları, rol ve grup durumu dağınık; hak hesabı tek yerde değil. | Tek E4N üyeliği; hesap, üyelik, kapalı grup, lonca ve dış etkinlik hakkı ayrı. | P12,P14,P25; D07. |
| Lonca katılımı | ACTIVE hesap ve REQUESTED/onay kapısı. | Geniş/açık lonca; kapalı grup 35/görüşme kuralı loncaya uygulanmaz. | P15; D07. |
| Kapalı grup döngüsü | Canlı `cycle_months=6`; ekranda demo tarih. | Dört aylık gerçek dönem ve kaydedilmiş atama geçmişi. | P27–P29; D06. |
| Kapasite | DB/API'de 35 sınırı yok. | Son kayıt anında ve eşzamanlı kabulde 35 kuralı. | P17; D09 (tavan/hedef ve başkan dahil hesabı). |
| Meslek/hizmet | Tam `profession` metin eşitliği ve tetikleyici. | Birden çok ve yakın hizmet için açıklanabilir çakışma matrisi, tüm atama yollarında aynı kontrol. | P16; D05. |
| Başvuru/ret/kabul | REQUESTED satırı var; görüşme kaydı yok; REJECTED canlı check'e aykırı. | Başkan görüşmesi, sonuç/karar, rol sınırı, uyumlu durum geçişi. | P18–P20; D08. |
| Puan | Son 6 aylık tek 0–100 alan; canlı tarihçe tablosu yok. | Aylık kaynaklı olay, kural sürümü, kesinleşme, düzeltme ve görünür tablo. | P21/P22; D01. |
| Gruptan çıkarma | Satır silme; otomatik eşik/geçmiş/yasak yok. | Tekrar güvenli çıkarma olayı, ikinci çıkarılmada sekiz ay yalnız grup başvuru yasağı. | P19/P23/P24; D01–D04. |
| Shuffle | Mock geçmiş, demo uygunluk, `INACTIVE`/unique çelişkisi. | Kural bozmayan simülasyon ve atomik/tekrar güvenli uygulama. | P27–P29; D06. |
| Etkinlik listeleme/kayıt | Açık liste 500; GET içinde UPDATE; kayıt gelecekteki katılımı PRESENT yapabiliyor. | Salt okunur liste, kayıt ile gerçek katılım ayrımı ve doğru bilet/indirim hesabı. | P05,P25,P26. |
| Bildirim | Kod `content/is_read`, canlı `title/message/read`; istemciler de farklı biçim bekliyor. | Tek DB/API/web/mobil sözleşmesi. | P07/P11/P32. |
| Ödeme | Üyelik/ziyaretçi callback ayrımı var; 5/5 işlemde `user_id` boş. | İşlem sahibi ve tekrar callback etkisi izlenebilir; üyelik hakkı doğru kaynağa bağlı. | P14; D07. |
| Mobil/API ve web/API | Mobil kodlu adres 404; aktifliği bilinmeyen eksik yol/yöntemler, 17 tekrar route. | Ortama göre doğru adres; aktif çağrılarda tam yol/yöntem/yanıt uyumu ve tek route işleyicisi. | P06,P08,P32,P39,P40. |
| Şema/operasyon | `init.sql`, runtime ve tekil scriptler parçalı; HTTP içinde DDL; fatura geçici dosya, cron yürütümü belirsiz. | Sürümlü migration, kalıcı fatura, tekrar güvenli/gözlenebilir işler. | P09,P11,P34–P36. |

## Ekle

| Yeni yetenek / veri | Gerekçe | İş / karar |
|---|---|---|
| Açık D01–D10 için karar ve örnek senaryo kaydı | Bilinmeyen eşiği/ücreti/ay hesabını yazılıma gömmemek. | P01–P03. |
| İzole DB, otomatik kritik akış ve migration prova düzeneği | Canlı ödeme/kabul/shuffle denemeden doğrulama yapabilmek. | P04,P09,P36,P37. |
| Üyelik ve dış etkinlik hakkının merkezi hesaplanması | Gruptan çıkarılınca ödeme/hak sürsün. | P12,P25; D07. |
| Şirket uygunluğu ve ülke bağımsız kanıt alanı | R06; mevcut 5 hesabın şirket alanı boş/null. | P13; D10. |
| Hizmet matrisi, görüşme görevi/sonucu ve yetkili karar izi | R07/R08; bugün yalnız meslek metni ve REQUESTED satırı var. | P16/P18; D05/D08. |
| Grup dönemi, atama/çıkarılma geçmişi ve başvuru yasağı | Dört aylık shuffle, iki çıkarılma sayımı ve sekiz ayın hesaplanması. | P19,P23,P24,P27–P29; D02–D04/D06. |
| Aylık puan olayları, kapanış ve düzeltme izi | R09/R10 ve eksik `user_score_history`. | P21/P22; D01. |
| Tekrar güvenli ödeme, bilet, puan, çıkarma ve shuffle anahtarları | Aynı callback/iş ikinci etki yaratmasın. | P14,P21,P23,P26,P29. |
| Üye/başkan/admin için gerçek durum, boş/hata/erişim ekranları | Yeni kurallar kullanıcıya açıklanmalı ve doğrudan API ile tutarlı olmalı. | P30–P32. |

## Kaldırmayı veya kullanımdan çıkarmayı değerlendir

| Aday | Kanıt | Ön koşul ve yön | İş |
|---|---|---|---|
| Shuffle ekranındaki mock `previous_group_id`, demo tarih ve sürekli açık `canShuffle` | `src/pages/AdminShuffle.tsx:37–102`. | Gerçek dönem/atama geçmişi çalıştıktan sonra demo mantığı kaldırılır; önizleme davranışı korunur. | P27–P29. |
| API istekleri içindeki `ALTER TABLE` / `CREATE TABLE` | `public_visitors` başvuru yolları ve bilet akışında DDL. | Sürümlü migration aynı şemayı üretip mevcut DB'de prova edildikten sonra istek içi DDL çıkarılır. | P09/P11. |
| Tekrarlanan Express method/path tanımları | 17 tekrar envanterde. | Aktif handler, middleware ve yetki karşılaştırılmadan silinmez; tek route sözleşmesine indirilir. | P40. |
| Karşılığı olmayan web/mobil istemci çağrıları | Web 19 yol konumu + 2 yöntem; mobil ayrı eksikler. | Kullanılan özellik için API tamamlanır; kullanılmayan çağrı/ekran ancak erişim ve ürün etkisi doğrulanınca temizlenir. | P08,P32,P39. |
| Doğrudan importu bulunmayan `CourseForm`, `Empty`, `LessonManager`, `StudentDashboard`, `TrafficLightCard` | 39 bileşenin statik import haritasında 0 kullanım. | Dinamik kullanım, route/derleme ve ürün kararı incelenir; sıfır import tek başına silme kararı değildir. | P41. |
| `ComingSoon` LMS route'ları, bağlantısız `server/src/routes/*`, `deploy/api` kod kopyası | Route/dağıtım haritasında ayrı eski veya yarım yollar. | Eğitim ve destek kapsamı, gerçek trafik/dağıtım, eski bağlantı etkisi netleşir; koru/bağla/birleştir/kaldır kararı verilir. | P08,P40,P41. |
| `user_score_history` yazma varsayımı, eski status/altı ay varsayılanı | Canlı tablo yok; kod–kısıt ve R05/R09 çatışması var. | Yeni geçmiş/durum/dönem modeli ve veri geçişi doğrulanınca eski referanslar değişir; veri silme olarak ele alınmaz. | P11,P21,P27. |

**Şimdilik silinmeyecekler:** Canlı kullanıcı/ödeme/ziyaretçi/etkinlik kayıtları, yasal metinler, eski URL yönlendirmeleri, blog/eğitim/destek alanları ve Pardus'un ayrı kimliği. Bu parçalar ancak açık ürün kararı, kullanım ve veri geçiş kanıtıyla yeniden sınıflandırılır.

## İnceleme sırası

Önce bu matris kullanıcıyla gözden geçirilir: “koru/değiştir/ekle/kaldırmayı değerlendir” etiketleri ve D01–D10 kararları düzeltilir. Sonra [[E4N/07-Sprintler/Gelistirme-Yol-Haritasi|Sprint 1]] içinden karar gerektirmeyen ilk dar iş seçilir. Linear işinin Backlog'da olması, uygulamanın başladığı anlamına gelmez.
