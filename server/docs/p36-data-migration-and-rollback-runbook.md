# P36 — Veri Geçişi ve Geri Dönüş Operasyon Rehberi (Rollback & DR Runbook)

Bu doküman, Event4Network (E4N) sisteminin PostgreSQL 17 / Supabase veri geçiş süreçleri, şema güncellemeleri, kalıcı ikili (bytea) dosya bütünlüğü ve acil durum geri dönüş (disaster recovery / rollback) prosedürlerini tanımlar.

---

## 1. Veri Geçiş Mimarisi ve Kapsam

- **Veritabanı Motoru:** PostgreSQL 17 (Supabase uyumlu).
- **Şema Sürümleme:** 28 numaralı ardışık sürüm (`0001_initial_schema.sql` ... `0028_remove_group_invitations.sql`).
- **Tablo Envanteri:**
  - 50 Uygulama Tablosu (`schemaname = 'public' AND tablename <> 'schema_migrations'`).
  - 1 Sürüm Takip Tablosu (`schema_migrations`).
  - Toplam: **51 Tablo**.
- **Kalıcı İkili Veri (Bytea) Mimarisi:**
  - `invoice_files`: Fatura PDF ikili içerikleri veritabanında `bytea` olarak tutulur. 64 karakterlik SHA-256 hex parmak izi (`fingerprint`), boyut (`size_bytes`), yükleyen (`uploaded_by`) ve üye bağıntısı (`member_id`) ile atomik korunur.
  - `document_files`: Belge kütüphanesi PDF ve ek dosyaları `bytea` olarak saklanır.
- **Güvenlik ve Erişim Katmanı (SEC-01 / SEC-03 Uyumu):**
  - Satır Düzeyi Güvenlik (RLS): 50 tablonun tamamında RLS aktiftir.
  - PostgREST / Supabase Bariyeri: 48 hassas tabloda `anon` ve `authenticated` rolleri için `REVOKE ALL` uygulanmıştır; doğrudan PostgREST üzerinden erişim `42501 Insufficient Privilege` ile engellenir.
  - CMS Tabloları (`blogs`, `blog_categories`): PostgREST üzerinden yalnızca `status = 'published'` içeriklerin salt-okunmasına (SELECT) izin verilir; tüm yazma işlemleri kilitlidir.
  - Express API Bağlantısı: Tüm iş mantığı ve mutasyonlar yetkili API havuzu (`postgres` / veritabanı sahibi) üzerinden parametrik ve oturum doğrulamalı işletilir.
- **Denetim Defteri Değişmezliği (Immutability):**
  - `group_membership_history` tablosu `prevent_group_membership_history_mutation` tetikleyicisi ile korunur; `DELETE` ve `UPDATE` işlemleri `23514 (check_violation)` ile mutlak surette engellenir.

---

## 2. Veri Geçiş Provası (Rehearsal Execution & Results)

Sistem veri geçişi ve geri dönüş kabiliyetini doğrulamak için izole Docker PostgreSQL 17 ortamında sentetik prova koşucusu (`server/test/backup-restore-rehearsal.mjs`) çalıştırılmıştır:

```bash
npm --prefix server run test:restore
```

### Prova Sonuçları ve Doğrulanan Güvenceler:

1. **51 Tablo Bütünlüğü ve Row-Level Manifest Eşleşmesi (`restoredEqual: true`):**
   - Kaynak veritabanındaki 51 tablonun tamamında satır sayıları sayılmış ve `ORDER BY to_jsonb(t)::text COLLATE "C"` ile sıralı JSONB SHA-256 özetleri çıkarılmıştır.
   - `pg_dump -Fc` ile alınan yedek, yeni `e4n_restore_target` veritabanına `pg_restore --exit-on-error --single-transaction` ile aktarılmıştır.
   - Geri yüklenen hedef veritabanında 51 tablonun hem satır sayıları hem de row-level SHA-256 manifestleri kaynakla **birebir (%100) eşleşmiştir**.
2. **Şema Kataloğu ve Nesne Eşitliği:**
   - Tablolar, sütunlar, veri tipleri, primary key, foreign key, check kısıtları, indeksler, tetikleyiciler, fonksiyonlar, sequence durumları ve effective ACL/RLS politikaları doğrulanmıştır.
3. **Sıfır Yeniden Uygulama (Zero Repeat: `repeatApplied: 0`):**
   - Geri yüklenen veritabanı üzerinde `applyVersionedSchema` çalıştırıldığında, 28 sürümün tamamının zaten uygulanmış olduğu teyit edilmiş ve 0 yeni migration uygulanmıştır.
4. **Bytea Bozulma Tespiti (`corruptionDetected: true`):**
   - `invoice_files` tablosundaki sentetik PDF dosyasının ikili içeriği yapay olarak değiştirilmiştir (aynı bayt boyutunda farklı veri yazılarak).
   - Yalnızca satır sayısını kontrol eden ilkel denetimlerin bu bozulmayı yakalayamayacağı, ancak sıralı SHA-256 JSONB manifestinin bu bozulmayı **anında ve kesin olarak tespit ettiği** kanıtlanmıştır.
5. **Temiz ve Atomik Geri Dönüş (`cleanRollbackEqual: true`):**
   - Bozulmuş hedef veritabanı, `--clean --if-exists --exit-on-error --single-transaction` bayraklarıyla orijinal yedekten yeniden yüklenmiş ve veritabanı orijinal sağlam manifestine hatasız geri dönmüştür.
6. **İmmutable Denetim Koruması:**
   - Geri yüklenen veritabanında `DELETE FROM group_membership_history` sorgusu denenmiş ve veritabanı tetikleyicisi `23514` hata koduyla işlemi başarıyla reddetmiştir.
7. **Geri Yüklenen Veritabanında API Güvenlik Bariyeri (`downloadAndOwnerBoundaryPassed: true`):**
   - Fatura indirme uç noktası (`GET /api/invoices/:id`):
     - Fatura sahibi üye: HTTP 200 OK ve orijinal PDF ikili içeriği (Cache-Control: `private, no-store`).
     - Anonim istek: HTTP 401 Unauthorized.
     - Yabancı üye: HTTP 404 Not Found (IDOR engeli).
     - Sahte admin tokeni: HTTP 404 Not Found.
     - Güncel yetkili admin: HTTP 200 OK.
     - Rolü düşürülmüş eski admin tokeni: HTTP 404 Not Found.
     - Kullanıcı profil uç noktası (`GET /api/user/profile-settings`): `password_hash` sızıntısı olmaksızın doğru kullanıcı verilerini döndürmüştür.

---

## 3. Geçiş Öncesi Hazırlık ve Kontrol Listesi (Pre-Migration Checklist)

Herhangi bir üretim veya hazırlık ortamı veri geçişi öncesinde aşağıdaki adımlar sırayla tamamlanmalıdır:

- [ ] **1. Bakım Penceresi ve Trafik Dondurma:**
  - Vercel veya sunucu girişinde bakım sayfası (503 Service Unavailable / Maintenance Mode) devreye alınır.
  - Arka plan işleri (cron scheduler) durdurulur (`event-completion`, `subscription-reminders`).
  - Aktif kullanıcı oturumlarının yeni veri yazması (mutasyonlar) dondurulur.
- [ ] **2. Cluster Rolleri Önkoşul Denetimi:**
  - Hedef PostgreSQL kümesinde `anon`, `authenticated` ve `service_role` rollerinin tanımlı olduğu doğrulanır (PostgreSQL dump dosyaları cluster rollerini taşımaz).
- [ ] **3. Atomik Snapshot Alma (Pre-migration Dump):**
  - Veritabanının anlık tam yedeği `pg_dump` özel arşiv biçiminde (`-Fc`) alınır:
    ```bash
    pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
      -Fc --no-owner --no-acl --single-transaction \
      -f "/backups/pre-migration-$(date +%Y%m%d_%H%M%S).dump"
    ```
- [ ] **4. Baseline SHA-256 Manifest Üretimi:**
  - Mevcut 51 tablonun satır sayıları ve canonical JSONB satır özetleri `pre-migration-manifest.json` olarak kaydedilir.
  - Fatura ve belge dosyalarının SHA-256 fingerprint listesi dondurulur.
- [ ] **5. Disk Alanı ve Bellek Teyidi:**
  - Veritabanı ve yedek disk alanının en az %50 boş kapasiteye sahip olduğu doğrulanır.

---

## 4. Geçiş Yürütme Prosedürü (Migration Execution)

1. **Bağlantı Havuzunu Yalıtma:**
   - Yalnızca geçişi yürüten yetkili yönetici bağlantısına izin verilir.
2. **Sürümlü Şema Yürütme:**
   ```bash
   npm --prefix server run migrate
   ```
   - Migration motoru (`run-versioned-schema.js`) sırayla eksik sürümleri `schema_migrations` tablosuna bakar, her sürümü tek transaction içinde uygular ve başarısızlık durumunda otomatik `ROLLBACK` yapar.
3. **Post-Migration Güvenlik Planını Uygulama:**
   - Eğer yeni tablo eklendiyse, `server/supabase_security_plan.sql` çalıştırılarak RLS etkinleştirilir ve `REVOKE ALL FROM anon, authenticated` bariyerleri çekilir.

---

## 5. Geçiş Sonrası Doğrulama Kapıları (Post-Migration Verification Gates)

Aşağıdaki 5 kapının tamamı **PASS** olmadan bakım modu sonlandırılamaz:

| Kapı | Denetlenen Varlık | Başarı Ölçütü |
| :--- | :--- | :--- |
| **Gate 1** | **Şema & Sürüm** | `schema_migrations` güncel sürümü (28) içermeli, tablo sayısı tam 50 uygulama tablosu olmalı. |
| **Gate 2** | **Veri & Manifest** | Önceden var olan verilerin satır sayıları ve JSONB SHA-256 özetleri değişmemiş olmalı (`restoredEqual: true`). |
| **Gate 3** | **Bytea Bütünlüğü** | `invoice_files` ve `document_files` kayıtlarının boyutları ve SHA-256 fingerprint'leri doğrulanmalı. |
| **Gate 4** | **RLS & PostgREST** | 48 hassas tabloda anonim PostgREST isteği `42501` almalı; 2 CMS tablosunda yalnızca `status='published'` okunabilmeli. |
| **Gate 5** | **Uygulama API** | `/api/health-check` HTTP 200 dönmeli, oturum açma, profil okuma ve fatura indirme sözleşmeleri doğrulanmalı. |

---

## 6. Geri Dönüş Tetikleyicileri (Rollback Triggers)

Aşağıdaki durumlardan **herhangi biri** gerçekleştiğinde geçiş derhal durdurulur ve geri dönüş (Rollback) protokolü işletilir:

- 🔴 **RT-1 (Manifest / Veri Uyuşmazlığı):** Önceden var olan herhangi bir tablonun satır sayısı azalırsa veya sıralı JSONB SHA-256 özeti uyuşmazsa (veri kaybı veya drift).
- 🔴 **RT-2 (Bytea / Dosya Bozulması):** Fatura veya doküman ikili verilerinde bayt bozulması, NUL sızıntısı veya fingerprint (`^[0-9a-f]{64}$`) uyuşmazlığı tespit edilirse.
- 🔴 **RT-3 (DDL / Migration Çöküşü):** Herhangi bir migration dosyasının işletimi sırasında sözdizimi, kısıt veya deadlock hatası alınması durumunda.
- 🔴 **RT-4 (Güvenlik / RLS Sızıntısı):** Anonim veya doğrulanmamış istemcilerin hassas tablolara PostgREST üzerinden erişebildiği saptanırsa (`42501` yerine veri dönerse).
- 🔴 **RT-5 (Constraint / İmmutability İhlali):** `group_membership_history` tetikleyicisinin bozulması veya yabancı anahtar (FK) bütünlüğünün zedelenmesi.
- 🔴 **RT-6 (Uygulama Hata Oranı / SLA Aşımı):** Temel API rotalarında HTTP 500 oranının %0'ın üzerine çıkması veya geri dönüş penceresi RTO sınırına (15 dk) yaklaşması.

---

## 7. Geri Dönüş Operasyonu (Rollback Procedure)

Geri dönüş tetiklendiğinde uygulanacak acil durum adımları:

1. **Geri Dönüş Kararı ve Bildirimi:**
   - Teknik operasyon sorumlusu geri dönüşü resmi olarak başlatır.
2. **Atomik Geri Yükleme (Clean Restore):**
   - Geçiş öncesinde alınan snapshot (`pre-migration.dump`) tek bir transaction içinde veritabanına geri yüklenir:
   ```bash
   pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
     --clean --if-exists --exit-on-error --single-transaction \
     "/backups/pre-migration-TIMESTAMP.dump"
   ```
3. **Geri Dönüş Sonrası Doğrulama:**
   - 51 tablonun satır sayıları ve baseline `pre-migration-manifest.json` ile karşılaştırılır.
   - `schema_migrations` sürümünün eski stabil seviyede olduğu teyit edilir.
   - Fatura ikili verilerinin (`invoice_files`) hash doğrulaması yinelenir.
4. **Trafiğin Yeniden Açılması:**
   - Sağlık kontrolleri tamamlandıktan sonra bakım modu kaldırılır.
   - Olay analizi (Post-mortem) için hata logları arşivlenir.

---

## 8. Kurtarma Hedefleri (RTO & RPO)

- **RPO (Recovery Point Objective) = 0 Dakika (Sıfır Veri Kaybı):**
  - Geçiş öncesinde trafik dondurulduğu ve anlık snapshot alındığı için geri dönüş durumunda hiçbir kullanıcı verisi veya finansal işlem kaybolmaz.
- **RTO (Recovery Time Objective) < 15 Dakika:**
  - Tek transaction'lı `--clean` geri yükleme işlemi ortalama veri tabanı boyutlarında 2-3 dakika sürmektedir. Maksimum kabul edilebilir kesinti süresi 15 dakikadır.
