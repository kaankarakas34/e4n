# WEB-09 — Grup ve toplantı API+web paketi


## WEB-09 — 5 Ekim doğrulanmış teslim

b1dc464 yönetilen dala push: /me/web-groups JWT sahibi/mevcut kullanıcı, ACTIVE grup+üyelik, minimal aktif üye DTO, readonly repeatable snapshot; query owner/group override reddi, admin için kişisel kapsam ve private/no-store. Dashboard katalog/ilk gruba primary atama yerine açık çoklu grup seçimi, roster+profil linkleri ve sıralı tekil gelecek toplantıları tek panelde gösterir. Hata/retry, başarılı boş okuma, token/hesap bağlamı ve eski yanıtların engellenmesi birlikte teslim.

İzole PG17/Express gerçek TS transport/DTO, owner/auth/admin/query/cache/active/requested/draft/üyelik kaldırma/bozuk tarih/query failure recovery PASS. Gerçek widget+captured fixture Playwright: error/retry, group seçimi, member linkleri, tarih sırası, group/owner değişimi ve revocation empty PASS; görsel kontrol PASS. check/build/diff/syntax PASS. Şema13/41; yeni kaynak migration yok. İzole fixtureda opsiyonel meeting_time/link sütunları eklenerek ikinci mevcut-şema varyantı da test edildi; canlı yazma/deploy/ödeme/mail yok.

Bulgu: sürümlü baseline groups tablosu meeting_time/link içermiyor; legacy admin create/update bunlara başvuruyor. Yeni okuyucu to_jsonb ile null/bağlantı belirtilmemiş güvenli fallback yapıyor; admin yazma drift'i P09/P11/P39 kalan kapsamdır. P30 yeni hak/kabul/puan ve D01–D10 politikaları seçilmedi; P39 ana görev açık, mobil/LMS ertelenmiş. Kanıt server/docs/web-groups.md ve Obsidian WEB09-Grup-Toplanti-API-Web-Paketi.md.

Kanıt: yönetilen worktree server/test/web-groups-contract.mjs, server/docs/web-groups.md, output/groups-selected.png ve groups-owner-empty.png. Kendi browser/Vite/PG süreçleri teslim sonrası kapatıldı. Üretim E2E yapılmadı.
