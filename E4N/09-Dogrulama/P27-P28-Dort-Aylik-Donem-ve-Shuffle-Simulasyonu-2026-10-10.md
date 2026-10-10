# P27 & P28 — Dört aylık dönem, shuffle uygunluğu ve simülasyonu doğrulama kanıtı

**Tarih:** 10 Ekim 2026  
**Linear Görevleri:**  
- `[E4N-99] P27 | Dört aylık dönem ve shuffle uygunluğunu tanımla` (Done)  
- `[E4N-100] P28 | Kapasite ve hizmet kuralını koruyan shuffle önizlemesi üret` (Done)  
**Durum:** Done  
**Dal:** `codex/e4n-sprint1-foundation`  

---

## 1. Teslim Özeti ve Kapsam

### A. E4N-99 (P27) — Dört Aylık Dönem ve Aday Uygunluğu
- **R05 & D06 Kanonik 4 Aylık Dönem (`server/src/canonical-period.js`):**
  - Yılda 3 dönem (trimester) deterministik olarak hesaplanır:
    - **T1:** 1 Ocak 00:00:00 UTC – 30 Nisan 23:59:59 UTC
    - **T2:** 1 Mayıs 00:00:00 UTC – 31 Ağustos 23:59:59 UTC
    - **T3:** 1 Eylül 00:00:00 UTC – 31 Aralık 23:59:59 UTC
  - **D06 Ödeme Kesim Kuralı:** Shuffle ödeme kesim tarihi, dönem bitişinden 24 saat (1 takvim günü) öncedir (`cutoffDate`).
  - Dönem anahtarları (`YYYY-T1`, `YYYY-T2`, `YYYY-T3`), geçiş yardımcıları (`getPreviousCanonicalPeriod`, `getNextCanonicalPeriod`, `parseCanonicalPeriod`) ve kesim kontrolü (`isCutoffPassed`) kuruldu.

- **Aday Shuffle Uygunluk Değerlendirmesi (`evaluateShuffleEligibility`):**
  - **Yönetici Ayrımı:** `role === 'ADMIN'` aday havuzundan hariç tutulur (`EXCLUDED_ADMIN`).
  - **Hesap Statüsü:** Yalnızca `account_status === 'ACTIVE'` üyeler uygundur. Borç gecikmesi nedeniyle kısıtlanan (`RESTRICTED` - D07) veya askıya alınan (`SUSPENDED`/`DELETED`) hesaplar `INELIGIBLE_ACCOUNT_RESTRICTED` / `INELIGIBLE_ACCOUNT_INACTIVE` olarak engellenir.
  - **Disiplin Yasağı (P24 / R11):** 2 kez gruptan çıkarılan ve 240 günlük yasağı devam eden üyeler `INELIGIBLE_REMOVAL_BAN` ile elenir.
  - **Abonelik Kesimi (D06):** Kesim tarihine kadar aktif aboneliği bulunmayanlar `INELIGIBLE_SUBSCRIPTION_UNPAID` olarak işaretlenir.
  - **Meslek Doğrulaması:** Mesleği tanımsız veya boş olanlar `MISSING_PROFESSION` ile elenir.
  - **Gerçek Önceki Grup Geçmişi:** Mock veya uydurma döngüsel atama yerine `group_membership_history` ve `group_members` üzerindeki gerçek kayıtlar (`previous_group_id`) bağlanır.

---

### B. E4N-100 (P28) — Shuffle Simülasyonu ve Sert Koşullar
- **Sert Koşullar (Hard Constraints - `server/src/shuffle-simulation.js` & `src/utils/shuffleAlgorithm.ts`):**
  - **D09 35 Kapasite Sınırı:** Hiçbir kapalı grup 35 kişilik kapasiteyi aşamaz. 72 kişi 2 gruba dağıtıldığında tam 35 + 35 yerleştirilir, kalan 2 kişi `CAPACITY_FULL` ile yerleşemeyenlere aktarılır.
  - **Katı Meslek Tekilliği (Strict Profession Uniqueness):** Bir grupta aynı meslekten (büyük/küçük harf ve boşluk normalizasyonu ile) en fazla 1 üye yer alabilir. Çakışan meslekler diğer müsait gruplara dağıtılır veya `PROFESSION_CONFLICT` olarak raporlanır.
  - **Kilit Tutarlılığı (`respectLocks`):** Yöneticinin sabitlediği üyeler korunur; ancak kilitler arasında meslek çakışması veya 35 kapasite aşımı varsa `LOCKED_CONFLICT` / `LOCKED_OVERFLOW` olarak gerekçelendirilir.

- **Optimizasyon ve Yumuşak Kısıtlar (Soft Constraints):**
  - **En Kısıtlı Üyeden Başlama:** Sık tekrarlanan mesleklere sahip üyeler (yerleşmesi en zor olanlar) öncelikli atanır.
  - **Eski Grup Örtüşmesini Azaltma (`minimizeOverlap`):** Aynı önceki gruptan gelen üyelerin aynı yeni gruba düşmesi cezalandırılır (`overlap * 50`).
  - **Rotasyon Teşviki:** Üyenin kendi eski grubuna tekrar atanması cezalandırılarak (`+100`) yeni gruplara rotasyon teşvik edilir.
  - **Grup Dengeleme:** Gruplar arasındaki doluluk dengeli tutulur.

- **Gerekçeli Yerleşemeyenler Raporu (`unassignedReport`):**
  - Yerleşemeyen her üye için açık gerekçe kodu (`PROFESSION_CONFLICT`, `CAPACITY_FULL`, `LOCKED_CONFLICT`) ve anlaşılır Türkçe açıklama üretilir.

---

### C. API ve Web Entegrasyonu
- **`GET /api/admin/shuffle-workspace`:**
  - `period` nesnesi ve üyelerin `is_eligible`, `eligibility_category`, `ineligibility_reasons`, `removal_ban`, `previous_group_id` alanları sağlandı.
  - Eski `historyAvailable: false` ve `revision` kontratı korundu.
- **`POST /api/admin/shuffle-preview`:**
  - Yöneticinin parametreli simülasyon çalıştırmasını sağlayan yeni güvenli endpoint: `{ expectedRevision, respectLocks, lockedMembers, targetPeriodKey }`.
  - Stale revision durumunda `409 SHUFFLE_STALE` döner.
  - Simülasyon sonucu, `previewRevision`, `assignments`, `unassigned`, `unassignedReport` ve `stats` üretir.
- **`POST /api/shuffle/save`:**
  - Yürütülen dağıtımın `after_snapshot` kaydına otomatik olarak `period` bilgisi eklenir.
- **`AdminShuffle.tsx` Web Ekranı:**
  - 4 Aylık Dönem kartı (Başlangıç, Bitiş, Ödeme Kesim Tarihi rozeti).
  - Aday Uygunluk metrikleri (Toplam, Uygun, 8 Ay Yasaklılar, Kısıtlı/Borçlular, Meslek Eksikler).
  - 35 Kapasite rozetleri ve meslek etiketleri.
  - Gerekçeli yerleşemeyenler kartı.

---

## 2. Doğrulama Kanıtları

1. **`server/test/canonical-period-and-simulation-contract.mjs`:**
   - Birim testleri: T1, T2, T3 dönem hesapları, 24 saatlik ödeme kesimi, parsing, transitionlar: **PASS**.
   - Aday uygunluk kuralları (Admin muafiyeti, kısıtlı hesap, meslek eksikliği, P24 8 ay yasağı, D06 kesim tarihi): **PASS**.
   - Simülasyon sert koşulları (D09 35 kapasite, katı meslek tekilliği, rotasyon optimizasyonu, unassigned gerekçeleri): **PASS**.
   - İzole PG17 & Express API testi: `GET /api/admin/shuffle-workspace` period & eligibility, `POST /api/admin/shuffle-preview` simulation ve 409 stale check: **PASS**.
   - Sonuç: **10/10 PASS**.

2. **`server/test/shuffle-workspace-contract.mjs`:**
   - Mevcut 28 migration ve 50 tablo ile geriye dönük tam regresyon: **PASS**.

3. **`server/test/route-ownership-static.mjs` & `server/test/route-ownership-contract.mjs`:**
   - 200 aktif rota, 31 sağlayıcı, 17 legacy rota: **PASS** (Sıfır gölgeli rota).

4. **Sistem ve Tip Bütünlüğü:**
   - `node server/test/isolated-smoke.mjs`: **PASS** (50 tablo, 28 sürüm korundu, 0 DDL).
   - `npm run check`: **PASS** (TypeScript tip denetimi ve statik rota kontrolü sıfır hata).
   - `npm run build`: **PASS** (Vite üretim derlemesi başarılı).
