# Kaynak kod ve canlı Supabase şeması farkları

**1 Ekim 2026.** Karşılaştırma, canlı `public` şemasındaki 34 tablo ve 307 kolonu `server/init.sql`, `server/src/config/migrate.js`, ayrı kurulum scriptleri ve API içindeki şema değiştirme ifadeleriyle eşleştirir. Canlı katalog: [[E4N/02-Mevcut-Sistem/Canli-Sema-Katalogu|307 kolon]]. Sorgular salt okunurdu. `CREATE TABLE IF NOT EXISTS` mevcut tabloyu değiştirmediği için kaynak tanımı canlı tabloyla aynı olmak zorunda değildir; hangi scriptin ne zaman çalıştığına dair güvenilir yürütüm geçmişi yok.

## Kaynakta tanımlı, canlıda bulunmayan alanlar

| Tablo.alan | Kaynak | Gözlenen sonuç |
|---|---|---|
| `notifications.content` | `server/src/config/migrate.js:215`; yazım `server/src/utils/notifications.js:10`, `server/src/index.js:3668` | Canlıda yok. Bildirim INSERT'i bu alan yüzünden hata verir. |
| `notifications.is_read` | `server/src/config/migrate.js:216`; okundu işaretleme `server/src/index.js:425,2970,2979` ve `server/src/routes/notifications.js` | Canlıda yok. Bu UPDATE yolları hata verir. |
| `public_visitors.group_id` | `server/create_public_visitors.js`, `server/migrate_public_visitors_group.js` | Canlıda yok. Scriptin canlıda uygulanması kanıtlanmadı. Aktif başvuru API'si `event_id`/`inviter_id` kullanıyor. |
| `referrals.notes` | Alternatif tablo tanımı `server/src/config/migrate.js:59–73` | Canlıda yok; `server/init.sql` tanımında da yok. Aktif API'nin alanı kullanımı doğrulanmadı. |

## Canlıda bulunan, incelenen şema kurulum ifadelerinde bulunmayan alanlar

| Tablo.alan | Canlı özellik | Kod karşılığı / sınır |
|---|---|---|
| `notifications.title`, `notifications.message`, `notifications.read` | `title/message` NOT NULL; `read` varsayılan false | Kurulumdaki `content/is_read` modelinden farklı. Bu üç alanın canlıya hangi değişiklikle geldiği repo şema kaynaklarında bulunmadı. Sadece kolon eklemek, zorunlu `title/message` sağlanmadan INSERT'i düzeltmez. |
| `groups.description` | nullable text | İncelenen `init.sql`, runtime migration ve ayrı kurulum scriptlerinde tanım bulunmadı. |

`public_visitors.inviter_id` canlıda var ve `server/src/index.js:2521,2790,2839` HTTP yolları içinde `ALTER TABLE` ile eklenmeye çalışılıyor. `users.marketing_consent`, `explicit_consent`, `consent_date` alanları `server/add_consent_columns.js` içindeki çoklu `ALTER TABLE` ifadesinde tanımlı. `friend_requests.created_at`, `event_tickets.created_at` ve `user_achievements` ek alanları kaynakta var; SQL satır içi yorumları nedeniyle basit metin ayrıştırmada ilk taramada yanlışlıkla eksik görünmüştü. Bu fark listesine alınmadılar.

## Alan türü ve yaşam döngüsü açısından önemli ayrımlar

- `notifications` kurulum taslağı `created_at TIMESTAMP` kullanırken canlı alan `TIMESTAMPTZ`; asıl işlevsel fark kolon adları ve zorunlu alanlardır.
- `public_visitors` için ayrı kurulum scripti `email NOT NULL` ve `group_id` tanımlar. Canlı `email` nullable; toplu sayımda boş/null e-posta **2**. Canlıda `group_id` yok. Bu scriptin mevcut şemayı kurduğu varsayılamaz.
- `payment_transactions.user_id` nullable; canlı **5/5** kayıtta boş. Bunların **2** tanesi `action_type=membership`, `status=PENDING`; kalan 3 kayıt ziyaretçi kaydı ödemesi. Üyelik ödeme kaydının hesaba hangi alanla bağlandığı callback kodu ve veri modeli birlikte incelenmeli. Bu sayım kişisel işlem içeriğini açmaz.
- `public_visitors.status` için canlı check kısıtı yok; **1/402** kayıtta `PENDING/CONTACTED/CONVERTED/REJECTED` dışı bir değer var. Geçmiş veri veya serbest durum yazımının nedeni bilinmiyor.
- `users.company` boş/null **5/23**. Bu, şirket şartının canlı veri ve kayıt yoluyla henüz zorlanmadığını destekler; mevcut hesapların nasıl ele alınacağı ürün kararıdır.

## Çalışma zamanı ve yeniden kurulum sınırı

Canlı `notifications` tablosu boş; bildirim akışının hatası üretimde çağrılarak doğrulanmadı. Canlıda `user_score_history`, `generated_leads`, `messages`, `revenue_entries` tabloları bulunmuyor. `user_score_history` puan yazımı için çağrılıyor; diğerleri çoğunlukla silme/özet kodunda referanslı. Kodun hata yakalama davranışı yola göre ayrı incelenmelidir.

Kurulum için tek, sıralı, sürümlü migration zinciri görülmedi. Supabase migration listesi boş döndü; ayrı scriptlerin ne zaman çalıştırıldığı ve canlıdaki elle/haricen yapılan değişiklikler kanıtlanamadı. Bu denetim canlı şemanın bugünkü durumunu doğrular, sıfırdan aynı sonucu kurabileceğini doğrulamaz.
