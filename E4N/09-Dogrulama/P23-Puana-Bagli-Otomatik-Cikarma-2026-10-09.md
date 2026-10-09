# P23 — Puana bağlı otomatik çıkarmayı tekrar güvenli uygula doğrulama kanıtı

**Tarih:** 9 Ekim 2026  
**Linear Görevi:** `[E4N-95] P23 | Puana bağlı otomatik çıkarmayı tekrar güvenli uygula`  
**Durum:** Done  
**Dal:** `codex/e4n-sprint1-foundation`  

---

## 1. Teslim Özeti ve Kapsam

- **Kesinleşmiş Dönem Ön Koşulu (`PERIOD_NOT_FINALIZED` Güvencesi):**
  - P23 puana bağlı otomatik çıkarma değerlendirmesi ve yürütmesi, YALNIZCA kesinleştirilmiş ay sonu puanları üzerinden çalıştırılabilir (`system_settings` içinde `period_finalized:${periodKey}` kaydı zorunludur).
  - Kesinleşmemiş bir dönem için yapılan istekler 400 Bad Request (`PERIOD_NOT_FINALIZED`) koduyla reddedilir.

- **Önizleme ve Değerlendirme API'si (`GET /api/reports/low-score-evaluations`):**
  - Yalnızca `ADMIN` yetkisine açık (üye istekleri 403 ile engellenir).
  - Kesinleşmiş snapshot üzerinden `score < threshold` (varsayılan 50) olan adayları inceler.
  - Canlı veritabanı durumunu kontrol ederek adayları sınıflandırır:
    - `ELIGIBLE`: Çıkarılmaya uygun düşük puanlı aktif üye.
    - `EXEMPT_PRESIDENT`: Grup başkanları otomatik çıkarmadan muaftır; başkanken düşürülmez.
    - `ALREADY_INACTIVE`: Üye grupta zaten aktif değilse işlem atlanır.
    - `ALREADY_REMOVED_FOR_PERIOD`: Bu dönem için daha önce çıkarılmışsa mükerrer işlem engellenir.

- **Otomatik / İncelemeli Çıkarma Yürütme API'si (`POST /api/reports/apply-low-score-removals`):**
  - Yalnızca `ADMIN` yetkisine açık.
  - Parametreler: `periodKey` (zorunlu), `threshold` (opsiyonel, default 50), `groupId` (opsiyonel), `exemptUserIds` (opsiyonel muafiyet listesi), `reasonNote` (opsiyonel açıklama).
  - Her çıkarma işlemi atomik transaction içinde yürütülür:
    1. `setMembershipOperationContext(conn, adminUserId, 'MEMBER_REMOVAL')` tetikleyici bağlamı kurulur.
    2. `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2` ile üye kapalı gruptan çıkarılır.
    3. **R12 Kuralı:** `users.account_status = 'ACTIVE'` korunur; üyenin genel E4N sistem hesabı, dış etkinlik ve bilet hakları sürer.
    4. `notifications` tablosuna `type = 'REMOVAL'` ve `category = 'LOW_SCORE'` JSON payload'ı ile bildirim kaydedilir.
    5. Tetiklenen veritabanı trigger'ı `group_membership_history` tablosuna `operation = 'DELETE'` ve `action = 'MEMBER_REMOVAL'` kaydı yazar.
    6. `GET /api/membership-history` ve başkan aday listesindeki `removal_history` bu çıkarılmayı `LOW_SCORE` ("Puan Düşüklüğü") gerekçesiyle gösterir.

- **Tekrar Güvenliği ve Idempotency:**
  - Yapılan çıkarma işlemi `system_settings` tablosuna `low_score_removals:${periodKey}` anahtarında kaydedilir.
  - Aynı dönem için tekrar çalıştırmada (replay), daha önce çıkarılmış üyeler tespit edilir ve `removedCount = 0` olarak atlanır. Sıfır mükerrer bildirim ve sıfır mükerrer tarihçe kaydı üretilir.

- **Sözleşme & Değişmezler:**
  - Şema sürümü 28 (`0028_group_application_workflow`), tablo sayısı 50 olarak sabit kaldı (0 DDL).
  - `GET /api/reports/traffic-lights` kontratı (`hasMonth: false, hasSource: false, hasRuleVersion: false`) tam olarak korundu.
  - Rota sahipliği: 195 aktif rota ve 30 sağlayıcı ile tam senkronize edildi.

---

## 2. Doğrulama Kanıtları

1. **`server/test/low-score-removal-contract.mjs`:**
   - İzole PG17 ve Express üzerinde 28 migration ve 50 tablo ile uçtan uca çalıştırıldı.
   - Kesinleştirilmemiş dönemde çıkarma denemesi 400 (`PERIOD_NOT_FINALIZED`) ile engellendi.
   - Normal üyenin önizleme ve çıkarma istekleri 403 ile engellendi.
   - Dönem kesinleştirildi (`POST /api/reports/finalize-period`).
   - Önizlemede (`low-score-evaluations`):
     - Düşük puanlı üye `ELIGIBLE` olarak tespit edildi.
     - Düşük puanlı başkan `EXEMPT_PRESIDENT` olarak muaf tutuldu.
     - Yüksek puanlı üye listeye dahil edilmedi.
   - Çıkarma yürütüldü (`apply-low-score-removals`):
     - `exemptUserIds` listesindeki üye `SKIPPED_EXEMPT` olarak atlandı ve grupta kaldı.
     - Düşük puanlı üye `REMOVED` edildi.
     - Çıkarılan üyenin `group_members` kaydı silindi, ancak `users.account_status = 'ACTIVE'` (R12) korundu.
     - `group_membership_history` tablosunda `operation = 'DELETE'`, `operation_context.action = 'MEMBER_REMOVAL'` doğrulandı.
     - `notifications` tablosunda `type = 'REMOVAL'`, `category = 'LOW_SCORE'` doğrulandı.
     - `GET /api/admin/membership-history/:id` çıktısında `removal_reason.category === 'LOW_SCORE'` ve `Puan Düşüklüğü` etiketi doğrulandı.
   - Idempotent replay: Aynı dönem ve parametrelerle ikinci çağrıda `removedCount = 0`, sıfır mükerrer bildirim ve sıfır mükerrer geçmiş kaydı doğrulandı.
   - `traffic-lights` kontratının korunduğu kanıtlandı.
   - Sonuç: **PASS**.

2. **Genişletilmiş Regresyon Testleri:**
   - `node server/test/isolated-smoke.mjs`: **PASS** (50 tablo, 28 sürüm, 0 DDL, tüm baseline'lar korundu).
   - `npm --prefix server run test:score-ledger`: **PASS** (P21 defter ve idempotentlik kontratı korundu).
   - `npm --prefix server run test:score-finalization`: **PASS** (P22 kesinleştirme ve liderlik tablosu korundu).
   - `npm --prefix server run test:score-removal`: **PASS** (P23 çıkarma kontratı).
   - `npm --prefix server run test:routes`: **PASS** (195 rota, 30 sağlayıcı, 17 legacy rota korundu).
   - `npm run check`: **PASS** (TypeScript tip denetimi sıfır hata).
   - `npm run build`: **PASS** (Vite üretim derlemesi eksiksiz tamamlandı).
