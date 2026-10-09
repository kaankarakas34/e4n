# P21 — Aylık puan olay defteri ve tekrar anahtarı doğrulama kanıtı

**Tarih:** 9 Ekim 2026  
**Linear Görevi:** `[E4N-93] P21 | Aylık puan olay defterini ve tekrar anahtarını kur`  
**Durum:** Done  
**Dal:** `codex/e4n-sprint1-foundation`  

---

## 1. Teslim Özeti ve Kapsam

- **Kural Sürümü ve Ağırlıklar (`SCORE_RULES` v2026.1):**
  - Yoklama: `PRESENT` (+10), `ABSENT` (-10), `LATE` (+5), `SUBSTITUTE` (+10).
  - Kural güvencesi: `REGISTERED` durumu kesinlikle puan kaynağı değildir (0 puan, deftere girmez).
  - Referanslar: `INTERNAL` (+10), `EXTERNAL` (+5), `status = 'SUCCESSFUL'` ciro katkı bonusu (+5).
  - Ziyaretçiler: `status IN ('ATTENDED', 'JOINED')` (+10). `INVITED` puan almaz.
  - Birebir görüşmeler: `COMPLETED` (+10).
  - Eğitim: `EDUCATION_UNIT = 0` (şu anki kuralda saat başına çarpan 0).
  - İnceleme penceresi: Son 6 ay (`lookbackMonths: 6`).

- **Tekrar Anahtarı ve Mükerrer Yazım Koruması (`idempotency_key`):**
  - Her faaliyet için deterministik tekil anahtar tanımlandı (`ATTENDANCE:${id}`, `REFERRAL:${id}`, `REFERRAL:${id}:SUCCESSFUL`, `VISITOR:${id}`, `ONE_TO_ONE:${id}`).
  - Puan hesaplama motorunda aynı anahtar ikinci kez puan üretmez.
  - `POST /api/visitors` uç noktasına opsiyonel `id` desteği eklendi (`ON CONFLICT (id) DO NOTHING`). Aynı `id` ile yapılan tekrarlı istekler 200 döner ve mükerrer ziyaretçi/skor üretmez. `id`siz eski çağrılar 201 dönerek `isolated-smoke.mjs` temel çizgisini (%100) korur.

- **Puan Olay Defteri (`score-ledger`) & Uzlaşma (`score-reconciliation`) API'leri:**
  - `GET /api/reports/score-ledger`: Kullanıcının dönem bazlı (`periodKey`), kaynak bazlı (`bySource`) puan olay dökümü. Normal üyeler yalnız kendi dökümünü, `ADMIN` tüm üyeleri sorgulayabilir (yetkisiz sorgularda 403).
  - `GET /api/reports/score-reconciliation`: Canlı `users.performance_score` ve `performance_color` ile olay defteri toplamının matematiksel karşılaştırması (`reconciled`, `drift`, `unreconciledLegacyScore`).
  - **Eski Puan Kuralı:** Geçmiş faaliyeti olmayan eski hesaplar için uydurma faaliyet üretilmez; aradaki fark `unreconciledLegacyScore` olarak raporlanır.

- **Değişmezler ve Korunan Sözleşmeler:**
  - Şema sürümü 28 (`0028_group_application_workflow`), tablo sayısı 50 olarak sabit kaldı; yeni DDL eklenmedi.
  - `GET /api/reports/traffic-lights` kontratı (`hasMonth: false, hasSource: false, hasRuleVersion: false`) tam olarak korundu.

---

## 2. Doğrulama Kanıtları

1. **`server/test/score-ledger-contract.mjs`:**
   - 28 sürüm migration, 50 tablo başlatıldı.
   - `REGISTERED` katılımın 0 puan ürettiği, `PRESENT` katılımın 10 puan ürettiği doğrulandı.
   - Referans taban puanı (+10) ve `SUCCESSFUL` ciro bonusu (+5) doğrulandı.
   - `POST /api/visitors`'a aynı `id` ile iki çağrı yapıldı; ilk çağrı 201, ikinci çağrı 200 döndü ve skor mükerrer artmadı (35 puanda sabit kaldı).
   - 1-to-1 (+10) ile nihai skor 45 ('RED') olarak hesaplandı.
   - `GET /api/reports/score-ledger` ile 5 tekil olay, `bySource` toplamları ve `idempotencyKey` tekilliği doğrulandı.
   - `GET /api/reports/score-reconciliation` ile `reconciled: true, drift: 0` ve faaliyetsiz eski kullanıcı için `reconciled: false, unreconciledLegacyScore: 40` doğrulandı.
   - Yetkisiz üye sorgularında 403, `ADMIN` sorgularında 200 doğrulandı.
   - `GET /api/reports/traffic-lights` çıktısında `month`, `source`, `rule_version` alanlarının olmadığı doğrulandı.
   - Sonuç: **PASS**.

2. **Genişletilmiş Regresyon Testleri:**
   - `node server/test/isolated-smoke.mjs`: **PASS** (50 tablo, 28 sürüm, baseline'lar korundu).
   - `node server/test/referral-contract.mjs --web-only`: **PASS** (Atomik skor rollback korundu).
   - `node server/test/personal-reports-contract.mjs`: **PASS**.
   - `node server/test/admin-reports-contract.mjs`: **PASS**.
   - `node server/test/group-application-workflow-contract.mjs`: **PASS**.
   - `node server/test/membership-history-contract.mjs`: **PASS**.
   - `npm run test:routes`: **PASS** (189 rota, 30 sağlayıcı, 17 legacy korundu).
   - `npm run check`: **PASS** (TypeScript tip denetimi hatasız).
   - `npm run build`: **PASS** (Vite üretim derlemesi hatasız).
