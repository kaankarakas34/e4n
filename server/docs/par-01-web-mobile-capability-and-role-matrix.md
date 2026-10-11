# PAR-01 — Web ve Mobil Yetenek, Navigasyon ve Rol Matrisi Denetimi (Capability, Navigation & Role Matrix)

Bu doküman, Event4Network (E4N) platformunun Web ve Mobil (React Native / Expo) istemcileri arasındaki rol tabanlı erişim kontrolü (RBAC), navigasyon yapıları, özellik eşitliği (feature parity) durumları ve mimari gap analizini tanımlar.

---

## 1. Rol Bazlı Erişim ve Navigasyon Modeli

Platformda 4 ana kullanıcı yetki seviyesi tanımlıdır:

| Rol Kimliği | Web Giriş ve Navigasyon | Mobil Giriş ve Navigasyon | Erişim Kapsamı ve Kurallar |
| :--- | :--- | :--- | :--- |
| **ANONYMOUS / GUEST** | Açık ana sayfa, etkinlikler, blog, iletişim, giriş (`/auth/login`), açık normal kayıt (`/auth/register`), şifre oluşturma (`/auth/create-password`). | Giriş ekranı (`/(auth)/login`), kayıt ekranı (`/(auth)/register`). Açık sekme gezintisi oturumsuz kilitlidir. | Herkese açık etkinlik keşfi ve misafir biletleme (P26). Kurumsal kimlik (şirket, VKN/TCKN, vergi dairesi) ile doğrudan üye kaydı. |
| **MEMBER** | `/dashboard`, `/members`, `/groups`, `/power-teams`, `/events`, `/referrals`, `/one-to-ones`, `/visitors`, `/reports`, `/membership-records`, `/support`. | 5 Sekme (`Ana Sayfa`, `Network`, `Etkinlikler`, `Profilim`, `Menü`). Menü altında 10 kart: referanslar, görüşmeler, raporlar, ödemeler, destek, ayarlar. | Standart iş ağı üyeliği. Grup üyeliği, etkinlik bilet hakları (P25), kişisel performans karnesi, birebir toplantı talepleri ve fatura indirme. |
| **PRESIDENT / VP** | `/group-management`, `/chapter-management`, grup detayında başvuru kuyruğu (7 gün SLA), toplantı yoklaması (toplu kayıt) ve üye devam takibi. | Mevcut auth yönlendirmesinde (`use-auth.tsx`) MEMBER sekmelerine gitmektedir. Menüde özel başkan paneli henüz ayrıştırılmamıştır. | Grup liderliği. Grup başvurularını inceleme ve kabul/ret, haftalık toplantı yoklamalarını tek transaction'da işleme. |
| **ADMIN** | `/admin/*` altında tam yetkili yönetim paneli. Üye oluşturma/CRM, grup kataloğu (35 tavanı), muhasebe/fatura yükleme, 4 aylık shuffle simülasyonu, cron işleri. | `/admin` ekranında 12 yönetim kartı: etkinlikler, gruplar, başvurular, üyeler, abonelikler, zamanlayıcı, shuffle, LMS, raporlar, e-posta, biletler, meslekler. | Sistem yöneticisi. Tüm gruplar, üyeler, muhasebe, güvenlik ayarları ve operasyonel kurtarma araçları üzerinde tam yetki. |

---

## 2. 20 Temel Fonksiyonel Yetenek Eşitlik Matrisi (Feature Parity Matrix)

Durum Sınıflandırması:
- **PARITY_FULL:** İki platformda da tam eşit ve doğrulanmış.
- **PARITY_PARTIAL:** Mobilde ekran/liste mevcut fakat detay, derin bağlantı veya yazma akışı eksik.
- **WEB_ONLY_INTENTIONAL:** Bilinçli olarak masaüstü web deneyimine ayrılmış karmaşık operasyonel konsollar.
- **GAP_TO_CLOSE:** Sprint 7 (PAR-02 ... PAR-05) kapsamında kapatılacak somut farklar.

| ID | Yetenek Alanı | Web Durumu | Mobil Durumu | Eşitlik Durumu | Aksiyon ve Çözüm Planı |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PAR-01** | **Kimlik Doğrulama & Oturum** | Login, Açık Kayıt (BAŞ-01 vergi alanları), Şifre oluşturma, Çıkış. | Login, Kayıt, Token saklama (`SecureStorage`), Çıkış. | **PARITY_FULL** | Mobil kayıt formunda kurumsal alanlar (VKN/TCKN) PAR-03 ile desteklenir. |
| **PAR-02** | **Kişisel Performans Raporu** | `/reports` -> `GET /api/reports/me` (7d, 30d, 90d, 1y). Karne ve iş hacmi. | `reports.tsx` -> `GET /api/reports/me` (7d, 30d, 90d, 1y). Karne ve retry. | **PARITY_FULL** | MOB-01 / E4N-134 ile tam eşitlendi ve izole testle kanıtlandı. |
| **PAR-03** | **Referans Yaşam Döngüsü** | Liste, Ver/Al, İç/Dış referans, Durum güncelleme ve Ciro bildirimi. | `features/referrals.tsx` -> Liste ve Yeni referans oluşturma. | **PARITY_FULL** | P32-D ile güçlendirildi; ortak `GET/POST /referrals` sözleşmesi devrede. |
| **PAR-04** | **Destek Talepleri & Biletler** | `/support` -> Yeni talep, mesajlaşma, Admin yanıtı ve durum kapatma. | `features/support.tsx` -> Talep oluşturma ve liste. | **PARITY_FULL** | P32-A ile `tickets/*` ortak Express API sözleşmesine bağlandı. |
| **PAR-05** | **Birebir Toplantı Talepleri** | Talep gönderme, Kabul/Ret, Gerçekleşme tarihi ve notu. | `features/meeting-requests.tsx` -> Liste ve talep yanıtı. | **PARITY_FULL** | P32-B ile navigasyon ve API sözleşmesi eşitlendi. |
| **PAR-06** | **Tamamlanan Birebir Görüşmeler** | `/one-to-ones` -> Tamamlanmış görüşme kaydı, eşleşme ve puan defteri. | `features/activities.tsx` -> Liste ve Görüşme formu. | **GAP_TO_CLOSE** | PAR-02'de mobildeki eski `/activities` çağrısı `/one-to-ones` rotasına bağlanacak. |
| **PAR-07** | **Üye Ağı ve Profil Arama** | `/members` -> 81 İl, meslek, şirket arama, detay profili ve bağlantı kurma. | `(tabs)/network.tsx` -> Üye listesi ve arama. | **PARITY_PARTIAL** | Üye kartı `onPress` navigasyonu detay profiline (`PublicProfile`) bağlanacak (PAR-03). |
| **PAR-08** | **Kendi Profilim ve Ayarlar** | `/profile` -> Bilgiler, fatura/vergi alanları, biyografi, şifre değiştirme. | `(tabs)/profile.tsx` & `features/settings.tsx`. | **PARITY_PARTIAL** | Profil düzenleme ve kaydetme akışı web API'siyle doğrulanacak (PAR-03). |
| **PAR-09** | **Etkinlik Keşfi ve Kayıt** | `/events` -> Liste, detay, üye indirim rozeti (P25), kayıt olma ve bilet alma. | `(tabs)/events.tsx` -> Liste ve kayıt butonu. | **PARITY_PARTIAL** | Kart `onPress` etkinliğin detayına yönlendirecek, bilet hakları yansıtılacak (PAR-03). |
| **PAR-10** | **Çoklu Bilet & Misafir Biletleme** | `/events/:id` -> 1-20 adet bilet, misafir katılımcı formu, ödeme entegrasyonu. | Henüz çoklu bilet seçimi ve misafir bilet formu yok. | **GAP_TO_CLOSE** | Mobil etkinlik detayında bilet adedi ve ödeme modalı eşlenecek (PAR-03). |
| **PAR-11** | **Grup ve Lonca Keşfi** | `/groups`, `/power-teams` -> Detaylar, üyeler, 35 kapasite rozeti, başvuru. | Menüde doğrudan grup keşif listesi eksik. | **GAP_TO_CLOSE** | Mobilde grup ve lonca detay ekranı/keşfi eklenecek (PAR-03). |
| **PAR-12** | **Abonelik & Ödeme Geçmişi** | `/membership-records` -> Aidat durumu, D07 kısıt uyarısı, PDF fatura indirme. | `features/payment.tsx` -> Ödeme ekranı. | **GAP_TO_CLOSE** | `/payments/me` yerine `/api/memberships` ve fatura geçmişi bağlanacak (PAR-02). |
| **PAR-13** | **Bildirimler** | Header zili, `/notifications` -> Liste, okundu işaretleme, derin link. | `(tabs)/index.tsx` içinde bildirim özeti. | **PARITY_PARTIAL** | Bildirim listesi ve okundu aksiyonu API ile uyumlu (PAR-03). |
| **PAR-14** | **Birebir Mesajlaşma** | `/messages` -> Sohbet odaları, anlık mesajlaşma, okunmamış sayacı. | `features/messages.tsx` -> Mock mesajlar. | **PARITY_PARTIAL** | Sabit mock veriler gerçek `direct_messages` API'sine bağlanacak (PAR-03). |
| **PAR-15** | **Başkan: Başvuru İnceleme & SLA**| 7 gün SLA aşımı rozeti, görüşme notu, kabul/ret kararı (BAŞ-05). | Mobilde başkan özel ekranı yok. | **GAP_TO_CLOSE** | Başkanlar için mobil başvuru kuyruğu ve SLA rozeti kurulacak (PAR-04). |
| **PAR-16** | **Başkan: Toplantı Yoklaması** | Toplu yoklama formu (PRESENT, ABSENT, LATE, SUBSTITUTE), açıklama. | Mobilde toplu toplantı yoklama akışı yok. | **GAP_TO_CLOSE** | Mobilde başkan toplantı yoklama arayüzü kurulacak (PAR-04). |
| **PAR-17** | **Admin: Üye & Grup Yönetimi** | Yeni üye oluşturma, CRM dönüşümü, 35 kişi tavanı, lonca yönetimi. | `admin/users.tsx`, `admin/groups.tsx`, `admin/applications.tsx`.| **PARITY_PARTIAL** | `/admin/public-visitors` ve üye durum filtreleri bağlanacak (PAR-04). |
| **PAR-18** | **Admin: Etkinlik & Destek** | Etkinlik CRUD, destek biletleri durum değiştirme. | `admin/events.tsx`, `admin/tickets.tsx`. | **PARITY_FULL** | Admin etkinlik ve bilet yönetimi bağlı ve çalışır durumda. |
| **PAR-19** | **Admin: Muhasebe & PDF Fatura** | Kalıcı bytea fatura yükleme (P35), SMTP mail tetikleme, indirme. | Mobilde admin dosya yükleme operasyonu yok. | **WEB_ONLY_INTENTIONAL** | PDF dosya yükleme ve SMTP ayarları masaüstü web odaklı tutulacaktır. |
| **PAR-20** | **Admin: Shuffle & Cron Operasyon**| 4 aylık simülasyon, 35 tavanı, bildirimli çalıştırma, Vercel cron alarmı. | `admin/shuffle.tsx` basit mock metin, cron ekranı yok. | **WEB_ONLY_INTENTIONAL** | Karmaşık simülasyon ve sistem cron kurtarma konsolu masaüstü webte kalacaktır. |

---

## 3. Mobil Navigasyon Mimarisi İyileştirme Kararları

1. **Başkanlık Rolü Navigasyon Ayrımı (`PRESIDENT` / `VICE_PRESIDENT`):**
   - Mevcut durumda `mobile/hooks/use-auth.tsx` içinde `ADMIN` dışındaki herkes standart üye muamelesi görmektedir.
   - Karar: Kullanıcı bir grubun başkanı veya başkan yardımcısı ise (`user.group_role === 'PRESIDENT' || user.role === 'PRESIDENT'`), Menü ekranında (`mobile/app/(tabs)/menu.tsx`) özel bir **"Grup Yönetimi (Başkanlık)"** kartı render edilecektir (PAR-04 aşamasında).
2. **Kişisel Rapor (MOB-01):**
   - Web `GET /api/reports/me` sözleşmesine eşitlendi; 4 dönem aralığı, performans karnesi ve hata/retry mekanizması devrededir.
3. **API Uç Noktaları Standartlaştırması:**
   - Var olmayan `/activities` -> `/one-to-ones`
   - Var olmayan `/payments/me` -> `/memberships`
   - Var olmayan `/public-visitors` -> `/admin/public-visitors`
   Bu eşitlemeler PAR-02 paketinde icra edilecektir.

---

## 4. Sonuç ve Sonraki Sprint 7 Adımları

PAR-01 denetimi ile mobil ve web platformlarının yetenek, rol ve navigasyon haritası eksiksiz çıkarılmıştır.
Sprint 7'nin sonraki adımları bu matris doğrultusunda yürütülecektir:
- **PAR-02 (E4N-116):** Ortak API, veri ve rol davranışını iki platformda denetle ve eşitle (`/one-to-ones`, `/memberships`, `/admin/public-visitors`).
- **PAR-03 (E4N-117):** Genel, ziyaretçi ve üye akışlarını web ve mobilde eşitle (Network detay, Etkinlik bilet, Mesajlar).
- **PAR-04 (E4N-118):** Başkan ve admin işlevlerini web ve mobilde eşitle (Başkan SLA başvuru kuyruğu & yoklama).
- **PAR-05 (E4N-119):** Web ve mobil özellik eşitliğini uçtan uca doğrula.
- **P32 (E4N-104):** Sprint 7 Kapanışı ve Mobil Sürüm Onayı.
