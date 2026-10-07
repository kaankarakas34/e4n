# P30 — Profil, panel verisi ve oturum kabul paketi

## Teslim — 5 Ekim 2026

Commit/push: `12b2ae3f370e541ad14c7952b833e1ffd75015fe`, yönetilen `codex/e4n-sprint1-foundation` dalı. Önceki P37 gerçek tarayıcı kabulünde saptanan profil SQL hatası bu bütün API/veri/ekran/test paketinde giderildi.

- `/api/users/:id`: canonical `one_to_ones.partner_id`; iki yöndeki görüşme sayısı, tarih/id sıralı son üç görüşme ve karşı taraf adı. Yönlendirme/başarılı ciro/ziyaretçi sayıları mevcut tüm geçmiş kapsamını korur; yeni aylık puan veya hak kuralı seçilmedi.
- Tek read-only repeatable-read snapshot; güncel DB kullanıcısı ve rolü. Sadece kendi özel profili veya güncel ADMIN. Anonim/başka üye/silinmiş/demoted actor testleri. SQL hatası redacted500; artık basic-profile200 fallback yok. Private/no-store, explicit alanlar, password_hash yok.
- Typed web yanıtı owner/target/metric/grup/son görüşme doğrular. Profil ve dashboard geç kalan eski owner/rol/token sonuçlarını atar. Oturum değişikliği önceki performansı temizler; tekrar dene güncel bağlamı yükler. Profil düzenleme sonrası yazma ACK'i yerine tam DTO tekrar okunur.
- ACTIVE grupların tümü listelenir; çoklu kayıtta rastgele primary group seçilmez. Tarayıcı ekran kontrolü başlıktaki eski sabit Liderler Global yazısını ortaya çıkardı: gerçek grup DTO'suyla değiştirildi, son fresh browser bunu da doğrular.

## Kanıt

Yönetilen checkout altında:

- `output/web-acceptance/2026-10-05T18-46-10-332Z/report.json`: 28 PASS / 0 FAIL, exit0. Önceki26 kontrata iki yeni actual PG/Express/web transport ve actual Zustand delayed-owner testleri eklenmiştir; tarihsel26 raporları değiştirilmedi.
- `output/web-browser/2026-10-05T18-52-51-923Z/browser-report.json`: son taze23 PASS / 0 FAIL. Gerçek App/Vite→Express/JWT→PG17; admin profil4görüşme/son3karşıtaraf/gerçekgrup ve foreign member privateprofile reddi dahil. Önceki `18-48-49-384Z`23PASS rapor/screenshot korunur; sabit grup etiketi görselde fark edilip son turda asserted.
- Production build PASS; son UI metin/grup değişikliği sonrası TypeScript PASS; diff/syntax PASS. Route ownership163/18/17legacy. Source15migration/41app+ledger42; yeni migration yok.
- BaseHEAD7687799; test edilen working-tree değişikliklerinin finalcommiti12b2ae3. Aggregate API run sonrası frontend token-effect/header son dokunuşları fresh browser+tsc ile doğrulandı.
- Gerçek ödeme/e-posta/canlıSupabase/deploy yok. Sahte mail, ağ yalnız loopback. İki browser/API/Vite/container kapalı.

## Kabul sınırı ve sıra

P30/P40/P37 ana görevleri In Progress; bu paket üyelik/haklar XL veya bütün web DONE sayılmaz. Mevcut profile read sözleşmesi tamamlandı. Üyelik edit/renew/expire akışlarının tüm hedef hakları, D07 ücret/dönem/exactcutoff/grace başlangıcı/kısıtlı haklar/açılma ve diğer D kararları hâlâ açık. Eski TasksCard demo puan/eğitim anlatımı ve group-scope role/DB invariant/placement history ayrı kalanlar.

Sonraki büyük web paketi P10/P17 grup bazlı rol, üyelik modeli ve doğrudan DB invariant kabulü için mevcut plan/şemayı uzlaştır; D05 hizmet/D08 son onay/D06 shuffle ayrıntılarını seçme. Karardan bağımsız P37 kalan hedef kabul farklarını ilerlet. Mobil Sprint7, LMS Sprint8 en son; broadSEC Sprint6. Bu profil paketini tekrar uygulama.

