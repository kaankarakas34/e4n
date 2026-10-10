# P29 — Shuffle Bildirimleri ve Kapanışı — 10 Ekim 2026

## Kapsam ve Başarı Kriterleri
- **Görev:** E4N-101 (P29) — Shuffle'ı atomik uygula, atama geçmişi tut, hedef dönem/uygunluk ve bildirim.
- **Epic E6 (Dört Aylık Shuffle) Kapanışı:** P27 (E4N-99 dönem ve aday uygunluğu), P28 (E4N-100 simülasyon ve kısıtlar) sonrasında P29 bildirim teslimatıyla tamamlandı.
- **Kriterler:**
  1. Dağıtım yürütüldüğünde (`POST /api/shuffle/save` / `recordShuffleExecution`), yeni gruba atanan her üyeye `notifications` tablosuna atomik `SHUFFLE_COMPLETED` bildirimi (`Yeni Dönem Grup Atamanız Yapıldı`, dönem başlığı, yeni grup adı, `action_url: /groups/:groupId`).
  2. Önceki dağıtımda aktif olup yeni dağıtımda yerleşemeyen üyelere gerekçeli bilgilendirme bildirimi (`Dönem Rotasyonu Bilgilendirmesi`, `action_url: /dashboard`).
  3. İletilen bildirim sayısı `after_snapshot.notificationsDelivered` içinde kalıcı saklanması ve `receipt` makbuzunda (`notificationsDelivered: number`) döndürülmesi.
  4. Mükerrer çağrılarda (idempotent replay) aynı `requestId` ile sıfır mükerrer bildirim yazımı (`replayed: true` ile orijinal makbuz).
  5. Web arayüzünde (`AdminShuffle.tsx`) eski "Bu işlem e-posta veya bildirim göndermedi" uyarısı yerine, iletilen bildirim sayısı ve durumunun doğrulanmış olarak sunulması.
  6. Sıfır DDL (28 migration, 50 tablo invariyantı korundu).

---

## Doğrulama ve Test Sonuçları

1. **Sözleşme ve Entegrasyon Testi (`server/test/canonical-period-and-simulation-contract.mjs`):**
   - T1/T2/T3 dönem hesabı ve D06 24 saatlik ödeme kesimi: PASS.
   - Aday uygunluk motoru (Admin hariç, Active şartı, kısıtlı ve borçlu engeli, 8 ay yasağı): PASS.
   - Simülasyon motoru (35 kişi sınırı, meslek tekilliği, kilitler, unassigned gerekçe raporu): PASS.
   - Atomik kayıt ve bildirim yazımı (`POST /api/shuffle/save`): PASS (`saveAck.notificationsDelivered > 0`, bildirim içeriği ve alanları doğrulandı).
   - Replay idempotency: PASS (tekrar istekte `replayed: true`, `notifications` sayısında artış yok).
   - Geçmiş detayı (`GET /api/admin/shuffle-history/:id`): PASS (`after_snapshot.notificationsDelivered` doğrulandı).

2. **Mevcut Shuffle Workspace Sözleşmesi (`server/test/shuffle-workspace-contract.mjs`):**
   - Keyed shuffle submission (8 eşzamanlı istek, tek execution, replay makbuzu, 409 conflict, DTO kontrolleri): **PASS**.

3. **Rota Sahipliği (`server/test/route-ownership-contract.mjs`):**
   - 200 Express rotası, 31 sağlayıcı, 17 legacy rota: **PASS**.

4. **İzole Veritabanı ve Şema Güvenliği (`server/test/isolated-smoke.mjs`):**
   - 28 migration, 50 tablo: **PASS** (Sıfır DDL).
   - Shuffle apply baseline ve missingShuffleNotify (404) korunumu: **PASS**.

5. **Tip ve Derleme Denetimi:**
   - `npm run check` (`tsc -b --noEmit`): **PASS**.
   - `npm run build` (Vite production build): **PASS**.
