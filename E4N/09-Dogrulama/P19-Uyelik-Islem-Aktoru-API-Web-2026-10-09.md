# P19 — Üyelik işlemi aktörü: veri/API/web teslimi

Tarih: 9 Ekim 2026. Linear: [E4N-159 — Done](https://linear.app/e4n/issue/E4N-159/p19-teslim-grup-uyelik-islemlerinin-aktoru-islem-bagi-ve-web-gecmisi). Ana E4N-91 In Progress.

## Teslim

Yeni kapalı grup başvurusu, üye durumu, üyelik silme, taşıma, grup rol atama, iki mounted shuffle yolu ve grup/hesap silme işlemleri kalıcı geçmişe aktör UUID/ad snapshotı, teknik işlem ve ortak operationId ekler. Taşımanın iki kaydı aynı işlem kimliğine bağlıdır. Üye/admin geçmiş ekranları bunları gösterir; geçersiz aktör yanıtını göstermez.

Migration0025: `server/supabase/migrations/20261009073843_membership_operation_context.sql`; Supabase CLI ile oluşturuldu. İlgili currentDB yetkisi sonrası transaction-local context; commit/rollback bağlantı yeniden kullanımında temizlenir. Eski satırlar/doğrudan DB değişiklikleri null kalır. İsim değişmesi veya aktör/konu hesabının silinmesi geçmiş snapshotını değiştirmez. Özel RLS/ACL, invoker/fixedsearchpath ve immutable kontroller korunur. Yeni grup silme ve mevcut hesap silme yolu güncel DB adminini kontrol eder.

Kapsam kapalı grup bağlantı geçmişidir; lonca/power-team geçmişi ve unmounted legacy users routerı bu teslim değildir. API DB bağlantısı güvenilir kabul edilir; ayrıcalıklı DB sahibi contexti taklit edebilir/triggerı kapatabilir. Teknik işlem türü ürünün çıkarılma nedeni veya dönem kararı değildir.

## Kanıt

- Kod/push: [fc42c49](https://github.com/kaankarakas34/e4n/commit/fc42c49d5afecef8fe30bfef0f52209db5169bdd), codex/e4n-sprint1-foundation.
- Temiz aynı commit, sourceBefore=sourceAfter `786636273e4a9bde15c2e56808831d9fda70d5e557ff311f4bcdb179ef2b5a8c`, dirty=false. Gerçek web/API/finalDB 6 PASS/0FAIL, owned fixture cleanup PASS: `output/history-context/2026-10-09T08-00-35-212Z/report.json`.
- `membership-history-contract.mjs` PASS: fresh25/repeat0,19/24 geçişleri; önceki ledger birebir korunması/null aktör; current-role/owner/spoof/immutable ACL/RLS; no-op replay; tüm mounted kapalı grup writerları; ortak taşıma kimliği; rename/delete; SET LOCAL commit/rollback temizliği; hatalı context transaction rollback.
- Grup kapasite/roster ve shuffle sözleşmeleri PASS: mevcut kapasite/yetki/atomik geçmiş/receipt uyumu. Shuffle log başlığı eski20 etiketini taşır; testin migration sayısı beklentisi25'tir.
- Web-job sözleşmesi PASS: fresh25/repeat0/17 upgrade; job authorization/ledger/crash/replay sınırları.
- Sentetik PG17 pg_dump/pg_restore PASS:47 tablo count+row hash, catalog/ACL/RLS, corruption detection/restore eşitliği,25 repeat0; aktör/operationId ve bilinmeyen başlangıç kaydı HTTP geçmiş yanıtında birebir korunur. Canlı Supabase yedeği değildir.
- `npm run build` temiz kod commitinde PASS; mevcut bundle büyüklüğü/Browserslist uyarıları devam ediyor.
- Supabase CLI2.119.0 `db advisors --db-url <owned loopback fixture> --type security --level error --fail-on none`: exit0, stderr `No issues found`, stdout boş. Bu yalnız izole şemanın security/error taramasıdır; üretim veya kapsamlı güvenlik kabulü değildir. Trigger invoker/fixedsearchpath/ACL ayrıca contract ile doğrulandı.
- Kalıcı kısa rapor: `server/docs/membership-operation-context-web-acceptance-2026-10-09.json`; başarılı ham loglar ignored output altında.

İlk geliştirme denemelerinde migration sırası ve test fixture/veri beklentileri düzeltildi; başarısız denemeler kabul sayılmadı. Son tarayıcı kabulü temiz kod commitinde yeniden çalıştı.

## Kalan ve devam

E4N-91: ürün nedeni/canonical dönem/puan-çıkarma-ban/retention ve geçmiş backfill kararı. Ürün kararları uydurulmaz. Canlı geçiş P09/P36 ve final P37 açık; releaseReady=false. Önceki24 şemasının102 bütün-web sonucu tarihsel kanıttır; yeni25 için yenilenmiş bütün kabul değildir. Root `test:web-rehearsal` yeni aktör browserını gelecek bütün kabul turuna dahil eder; bu turda bütün39 API+102 browser tekrar edilmedi.

Eğitim dışı web önceliği sürer; mobilSprint7/LMS Sprint8 ertelenmiş. Kapsamlı SEC58/59/120 Sprint6. Canlı DB yazma/deploy/gerçek ödeme-mail yapılmadı.

Doküman kontrolü: [Supabase triggers](https://supabase.com/docs/guides/database/postgres/triggers), [25 Eylül PostgreSQL değişiklikleri](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes). Yeni migration ltree/legacyPGP/floatGiST/custom estimator eklemiyor; canlı eski objeler için denetim iddiası yok.
