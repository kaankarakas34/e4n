# WEB-10 — Aktivite özeti API+web paketi


## WEB-10 — 5 Ekim doğrulanmış teslim

07a8eb3 yönetilen dala push: /me/web-activities JWT mevcut sahibinin eğitim dışı son10 birebir/yönlendirme/ziyaretçi/etkinlik kaydını tek readonly snapshot olarak döndürür. Minimal DTO, gerçek referral direction/counterpart, kaynak status ve created/scheduled tarihleri; eğitim, kişisel iletişim/notes/amount hariç. Admin de kişisel owner scope, query override400, private/no-store, deterministic order. Dashboard+Activities ActivitySummary tek typed API ile error/loading/empty/retry/refreshVersion/token/account guard ve çalışan event/panel linkleri içerir. ACCEPTED/future görüşmeler yapılmış gibi, attendance PRESENT gerçekleşen katılım gibi, gelecek tarih negatif gün önce gibi sunulmaz. Mevcut kayıt statüleri gösterilir; yeni completion/puan/hak kuralı seçilmedi.

İzole PG17/gerçek Express+TS transport: dört kaynak/status/direction/date, auth/admin/owner/query/cache, eğitim/diğer ziyaretçi gizliliği, actual empty owner, deterministic last10/DTO/read-only count/query failure recovery PASS. Gerçek ActivitySummary + captured fixture Playwright error/retry/status/referral/event link/owner replacement/empty PASS ve görsel kontrol. check/build/diff/syntax PASS; mevcut bundle/browser-data warnings. Yeni migration yok13/41; canlı Supabase yazma/deploy/real mail/payment yok. Kanıt server/docs/web-activities.md, server/test/web-activities-contract.mjs, Obsidian WEB10-Aktivite-Ozeti-API-Web-Paketi.md. P26 kayıt-yoklama ayrımı ve P30/P39 ana hedefleri, D01–D10, mobil/LMS ayrı açık kalır.

Kanıt görselleri yönetilen worktree output/activities-statuses.png ve activities-owner-empty.png. Playwright harness gerçek ActivitySummary kullanır; captured isolated fixture üretim doğrulaması değildir. Kendi Vite/browser/PG işlemleri teslim sonrası kapatıldı.
