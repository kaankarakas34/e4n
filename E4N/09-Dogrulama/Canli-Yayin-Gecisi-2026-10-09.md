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
- Yeni 15 tablo/ledger için RLS ve anon/authenticated erişim kapısı; mevcut 34 tabloya kapsamlı SEC incelemesi henüz uygulanmadı.
- Beş eski gömülü bağlantı/manuel DDL/SMTP test betiği kaldırıldı; vercel.json içindeki gömülü DATABASE_URL kaldırıldı. Çalışma ağacındaki izlenen dosyalarda verilen DB parolası/encoded karşılığı 0 eşleşme. Eski Git geçmişi temizlenmedi; DB ve eski SMTP parolası rotasyonu gerekli, güvenlik tamamlandı denmez.

## Kabul ve canlı sonuç
Bekliyor: bütün web kabulü, canlı transaction ve production deployment/domain doğrulaması. Kanıt olmadan canlı tamamlandı denmez.

## Geri dönüş
Önceki çalışan production commit `c5d6323e3c1c2df8c427d958b035b8ab08c6a31d`, deployment `dpl_EQFvR7rHDNRiouU8Jnw69RouE5PK`. Kod rollback yeni veri yazılmadan önce yapılabilir. Veritabanı geri dönüşü için yeni yazılar durdurulmalı, yayın sonrası veriler ayrıca korunmalı; eski yedeği körlemesine geri yüklemek yeni kayıtları kaybettirir. Rol geçişi ayrıca kalıcı transition tablosunda kayıtlıdır. API rollback'in bu yeni rollerle uyumu ayrıca sınanmalıdır. Otomatik yıkıcı geri yükleme yok.
