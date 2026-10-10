# P39 / P41 — Web API Sözleşme Uyumu ve Bileşen Kararları Doğrulaması

**Tarih:** 10 Ekim 2026  
**İlgili Görevler:**
- **[E4N-111](https://linear.app/e4n/issue/E4N-111) (P39):** Web API sözleşmesindeki aktif yol ve yöntem farklarını kapat
- **[E4N-113](https://linear.app/e4n/issue/E4N-113) (P41):** Demo ve kullanılmayan parçaların korunma veya kaldırılma kararını ver

---

## 1. Kapsam ve İnceleme Özeti

Sprint yol haritasında Paket 06 kapsamında yer alan P39 ve P41 tesliminde, istemci (`src/`) kodundaki tüm API çağrıları TypeScript AST tabanlı statik tarayıcı (`server/test/scan-client-endpoints.mjs`) ile incelenmiş; Express sunucusunun aktif rota envanteri (`server/docs/route-ownership.json`, 203 rota) ile karşılaştırılmıştır.

Ayrıca kullanılmayan veya demo niteliğindeki bileşenler (`server/test/scan-unreferenced-components.mjs`) taranarak korunma, arındırma ve değerleme kararları çıkarılmıştır.

---

## 2. Tespit Edilen Farklar ve Uygulanan Çözümler

### 2.1. Aktif Yol Uyuşmazlığı: `POST /api/admin/members` (Giderildi)
- **Sorun:** Admin panelinde yer alan `CreateMember.tsx` (`/admin/members/new`) ve `AdminCRM.tsx` lead dönüştürme akışları `api.createMember(payload)` üzerinden `POST /api/admin/members` çağrısı yapıyordu. Ancak sunucu tarafında `/api/admin/members` yalnızca `GET` metoduna sahipti ve `POST` istekleri 404 dönüyordu.
- **Çözüm:** `server/src/routes/admin.js` içine `router.post('/members', ...)` işleyicisi eklendi:
  - **Yetki Kontrolü:** Yalnızca aktif veritabanı `ADMIN` rolü tarafından yürütülebilir (401 / 403 koruması).
  - **Doğrulama ve Tekillik:** BAŞ-01 (E4N-161) ve `companyIdentity` kurallarına tam uyum sağlandı. Zorunlu `name`, `email`, `phone`, `city` (`canonicalProvince`), `profession`, `company`, 10 haneli VKN veya 11 haneli TCKN (`tax_number`), `tax_office` ve `billing_address` alanları denetlendi.
  - **Şifreleme:** Güvenli geçici şifreleme (`bcrypt.hash(password, 10)`).
  - **Atomik Yazım:** Transaction ile `users` tablosuna `role = 'MEMBER'`, `account_status = 'ACTIVE'`, `company_registration = true` olarak yazım sağlandı.
  - **Hata Eşleme:** `companyWriteError` ile mükerrer e-posta (409 `EMAIL_IN_USE`) ve mükerrer VKN/TCKN (409 `TAX_NUMBER_IN_USE`) koruması uygulandı.
- **Arayüz İyileştirmesi (`CreateMember.tsx`):**
  - Form Zod şeması zorunlu kurumsal alanlar (`tax_number`, `tax_office`, `billing_address`, `city`) ile güncellendi.
  - `AdminCRM.tsx` üzerinden yönlendirilen adaylar için `location.state.lead` ön-doldurma (prefill) desteği eklendi.
  - Hata durumunda sunucudan dönen hata mesajı kullanıcıya anlaşılır şekilde sunuldu (`submitError` alert).

### 2.2. E-posta İstemci Servisi: `emailService.ts` (Düzeltildi)
- **Sorun:** `src/services/emailService.ts:133` dosyasında hardcoded `fetch('http://localhost:3001/send-email')` mikroservis çağrısı bulunuyordu.
- **Çözüm:** Gerçek e-posta gönderimleri sunucuda `nodemailer` ve outbox kuyrukları üzerinden yürütüldüğünden, istemci tarafındaki bu ölü bağlantı kaldırılarak yerel mock loglama dispatch'ine dönüştürüldü.

### 2.3. Eski Mock API Sarmalayıcıları (JSDoc @deprecated Olarak Belgelendi)
Hiçbir sayfa veya bileşen tarafından çağrılmayan, ancak eski arayüz imzalarını korumak için `api.ts` içinde yer alan 5 wrapper dokümante edildi:
1. `getPaymentToken`: Eski SIPAY v1 mock uç. Aktif ödeme sözleşmesi `payWithSipay`, `resumePayment` ve `getPaymentStatus` ile yürütülür.
2. `getTicketStats`: Eski mock bilet istatistikleri. Bilet ve kontenjan sayıları `GET /api/events` ve `GET /api/events/:id` ile sunulur.
3. `getPowerTeamEvents`: Eski mock lonca etkinlikleri. Lonca etkinlikleri `GET /api/events` üzerinden `power_team_id` ile filtrelenir.
4. `submitMeetingReport`: Eski mock toplantı raporu. Grup toplantı yoklaması ve katılımı `GET/POST /api/group-meetings/:id/attendance` ile yönetilir.
5. `notifyMembersOfShuffle`: Eski ayrı shuffle bildirimi. Bildirimler E4N-101 (P29) gereği `POST /api/shuffle/save` yürütüldüğünde atomik olarak iletilir.

---

## 3. P41 Bileşen ve Modül Karar Matrisi

| Bileşen / Modül | Tür | Kullanım Durumu | Karar | Gerekçe |
|---|---|---|---|---|
| `src/pages/ComingSoon.tsx` | Sayfa | `/lms`, `/lms/course/:id` | **KORU (RETAIN)** | Sprint 8 LMS-SON aşamasına kadar kullanıcıya bilgilendirici arayüz sunar. |
| `src/components/CourseForm.tsx` | Bileşen | LMS | **KORU (DEFERRED)** | Sprint 8 Kurs/Eğitim/Sınav kapsamı için korunur. |
| `src/components/LessonManager.tsx` | Bileşen | LMS | **KORU (DEFERRED)** | Sprint 8 LMS modülü parçasıdır. |
| `src/components/StudentDashboard.tsx`| Bileşen | LMS | **KORU (DEFERRED)** | Sprint 8 LMS modülü parçasıdır. |
| `src/components/Empty.tsx` | Bileşen | Yardımcı UI | **KORU (UTILITY)** | Yeniden kullanılabilir boş durum sunum bileşeni. |
| `src/hooks/useTheme.ts` | Hook | Yardımcı UI | **KORU (UTILITY)** | Tema (light/dark) altyapısı. |
| `src/pages/Home.tsx` | Sayfa | Referanssız (3 satır) | **KALDIRILACAK** | Boş `<div></div>`; ana rota `/` doğrudan `LandingPage.tsx` ile yönetilir. |
| `src/stores/taskStore.ts` | Store | Referanssız | **KALDIRILACAK** | `TasksCard.tsx` gerçek `referralStore` ve `api.getCalendar` kullanır; mock store gereksizdir. |
| `src/shared/TrafficLightCard.tsx` | Bileşen | Referanssız | **KALDIRILACAK** | Yerini modern `ScoreCard.tsx` ve P21/P22 puan olay defteri aldı. |
| `src/stores/trafficLightStore.ts` | Store | Referanssız | **KALDIRILACAK** | Yerini `performanceStore.ts` aldı. |
| `src/pages/AdminRoles.tsx` | Sayfa | Bağlantısız | **KALDIRILACAK** | Rotalarda tanımlı değil; statik sahte izin dizileri içeriyor. Rol yönetimi `AdminMembers.tsx` ve DB constraint'iyle sağlanır. |

---

## 4. Doğrulama ve Test Kanıtları

1. **İzole PostgreSQL 17 Üye Oluşturma Sözleşme Testi (`server/test/admin-member-creation-contract.mjs`):**
   - Test 1: Yetki bariyerleri (Anonim 401, MEMBER 403 engeli) -> **PASS**
   - Test 2: Zorunlu alan ve geçersiz VKN/TCKN kontrolleri (400) -> **PASS**
   - Test 3: Başarılı 10-haneli VKN üye kaydı (201, `account_status = 'ACTIVE'`, `role = 'MEMBER'`, bcrypt şifre hash doğrulaması) -> **PASS**
   - Test 4: Mükerrer e-posta engeli (409 `EMAIL_IN_USE`) -> **PASS**
   - Test 5: Mükerrer VKN/TCKN engeli (409 `TAX_NUMBER_IN_USE`) -> **PASS**
   - Test 6: `GET /api/admin/members` üzerinden oluşturulan üyenin okunması -> **PASS**
   - **Sonuç:** 6/6 test PASS.

2. **Rota Sahipliği ve Çalışma Zamanı Express Karşılaştırması (`server/test/route-ownership-contract.mjs`):**
   - 203 exact static / Express method-path tam eşleşme, 0 gölgeleme, 17 korunmuş unmounted modül -> **PASS**.

3. **Statik Rota Sahipliği Kapısı (`server/test/route-ownership-static.mjs`):**
   - 203 rota, 31 sağlayıcı, 17 legacy modül, guard denetimleri -> **PASS**.

4. **Sıfır DDL ve İzole Regresyon Testi (`server/test/isolated-smoke.mjs`):**
   - 28 sürüm, 50 tablo invariyantı korundu -> **PASS**.

5. **Derleme ve Tip Denetimi:**
   - `npm run check` (`tsc -b --noEmit`) -> **PASS**.
   - `npm run build` (`vite build`) -> **PASS**.
