# PAR-04 — Başkan ve Admin İşlevlerini Web ve Mobilde Eşitleme (President & Admin Workflows Parity)

Bu doküman, Event4Network (E4N) Web ve Mobil istemcileri arasındaki başkanlık rolü, 7 gün SLA aşımı takip kuyruğu, görüşme ve kabul/ret kararları ile haftalık toplantı yoklaması akışlarının uzlaştırılmasını belgeler.

---

## 1. Yürütülen Eşitlemeler ve Kapsam

### 1.1. Başkanlık Rolü ve Mobil Navigasyon Ayrımı
- **Matris Tespiti:** PAR-01 matrisinde tespit edilen, mobilde başkanların (`PRESIDENT` / `VICE_PRESIDENT`) sıradan üye ile aynı sekmelerde kalarak başkanlık yetkilerine doğrudan erişememesi boşluğu giderildi.
- **Yetki Kontrolü:** `user?.role === 'PRESIDENT' || user?.group_role === 'PRESIDENT' || user?.group_title === 'PRESIDENT' || user?.role === 'ADMIN'`.
- **Erişim Noktaları:**
  - **Menü Ekranı (`mobile/app/(tabs)/menu.tsx`):** Başkan rolündeki kullanıcılar için en üstte dikkat çeken "Grup Yönetimi (Başkanlık) - SLA Başvuru Kuyruğu & Toplantı Yoklaması" kartı render edildi.
  - **Ana Ekran (`mobile/app/(tabs)/index.tsx`):** Hoşgeldiniz kartının altında doğrudan `/features/president` rotasına yönlendiren hızlı erişim banner'ı eklendi.
  - **Admin Konsolu (`mobile/app/admin/index.tsx`):** Sistem yöneticilerinin de başkanlık akışlarını test ve kontrol edebilmesi için "Başkanlık Konsolu" kartı bağlandı.

### 1.2. Başkanlık Yönetim Ekranı (`mobile/app/features/president.tsx`)
- **Yönetilen Grup Seçimi:** Başkanın aktif üyesi olduğu grup (`GET /api/user/groups`) otomatik algılanır; yöneticiler için tüm gruplar listelenir ve çip butonlarıyla geçiş yapılabilir.
- **Segmented Sekmeler:**
  1. `Başvuru Kuyruğu` (`APPLICATIONS`)
  2. `Toplantı Yoklaması` (`ATTENDANCE`)

### 1.3. Başvuru İnceleme Kuyruğu & 7 Gün SLA Aşımı Takibi (BAŞ-05 & P31)
- **Sözleşmeler:**
  - `GET /api/group-applications/tasks`: Bekleyen görevler listesi (`AWAITING_CALL`, `INTERVIEWED`).
  - `GET /api/groups/:id/applications`: Grubun tüm başvuru detayları.
- **7 Günlük Görüşme SLA Uyarısı:**
  - Başvurunun bekleme süresi 7 günü aştığında (`sla_breached: true` veya `days_waiting >= 7`):
  - `"⚠️ 7 Günlük Görüşme SLA Süresi Aşıldı (${days_waiting} gün)"` uyarı rozeti render edilir.
- **Önceki Çıkarılma Geçmişi (`removal_history`):**
  - Başvuran üyenin geçmişte bir gruptan çıkarılma kaydı varsa nedeni ve grup adı gösterilir.
- **Görüşme Notu Kaydetme:**
  - `AWAITING_CALL` durumundaki başvurular için "Görüşme Sonucu Kaydet" butonu ve modalı.
  - `POST /api/group-applications/:id/interview` -> `{ note: string }` ile durum atomik olarak `INTERVIEWED` yapılır.
- **Kabul ve Ret Kararı:**
  - `INTERVIEWED` durumundaki başvurular için "Kabul Et" ve "Reddet" aksiyonları.
  - Gerekçe girişi zorunlu tutularak `POST /api/group-applications/:id/decision` -> `{ decision: 'ACCEPTED' | 'REJECTED', note: string }` ile başvuru sonuçlandırılır; kabul edilen üyenin `group_members.status` değeri atomik `ACTIVE` yapılır.

### 1.4. Haftalık Toplantı Yoklaması (PAR-16 & P31)
- **Aktif Üye Kadrosu:** `GET /api/groups/:id/members` rotasından `status = 'ACTIVE'` olan üyeler listelenir.
- **Katılım Seçenekleri:**
  - `PRESENT` (Katıldı - Yeşil)
  - `ABSENT` (Katılmadı - Kırmızı)
  - `LATE` (Geç Kaldı - Sarı)
  - `SUBSTITUTE` (Vekil Gönderdi - Mavi)
- **Toplu Kayıt ve Tekrar Güvenliği (Idempotency):**
  - İstemcide tekil `requestId = uuid.v4()` üretilir.
  - `meeting_date` (ISO), `topic` (Toplantı konusu), `reason` (Yoklama gerekçesi) ve tüm aktif üyelerin katılım durumları derlenir.
  - `POST /api/events/attendance` sözleşmesine gönderilir.
  - Sunucu hash parmak izi (`fingerprint`) ile doğrular; mükerrer gönderimde güvenle `replayed: true` döner.

---

## 2. Doğrulama ve Test Kanıtları

- **Sözleşme Koşucusu:** `server/test/par-04-president-and-admin-contract.mjs`
- **İzole Ortam:** PostgreSQL 17 Docker konteyneri, 28 sürüm, 50 tablo invariyantı (Sıfır DDL).
- **Test Senaryoları (5/5 PASS):**
  1. `RBAC & Authorization Boundaries`: Sıradan üyenin başkan görev kuyruğu boş döner; grup başvuru detaylarına ve yoklama kaydına yetkisiz erişim 403 `FORBIDDEN` ile engellenir.
  2. `President Application Queue & 7-day SLA Breach`: 8 gün önce yapılan başvuru için `sla_breached: true` ve `days_waiting >= 7` durumu doğrulanır.
  3. `President Interview Flow`: `POST /api/group-applications/:id/interview` ile görüşme notu kaydedilir; başvuru durumu `INTERVIEWED` olur.
  4. `President Decision Flow`: `POST /api/group-applications/:id/decision` ile kabul kararı verilir; adayın `group_members` durumu `ACTIVE` yapılır.
  5. `Weekly Meeting Attendance Flow`: `POST /api/events/attendance` ile 3 aktif üye için toplantı ve katılım kayıtları atomik kaydedilir; aynı isteğin tekrarında `replayed: true` idempotent akışı kanıtlanır.
