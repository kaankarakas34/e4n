# E4N Veritabanı RLS ve Erişim Güvenlik Matrisi (SEC-01 / E4N-58)

## 1. Mimari Model: API-Owner ve PostgREST İzolasyonu

E4N platformu hibrit bir veri erişim mimarisinde geliştirilmeye başlanmış, ardından **API-Owner** modeline stabilize edilmiştir:

```
[Web & Mobil İstemciler]
       │
       ▼ (1) Yalnızca Yetkili Rotalar (JWT, Rol ve Durum Denetimli)
 [Express API (/api/*)]
       │
       ▼ (2) Database Owner Bağlantı Havuzu (postgres superuser)
[PostgreSQL 17 / Supabase] (50 Uygulama Tablosu - RLS ENABLED)
       ▲
       │ (3) Doğrudan PostgREST / Data API Erişim Girişimi
 [Kötü Niyetli / Anon İstemci] (VITE_SUPABASE_ANON_KEY ile)
       └───► ⛔ TAM BLOKE (REVOKE ALL + 42501 Permission Denied)
```

1. **Express API (Node.js backend):**
   - Veritabanına `DATABASE_URL` üzerinden süper kullanıcı (`postgres`) yetkisiyle bağlanır.
   - Tüm iş kuralları, yetkilendirmeler (ADMIN, PRESIDENT, MEMBER), veri doğrulama ve transaction bütünlüğü Express katmanında çözülür.
   - Bu nedenle Express API, PostgreSQL'in RLS kısıtlarına takılmadan tüm tablolara tam yetkiyle erişir.
2. **PostgREST / Supabase Data API (İstemci Doğrudan Bağlantısı):**
   - Tarayıcı veya istemciye verilen `VITE_SUPABASE_ANON_KEY` ve JWT belirteçleri PostgreSQL seviyesinde `anon` ve `authenticated` rollerini kullanır.
   - Bu rollerin 48 hassas tabloya erişimi `REVOKE ALL` ile tamamen kaldırılmıştır.
   - Açık CMS tabloları (`blogs`, `blog_categories`) için ise RLS politikaları ile yalnızca `status = 'published'` olan kayıtların okunmasına izin verilmiştir.

---

## 2. 50 Tabloluk Veri Hassasiyeti ve Erişim Matrisi

| # | Tablo Adı | Hassasiyet Kategorisi | RLS Durumu | PostgREST Anon Yetkisi | PostgREST Authenticated Yetkisi | Express API (Owner) | Açıklama ve Güvenlik Riski |
|---|---|---|---|---|---|---|---|
| 1 | `users` | CRITICAL_CREDENTIALS_AND_PII | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Parola hashleri, VKN/TCKN, fatura adresleri, roller |
| 2 | `company_tax_registry` | CRITICAL_CREDENTIALS_AND_PII | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Türkiye VKN ve şahıs TCKN tekillik kütüğü |
| 3 | `normal_membership_role_transition` | CRITICAL_CREDENTIALS_AND_PII | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Rol geçişleri ve dönüşüm denetim izi |
| 4 | `email_configurations` | CRITICAL_CREDENTIALS_AND_PII | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | SMTP sunucu, kullanıcı adı ve parola bilgileri |
| 5 | `payment_transactions` | FINANCIAL_AND_TRANSACTIONAL | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Sipay ödeme kayıtları, provizyon kodları, tutarlar |
| 6 | `invoice_files` | FINANCIAL_AND_TRANSACTIONAL | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Fatura PDF ikili içerikleri (bytea), SHA-256 fingerprint |
| 7 | `group_applications` | SENSITIVE_WORKFLOW_AND_AUDIT | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Kapalı grup aday başvuruları ve başkan değerlendirmeleri |
| 8 | `group_application_mail` | SENSITIVE_WORKFLOW_AND_AUDIT | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Başvuru e-posta gönderim kuyruğu ve retry verileri |
| 9 | `group_membership_history` | SENSITIVE_WORKFLOW_AND_AUDIT | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Değiştirilemez üyelik/çıkarılma ve ceza kayıtları |
| 10 | `shuffle_execution_history` | SENSITIVE_WORKFLOW_AND_AUDIT | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | 4 aylık dönem rotasyon snapshot ve makbuzları |
| 11 | `user_score_history` | SENSITIVE_WORKFLOW_AND_AUDIT | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Aylık puan olay defteri (P21) |
| 12 | `web_job_runs` | SENSITIVE_WORKFLOW_AND_AUDIT | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Üretim scheduler iş yürütüm kayıtları ve alarmlar |
| 13 | `support_mutations` | SENSITIVE_WORKFLOW_AND_AUDIT | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Destek talebi durum değişiklikleri |
| 14 | `direct_messages` | SENSITIVE_WORKFLOW_AND_AUDIT | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Üyeler arası doğrudan mesajlaşma |
| 15 | `tickets` | SENSITIVE_WORKFLOW_AND_AUDIT | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Destek biletleri |
| 16 | `ticket_messages` | SENSITIVE_WORKFLOW_AND_AUDIT | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Destek bilet mesajlaşma geçmişi |
| 17 | `groups` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Kapalı grup temel bilgileri, toplantı gün/saati |
| 18 | `group_members` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Kapalı grup üyelikleri ve durumları |
| 19 | `power_teams` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Lonca (açık takım) tanımları |
| 20 | `power_team_members` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Lonca üyelikleri |
| 21 | `events` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Etkinlikler, toplantılar ve seminerler |
| 22 | `attendance` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Etkinlik yoklama kayıtları |
| 23 | `event_tickets` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Tekil bilet kayıtları ve misafir biletleri |
| 24 | `event_attendance_verifications` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Yoklama doğrulama ve değiştirilemez denetim |
| 25 | `event_reminders_sent` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Etkinlik hatırlatma gönderim bayrakları |
| 26 | `referrals` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | İç/dış referanslar ve ciro bildirimleri |
| 27 | `one_to_ones` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Birebir görüşme kayıtları |
| 28 | `one_to_one_requests` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Birebir görüşme davetleri ve talepleri |
| 29 | `visitors` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Toplantı ziyaretçi kayıtları |
| 30 | `public_visitors` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Açık etkinlik ve site ziyaretçi başvuruları |
| 31 | `friend_requests` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Üye bağlantı talepleri |
| 32 | `subscription_reminder_deliveries` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Aidat gecikme bildirim geçmişi |
| 33 | `champions` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Aylık şampiyonlar tablosu |
| 34 | `notifications` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Kullanıcı sistem içi bildirimleri |
| 35 | `system_settings` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Sistem ayarları, referans ve dondurma kayıtları |
| 36 | `professions` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Standart meslek kataloğu |
| 37 | `document_library` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Belge kütüphanesi üst verileri |
| 38 | `document_files` | CORE_OPERATIONAL_RELATIONS | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Belge ikili dosyaları |
| 39 | `education` | LMS_MODULE_POSTPONED | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Eğitim kategorileri (Sprint 8 kapsamı) |
| 40 | `courses` | LMS_MODULE_POSTPONED | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Kurslar (Sprint 8 kapsamı) |
| 41 | `lessons` | LMS_MODULE_POSTPONED | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Dersler (Sprint 8 kapsamı) |
| 42 | `materials` | LMS_MODULE_POSTPONED | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Kurs materyalleri (Sprint 8 kapsamı) |
| 43 | `exams` | LMS_MODULE_POSTPONED | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Sınavlar (Sprint 8 kapsamı) |
| 44 | `questions` | LMS_MODULE_POSTPONED | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Sınav soruları (Sprint 8 kapsamı) |
| 45 | `exam_attempts` | LMS_MODULE_POSTPONED | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Sınav denemeleri (Sprint 8 kapsamı) |
| 46 | `enrollments` | LMS_MODULE_POSTPONED | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Kurs kayıtları (Sprint 8 kapsamı) |
| 47 | `achievements` | LMS_MODULE_POSTPONED | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Başarı tanımları (Sprint 8 kapsamı) |
| 48 | `user_achievements` | LMS_MODULE_POSTPONED | ENABLED | DENIED (42501) | DENIED (42501) | FULL (Bypass) | Üye başarı eşleşmeleri (Sprint 8 kapsamı) |
| 49 | `blogs` | PUBLIC_CMS_CONTENT | ENABLED | SELECT (published only) | SELECT (published only) | FULL (Bypass) | Blog içerikleri (Yazma/güncelleme/silme yasak) |
| 50 | `blog_categories` | PUBLIC_CMS_CONTENT | ENABLED | SELECT (all) | SELECT (all) | FULL (Bypass) | Blog kategorileri (Yazma/güncelleme/silme yasak) |

---

## 3. Supabase Linter Bulguları ve Çözümleri

1. **`0013_rls_disabled_in_public` (Hata Düzeyi):**
   - *Sorun:* Canlı yayında `blogs` ve `blog_categories` tablolarında RLS kapalı bırakılmıştı.
   - *Çözüm:* Her iki tabloda da `ALTER TABLE ENABLE ROW LEVEL SECURITY;` uygulandı. PostgREST üzerinden yalnızca `SELECT` politikası (`status = 'published'`) tanımlandı. Tüm mutasyonlar (`INSERT`, `UPDATE`, `DELETE`) `anon` ve `authenticated` için kapatıldı.
2. **`0011_function_search_path_mutable` (Uyarı Düzeyi):**
   - *Sorun:* Tetikleyici fonksiyonlar (`fn_check_group_profession_unique`, `e4n_preserve_*`) varsayılan `search_path` ile derlendiğinde kötü niyetli şema enjeksiyonuna açık olabilir.
   - *Çözüm:* `ALTER FUNCTION ... SET search_path = public, pg_temp;` direktifi eklenerek fonksiyonların arama yolu güvenli hale getirildi.

---

## 4. Doğrulama Sözleşmesi

- **Test Dosyası:** `server/test/sec-rls-access-contract.mjs`
- **Hedef:** İzole PostgreSQL 17 Docker ortamında 28 migration + tam RLS güvenlik planı.
- **Doğrulananlar:**
  - 50/50 tabloda RLS etkin (`relrowsecurity = true`).
  - 48 tabloda `anon` ve `authenticated` rolleri için tüm yetkiler sıfır (`42501 permission denied`).
  - `blogs` tablosunda `anon` yalnızca yayınlanmış blogları okuyabilir; taslakları okuyamaz ve yazı ekleyemez/değiştiremez/silemez.
  - Express API bağlantısı 50 tablonun tamamında tam okuma/yazma erişimini korur.
