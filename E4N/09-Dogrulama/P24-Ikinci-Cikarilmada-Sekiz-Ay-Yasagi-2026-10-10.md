# P24 — İkinci çıkarılmada sekiz ay başvuru yasağı doğrulama kanıtı

**Tarih:** 10 Ekim 2026  
**Linear Görevi:** `[E4N-96] P24 | İkinci çıkarılmada sekiz ay başvuru yasağını uygula`  
**Durum:** Done  
**Dal:** `codex/e4n-sprint1-foundation`  

---

## 1. Teslim Özeti ve Kapsam

- **R11, D03, D04 Hedef Kuralı:**
  - İki veya daha fazla kez gruptan çıkarılan üyeye, son çıkarılma tarihinden (`last_removed_at`) itibaren **8 takvim ayı (2 dönem / 240 gün)** boyunca kapalı grup başvuru yasağı uygulanır.
  - İlk çıkarılmada yeniden başvuru koşulu beklemesizdir (`D02`). İkinci çıkarılmada yasak devreye girer.

- **Kapalı Grup Başvuru Kapısı (`POST /api/groups/:id/join`):**
  - Üyenin `removal_count >= 2` ve son çıkarılmasının üzerinden 240 günden az geçmişse, istek `403 Forbidden` (`code: 'REMOVAL_BAN_ACTIVE'`) koduyla engellenir.
  - Hata gövdesi `daysLeft` (kalan gün), `bannedUntil` (yasak bitiş tarihi) ve `removalCount` alanlarını açıkça sunar.
  - Hata mesajı: `İki kez gruptan çıkarılma nedeniyle 8 aylık (2 dönem / 240 gün) grup başvuru yasağınız bulunmaktadır. Kalan süre: {daysLeft} gün.`

- **Grup Keşfi (`GET /api/group-discovery`):**
  - İstemciye ve web paneline `removal_ban` nesnesi sunulur:
    - `{ active: true, daysLeft: ..., bannedUntil: '...', removalCount: 2 }` veya aktif yasak yoksa `{ active: false, daysLeft: 0, bannedUntil: null, removalCount: ... }`.

- **Kapsam İnvaryantı & Açık Haklar (R12 / Lonca Koruması):**
  - Yasak YALNIZCA kapalı gruplar içindir.
  - Lonca (Power Team) katılımı (`POST /api/power-teams/:id/join`) bu yasaktan kesinlikle etkilenmez.
  - Kullanıcının `users.account_status = 'ACTIVE'` olarak kalır; dış etkinlik, indirimli bilet ve platform hakları korunur.

- **Yasak Bitişi (240 Gün Sonrası):**
  - Son çıkarılmanın üzerinden 240 gün geçtikten sonra yasak otomatik olarak kalkar (`active: false`) ve üye yeniden kapalı gruba başvurabilir.

- **Değişmezler ve Korunan Sözleşmeler:**
  - Şema sürümü 28 (`0028_group_application_workflow`), tablo sayısı 50 olarak sabit kaldı (0 DDL).
  - `GET /api/reports/traffic-lights` kontratı (`hasMonth: false, hasSource: false, hasRuleVersion: false`) korundu.
  - Rota sahipliği: 195 aktif rota ve 30 sağlayıcı korundu.

---

## 2. Doğrulama Kanıtları

1. **`server/test/second-removal-ban-contract.mjs`:**
   - İzole PG17 ve Express üzerinde 28 migration ve 50 tablo ile uçtan uca çalıştırıldı.
   - 1. çıkarma sonrası `removal_ban.active: false` olduğu ve hemen gruba başvurulabildiği kanıtlandı (D02).
   - 2. çıkarma sonrası `removal_ban.active: true`, `daysLeft: 240`, `POST /api/groups/:id/join` -> 403 `REMOVAL_BAN_ACTIVE` doğrulandı (R11, D03, D04).
   - Yasaklı üyenin Power Team'e katılabilmesi (`POST /api/power-teams/:id/join` 200) ve `users.account_status = 'ACTIVE'` korunduğu kanıtlandı.
   - 240 gün geçtikten sonra (eski tarihli çıkarılma) yasağın kalktığı ve başvurunun başarıyla açılabildiği doğrulandı.
   - Sonuç: **PASS**.

2. **`server/test/group-application-workflow-contract.mjs`:**
   - 8 aylık / 2 dönem yasağı ve group-discovery removal_ban doğrulaması: **PASS**.

3. **Genişletilmiş Regresyon Testleri:**
   - `node server/test/isolated-smoke.mjs`: **PASS** (50 tablo, 28 sürüm, 0 DDL, tüm baseline'lar korundu).
   - `npm --prefix server run test:score-ledger`: **PASS** (P21 defter ve idempotentlik).
   - `npm --prefix server run test:score-finalization`: **PASS** (P22 kesinleştirme ve liderlik tablosu).
   - `npm --prefix server run test:score-removal`: **PASS** (P23 puana bağlı çıkarma).
   - `npm --prefix server run test:removal-ban`: **PASS** (P24 8 ay yasağı).
   - `npm --prefix server run test:routes`: **PASS** (195 rota, 30 sağlayıcı, 17 legacy rota).
   - `npm run check`: **PASS** (TypeScript tip denetimi sıfır hata).
   - `npm run build`: **PASS** (Vite üretim derlemesi eksiksiz tamamlandı).
