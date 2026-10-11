# SEC-01 — Supabase Public Tabloları için RLS ve Erişim Güvenlik Planı (E4N-58)

**Tarih:** 11 Ekim 2026  
**Görev:** [E4N-58 (SEC-01 / Supabase public tabloları için RLS ve erişim planını hazırla)](https://linear.app/e4n/issue/E4N-58) -> **DONE**  
**Milestone:** Sprint 6 — Operasyon ve sürüm  
**Kapsam ve Hedef:**  
PostgreSQL `public` şemasındaki 50 uygulama tablosunun Satır Düzeyi Güvenlik (RLS) durumunun, `anon` ve `authenticated` rollerinin doğrudan PostgREST (Data API) yetkilerinin ve API-Owner mimarisinin denetlenmesi; veri hassasiyeti sınıflandırması ve erişim matrisinin çıkarılması; Supabase linter bulgularının (`0013_rls_disabled_in_public`, `0011_function_search_path_mutable`) çözümlenmesi; izole test ortamında 50 tablonun güvenlik bariyerlerinin otomatik sözleşme testiyle kanıtlanması ve üretim SQL planının hazırlanması.

---

## 1. Mimari Karar: API-Owner ve PostgREST İzolasyonu

1. **Express API (Node.js backend):**
   - Veritabanına `DATABASE_URL` üzerinden süper kullanıcı (`postgres`) yetkisiyle bağlanır.
   - Tüm iş kuralları, yetkilendirmeler (ADMIN, PRESIDENT, MEMBER), veri doğrulama ve transaction bütünlüğü Express katmanında çözülür.
   - Bu nedenle Express API, PostgreSQL'in RLS kısıtlarına takılmadan tüm tablolara tam yetkiyle erişir.
2. **PostgREST / Supabase Data API (İstemci Doğrudan Bağlantısı):**
   - Tarayıcı veya istemciye verilen `VITE_SUPABASE_ANON_KEY` ve JWT belirteçleri PostgreSQL seviyesinde `anon` ve `authenticated` rollerini kullanır.
   - Bu rollerin 48 hassas tabloya doğrudan SQL/REST erişimi `REVOKE ALL` ile tamamen kaldırılmıştır.
   - Açık CMS tabloları (`blogs`, `blog_categories`) için ise RLS politikaları ile yalnızca `status = 'published'` olan kayıtların okunmasına izin verilmiştir; tüm mutasyonlar (yazma/güncelleme/silme) doğrudan istemciye kapatılmıştır.

---

## 2. 50 Tabloluk Hassasiyet ve Erişim Matrisi Özeti

Tam teknik döküm `server/docs/sec-rls-access-matrix.md` ve `server/docs/sec-01-rls-access-report.json` dosyalarında saklanmaktadır.

- **Kategori 1: Kritik Kimlik, Parola ve PII (4 Tablo):**
  - Tablolar: `users`, `company_tax_registry`, `normal_membership_role_transition`, `email_configurations`
  - RLS: `ENABLED` (Row Security Active)
  - Anon / Authenticated Rolleri: `REVOKE ALL` (SELECT, INSERT, UPDATE, DELETE engellendi - `42501`)
  - Express API: FULL erişim
- **Kategori 2: Finansal ve İşlemsel Veriler (2 Tablo):**
  - Tablolar: `payment_transactions`, `invoice_files`
  - RLS: `ENABLED`
  - Anon / Authenticated Rolleri: `REVOKE ALL` (`42501`)
  - Express API: FULL erişim
- **Kategori 3: Hassas İş Akışı ve Denetim Kayıtları (10 Tablo):**
  - Tablolar: `group_applications`, `group_application_mail`, `group_membership_history`, `shuffle_execution_history`, `user_score_history`, `web_job_runs`, `support_mutations`, `direct_messages`, `tickets`, `ticket_messages`
  - RLS: `ENABLED`
  - Anon / Authenticated Rolleri: `REVOKE ALL` (`42501`)
  - Express API: FULL erişim
- **Kategori 4: Çekirdek Operasyonel İlişkiler (22 Tablo):**
  - Tablolar: `groups`, `group_members`, `power_teams`, `power_team_members`, `events`, `attendance`, `event_tickets`, `event_attendance_verifications`, `event_reminders_sent`, `referrals`, `one_to_ones`, `one_to_one_requests`, `visitors`, `public_visitors`, `friend_requests`, `subscription_reminder_deliveries`, `champions`, `notifications`, `system_settings`, `professions`, `document_library`, `document_files`
  - RLS: `ENABLED`
  - Anon / Authenticated Rolleri: `REVOKE ALL` (`42501`)
  - Express API: FULL erişim
- **Kategori 5: Ertelenen LMS Modülleri (10 Tablo - Sprint 8 LMS):**
  - Tablolar: `education`, `courses`, `lessons`, `materials`, `exams`, `questions`, `exam_attempts`, `enrollments`, `achievements`, `user_achievements`
  - RLS: `ENABLED`
  - Anon / Authenticated Rolleri: `REVOKE ALL` (`42501`)
  - Express API: FULL erişim
- **Kategori 6: Açık İçerik / CMS (2 Tablo):**
  - Tablolar: `blogs`, `blog_categories`
  - RLS: `ENABLED` (Politika korumalı)
  - Anon / Authenticated Rolleri: `SELECT` açık (`blogs` için yalnızca `status = 'published'`, `blog_categories` için tüm kategoriler). `INSERT`, `UPDATE`, `DELETE` kesinlikle yasak (`42501`).
  - Express API: FULL erişim

---

## 3. Otomatik Sözleşme Testi Kanıtı

- **Test Dosyası:** `server/test/sec-rls-access-contract.mjs`
- **Çalıştırma:** `node server/test/sec-rls-access-contract.mjs`
- **Ortam:** İzole PostgreSQL 17 Docker konteyneri (28 sürüm migration, 50 tablo)
- **Sonuç:** **PASS (0 Hata)**
- **Doğrulanan Bulgular:**
  1. 28 migration sırayla çalıştırıldı; 50 tablo eksiksiz doğrulandı.
  2. `server/supabase_security_plan.sql` uygulandı.
  3. 50/50 tabloda `relrowsecurity = true` (RLS aktifliği) doğrulandı.
  4. 48 hassas tabloda `anon` ve `authenticated` rolleri için `SELECT`, `INSERT`, `UPDATE`, `DELETE` yetkilerinin `false` olduğu teyit edildi.
  5. `SET LOCAL ROLE anon` ve `SET LOCAL ROLE authenticated` işlemlerinde `users`, `payment_transactions`, `invoice_files`, `group_applications`, `email_configurations` tablolarına yapılan tüm sorguların `42501 permission denied` ile engellendiği kanıtlandı.
  6. `blogs` tablosunda `anon` rolünün yalnızca `status = 'published'` olan blogları okuyabildiği, taslakları (`draft`) göremediği, blog ekleme, güncelleme ve silme işlemlerinin `42501` ile reddedildiği kanıtlandı.
  7. Express API DB owner bağlantısının tüm tablolarda tam yetkiyle çalışmayı sürdürdüğü doğrulandı.
  8. `server/docs/sec-01-rls-access-report.json` rapor dosyası üretildi.

---

## 4. Supabase Linter İyileştirmeleri

- **`0013_rls_disabled_in_public`:**
  - Canlı DB denetiminde `blogs` ve `blog_categories` tablolarında RLS kapalı olduğu için linter ERROR veriyordu.
  - Güvenlik planında bu iki tabloya RLS etkinleştirilerek published-only okuma politikaları tanımlandı; linter hatası çözümlendi.
- **`0011_function_search_path_mutable`:**
  - Tetikleyici ve güvenlik fonksiyonlarında (`fn_check_group_profession_unique`, `e4n_preserve_membership_history`, `e4n_preserve_shuffle_execution`, `e4n_preserve_attendance_verifications`) `SET search_path = public, pg_temp;` direktifi eklenerek güvenli hale getirildi.

---

## 5. Üretim SQL Güvenlik Planı

- Üretime uygulanmaya hazır deklaratif güvenlik scripti `server/supabase_security_plan.sql` olarak depoya eklendi.
- Yetkilendirildiğinde canlı Supabase projesinde (`kaoagsuxccwgrdydxros`) tek bir transaction ile çalıştırılabilir.
- Geri dönüş senaryosu: `blogs` ve `blog_categories` üzerindeki politikalar kaldırılıp RLS eski duruma getirilebilir; Express API sahibi üzerinde hiçbir operasyonel kesinti oluşmaz.
