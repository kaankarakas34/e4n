# P09 — Canlı katalogdan veri içermeyen şema kopyası provası

**1 Ekim 2026. Durum:** üretim dışı teknik prova; canlı yükseltme değildir. Supabase `e4n` projesine yalnız `pg_catalog`/`information_schema` SELECT sorguları yapıldı. Yerel `.env` kapalı `localhost:5433` hedefine işaret ettiğinden canlı PostgreSQL yedek bağlantısı kullanılmadı. Ücretli Supabase branch/proje açılmadı.

## Yöntem ve sonuç

- 34 `public` tablonun 307 kolonu (tür, `NOT NULL`, varsayılan), 113 kısıtı, 10 bağımsız indeksi, 1 fonksiyonu ve 1 tetikleyicisi katalogdan okundu. Kısıtlara bağlı indekslerle toplam 58 indeks elde edildi.
- Yalnız şema nesnelerinden [[P09-Canli-Katalog-Sema.sql|yerel SQL yeniden kurma dosyası]] üretildi (SHA-256 `6317D432EE5AD5D2DF195513C651323694D50859B770EDBC5D9C1B885C7F3369`). Dosyada üretim satırı/INSERT bulunmuyor. Geçici `postgres:17` konteynerinde transaction ile hatasız kuruldu.
- Kurulan şemadan PostgreSQL 17 `pg_dump -Fc --schema-only -n public` alındı. Yeni veritabanına ilk `pg_restore` denemesi varsayılan `public` şeması zaten bulunduğu için durdu. `--clean --if-exists --no-owner --no-acl --exit-on-error` ile geri yükleme başarılı oldu. Hem ilk kopya hem geri yüklenen kopya: **34 tablo, 307 kolon, 113 kısıt, 58 indeks, 1 kullanıcı tetikleyicisi, 1 public fonksiyon**.
- Canlı katalogla yerel ilk kopyanın 480 nesne tanımı karşılaştırıldı: 462 metin olarak aynı. Kalan 18'i yalnız CHECK kısıtı tanım metni; `pg_get_constraintdef` yeniden parse sırasında tip dönüşümü ifadesini başka biçimde yazdı. Örnek: `ARRAY['ACTIVE'::character varying, ...]::text[]` → `ARRAY['ACTIVE'::character varying::text, ...]`. Aynı değerleri kontrol eder; katalog metninin byte eşitliği yoktur. Bu fark ayrıca doğrulanmadan tam yapısal eşdeğerlik iddiası kurulmaz.
- Sürümlü koşucu `adoptLegacyInit: true` ile bu 34 tabloluk yerel kopyada çağrıldı. Beklenen `Existing schema does not match the known init.sql baseline` hatasıyla reddetti; rollback sonrası `schema_migrations` tablosu kalmadı. Mevcut canlı biçimi yanlışlıkla eski `init.sql` kurulumu sayılmıyor.

## Sınır

Bu dosya gerçek bir `pg_dump` üretim yedeği değildir: katalogdan yeniden kurulmuş **yalnız public uygulama şemasıdır**. Üretim satırları, roller, GRANT/RLS politikaları, Supabase yönetim şemaları, Storage/Auth içeriği ve dış bağımlılıklar kopyalanmadı. Canlı yedekten geri yükleme süresi ve uygulama verisi koruma testi yapılmış sayılmaz. Bu nedenle [[P09-Mevcut-Sema-Gecis-Tasarimi|canlıdan sürümlü geçiş taslağının]] veri dönüşümü ve geri dönüş kapıları açık; P09 In Progress.

Bağlı Supabase proje metadata'sı PostgreSQL 17.6 sunucusunu gösteriyor ancak veritabanı parolasını/yedek dosyasını vermiyor. Yerel `server/.env` yalnız kapalı `localhost:5433` hedefine bağlı; yerel `pg_dump` sürümü 15, canlı sunucu 17. Gerekli gerçek yedek için PostgreSQL 17 istemcisiyle yetkili `pg_dump`/Supabase CLI `db dump` veya Dashboard yedek erişimi gerekir. Supabase'in [yedek kılavuzu](https://supabase.com/docs/guides/platform/backups) mantıksal dışa aktarım ve platform yedeğinin sınırlarını açıklar. Erişim sağlanmadan canlıya yalnız ledger/DDL yazmak geri dönüş kanıtı oluşturmaz.

Geçici konteynerler prova bitince durdurulup silindi. Kod dalında üretim migration'ı değiştirilmedi, canlı veritabanına DDL/DML uygulanmadı. Supabase'in [yerel geliştirme iş akışı](https://supabase.com/docs/guides/local-development/cli-workflows) şema/migration'ların sürüm kontrolüyle yerelde sınanmasını önerir; bu katalog provası tam CLI `db pull` veya gerçek yedeğin yerini tutmaz.
