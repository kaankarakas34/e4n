# P09 — İstek ve açılış sırasında çalışan DDL envanteri

**1 Ekim 2026.** Kaynak: `codex/e4n-sprint1-foundation` dalındaki `server/src/index.js`, `server/migrations/0002_runtime_extensions.js`, `server/init.sql` ve 0003–0004. Kod statik incelendi; ödeme callback'i veya canlı yazan endpoint çağrılmadı.

**2 Ekim dal güncellemesi:** Aşağıdaki tablo 1 Ekim baz çizgisidir. Çalışma dalında 0005 ile eksik `public_visitors.inviter_id` alanı sürümlü zincire alındı; üç ziyaretçi yolundaki `ALTER TABLE` blokları, destek tablolarının import sırasında `CREATE TABLE` çağrısı ve HTTP `run-migrations` ucu kaldırıldı. Vercel dışı açılış sürümlü koşucuyu kullanır ve tanınmayan sürümsüz şemada API'yi başlatmaz. `server/src/index.js` içinde artık `ALTER TABLE`, `CREATE TABLE` veya doğrudan `runMigrations()` çağrısı yoktur. İzole PostgreSQL 17.11 testinde ziyaretçi başvurusu 201, durum güncellemesi 200, destek listesi 200, eski HTTP migration ucu 404 döndü. Bu değişiklikler canlıya dağıtılmadı; canlı şema adoption/yedek kapısı hâlâ açık.

Varsayılan `npm run migrate` komutu sürümlü koşucuya bağlandı; eski `migrate_supabase.js` init/seed yardımcısı açık opt-in olmadan çıkıyor. İzole test güncel DB'de migration komutunun `applied=0 total=5` yanıtını da doğruladı. `NODE_ENV=test` sırasında cron kapalı tutularak test fixture'ı zamanlayıcı tarafından değiştirilmez.

| Konum | Bugünkü işlem | Risk ve geçiş adımı |
|---|---|---|
| `POST /api/admin/run-migrations` | Admin HTTP isteğinde sürümsüz `runMigrations()` çağırır. | Ledger/checksum olmadan tekrar DDL; P09 sürümlü zincir ve dağıtım aracı devreye girince HTTP yolu kapatılır. |
| Ödeme callback'inin `visitor_registration` dalı | Transaction içinde `public_visitors` için 11 `ALTER TABLE` dener. | DDL lock'ları ödeme yoluna ve transaction'a taşınır. Önce şema sürümü doğrulanır, sonra yalnız INSERT bırakılır. |
| `POST /api/visitors/apply` | Her kayıt denemesinde aynı 11 `ALTER TABLE` çağrısını yapar. | Kayıt isteği şema yetkisine ve lock'a bağlı. Alanlar migration'da tamamlandıktan sonra DDL kaldırılır. |
| `PUT /api/admin/public-visitors/:id/status` | Transaction içinde `public_visitors` için 2, dönüşüm dalında `visitors` için 5 DDL çağrısı yapar. | Durum güncellemesi/ziyaretçi yazımıyla şema değişikliği iç içe. P11 durum sözlüğü ve P09 kolon sürümü tamamlanınca DDL çıkarılır. |
| Modül düzeyindeki destek sistemi | Sunucu import edilirken `tickets` ve `ticket_messages` için `CREATE TABLE IF NOT EXISTS` çağrısı başlar. | Asenkron ve hata yalnız loglanıyor; istek tablonun kurulmasından önce gelebilir. Tablolar 0002'de zaten tanımlı, bu çağrı sürümlü migration sonrasında kaldırılmalı. |
| Vercel dışı sunucu açılışı | `runMigrations()` çalışır; hata non-fatal loglanır, sunucu devam eder. Vercel'de bu blok atlanır. | Yarım şemayla uygulama açılabilir; 0001–0004 zinciri doğrulanıp üretim canlı baseline ayrı tasarlanınca açılış kapısı netleştirilir. |

## Somut eksik kolon

`0002_runtime_extensions.js`, `public_visitors` tablosunu kurar ve birçok ek alanı ALTER ile sağlar; **`inviter_id` alanını eklemez**. 0001/0003/0004 de bu alanı eklemez. Canlı Supabase'de `public_visitors.inviter_id` ve FK var; bu fark [[P09-Kolon-Farklari|P09 kolon karşılaştırmasında]] görünür. Bugünkü temiz 0001–0004 kurulumunda bu alan yalnız ödeme/kayıt/admin HTTP yolundaki lazy DDL çağrısıyla oluşabilir. Bu yüzden runtime DDL hemen silinirse yeni kurulumdaki ilgili INSERT bozulur.

Önce yeni, sıralı migration'da `inviter_id`/FK ve diğer canlıya özgü alanlar için açık kaynak manifesti kurulur; boş kurulum ve canlı biçimli veri kopyası aynı hedefe ulaşır. Ardından API yolu DDL'den ayrılır ve tablo/kolon ön koşulu sağlık/migration kapısında doğrulanır. Eski 0002 dosyasını değiştirmek checksum geçmişini bozacağı için bu ekleme yeni sürüm olmalı. Canlıya bu notla DDL uygulanmaz; gerçek yedek, veri/iş kuralı ve geri dönüş koşulları [[P09-Mevcut-Sema-Gecis-Tasarimi|geçiş tasarımında]].
