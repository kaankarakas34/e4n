# P22 — Aylık puanı kesinleştir ve tablo olarak sun doğrulama kanıtı

**Tarih:** 9 Ekim 2026  
**Linear Görevi:** `[E4N-94] P22 | Aylık puanı kesinleştir ve tablo olarak sun`  
**Durum:** Done  
**Dal:** `codex/e4n-sprint1-foundation`  

---

## 1. Teslim Özeti ve Kapsam

- **Ay Sonu Puanlarını Kesinleştirme ve Dondurma (`finalizePeriod`):**
  - Ay sonlarında puanların dondurulması motoru kuruldu.
  - Kesinleştirilen dönem, `system_settings` tablosuna `period_finalized:${periodKey}` anahtarıyla kalıcı ve değiştirilemez biçimde kaydedilir.
  - Şema sürümü 28 ve tablo sayısı 50 kuralı (sıfır DDL / sıfır şema değişikliği) korundu; yeni tablo açılmadan mevcut anahtar-değer altyapısı kullanıldı.
  - Aynı dönem için tekrarlanan çağrılar idempotenttir (`isAlreadyFinalized: true`); mevcut dondurulmuş veriyi ve kesinleşme zaman damgasını bozmadan aynen döner.

- **Gerekçeli İdari Puan Düzeltmesi (`applyScoreAdjustment`):**
  - Yalnızca `ADMIN` yetkisine açık, gerekçeli puan düzeltme akışı sağlandı (`reason` alanı en az 3 karakter uzunluğunda zorunludur).
  - Düzeltmeler `system_settings` tablosunda `score_adjustments` anahtarında saklanır ve `buildScoreEvents` motoruna `sourceKind: 'ADJUSTMENT'` olarak işlenir.
  - İdari düzeltme yapıldığı anda üyenin canlı skoru (`users.performance_score`) anında uzlaştırılarak güncellenir.

- **Aylık Puanlar & Liderlik Tablosu (`GET /api/reports/monthly-scores`):**
  - Belirtilen dönem kesinleşmişse dondurulmuş snapshot verilerini, kesinleşmemişse cari ayın canlı puan hesaplamasını sunar.
  - Grup filtresi (`groupId`) desteklenir; sıralama kuralı `score DESC, name ASC` biçimindedir.
  - Üye ve Admin kullanıcıları tarafından görüntülenebilir.

- **Üye Karnesi (`GET /api/reports/scorecard/:userId`):**
  - Normal üyeler yalnızca kendi karnesini (`userId = 'me'` veya kendi ID'si), Admin kullanıcıları tüm üyelerin karnesini görüntüleyebilir (yetkisiz istekler 403 ile engellenir).
  - Son 6 aylık UTC-safe puan trendini (`periodsTrend`), kaynak bazlı puan dağılımını (`sourcesSummary`) ve son olayları (`recentEvents`) döner.

- **API İstemcisi ve Rota Entegrasyonu:**
  - `src/api/api.ts` istemcisine `getMonthlyScores`, `finalizePeriod`, `adjustMemberScore` ve `getScorecard` fonksiyonları eklendi.
  - `server/docs/route-ownership.json` 193 rota, 30 sağlayıcı ve 17 legacy rota ile tam senkronize edildi.

- **Değişmezler ve Korunan Sözleşmeler:**
  - Şema sürümü 28 (`0028_group_application_workflow`), tablo sayısı 50 olarak sabit tutuldu.
  - `GET /api/reports/traffic-lights` kontratı (`hasMonth: false, hasSource: false, hasRuleVersion: false`) kesin olarak korundu.

---

## 2. Doğrulama Kanıtları

1. **`server/test/monthly-score-finalization-contract.mjs`:**
   - İzole PG17 veritabanı ve Express üzerinde 28 migration ve 50 tablo ile uçtan uca çalıştırıldı.
   - Puan etkinlikleri (katılım, referans, birebir, ziyaretçi) ile üye skoru oluşturuldu.
   - Normal üyenin dönem kesinleştirme (`POST /api/reports/finalize-period`) isteği 403 ile engellendi.
   - `ADMIN` tarafından dönem donduruldu (`isAlreadyFinalized: false`).
   - Aynı dönem için ikinci kesinleştirme isteğinde dondurulmuş verilerin bozulmadığı ve idempotent olarak `isAlreadyFinalized: true` döndüğü kanıtlandı.
   - Eksik gerekçeli düzeltme isteği 400 ile reddedildi (`Reason is required`).
   - Normal üyenin düzeltme isteği 403 ile reddedildi.
   - `ADMIN` tarafından gerekçeli +15 puan düzeltmesi yapıldı; canlı skor ve olay defterinde anında yansıdığı doğrulandı.
   - `GET /api/reports/monthly-scores` liderlik tablosu (`score DESC, name ASC`) doğrulandı.
   - Üyenin başka bir üyenin karnesini sorgulaması 403 ile engellendi.
   - Üyenin kendi karnesini ve adminin ilgili üye karnesini trend analiziyle eksiksiz aldığı doğrulandı.
   - `GET /api/reports/traffic-lights` sözleşmesinin bozulmadığı (`hasMonth: false, hasSource: false, hasRuleVersion: false`) doğrulandı.
   - Sonuç: **PASS**.

2. **Genişletilmiş Regresyon Testleri:**
   - `node server/test/isolated-smoke.mjs`: **PASS** (50 tablo, 28 sürüm, 0 DDL, tüm baseline'lar korundu).
   - `npm --prefix server run test:score-ledger`: **PASS** (P21 defter ve idempotentlik kontratı korundu).
   - `npm --prefix server run test:score-finalization`: **PASS**.
   - `npm --prefix server run test:routes`: **PASS** (193 rota, 30 sağlayıcı, 17 legacy rota korundu).
   - `npm run check`: **PASS** (TypeScript tip denetimi sıfır hata).
   - `npm run build`: **PASS** (Vite üretim derlemesi eksiksiz tamamlandı).
