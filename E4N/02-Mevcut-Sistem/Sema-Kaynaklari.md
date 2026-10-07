# Şema kaynakları ve canlı veritabanı karşılığı

1 Ekim 2026 statik kod taraması ile [[E4N/02-Mevcut-Sistem/Canli-Supabase-Tablolari|canlı 34 tablo envanteri]] karşılaştırıldı. Bu, migration dosyalarının canlı projede hangi tarihte çalıştırıldığını kanıtlamaz; Supabase migration geçmişi araçta boş döndü.

| Kaynak | Gözlenen rol | `CREATE TABLE IF NOT EXISTS` sayısı |
|---|---|---:|
| `server/init.sql` | Docker PostgreSQL ilk kurulumunda mount; `server/migrate_supabase.js` de bu dosyayı okur | 20 |
| `server/src/config/migrate.js` | `server/src/index.js` içinde Vercel dışı başlatmada ve `/api/admin/run-migrations` çağrısında çalıştırılabilir; kolon ekleme ve ayar seed işlemleri de var | 19 |
| `server/src/index.js` | Bilet endpointleri yakınında ayrıca tablo oluşturma SQL'i bulunur | 2 (yukarıdaki 19 ile aynı tablolar) |
| `server/migrate_supabase.js` | Ayrı `npm run migrate` komutu; `init.sql` ve seed SQL dosyalarını çalıştırır | Doğrudan tablo tanımı yok |
| `server/migrate_friends.js` | `friend_requests` için ayrı kurulum scripti | 1 |
| `server/create_blogs_table.js` | `blog_categories` ve `blogs` için ayrı kurulum scripti | 2 |
| `server/create_public_visitors.js` ve diğer `server/*` şema scriptleri | Tekil tablo/kolon kurulumları; bazıları alternatif tanım içeriyor | Çakışan tanımlar |

İlk iki kaynaktaki tablo adlarının birleşimi **31 tablo**. Bunların tamamı canlı `public` şemada var. Diğer **3 tablonun** (`friend_requests`, `blogs`, `blog_categories`) kaynak tanımları yukarıdaki ayrı scriptlerde bulundu. Dolayısıyla 34 canlı tablo adının tamamının repoda bir tanımı var. Scriptlerin canlıda çalıştırılma sırası/tarihi ve canlı şemaya sonradan yapılan değişiklikler hâlâ belirsiz.

Şema tek kaynaktan yönetilmiyor: Docker ilk kurulum SQL'i, açılışta çalışan idempotent migration kodu, ayrı Supabase migration komutu ve bazı HTTP akışlarının içindeki `ALTER TABLE` / `CREATE TABLE` ifadeleri birlikte bulunuyor. Özellikle `public_visitors` kolonları başvuru ve ödeme callback akışlarında da değiştirilmeye çalışılıyor. Bu nedenle kod dosyası ile canlı şema eşleşmesi tablo adından ibaret değildir; kısıtlar, varsayılanlar ve kolon tipleri ayrıca karşılaştırılmalı.

Kolon düzeyindeki doğrulanmış farklar [[E4N/02-Mevcut-Sistem/Kaynak-Canli-Sema-Farklari|kaynak–canlı şema farkları]] notunda. Özellikle `notifications` için canlı `title/message/read` ile kodun `content/is_read` kullanımı çatışıyor. Canlıda `groups.description` da kurulum kaynaklarında bulunmuyor. `public_visitors.inviter_id` ise API içindeki `ALTER TABLE` ifadeleriyle açıklanabiliyor; kurulum scriptleri arasında `group_id` ve e-posta null kuralı farklı.

`server/src/index.js` sonundaki başlangıç bloğu `process.env.VERCEL` varsa `runMigrations()` çağrısını atlıyor. Bu nedenle Vercel konfigürasyonu altında canlı şemanın uygulama başlarken eşitlenmesi beklenemez; gerçek dağıtım ortamı hâlâ doğrulanmalı.

Canlı sistemde `user_score_history`, `generated_leads`, `messages`, `revenue_entries` bulunmuyor; API kodunda bu isimlere referanslar var. Bu yollardaki hata davranışı çalışma zamanında henüz doğrulanmadı.

## Açık doğrulama

1. Scriptlerin gerçek yürütüm sırası ve eski dağıtım/manuel SQL geçmişi mevcut kayıtlardan kanıtlanabiliyorsa belirle.
2. Yeni geliştirme öncesi tek sürümlü migration zinciri ve canlıdan yeniden üretilebilirlik doğrulaması tasarla.
3. Bildirim ve diğer kolon farklarını izole veritabanında uçtan uca doğrula; üretimde düzeltme yapma.
