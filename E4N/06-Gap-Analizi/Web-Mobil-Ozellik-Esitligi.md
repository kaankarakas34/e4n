# Web–mobil özellik eşitliği denetimi

**1 Ekim 2026. Durum:** kaynak bazlı ilk karşılaştırma. Web `src/App.tsx` route'ları, ilgili `src/pages/*`, mobil `mobile/app/*` ekranları, menü bağlantıları ve bağlı API envanteri incelendi. Mobil yayın sürümü, web/mobil bütün rollerle uçtan uca çalışma zamanı ve yazan işlemler bu notta doğrulanmadı. Güvenlik işleri E4N-58/59 kullanıcı kararıyla ertelenmiş durumda.

**2 Ekim ek denetim:** [[E4N/06-Gap-Analizi/Web-Mobil-Yetenek-ve-API-Sozlesmesi|17 yeteneklik rol, navigasyon ve API sözleşmesi matrisi]] açıldı. Mobil API adresi güncel çalışma ağacında değişmiş; 1 Ekim'deki eski üretim adresi 404 denemesi güncel kaynak/yayın kanıtı sayılmaz. Mobil başvuru ekranının beklediği `status` alanı bağlı `GET /users` yanıtında bulunmuyor.

## Linear takip işleri

- [E4N-114 — web/mobil özellik eşitliği programı](https://linear.app/e4n/issue/E4N-114/par-web-ve-mobil-ozellik-esitligi-programi): üst iş.
- [E4N-115 — yetenek, navigasyon ve rol matrisi](https://linear.app/e4n/issue/E4N-115/par-01-web-ve-mobil-yetenek-navigasyon-ve-rol-matrisi-denetimi): bu kaynak bazlı matris başladı; yayın sürümü ve çalışma zamanı kanıtı açık.
- [E4N-116 — ortak API, veri ve rol denetimi](https://linear.app/e4n/issue/E4N-116/par-02-ortak-api-veri-ve-rol-davranisini-iki-platformda-denetle): iki istemcinin bağlı API ve veri sözleşmesi.
- [E4N-117 — genel, ziyaretçi ve üye akışları](https://linear.app/e4n/issue/E4N-117/par-03-genel-ziyaretci-ve-uye-akislarini-web-ve-mobilde-esitle): denetim kararlarından sonra uygulama.
- [E4N-118 — başkan ve admin akışları](https://linear.app/e4n/issue/E4N-118/par-04-baskan-ve-admin-islevlerini-web-ve-mobilde-esitle): denetim kararlarından sonra uygulama.
- [E4N-119 — iki platformlu uçtan uca doğrulama](https://linear.app/e4n/issue/E4N-119/par-05-web-ve-mobil-ozellik-esitligini-uctan-uca-dogrula): uygulama sonrası kabul.

## Eşitlik ölçüsü

Hedef aynı piksel düzeni değil, aynı **işi tamamlayabilme**: aynı rol aynı veriyi görür, aynı uygun işlemi yapar, aynı sonucu ve hatayı alır. Ekran dosyasının varlığı, menüde görünmesi veya API yolunun tanımlı olması işlevin çalıştığını kanıtlamaz. Web'de zaten eksik, demo veya hatalı olan davranış mobilde kopyalanmaz; iki istemci ortak kabul edilmiş hedef sözleşmeye bağlanır. Her özellik için `yok / yalnız görünüm / kısmi / API eşleşiyor ama doğrulanmadı / uçtan uca doğrulandı` etiketi kullanılır.

## İlk karşılaştırma

| Özellik kümesi | Web kaynak durumu | Mobil kaynak durumu | Eşitlik denetiminde yapılacak iş |
|---|---|---|---|
| Giriş, kayıt, kurtarma, onay | Giriş/kayıt yanında community kayıt, şifre unutma/oluşturma, pending sayfaları var. | Giriş ve kayıt var; diğer akışlara ekran yok. | Kayıt türleri, davet/onay ve şifre kurtarma aynı sonuca ulaşıyor mu? |
| Genel tanıtım, blog ve yasal içerik | Landing, E4N anlatımı, etkinlik ayrıntısı, blog, ziyaretçi başvurusu/ödemesi, iletişim ve yasal sayfalar kayıtlı. | Mobil sekmelerde etkinlik listesi var; bu genel içerik ve başvuru/ödeme yolları için eş ekran yok. | Kullanıcının mobilde bu işlemleri tamamlayacağı yol ve içerik güncelliği belirlenmeli; yalnız route varlığı yeterli değil. |
| Üye ağı ve profil | Üye profili, grup/lonca detayları, kendi profil/üyelik sayfaları var. | Network listesi var fakat kartın `onPress` işlevi yok; kendi profilinde düzenleme/destek düğmeleri bağlı değil; grup/lonca detay ekranı yok. | Profil açma/düzenleme, görünür grup/lonca, başvuru ve üyelik hakkı iki istemcide aynı veriye bağlanmalı. |
| Etkinlik, bilet, ödeme | Etkinlik listesi/ayrıntısı, kayıt, üyelik planı ve ödeme akışı kaynakta var. | Etkinlik listesi/kayıt var; ayrıntı/bilet/ücret/üyelik yenileme eksik veya web'e yönlendirme. `/payments/me` bağlı API'de yok. | İki istemcide kayıt–ödeme–bilet sonucu ve başarısız/tekrar çağrı aynı hak hesabıyla doğrulanmalı. |
| Referans, görüşme, puan, rapor | Referans, toplantı/aktivite, gelir girişi ve kişisel rapor sayfaları var; bazı API farkları açık. | Referans ekranı var; görüşme `/activities` bağlı API'de yok; rapor `/users/me/stats` yok ve hata halinde sıfırlar gösteriliyor. | Ortak API ve gerçek veri sözleşmesi kurulmalı; sıfır veri ile istek hatası ayırt edilmeli. |
| Mesaj, destek, eğitim, belge | Mesaj, destek, eğitim/belge route'ları var; web'de de eksik API ve LMS `ComingSoon` parçaları mevcut. | Mesaj listesi sabit örnek veridir; destek `/support` yok; LMS listesinde kart basışı boş; belge ekranı yok. | Önce her özelliğin hedefte kalacağı doğrulanır, sonra iki tarafta aynı işlev/boş/hata hali uygulanır. Sahte mesaj gerçek gibi gösterilmez. |
| Başkan/grup yöneticisi | `group-management`, `chapter-management` ve grup detayında üye, toplantı, katılım, başvuru kararları bulunuyor. | Başkan için eş yönetim akışı görülmedi; mobil admin grup ekranı yalnız liste/oluşturma ağırlıklı ve kartlar işlevsiz. | Başkan rolünün yetkili olduğu tüm adımlar, 35/çakışma/görüşme kurallarıyla iki platformda eşlenmeli. |
| Admin üye, grup, başvuru | Web üye oluşturma/detay, grup/lonca detay, ziyaretçi/CRM ve başvuru yönetimini içeriyor. | Admin üye/grup/başvuru ekranları daha dar; başvuru `/public-visitors` bağlı API'de yok. | Liste–detay–oluşturma–karar–düzenleme–hata matrisi ve rol kapısı karşılaştırılmalı. |
| Admin ödeme/muhasebe, içerik, LMS | Web abonelik/muhasebe/fatura, blog, rol, sınav ve ders editörü route'ları var. | `/payments/history` yok; muhasebe/blog/rol/ders editörü yok; admin LMS ekranı masaüstüne yönlendiriyor. | Mobilde işlevsel eşdeğer akış veya açık hedef kararı; fatura ve ödeme veri sahipliği P10/P14 ile uyumlu olmalı. |
| Admin rapor, e-posta, destek, shuffle | Web detay ekranları var; raporda örnek/sabit veri ve shuffle durum hatası ayrıca kayıtlı. | Rapor yalnız özet ve masaüstüne yönlendirme; e-posta placeholder; destek `/support` ve shuffle `/shuffle` bağlı API'de yok. Admin dashboard 54/1/2 sabit sayaç gösteriyor. | Gerçek veri, aynı onay/önizleme/geri alma ve hata davranışı; web'in hatalı değerleri mobilde referans sayılmaz. |
| Mobilde görünen mağaza | Web route envanterinde mağaza yok. | “Mağaza Çok Yakında” placeholder. | Hedef ürün özelliği mi yoksa menüden çıkarılacak demo mu, P41 ile kararlaştırılır. |

## Denetim adımları ve kabul ölçütü

1. Her satırı küçük, numaralı yeteneklere ayır: rol, giriş, ekran, API method/yol, beklenen yanıt/veri sahibi, yazma etkisi ve web/mobil karşılığı. Menüden erişim ve derin bağlantı ayrıca işaretlenir.
2. API çağrılarını bağlı sunucu ile yöntem, yetki, alan, durum kodu ve boş/hata biçiminde karşılaştır. Eksik mobil yollar [[E4N/02-Mevcut-Sistem/Mobil-Envanteri|mevcut envanterde]], web eksikleri [[E4N/02-Mevcut-Sistem/Istemci-API-Eslesmesi|istemci eşlemesinde]].
3. Sentetik kullanıcılarla üye, başkan ve admin rollerinde tarayıcı + Expo test derlemesi akışları sınanır. Aynı kullanıcı işlemi sonrası DB satırı ve iki istemcinin görünümü karşılaştırılır; ödeme/shuffle gibi yazan testler yalnız izole ortamda.
4. Her yetenek için hedef karar `iki platformda uygula / iki platformdan kaldır / yalnız web içeriği için mobil erişim yolu` olarak kaydedilir. Uygulama görevleri bu karara ve D01–D10 ürün kurallarına bağlanır. Gizli veya sahte veri gerçekmiş gibi sunulmaz.
5. Eşitlik tamam ölçütü: hedefte kalan her yetenek için iki platformda erişilebilir akış, aynı hak/veri sonucu, aynı anlamlı hata ve test kanıtı. Yayın mobil derlemesinin kaynak commit'i ayrıca eşlenir.

Bu ilk matris kaynak kanıtıdır; mobilde olmayan her web route'unun üretimde çalıştığını, web'deki her ekranın doğru olduğunu veya yayımlanmış mobil sürümün incelenen kaynakla aynı olduğunu iddia etmez. Uygulama P32/P39/P41 ve yeni eşitlik işleriyle planlanır; bu denetim turunda kod/DB değiştirilmez.
