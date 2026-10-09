# P19 | Geçmiş Nedeni, Dönem ve Çıkarılma Bağları Doğrulama Raporu — 9 Ekim 2026

## 1. Görev Özeti ve Kapsam
- **Linear Görevi:** `[E4N-91] P19 | Kalan: Geçmiş nedeni, dönem ve çıkarılma bağları`
- **Durum:** Done
- **Öncelik:** P2
- **Kapsam:** Üyelikten/gruptan çıkarılma nedenleri, dönem bağları, kalıcı geçmiş, 2. çıkarılmada 1 dönem (4 ay / 120 gün) başvuru yasağı ve başkan görünürlüğü kuralları.

---

## 2. Uygulanan İş Kuralları ve Mimarî Kararlar

1. **Standart Neden Kategorileri:**
   - Üye gruptan çıkarılırken (`DELETE /api/groups/:id/members/:userId`):
     - `LOW_SCORE`: Puan Düşüklüğü
     - `ATTENDANCE`: Devamsızlık
     - `VOLUNTARY`: Kendi İsteğiyle Ayrılma
     - `ADMIN_DISCIPLINARY`: Disiplin / İdari Karar (varsayılan)
   - Opsiyonel serbest açıklama notu (`reason_note`, max 500 karakter).
   - İşlem anında üyeye çıkarılma gerekçesini ve yapılandırılmış JSON yükünü içeren `REMOVAL` tipinde kalıcı bildirim kaydedilir.

2. **İlk Çıkarılma Kuralı (D02):**
   - Aktif aboneliği devam ettiği sürece bekleme süresi olmadan hemen başka bir gruba başvurabilir.
   - Çıkarılma nedeni üyenin geçmişinde ve bildirimlerinde saklanır.

3. **İkinci Çıkarılma ve 1 Dönem Başvuru Yasağı (D03 / D04 - R11):**
   - Kullanıcı gruptan 2. kez çıkarıldığında (`MEMBER_REMOVAL` sayısı >= 2), son çıkarılma tarihinden itibaren 1 dönem (4 ay / 120 gün) boyunca yeni bir gruba başvuru yapamaz (`POST /api/groups/:id/join`).
   - Sistem `403 Forbidden` ve `REMOVAL_BAN_ACTIVE` hata koduyla kalan gün sayısını döner:
     `"İki kez gruptan çıkarılma nedeniyle 4 aylık (1 dönem) grup başvuru yasağınız bulunmaktadır. Kalan süre: X gün."`

4. **Hakların Korunması:**
   - Taciz ve dolandırıcılık gibi ağır disiplin suçları haricinde kullanıcının E4N platform üyeliği iptal edilmez.
   - Kullanıcının dış etkinlik ve lonca (power-team) katılım hakları korunur.

5. **Başkanın Görünürlüğü:**
   - Üye yeni bir gruba başvurduğunda, o grubun başkanı başvuru kuyruğunda (`GET /api/groups/:id/applications` ve `GroupApplicationQueue.tsx`) başvuran üyenin daha önce hangi gruptan, ne zaman ve hangi gerekçeyle çıkarıldığını (`removal_history`) şeffaf biçimde görür.

6. **Kalıcı Geçmiş Ekranı:**
   - `GET /api/membership-history` ve `GET /api/admin/membership-history/:id` çıktıları `REMOVAL` bildirimleriyle zenginleştirilir.
   - `MembershipHistory.tsx` ekranında çıkarılma gerekçesi rozeti (`e.removal_reason`) gösterilir.

---

## 3. Doğrulama Kanıtları ve Test Sonuçları

- **Git Commit:** `5bd8da4` (`codex/e4n-sprint1-foundation` dalına pushlandı)
- **Sözleşme & Otomasyon Testleri:**
  - `node server/test/group-application-workflow-contract.mjs`: **PASS**
    - Çıkarılma nedeni ve açıklaması doğrulaması
    - İlk çıkarılmada başka gruba hemen başvurabilme (D02)
    - Başvuru kuyruğunda başkanın önceki çıkarma geçmişini görmesi
    - 2. çıkarılmada 120 günlük başvuru yasağı (`403 REMOVAL_BAN_ACTIVE`)
  - `node server/test/membership-history-contract.mjs`: **PASS**
    - Keyset paging, immutable provenance, DTO validasyonu, atomik transaction kontrolü
  - `npm run check` (TypeScript typecheck + route-ownership-static): **PASS** (187 routes, 0 errors)
  - `npm run build` (Vite production build): **PASS**
  - `node server/test/isolated-smoke.mjs`: **PASS** (50 tablo invariantı, 28 şema versiyonu korunuyor)

---

## 4. Değiştirilen Dosyalar
- `server/src/index.js`
- `server/src/group-applications.js`
- `server/src/membership-history.js`
- `server/test/group-application-workflow-contract.mjs`
- `src/api/api.ts`
- `src/api/groupApplications.ts`
- `src/api/membershipHistory.ts`
- `src/components/GroupApplicationQueue.tsx`
- `src/hooks/useGroupMemberActions.ts`
- `src/pages/MembershipHistory.tsx`
