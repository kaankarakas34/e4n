# Canlı yayın geçişi — 9 Ekim 2026

## Yetki ve hedef
Kullanıcı yapılan değişikliklerin canlıya alınmasını istedi; canlı Supabase bağlantı parolasını sağladı. Hedef Supabase `kaoagsuxccwgrdydxros`, Vercel `e4n`, `event4network.com`. Mobil/LMS ve açık ürün kararları bu yayında tamamlandı sayılmaz. Gerçek ödeme/mail testi yapılmaz.

## Yedek ve gerçek veri provası
- Tam PostgreSQL 17 custom dump: yerel ve Git dışı `output/production-backup-2026-10-09/pre-release-full.dump`, 520274 bayt.
- SHA256: `e7a5be307270c80e81cce687688b84e928300003e880de8272ed7be68d9dd985`.
- Ayrı loopback PostgreSQL'de public şeması; satırlar, kısıtlar, tetikleyici, owner/ACL/RLS geri yüklendi. 34 tablo / 581 kayıt. Auth/storage/platform şemaları arşivde bulunur; platform geri yükleme provası yapılmadı.
- Tüm 27 kaynak geçişi tek transaction'da gerçekten çalıştırıldı; uygulanmamış geçiş damgalanmadı. Sonraki çalıştırma 0 geçiş.
- İkinci bağımsız özgün yedek kopyası ile tüm eski kolon/satırların karşılaştırması PASS. Yalnız 11 COMMUNITY_MEMBER→MEMBER ve vergi numarası normalize/rezervasyon dönüşümü; diğer 581 kayıt alanları korunuyor. 28 kullanıcı, 3 vergi rezervasyonu.
- 116 kaynak kolon farkından eski `notifications.content/is_read` dışında tüm hedef alanlar mevcut. Bu iki kaynak legacy alanı canlıda hiç yoktu; canonical API title/message/read kullanır. Uyumlu TEXT/VARCHAR ve timestamp/timestamptz canlı alanları korunur; saat dilimi dönüşümü yapılmaz.
- Yetkisiz baseline ve gerçek kolon drift'i reddedilir; başarısız transaction ledger bırakmaz. `baseline-guard-report.json` PASS.
- PG17.6 canlı CHECK array cast gösterimi ile PG17.11 restore gösterimi yalnız 18 nesnede eşdeğer biçim farkı taşır. Ayrı tam katalog fingerprintleri doğrulanır; genel drift istisnası yok.
- Restore fingerprint: `ebf1356134a29ea627d185931083ed730d6550fb9d0c5fa55b3b517b985bedc5`; canlı fingerprint: `dbf0b95589036323d57af0b2c70b25386d7511cac9da85bec55024350402549c`.

## Yayın hazırlığı
- DATABASE_URL ve yeni JWT_SECRET yalnız Vercel şifreli production environment'da. JWT değişimi mevcut oturumların tekrar giriş yapmasını gerektirir.
- Vercel içinde node-cron başlatılmaz. İlgili üretim planlayıcı/provider işinin kabulü ayrıca açık; gerçek mail/ödeme gönderilerek test edilmez.
- Kodda doğrudan Supabase tablo erişimi yalnız legacy blog ekranlarında bulundu. API üzerinden kullanılan 47 tabloda RLS ve anon/authenticated grant revoke uygulandı; 47/47 anonim SELECT denial PASS. PostgreSQL owner kullanan gerçek kopya/API sağlık, etkinlik, grup ve rapor GET200; anon groups401 PASS. Blogs/blog_categories istemci geçişi SEC kapsamında açık. Bu izin kapısı kapsamlı güvenlik denetimi değildir.
- Beş eski gömülü bağlantı/manuel DDL/SMTP test betiği kaldırıldı; vercel.json içindeki gömülü DATABASE_URL kaldırıldı. Çalışma ağacındaki izlenen dosyalarda verilen DB parolası/encoded karşılığı 0 eşleşme. Eski Git geçmişi temizlenmedi; DB ve eski SMTP parolası rotasyonu gerekli, güvenlik tamamlandı denmez.

## Kabul ve canlı sonuç
- 40 API/veri contract PASS: `7bc1ff2`, `output/web-acceptance/2026-10-09T12-59-03-505Z/report.json`. İlk tarayıcı turunda eski 5/6 haneli vergi fixture'ları yeni doğrulamaya takıldı; geçerli 10 haneli sentetik VKN ile düzeltildi. 18 CHECK için ayrı canlı fingerprint allowlist düzeltmesi ayrıca gerçek yedek/katalog/rollback ile sınandı; API route/handler kapsamı değişmedi.
- `03a99de` current build + 108 browser/finalDB/cleanup PASS: `output/production-final-acceptance/2026-10-09T13-12-23-295Z/report.json`. 89 ana +7 grup +6 lonca +6 üyelik aktörü. API kanıtı tekrar 40 test çalıştırılmadan değişmeyen route/runtime kapsamından yeniden kullanıldı; aynı-commit 40+108 iddiası yok.
- Yalnız production DB izin SQL'i ve üretilen ownership manifesti `2fefd8ae939f4ec049008d7cef6de0073f4effc6` ile sonlandı; yeni tam restore, 27 geçiş/repeat0, owner API ve 47 anon denial ayrıca PASS. Yeni sürüm checksumları/ürün handlerları değişmedi.
- Canlı transaction 13:21:35 UTC tamamlandı: 27 sürüm/repeat0, 28 kullanıcı, 11 rol geçişi ve 3 kalıcı vergi rezervasyonu. 47 tablonun izin kapısı uygulandı. Üretim e-posta/ödeme çalıştırılmadı.
- `main` ve `codex/e4n-sprint1-foundation` push başarılı. Vercel production `dpl_7NZF4USEqSCdsToRdfeYPQQdFSfN` READY; Git SHA `2fefd8a`, ref main. Aliases `event4network.com`, `www.event4network.com`, `e4n.vercel.app` yeni deployment'a bağlı.
- Gerçek www domain: /api/health-check HTTP200 statusok/dbsuccess; /api/health200; oturumsuz groups401; boş auth/register400. Canlı login→Üye Ol→/auth/register browser/screenshot PASS; dört zorunlu şirket alanı ve normal üyelik açıklaması görünür. Sahte canlı kullanıcı oluşturulmadı; gerçek kayıt/ödeme/mail göndererek test yapılmadı.
- Son canlı SELECT: users28, migrations27, transition11, taxregistry3, usersRLS=true, anon_users_select=false.
- Advisor: INFO47 RLS enabled/no policy (API-owner mimarisi); WARN4 function search_path; ERROR2 blogs/blog_categories RLS disabled. Bunlar SEC58/59/120'de kapanacak; security=PASS denmez. Resmi açıklamalar: https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public ve https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable.
- Linear P09/E4N-81 Done; E4N-109/P37 In Progress, releaseReady=false; E4N-161 mevcut Done teslimine canlı kabul eklendi. 162–165, sağlayıcı/üretim planlayıcı, P36/P38, açık ürün kararları ve SEC ana kabulü kapanmadı.

## Geri dönüş
Önceki çalışan production commit `c5d6323e3c1c2df8c427d958b035b8ab08c6a31d`, deployment `dpl_EQFvR7rHDNRiouU8Jnw69RouE5PK`. Kod rollback yeni veri yazılmadan önce yapılabilir. Veritabanı geri dönüşü için yeni yazılar durdurulmalı, yayın sonrası veriler ayrıca korunmalı; eski yedeği körlemesine geri yüklemek yeni kayıtları kaybettirir. Rol geçişi ayrıca kalıcı transition tablosunda kayıtlıdır. API rollback'in bu yeni rollerle uyumu ayrıca sınanmalıdır. Otomatik yıkıcı geri yükleme yok.
