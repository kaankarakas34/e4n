# WEB-08 — Aktivite takvim API+web paketi


## 5 Ekim 2026 — WEB-08 doğrulanmış teslim

Commit 9541dff mevcut codex/e4n-sprint1-foundation dalına push edildi. /api/calendar/web JWT sahibi ve mevcut kullanıcıya bağlı, read-only repeatable snapshot, canonical 43 günlük aralık, ACTIVE grup+üyelik sınırı ve 1000 kayıt üzerinde açık 503. Yalnız etkinlik/birebir/ziyaretçi DTO; eğitim dışı. WebCalendarPanel gerçek ay aralığı, yerel gün/ay grid, seçili gün ajandası, etkinlik detay linki, loading/error/retry ve hesap/token bağlamı birlikte tamamlandı. Eski /calendar mobil/LMS sözleşmesi korundu.

İzole PostgreSQL17 + gerçek Express/TS transport kontratı, owner/status/group/range/privacy/DTO/November/read-error kontrolleri PASS; npm run check/build, syntax/diff PASS. Gerçek panel+izole fixture Playwright: read retry, İstanbul 00:30 doğru 8 Ekim, ay sınırları, Kasım yeni aralık, hesap değişiminde özel satırların kaldırılması PASS, ekran görüntüsü kontrol edildi. Production E2E değildir. Yeni migration yok:13 sürüm/41 tablo; canlı Supabase yazma/dağıtım/ödeme/mail yapılmadı. P39/P30/P31/P40 ve ürün kararı gerektiren ana hedefler açık.

Kanıt kaynakları: server/docs/web-calendar.md, server/test/web-calendar-contract.mjs; yönetilen worktree output/calendar-october.png, calendar-november.png, calendar-owner-change.png. Tarayıcı harness captured fixture kullanır; üretim E2E iddiası yok.
