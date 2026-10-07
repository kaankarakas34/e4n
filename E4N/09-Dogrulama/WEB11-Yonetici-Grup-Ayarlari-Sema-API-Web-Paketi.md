# WEB-11 — Yönetici grup ayarları şema+API+web paketi


## WEB-11 — 5 Ekim doğrulanmış teslim

14ae684 yönetilen dala push: 0014 additive migration groups meeting_time/link drift'ini kaynak şemada giderir; mevcut kolon/değerleri ve eski migration checksum'larını korur. Source14 sürüm/41 tablo. Mevcut POST/PUT groups güncel DB ADMIN rolüyle transaction, invalid date/time/http(s)/payload/query kontrolleri, missing target404, partial update/status koruma ve rollback içerir. Web oluşturma UUID'si modal retry boyunca korunur; concurrent/replay aynıid+payload tek satır, içerik farkı409. Yeni kapasite/kabul/işkolu/shuffle/hak/puan/ücret kuralı seçilmedi.

AdminGroups read-error/empty ayrımı, retry ve account/token scope; AdminGroupDetail gerçek saved DTO ile render, save-lock ve stale write guard, viewport içinde kaydırılabilir edit paneli tamamlandı. İzole PG17 gerçek Express/TS contract: fresh14/repeat0, varolan kolonlarla upgrade değer koruma, current admin/revoked claim, concurrent replay1row, validation/partial/DRAFT/404/rollback/readback PASS. isolated-smoke fresh/upgrade/legacy/checksum/order41tables PASS; WEB09 missing/restored column compatibility PASS. Gerçek AdminGroups+Detail captured fixture Playwright (alert stub): read retry, lost create reply sameUUID, write fail/retry, savedDRAFT/time, held old write reply sonrasıaccount değişimi PASS; screenshot kontrol. check/build/diff/syntax PASS. Diğer contract bootstrap sayımları14'e güncellendi; hepsi yeniden çalıştırılmış gibi raporlanmadı.

Kanıt server/docs/group-settings.md, server/test/group-settings-contract.mjs, Obsidian WEB11-Yonetici-Grup-Ayarlari-Sema-API-Web-Paketi.md. Canlı migration/Supabase yazma/deploy/real mail/payment yok. P09 gerçek canlı geçiş ve P11 kalan drift, P30/P31/P39/P40 genel hedefleri ve D01–D10 açık. Group admin silme/kabul/rol atama/shuffle ve kapsamlı SEC bu ayar paketiyle kapanmaz.

Görseller: yönetilen worktree output/group-settings-saved.png ve group-settings-account-change.png. Browser testte alert display stub kullanılır; gerçek production E2E değildir. Kendi browser/Vite/izole PG süreçleri kapatıldı. 0014 canlı uygulanmadı.
