# PAR-02 — Ortak API, Veri ve Rol Davranışı Denetimi ve Eşitlemesi (Common API, Data & Role Reconciliation)

Bu doküman, Event4Network (E4N) Web ve Mobil (React Native / Expo) istemcileri arasındaki ortak API uç noktaları, veri modelleri ve rol bazlı erişim denetimi (RBAC) sözleşmelerinin uzlaştırılmasını belgeler.

---

## 1. Tespit Edilen Uyumsuzluklar ve Çözümler

| Fonksiyonel Alan | Eski / Hatalı Mobil Çağrısı | Doğrulanmış Sunucu Uç Noktası | Yapılan Eşitleme ve Rol Kapsamı |
| :--- | :--- | :--- | :--- |
| **Abonelik & Ödemeler** | `GET /payments/me` (Sunucuda yok) | `GET /api/membership-records` (Bireysel)<br>`GET /api/memberships` (Admin dizini) | Mobil `PaymentScreen` (`payment.tsx`), doğrulanmış `GET /api/membership-records` sözleşmesine bağlandı. `account` (`subscription_plan`, `subscription_end_date`, `account_status`), `payments` işlem geçmişi ve `invoices` resmi faturaları listelenebilir hale getirildi. D07 gecikme uyarısı ve hata/retry eklendi. |
| **Birebir Toplantı ve Görüşmeler** | `GET /activities` | `GET /api/one-to-ones`<br>`POST /api/one-to-ones/request`<br>`PUT /api/one-to-ones/:id/status`<br>`POST /api/one-to-ones` | `mobile/utils/meetings-api.ts` ve `mobile/constants/api.ts` tam sözleşmeye bağlandı. `record_kind` (`REQUEST` vs `ACTIVITY`), talep tekilleştirme (`requestId` idempotency), kabul/ret kararı ve skor defteri tetiklemesi doğrulandı. |
| **Aday ve Ziyaretçi Başvuruları** | `GET /public-visitors` | `GET /api/admin/public-visitors`<br>`PUT /api/admin/public-visitors/:id/status` | `mobile/app/admin/applications.tsx`, kanonik `/admin/public-visitors` rotasına bağlandı. Ziyaretçi durum güncelleme (`CONTACTED`, `REJECTED`) butonları ve RBAC guard (`ADMIN` zorunlu) eklendi. |
| **Ödeme İşlemleri Geçmişi** | Doğrudan string çağrısı | `GET /api/payments/history` | `mobile/app/admin/subscriptions.tsx`, `API_CONFIG.ENDPOINTS.ADMIN.PAYMENTS_HISTORY` ile bağlandı. Admin harici üyeler için 403 engeli doğrulandı. |
| **Destek Biletleri** | Eksik sabitler | `GET/POST /api/tickets`<br>`GET/POST /api/tickets/:id/messages` | `API_CONFIG.ENDPOINTS.TICKETS` modülü altına eklendi. |

---

## 2. API Sabitleri Standartlaştırması (`mobile/constants/api.ts`)

`mobile/constants/api.ts` dosyasına eklenen doğrulanmış uç noktalar:

```typescript
    ONE_TO_ONES: {
      LIST: '/one-to-ones',
      LOG: '/one-to-ones',
      REQUEST: '/one-to-ones/request',
      STATUS: (id: string) => `/one-to-ones/${encodeURIComponent(id)}/status`,
    },
    MEMBERSHIPS: {
      PLANS: '/memberships',
      RECORDS: '/membership-records',
    },
    TICKETS: {
      LIST: '/tickets',
      DETAIL: (id: string) => `/tickets/${encodeURIComponent(id)}`,
      CREATE: '/tickets',
      MESSAGES: (id: string) => `/tickets/${encodeURIComponent(id)}/messages`,
      STATUS: (id: string) => `/tickets/${encodeURIComponent(id)}/status`,
    },
    ADMIN: {
      PUBLIC_VISITORS: '/admin/public-visitors',
      PUBLIC_VISITOR_STATUS: (id: string) => `/admin/public-visitors/${encodeURIComponent(id)}/status`,
      PAYMENTS_HISTORY: '/payments/history',
      MEMBERSHIP_RECORDS: '/admin/membership-records',
      MEMBERSHIP_RECORD_DETAIL: (id: string) => `/admin/membership-records/${encodeURIComponent(id)}`,
    },
```

---

## 3. Ekran Seviyesi İyileştirmeler

### 3.1. `mobile/app/features/payment.tsx`
- **Sözleşme:** `GET /api/membership-records`
- **Görsel Durum:**
  - Mevcut Plan: `12_MONTHS` ("12 Aylık (Yıllık) Üyelik"), `6_MONTHS` ("6 Aylık Üyelik"), `1_MONTH` ("Aylık Üyelik").
  - Hesap Durumu Rozeti: `ACTIVE` (Yeşil), `RESTRICTED` (Turuncu - D07 Uyarısı), `SUSPENDED` (Kırmızı), `PENDING` (Mavi).
  - Abonelik Bitiş Tarihi: Formatlı Türkçe tarih (`toLocaleDateString('tr-TR')`).
  - Geçmiş Ödemeler: Tutar (`₺`), tarih, plan ve durum (`SUCCESS`, `PENDING`, `FAILED`) rozetleri.
  - Resmi Faturalar: İlgili `invoice_files` satırları (dosya adı, tarih, KB boyutu).
  - Hata & Yeniden Deneme: Yükleme başarısız olduğunda açık uyarı ve `Tekrar Dene` retry butonu.

### 3.2. `mobile/app/admin/applications.tsx`
- Kanonik `GET /api/admin/public-visitors` rotasına geçildi.
- Detay modalına Ziyaretçi aksiyonları eklendi:
  - `İletişime Geçildi Olarak İşaretle` (`PUT /api/admin/public-visitors/:id/status` with `CONTACTED`)
  - `Başvuruyu Reddet` (`PUT /api/admin/public-visitors/:id/status` with `REJECTED`)
  - `Başvuruyu Onayla` (`PUT /users/:id` with `status: 'ACTIVE'` - Üyeler için).

### 3.3. `mobile/app/admin/subscriptions.tsx`
- `API_CONFIG.ENDPOINTS.ADMIN.PAYMENTS_HISTORY` ile eşlendi.
- `ADMIN` rolü denetimi ve veri tipi güvenliği sağlandı.

---

## 4. Doğrulama ve Test Kanıtları

- **Sözleşme Koşucusu:** `server/test/par-02-api-data-and-role-contract.mjs`
- **Ortam:** İzole PostgreSQL 17 Docker konteyneri, sıfır DDL (28 migration, 50 tablo invariyantı), Express API sunucusu.
- **Test Senaryoları (5/5 PASS):**
  1. `GET /api/membership-records`: Anon 401, Member1 200 (envelope, account, payments, invoices, totals), Restricted 200 (RESTRICTED D07), Non-admin 403.
  2. `GET /api/memberships`: Anon 401, Member 403 (Admin-only RBAC), Admin 200 (user memberships directory).
  3. `One-to-Ones`: Member1 request (201), Idempotent replay (200), Member2 accept (200), Member1 activity log (201/200), Score ledger recalculation.
  4. `Public Visitors`: Anon 401, Member 403, Admin 200 list, Admin update status to CONTACTED (200), DB update teyidi.
  5. `Payments History`: Anon 401, Member 403, Admin 200 list with joined `member` object and float amount.
- **Tip & Derleme Denetimi:**
  - `mobile`: `npx tsc --noEmit` -> 0 hata.
  - `web`: `npm run check` -> 203 rota, 31 sağlayıcı, 0 TS hatası.
  - `web`: `npm run build` -> 2814 modül temiz derleme.
