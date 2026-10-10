# P26 — Etkinlik Katılım, Çoklu Bilet ve Ödeme Bütünlüğü Doğrulaması

**10 Ekim 2026.** E4N-98 teslim doğrulaması. Çoklu bilet alımı, harici (misafir) katılımcı biletleme ve ödeme transaction bütünlüğü tamamlandı.

## 1. Kapsam ve Kurallar

- **Çoklu Bilet Satın Alma (Üye):**
  - Aktif üyeler etkinlik kaydı sırasında kendileri ve misafirleri için çoklu bilet (`quantity: 1..20`) satın alabilir.
  - Mevcut bir `PENDING` bilet varsa, ödeme kesinleştiğinde (`settled`) bu bilet `PAID` yapılır ve talep edilen ek bilet sayısı kadar (`quantity - settledCount`) her biri tekil `E4N-...` bilet numarası ile yeni `PAID` bilet satırı `event_tickets` tablosuna atomik olarak yazılır.
  - `attendance` kaydı tekilleştirilerek (`ON CONFLICT (event_id, user_id) DO NOTHING`) `PRESENT` statüsünde korunur.
- **Harici Misafir Katılımcı Biletlemesi (`visitor_registration`):**
  - Giriş yapmamış harici katılımcılar, halka açık etkinlikler (`is_public = true`) için isim, e-posta ve telefon bilgileriyle çoklu bilet satın alabilir.
  - Biletler `event_tickets` tablosuna `user_id = NULL`, `payment_status = 'PAID'` ve `E4N-GUEST-...` tekil bilet numarasıyla işlenir.
  - Ziyaretçi bilgisi `public_visitors` tablosuna kaydedilir; `form_data` alanına `ticket_numbers` dizisi ve `quantity` adedi bağlanır.
- **Kontenjan Tavanı ve Koruma (`CAPACITY_EXCEEDED` 409):**
  - Çoklu bilet talebi (`quantity`) mevcut katılımcı sayısına eklendiğinde etkinliğin `max_attendees` sınırını aşıyorsa işlem ödeme başlatma aşamasında `409 CAPACITY_EXCEEDED` hatasıyla reddedilir.
- **Kapalı Grup Etkinliği Koruması (`CLOSED_GROUP_EVENT` 403):**
  - Kapalı bir gruba ait ve halka açık olmayan etkinliklere (`is_public != true` ve `group_id IS NOT NULL`) harici misafir biletleme denendiğinde işlem `403 CLOSED_GROUP_EVENT` ile engellenir.
- **Transaction Atomikliği ve Rollback Güvencesi:**
  - Bilet üretimi veya eylem yürütme sırasında herhangi bir veritabanı hatası oluştuğunda tüm işlem atomik olarak geri alınır (`ROLLBACK`), yetim bilet veya tutarsız yoklama kaydı oluşmaz. Ödeme kaydı `PENDING` statüsünde kalarak geçici hata giderildiğinde güvenle yeniden denenebilir (`retry`).
- **Tekrar Güvenliği (Idempotency):**
  - Aynı faturanın callback veya durum sorgusunda mükerrer işlenmesi durumunda sıfır yeni bilet üretilir, mevcut `PAID` durumu korunur.

## 2. Mimari ve Değişiklikler

- **Ödeme Eylem Motoru:** `server/src/payment-processing.js`
  - `applyAction`: `action_type === 'event_registration'` için `quantity` adedince `event_tickets` üretimi ve PENDING promosyonu.
  - `applyAction`: `action_type === 'visitor_registration'` için `event_id` mevcutsa `quantity` adedince `user_id = NULL` ile `E4N-GUEST-...` bilet satırları üretimi ve `public_visitors.form_data.ticket_numbers` bağlantısı.
- **API Katmanı:** `server/src/index.js`
  - `POST /api/payment/pay`: `event_registration` ve `visitor_registration` isteklerinde `quantity` doğrulama (1-20), `CAPACITY_EXCEEDED` (409) ve `CLOSED_GROUP_EVENT` (403) kontrolleri.
  - `GET /api/events/:id`: Kullanıcının sahip olduğu tüm biletleri içeren `my_tickets` dizisi, toplam `my_tickets_count` ve çoklu bilet aggregation (`ticket_payment_status`).
- **Web Katmanı:** `src/pages/EventDetail.tsx`
  - Bilet adedi seçici (+/- butonları, 1-10 adet).
  - Üye indirimine göre toplam tutar hesaplama (`totalPayable = 1. bilet indirimli + ek biletler standart fiyat`).
  - Harici misafir formu (Ad Soyad, E-posta, Telefon) ve "Misafir Olarak Bilet Al" akışı.
  - Kullanıcının onaylanmış biletlerini listeleyen "Biletleriniz" kartı ve bilet numaraları.
  - `PaymentModal` ile `action.data.quantity` ve `totalPayable` tam entegrasyonu.

## 3. Doğrulama Kanıtları

1. **`server/test/event-multi-ticket-and-payment-integrity-contract.mjs` (İzole PG17 Docker):**
   - **Test 1 (Üye Çoklu Bilet - Quantity = 3):** 3 adet `PAID` statüsünde `E4N-...` bileti, tekil numaralar, `PRESENT` yoklama, `GET /api/events/:id`'de `my_tickets_count = 3` ve bilet listesi doğrulandı: **PASS**.
   - **Test 2 (Mevcut PENDING Bilet Promosyonu + Çoklu Tamamlama):** 1 PENDING bilet `PAID` yapıldı, 2 yeni `PAID` bilet eklendi, toplam 3 `PAID` bilet sağlandı: **PASS**.
   - **Test 3 (Harici Misafir Biletleme - Quantity = 2):** 2 adet `user_id = NULL` ve `E4N-GUEST-...` bileti üretildi, `public_visitors.form_data` içine 2 bilet numarası işlendi: **PASS**.
   - **Test 4 (Kontenjan Tavanı Aşımı):** 3 kişilik kontenjanda 2 kişi varken 2 bilet isteği `409 CAPACITY_EXCEEDED` ile engellendi: **PASS**.
   - **Test 5 (Kapalı Grup Etkinliği Misafir Koruması):** Kapalı grup etkinliğine misafir bilet alımı `403 CLOSED_GROUP_EVENT` ile engellendi: **PASS**.
   - **Test 6 (Transaction Atomikliği & Rollback):** Bilet yazımında DB hatası oluştuğunda işlem atomik geri alındı, yetim bilet oluşmadı, hata sonrası retry ile 2 bilet başarıyla üretildi: **PASS**.
   - **Test 7 (Idempotent Replay):** Mükerrer ödeme sorgusunda sıfır yeni bilet üretildi, bilet sayısı 2 olarak korundu: **PASS**.
2. **`server/test/payment-flow.mjs`:**
   - Ödeme callback, bilet settle ve receipt regresyonları: **PASS**.
   - Tek biletli legacy akışlar bozulmadan korundu.
3. **`server/test/event-ticket-entitlement-contract.mjs`:**
   - R02, R12, D07 bilet hak motoru: **PASS**.
4. **`server/test/event-registration-contract.mjs`:**
   - Yoklama, toplantı akışı ve bilet bütünlüğü: **PASS**.
5. **`node server/test/isolated-smoke.mjs`:**
   - 28 şema sürümü, 50 tablo korundu (Sıfır DDL): **PASS**.
6. **`npm run check` ve `npm run build`:**
   - TypeScript ve Vite derlemesi hatasız: **PASS**.
