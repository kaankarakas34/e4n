# E4N-132 — Referans yaşam döngüsü: API, web ve mobil

Tarih: 4 Ekim 2026 (Europe/Istanbul). Teslim: `c1f5b102c03ba6a1c1c77f14e3a2d82b010565d1`, `codex/e4n-sprint1-foundation`, push başarılı.

## Paket kapsamı

- Owner gelen/giden liste, doğru giver/receiver isimleri; grup/lonca üyelerinden veya mevcut `/user/friends` bağlantılarından alıcı kimliği. Web external seçimindeki UUID kaybı giderildi.
- Web Referans ve Ciro aynı workspace; mobil Referans aynı typed domain service (yalnız transport importu farklı). Tür/sıcaklık/açıklama/isteğe bağlı tahmini hacim, başarılı/olumsuz alıcı sonucu ve pozitif ciro; arama, yön ve gerçek özet.
- Yeni optional requestId mevcut referral PK'sini kullanır; aynı owner/payload tekrar tek kayıt ve skor/history. Referrals ve mevcut giver skor/history aynı transaction; katsayı, aylık değerlendirme ve hak uydurulmadı. Yeni migration yok: 10 sürüm/37 tablo.
- Receiver-only PENDING karar, sonuçlandırılmış aynı durum/tutar replay200; değişmiş sonuç409. Eşzamanlı karşıt karardan biri200, biri409. Create ve status skor-hatası bütün yazmayı rollback eder.
- Actual row/ACK doğrulaması; HTTP/shape failure≠gerçek boş/0. Decimal string tutarlar numeric toplanır; eski başarılı satırda amount yoksa toplam Bilinmiyor. Oturum, alıcı scope, ABA/unmount ve geç read; tek mutation lock. Onaylı kayıt + refresh hatası kayıt başarısızlığı gibi gösterilmez.
- Web store status Supabase/yerel sahte başarı yerine gerçek ortak API; owner read sequence, eski disk cache temizliği.

## Kabul kanıtı

Yönetilen checkout: `C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2`; mobil: `C:/Users/murat/OneDrive/Desktop/e4n2/mobile`.

| Kontrol | Sonuç |
|---|---|
| `node test/referral-lifecycle.mjs <mobile-root>` | Gerçek iki TSX/domain source, kontrollü hooks/transport; scope/alıcı/ciro, wrong ACK, samekey retry, same-tick lock, read/error/empty, numeric total/missing amount, confirmed save refresh failure, session ABA/unmount PASS |
| `node server/test/referral-contract.mjs <mobile-root>` | Gerçek web ve mobil bearer transport/service→Express→disposable PostgreSQL17; group/team/friend sources, owner/foreign/anon, invalid fields, create race/key collision, receiver restriction, terminal race/replay, create+status skor/history rollback PASS |
| `node test/referral-api.mjs`, `node test/referral-store.mjs` | HTTP/network reject, true[]/0, status write/cache failure, stale owner read PASS |
| `node server/test/isolated-smoke.mjs` | Mevcut schema/route/sentetik veri regresyonları exit0; raporlanan mevcut diğer hatalar düzeldi sayılmadı |
| Web `npm run build` / final `npm run check` | exit0; mevcut bundle/browser-data uyarıları korunur |
| Mobil TypeScript ve offline Android Metro export | final exit0 /1401 modül; source cihaz kabulü değil |
| Scoped patch `git apply --reverse --check`, staged `git diff --cached --check` | PASS |

Bir test-harness turunda callback biçimli pool.query ile async fault-injection connect çakışması beklemeye yol açtı; fixture sorgusu fault injection öncesine taşındı, yalnız kendi işlem/konteyneri kapatıldı ve son test exit0 tekrar geçti. Ürün arızası veya canlı işlem değildir. Tüm test konteynerleri kapalı.

## Açık sınırlar

- Browser DOM ve gerçek native cihaz acceptance, mobil authoritative repo/no-remote entegrasyonu ve yayın açık. Dirty ayrı mobil kaynağın diğer değişiklikleri/gitlink korunur; yalnız iki dosyanın scoped patch'i managed branch'te.
- Create anahtarı bellekte; reload recovery yok. Alıcı recorded amount değiştirdiyse aynı create replay409 verir, listeyle uzlaştırma gerekir; yeni satır açmaz. Eski keyless API tüketicisi dedup değildir.
- Kaydedilmeyen NEW/RECURRING/currency seçenekleri kaldırıldı; ayrı finansal revenue ledger, geçmiş ciro düzeltme politikası veya aylık puan kuralı eklenmedi.
- Grup/member kaynak endpointlerinin genel auth/RLS davranışı değiştirilmedi; Sprint6 kapsamlı denetim açık. Bu paketin referral owner/receiver sınırları testlidir.
- Canlı Supabase yazma, üretim deploy, gerçek ödeme veya SMTP yapılmadı. Ana P32/PAR ve D kararlarına bağlı hedefler açık.

## Sonraki bütün paket

E4N-133 / P32-E: kişisel rapor API/web/mobil ortak gerçek kaynak. Mobil `/users/me/stats` failure sonrası sabit0 ve doğrulanmayan yılbaşı/grup kapsamı var. Önce mevcut metrik owner/tarih/yön/eksik sözleşmesi, sonra salt okunur ortak API+iki ekran ve HTTP/PG/TSX/build/Android kabulü; yeni D puan/hak kuralı seçme. Adımlar tek paket olarak Linear'a yazıldı.
