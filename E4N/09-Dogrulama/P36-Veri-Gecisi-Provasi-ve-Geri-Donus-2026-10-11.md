# P36 — Veri Geçişi Provası ve Geri Dönüş Koşulları (E4N-108)

**Tarih:** 11 Ekim 2026  
**Görev:** [E4N-108 (P36 / Veri geçişini prova et ve geri dönüş koşullarını yaz)](https://linear.app/e4n/issue/E4N-108) -> **DONE**  
**Milestone:** Sprint 6 — Operasyon ve sürüm  
**Kapsam ve Kısıtlar:** Sıfır DDL (28 migration, 50 tablo invariyantı); canlı Supabase'e yazma/deploy yok; tüm doğrulamalar izole Docker PostgreSQL 17 test ortamında yürütülmüştür.

---

## 1. Yönetici Özeti ve Prova Sonucu

Sprint 6'nın veri güvenliği ve felaket kurtarma aşaması olan **P36 (E4N-108)** görevi başarıyla tamamlanmıştır. Sistemde mevcut 28 şema sürümü (`schema_migrations`), 50 uygulama tablosu (`tablename <> 'schema_migrations'`), ilişkili kısıtlar, tetikleyiciler, indeksler, RLS politikaları ve PostgreSQL `bytea` formatında saklanan kalıcı PDF fatura/belge dosyaları izole PostgreSQL 17 Docker ortamında uçtan uca yedekleme (`pg_dump -Fc`), geri yükleme (`pg_restore`), bozulma tespiti (corruption detection) ve atomik geri dönüş (clean rollback) sınavından geçirilmiştir.

Tüm test adımları `npm --prefix server run test:restore` (`server/test/backup-restore-rehearsal.mjs`) ile koşulmuş ve tüm kriterlerde **%100 BAŞARI (PASS)** elde edilmiştir:
- `restoredEqual: true` (51 tablo satır sayısı ve row-level SHA-256 JSONB manifest eşitliği)
- `repeatApplied: 0` (Geri yüklenen veritabanında sürümlü migration'ın sıfır tekrar uygulaması)
- `corruptionDetected: true` (Bytea dosya içeriği bozulduğunda manifestin bunu yakalayabilmesi)
- `cleanRollbackEqual: true` (Bozulmuş veritabanının `--clean` ile orijinal haline tam geri dönmesi)
- `downloadAndOwnerBoundaryPassed: true` (Geri yüklenen veritabanından Express API üzerinden yetkili fatura indirme ve profil okuma doğrulaması)

---

## 2. Doğrulanan Prova Kapıları ve Kanıtlar

### Kapı 1: 51 Tablo Satır Sayısı ve Row-Level JSONB SHA-256 Manifest Eşleşmesi
- İzole Docker PG17 ortamında 28 migration çalıştırılarak 50 uygulama tablosu + 1 `schema_migrations` tablosu oluşturulmuş ve sentetik veriler (kullanıcılar, etkinlikler, yoklama, biletler, ödemeler, doğrudan mesajlar, PDF faturalar, belgeler, iş logları, shuffle geçmişi) yerleştirilmiştir.
- `ORDER BY to_jsonb(t)::text COLLATE "C"` algoritması ile her tablonun canonical JSONB SHA-256 parmak izi hesaplanmıştır.
- `pg_dump -Fc` ile alınan yedek, ayrı bir hedef veritabanına aktarılmış ve 51 tablonun tamamında satır sayıları ile SHA-256 manifestleri **birebir (%100) eşleşmiştir** (`restoredEqual: true`).

### Kapı 2: Şema Kataloğu, İndeks, Kısıt ve RLS Eşitliği
- PostgreSQL 17 dump/restore sürecinde kolonlar, veri tipleri, primary key, foreign key, check kısıtları, sequence sayaçları, effective ACL ve RLS politikaları doğrulanmıştır.
- `schema_migrations` tablosundaki 28 sürümün tamamı eksiksiz korunmuş; tekrar migration çalıştırmasında yeni sürüm uygulanmamıştır (`repeatApplied: 0`).

### Kapı 3: Kalıcı Bytea Bozulma Tespiti (Corruption Detection)
- Yalnızca satır sayısını sayan basit denetimlerin sessiz veri bozulmalarını (silent data corruption) yakalayamayacağını kanıtlamak amacıyla, `invoice_files` tablosundaki sentetik fatura içeriği aynı bayt uzunluğunda yapay bir içerikle güncellenmiştir.
- Tablo satır sayısı değişmediği halde, sıralı SHA-256 JSONB manifestinin bu bozulmayı anında yakaladığı ve testi beklenen şekilde kırmızıya düşürdüğü kanıtlanmıştır (`corruptionDetected: true`).

### Kapı 4: Atomik ve Temiz Geri Dönüş (Clean Rollback)
- Bozulmuş hedef veritabanı üzerine orijinal yedek `--clean --if-exists --exit-on-error --single-transaction` bayraklarıyla yeniden restore edilmiş ve veritabanının orijinal sağlam manifestine sıfır sapmayla geri döndüğü doğrulanmıştır (`cleanRollbackEqual: true`).

### Kapı 5: Denetim Defteri Değişmezliği (Immutability Trigger)
- Geri yüklenen veritabanında `DELETE FROM group_membership_history` sorgusu çalıştırılmış ve PostgreSQL tetikleyicisi `23514` (check_violation) hatası vererek denetim defteri silme girişimini engellemiştir.

### Kapı 6: Geri Yüklenen Veritabanında Express API ve İndirme Bariyerleri
- Geri yüklenen veritabanına bağlanan canlı Express sunucusu üzerinde fatura indirme (`GET /api/invoices/:id`) uç noktası test edilmiştir:
  - Fatura sahibi üye: HTTP 200 OK ve orijinal PDF ikili verisi (Cache-Control: `private, no-store`).
  - Anonim istek: HTTP 401 Unauthorized.
  - Yabancı üye: HTTP 404 Not Found (IDOR engeli).
  - Sahte admin tokeni: HTTP 404 Not Found.
  - Güncel yetkili admin: HTTP 200 OK.
  - Rolü düşürülmüş eski admin: HTTP 404 Not Found.
  - Profil sorgusu (`GET /api/user/profile-settings`): `password_hash` dönmeksizin doğru kullanıcı biyografisi ve web sitesi dönmüştür.

---

## 3. Geri Dönüş Tetikleyicileri (Rollback Triggers)

Olası bir üretim veri geçişinde aşağıdaki 6 durumdan herhangi biri tespit edildiğinde geçiş derhal durdurulur ve geri dönüş (rollback) tetiklenir:

1. **RT-1 (Manifest / Satır Sayısı Uyuşmazlığı):** 51 tablodan herhangi birinde satır sayısı azalması veya canonical JSONB SHA-256 hash farkı (veri kaybı veya drift).
2. **RT-2 (Bytea / Dosya Bütünlüğü Bozulması):** `invoice_files` veya `document_files` kayıtlarında binary bozulma, NUL bayt hasarı veya 64 karakterli SHA-256 hex `fingerprint` uyuşmazlığı.
3. **RT-3 (DDL / Sürüm Hatası):** 28 migration'dan herhangi birinde sözdizimi, tip uyuşmazlığı veya deadlock hatası alınması.
4. **RT-4 (Güvenlik / RLS Sızıntısı):** 48 hassas tablodan herhangi birinin doğrudan PostgREST üzerinden `anon` veya `authenticated` rollerine açılması (`42501` yerine veri dönmesi).
5. **RT-5 (Kısıt ve İmmutability İhlali):** `group_membership_history` tetikleyicisinin veya foreign key bütünlüklerinin zedelenmesi.
6. **RT-6 (Uygulama Hata Oranı / SLA Aşımı):** Temel API rotalarında HTTP 500 hataları veya geri dönüş penceresi süresinin RTO tavanına (> 15 dakika) yaklaşması.

---

## 4. Felaket Kurtarma ve Geri Dönüş Runbook'u

Operasyonel adımlar, bakım modu yönetimi, pre-migration snapshot alma prosedürü ve kurtarma hedefleri (`RPO = 0`, `RTO < 15 dk`) ayrıntılı olarak `server/docs/p36-data-migration-and-rollback-runbook.md` dokümanında kayıt altına alınmıştır.

---

## 5. İlgili Dosyalar ve Doğrulama Raporları

- **Test Koşucusu:** `server/test/backup-restore-rehearsal.mjs`
- **Operasyonel Rehber:** `server/docs/p36-data-migration-and-rollback-runbook.md`
- **Prova Raporu:** `output/backup-restore-rehearsal.json`
- **Şema Kataloğu Farkı:** `output/restore-catalog-diff.json`
- **TypeScript & Rota Kontrolü:** `npm run check` (203 rota, 0 TS hatası PASS)
- **Vite Üretim Derlemesi:** `npm run build` (PASS)

---

## 6. Sıradaki Sprint 6 İşi

Kullanıcı "devam" dediğinde Sprint 6'nın son görevi olan **[E4N-110 / P38]**: Sürüm kararı, dokümantasyon ve izlenebilirliği kapat görevine geçilecektir.
