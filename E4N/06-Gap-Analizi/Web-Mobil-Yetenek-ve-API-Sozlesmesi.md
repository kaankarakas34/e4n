# Web–mobil yetenek, rol ve API sözleşmesi: ikinci denetim

**2 Ekim 2026. Kanıt düzeyi:** güncel çalışma ağacındaki statik kaynak incelemesi. Web `src/App.tsx`, `src/shared/Navigation.tsx`, mobil `app`, `hooks/use-auth.tsx`, `constants/api.ts` ve bağlı `deploy/api/src/index.js` esas alındı. Çalışma ağacı kirli olduğundan bu not bir yayın sürümü iddiası değildir. Canlı API'ye ve veritabanına yazılmadı. İşler [E4N-115](https://linear.app/e4n/issue/E4N-115/par-01-web-ve-mobil-yetenek-navigasyon-ve-rol-matrisi-denetimi) ve [E4N-116](https://linear.app/e4n/issue/E4N-116/par-02-ortak-api-veri-ve-rol-davranisini-iki-platformda-denetle) altında izlenir.

Kaynak kimliği: üst repo HEAD `7ead1690ab1b7344fe2ea98d6217700e3f39e0ab`; ayrı mobil repo HEAD `db2028480fa28ad1a421d14189345f04368130c8`. Mobil ekranların ve `constants/api.ts` dosyasının çoğu commit edilmemiş/izlenmeyen çalışma ağacı içeriğidir. `mobile/app.json` sürüm alanı `1.0.0`; bu alan ve HEAD yayın paketini eşleştirmez. Kaynakta `eas.json` bulunmadı. Bu nedenle mağaza sürümüne dair hiçbir eşitlik sonucu verilmez.

## Rol ve erişim baz çizgisi

| Rol/erişim | Web giriş noktası | Mobil giriş noktası | Statik bulgu ve doğrulama |
|---|---|---|---|
| Ziyaretçi | Açık tanıtım, blog, etkinlik, başvuru, ziyaretçi ödeme ve yasal route'lar (`src/App.tsx:137-188`). | Kayıt/giriş dışında açık içerik akışı yok; sekmeler oturum sonrasında. | Hangi açık içeriğin mobilde uygulama içi, hangisinin tarayıcı bağlantısıyla tamamlanacağı ürün kararı gerekir. |
| Üye | Dashboard, grup/lonca, aktivite, üyelik ve diğer route'lar. Menü rol bazlı (`src/shared/Navigation.tsx:40-85`). | Beş sekme + dokuz özellik kartı (`mobile/app/(tabs)/menu.tsx:6-16`). | Mobil kartın açılması işin tamamlandığını göstermez; aşağıdaki kısmi/sabit ekranlar ayrı incelenir. |
| Başkan/başkan yardımcısı | Menüde `/group-management`; grup kararları ve toplantı akışları (`src/shared/Navigation.tsx:59-79`). | Auth yönlendirmesi ADMIN dışındaki herkesi üye sekmelerine yollar (`mobile/hooks/use-auth.tsx:30-49`); başkan ekranı yok. | Başkan ve yardımcının hedef yetkisi D kararlarıyla kesinleşir; mobilde yönetim akışı ve API rol testi gerekir. |
| Admin | Menüde yönetim; `src/App.tsx` admin route'ları ProtectedLayout içinde. | Auth hook'u ADMIN'i `/admin`e yönlendirir; 12 kart `mobile/app/admin/index.tsx:12-25`. | İki tarafta da yalnız menü/istemci yönlendirmesi sunucu yetkisini kanıtlamaz. Web ProtectedLayout yalnız oturum/PENDING kontrolü yapar (`src/App.tsx:92-117`); alt route'larda genel rol kapısı yok. API bazında rol ayrıca ölçülür. |

## Yetenek düzeyinde kaynak matrisi

`Yok`: eş akış yok. `Görünüm`: ekran var, işi bitiremiyor. `Kısmi`: en az bir adım bağlı, tüm işlem kanıtlanmadı. `Yol`: istemci API yolu bağlı kodda var; çalışma zamanı kanıtı değil.

| ID | Rol / iş | Web kaynak durumu | Mobil kaynak durumu | Bağlı API/veri kontrolü ve açık kabul |
|---|---|---|---|---|
| PAR-A01 | Ziyaretçi: tanıtım/blog/yasal | Route var | Yok | İçerik ve bağlantı hedefi kararlaştırılmalı. |
| PAR-A02 | Ziyaretçi: başvuru/ödeme | Route var | Yok | Başvuru, ödeme callback ve hak sonucu iki kanalda aynı olmalı. |
| PAR-A03 | Üye: giriş/kayıt/kurtarma | Giriş/kayıt/kurtarma/onay route'u | Giriş/kayıt; kurtarma/onay yok | Kayıt türü ve şifre kurtarma sonucu test edilmeli. |
| PAR-A04 | Üye: ağ/profil/grup ayrıntısı | Profil ve grup detay route'u | Ağ listesi; üye kartında `onPress` yok (`network.tsx:62`); grup detay yok | `GET /users` satırı ve profil, görünür alan ve rol aynı olmalı. |
| PAR-A05 | Üye: etkinlik/kayıt/bilet | Liste/detay/kayıt/bilet route'ları | Liste ve POST kayıt; kart `onPress` boş (`events.tsx:97`), detay/bilet yok | `GET /events` ve `POST /events/:id/register` yol var; hata/tekrar kayıt ve bilet sonucu test edilmeli. |
| PAR-A06 | Üye: referans | Kaynak ekran var | Liste ve POST var (`features/referrals.tsx`) | Yol eşleşmesi mevcut; yanıt alanları ve yazılan satır karşılaştırılmalı. |
| PAR-A07 | Üye: görüşme/aktivite | Ekranlar var | GET/POST `/activities` | Bağlı API'de `/activities` yok; işin ekranı tamamlanamaz. |
| PAR-A08 | Üye: rapor/puan | Rapor route'u; bazı sunucu değerleri örnek | `/users/me/stats` isteği başarısız olunca başlangıç sıfırları kalır (`features/reports.tsx:8-32`) | Bu yol bağlı API'de yok; hata sıfır veri gibi gösterilmemeli. |
| PAR-A09 | Üye: mesaj/destek/belge | Route'lar var; bazı çağrılar API'siz | Mesaj `MESSAGES_MOCK`; destek `/support`; belge ekranı yok | Mesaj gerçek veriyle, destek `tickets/*` sözleşmesiyle değerlendirilir. |
| PAR-A10 | Üye: eğitim/LMS | `/lms` ve kurs route'u `ComingSoon` | `/courses` listesi; kart basışı boş (`features/lms.tsx:56`) | `GET /courses` var; ders ilerlemesi ve içerik açılışı iki tarafta eksik. |
| PAR-A11 | Üye: üyelik/ödeme | Üyelik/ödeme ekranları | `/payments/me` yok; yenileme yalnız web uyarısı | Üyelik hakkı ve ödeme veri sahipliği P12/P14'e bağlı. |
| PAR-A12 | Başkan: grup kararı/toplantı | Yönetim ekranları | Eş başkan akışı yok | Rol, kapasite, görüşme ve karar sonucu ortak sunucu sözleşmesiyle sınanmalı. |
| PAR-A13 | Admin: üye/başvuru | Liste/detay/karar route'ları | Üye liste ve başvuru ekranı; `/public-visitors` yok | `GET /users` yalnız id/name/profession/city/email/phone döndürür (`deploy/api/src/index.js:1643-1672`); mobil başvuru ekranının `status/account_status/profession_id` filtre/verisi bu yanıtla gelmez. Liste boş görünmesi gerçek sıfır başvuru kanıtı değildir. |
| PAR-A14 | Admin: grup/etkinlik | Detay ve yönetim route'ları | Liste/oluşturma; grup detay yok. Etkinlik CRUD bağlı. | `GET /events` üretim 500 bulgusu ve GET içindeki yazma etkisi ayrı H kaydında; rota varlığı başarı değil. |
| PAR-A15 | Admin: rapor/muhasebe/LMS/e-posta | Route'lar var, bazıları örnek/eksik | Rapor özet; `/payments/history` yok; LMS/e-posta yönlendirme görünümü | Gerçek veri ile boş/hata ayrımı ve seçilen hedef işlev test edilmeli. |
| PAR-A16 | Admin: destek/shuffle | Route'lar var | `/support` ve `POST /shuffle` bağlı API'de yok | Shuffle önizleme/geri alma/rol/idempotency kararı P27–P29'a bağlı. Üretimde çağrı yok. |
| PAR-A17 | Mobil mağaza | Web route'u yok | “Çok Yakında” görünümü | P41 ürün kararı: hedef özellik veya menüden kaldırılacak demo. |

## API ve veri sözleşmesinde kanıtlanan ayrımlar

1. **Mobil adres güncellendi.** `mobile/constants/api.ts:3-10` şimdi Android emülatörde `10.0.2.2:4000/api`, diğer geliştirmede `localhost:4000/api`, üretim varsayılanında `https://event4network.com/api` kullanıyor; `EXPO_PUBLIC_API_URL` bunu değiştirebilir. Önceki `e4n-backend.vercel.app` 404 denemesi bu güncel kaynak için geçerli yayın testi değildir. Yayın derlemesinin env değeri ve commit'i açık.
2. **Yol eksikleri.** Mobil `/activities`, `/payments/me`, `/payments/history`, `/support`, `/users/me/stats`, `/shuffle`, `/public-visitors` istekleri bağlı `deploy/api/src/index.js` yollarıyla eşleşmiyor. Web'in ayrıca [[E4N/02-Mevcut-Sistem/Istemci-API-Eslesmesi|19 yol ve 2 yöntem farkı]] var. Alternatif sunucuya dair kanıt olmadan otomatik çalışma zamanı 404 sonucu iddia edilmez.
3. **Yanıt alanı eksikliği.** Mobil admin başvurusu `/users` yanıtını `status/account_status/profession_id` ile filtreliyor; bağlı `GET /users` bunları seçmiyor. Bu, yol eşleşse bile işlev eşitliğinin bozulduğunu gösterir. `GET /courses` ders sayısı ve kayıt durumu döndürür, ancak mobil kurs kartı navigasyon yapmaz.
4. **Örnek/yanıltıcı veri.** Mobil mesajlar sabit örnek, admin panosu 54/1/2 sabit sayı. `GET /reports/stats` içinde `internalRevenue/externalRevenue` 70/30 hesaplanıyor, `lostMembers` sıfır ve `visitorConversionRate` 20 sabit (`deploy/api/src/index.js:468-501`). Mobil kişisel rapor ağ/404 hatasında sıfır gösteriyor. Ortak rapor sözleşmesinde `veri yok`, `hata` ve gerçek sıfır ayrılmalı.
5. **Rol.** Mobil hook yalnız `ADMIN`/diğerleri yönlendiriyor; web menüsü `PRESIDENT` ve `VICE_PRESIDENT` ayrımı yapıyor. API uçları için JWT ve rol denetimi ayrı satır bazında doğrulanmadan erişim eşitliği veya güvenlik sonucu çıkarılmaz. E4N-58/59 ertelidir.

## Kalan doğrulama kapıları

**2 Ekim izole PAR-02 devamı:** Aynı sentetik üyeyle referans oluşturma mobil gövdesi 500/0 satır, web gövdesi 201/1 satır verdi ([[E4N/09-Dogrulama/PAR-02-Referans-Sozlesmesi-Deneyi|referans deneyi]]). Sentetik PENDING kullanıcı `/users` yanıtında var ama durum alanı yok; mobil filtre 0 döndürüyor. Mobil `/public-visitors` 404, bağlı `/admin/public-visitors` 200 ([[E4N/09-Dogrulama/PAR-02-Mobil-Admin-Basvuru-Sozlesmesi|başvuru deneyi]]). Bunlar yayın paketi veya Expo ekran testi değildir.

Destek yolu da aynı izole ortamda karşılaştırıldı: mobil `/support` oluşturma/liste 404 ve 0 yeni satır, web `/tickets` oluşturma 201/1 satır ve admin liste 200 ([[E4N/09-Dogrulama/PAR-02-Destek-Yolu-Sozlesmesi|destek deneyi]]). Mobil admin durum PUT yolunun karşılığı da `/tickets/:id/status`; işlem yazması bu deneyde çağrılmadı.

Mobil bire bir görüşme `/activities` GET/POST da izole API'de 404/0 satır; web biçimli `/one-to-ones` POST 201/1 satır, GET 200 ([[E4N/09-Dogrulama/PAR-02-Gorusme-Aktivite-Sozlesmesi|görüşme deneyi]]). Gövde alanları farklı olduğundan yalnız yol değişikliği hedef sözleşme çözümü sayılmaz.

Ortak etkinlik kayıt yolunda sentetik MEMBER için tekrar POST 200 / `Already registered` ve `attendance` 1→1; olmayan etkinlik 404, JWT'siz istek 401 ([[E4N/09-Dogrulama/PAR-02-Etkinlik-Kayit-Ortak-Yol|etkinlik kaydı deneyi]]). Yeni kayıt, bilet ve e-posta yan etkileri bu deneyde çalıştırılmadı.

- Yayın mobil paketinin commit/env eşlemesi; gerçek cihaz/Expo test derlemesi ve web sürüm commit'i.
- Sentetik üye, başkan, yardımcısı, admin ve ziyaretçi için giriş noktası, deep link, 200/4xx/5xx, boş/verili yanıt ve gerçek işlem sonucu matrisi.
- İzole DB'de önce/sonra satır sayımı: etkinlik kayıt, referans, başvuru kararı, üyelik/ödeme, grup kararı ve shuffle. Üretimde yazan test yok.
- Her PAR-A satırı için hedef kararı: iki platformda işlev, mobilde açık web geçişi, ya da her ikisinden çıkarma. D01–D10 gerektiren kararlar açık bırakılır. Karar çıkmadan PAR-03/04 Done olmaz.
