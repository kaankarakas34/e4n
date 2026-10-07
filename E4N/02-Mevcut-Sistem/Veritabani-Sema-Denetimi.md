# Veritabanı şeması ve veri modeli denetimi

**Tarih:** 1 Ekim 2026. **Linear:** [E4N-62 — canlı Supabase şeması denetimi](https://linear.app/e4n/issue/E4N-62/aud-04-canli-supabase-semasini-uygulama-ihtiyaclarina-gore-denetle). Bu not, üretim `e4n` Supabase projesinde yalnız salt okunur katalog ve toplu sayım sorguları ile repo kodunun karşılaştırmasıdır. Bulguların hiçbiri canlı veride denenerek düzeltilmedi. Kişi bilgisi veya gizli değer kaydedilmedi.

## Teknik kapsam

Bir veritabanı modeli yalnız tablo listesi değildir. Denetim; alan türleri, boş bırakılabilirlik, varsayılanlar, ilişkiler, benzersizlik ve durum kısıtları, indeksler, tetikleyiciler, veri yaşam döngüsü, geçmiş kaydı ve kodun gerçekten yaptığı sorguları birlikte inceler.

| Canlı `public` envanteri | Sayı | Kaynak |
|---|---:|---|
| Tablolar | 34 | `information_schema.tables` |
| Kolonlar | 307 | `information_schema.columns` |
| PK/FK/unique/check kısıtları | 113 | `pg_constraint` |
| İndeksler | 58 | `pg_indexes` |
| Tetikleyici olayları | 2 | `information_schema.triggers`; aynı `group_members` tetikleyicisinin INSERT ve UPDATE olayları |

[[E4N/02-Mevcut-Sistem/Canli-Supabase-Tablolari|Tablo ve satır sayıları]], [[E4N/02-Mevcut-Sistem/Canli-Veri-Iliskileri|43 yabancı anahtar]], [[E4N/02-Mevcut-Sistem/Sema-Kaynaklari|şema kaynakları]] ve [[E4N/02-Mevcut-Sistem/Kaynak-Canli-Sema-Farklari|kolon farkları]] ayrı envanterlerdir.
Tüm 307 kolonun türü, null/default bilgisi ve tablo bazında kısıt/indeks adları [[E4N/02-Mevcut-Sistem/Canli-Sema-Katalogu|canlı şema kataloğunda]] yer alır.

## Doğrulanmış uyumsuzluklar ve model eksikleri

| Kod | Kanıt | Olası etki / veri modeli ihtiyacı | Durum |
|---|---|---|---|
| DB-01 | Canlı `group_members.status` ve `power_team_members.status` check kısıtları yalnız `ACTIVE`, `REQUESTED` kabul ediyor. `server/src/index.js:3508–3510` ve `3548–3550` shuffle / üye taşıma sırasında `INACTIVE` yazıyor; `GroupManagerDashboard.tsx:706–755` ret için `REJECTED` gönderiyor. | Bu yazmalar mevcut kısıtta hata üretir ve işlem başarısız olur. Başvuru/üyelik/çıkış durumları tek yaşam döngüsünde tanımlanmalı. | Şema+kod kesin; uçtan uca çağrı denenmedi. |
| DB-02 | Canlı `visitors.status` check kısıtı `INVITED`, `ATTENDED`, `JOINED`, `NO_SHOW`; `server/src/index.js:1092` `CONVERTED` yazıyor. | Ziyaretçiyi üyeye dönüştürme yolu mevcut kısıtla çelişiyor. Geçiş durumları tek sözlükte tanımlanmalı. | Şema+kod kesin; endpoint çalıştırılmadı. |
| DB-03 | `server/src/index.js:393–407` puan hesabı önce `users.performance_score/color` güncelliyor, sonra `user_score_history` tablosuna yazıyor; canlı 34 tabloda bu tablo yok. Fonksiyon hata yakalayıp logluyor, ayrı bir transaction açmıyor. | Kullanıcı puanı güncellenip geçmiş kaydı başarısız kalabilir; çağırana sonuç dönmeyebilir. Aylık puanların ve kesinleşmiş sonuçların saklanma biçimi tasarlanmalı. | Kod ve tablo yokluğu kesin; canlı çağrı denenmedi. |
| DB-04 | `group_members` üzerinde `UNIQUE(user_id, group_id)` var, fakat kullanıcı başına tek etkin kapalı grup kısıtı yok. Çıkarma API'si `server/src/index.js:3450` üyelik satırını siliyor. | Aynı üye farklı gruplarda etkin kalabilir; çıkarılma sayısı/sekiz aylık yasak bu satırdan geri kurulamaz. Dönemsel grup üyeliği ve çıkarılma olayı ayrı tutulmalı mı değerlendirilmeli. | Şema+kod kesin; hedefle ayrıntılı kıyas sonraki aşamada. |
| DB-05 | `groups.cycle_months` canlı varsayılanı **6**, mevcut tek grupta değer **6**. Zaman damgalı döngü başlangıcı var. | Dönem verisi saklanıyor; dört aylık hedefe geçişte mevcut grubun başlangıç ve geçiş kuralı ayrıca kararlaştırılmalı. | Canlı metadata ve toplu sorgu ile kesin. |
| DB-06 | Canlı `group_members` tetikleyicisi `fn_check_group_profession_unique()` etkin ACTIVE üyelerin `users.profession` metnini tam eşitlikle karşılaştırıyor; INSERT ve `user_id/group_id` UPDATE'inde çalışıyor, `status` UPDATE'inde çalışmıyor. | Aynı mesleğe REQUESTED başvuru `P0001` ile reddedildi; boş grupta iki REQUESTED satırı etkin API ile ACTIVE yapıldığında iki kayıt birden kaldı. Meslek metni ayrıca yakın/çoklu hizmet matrisini temsil etmez. | Kaynak ve izole çalışma zamanı doğrulandı; [[E4N/09-Dogrulama/P16-Meslek-Tetikleyici-Provasi|P16 kanıtı]]. Canlı çağrı yapılmadı. |
| DB-07 | `payment_transactions.status` için check kısıtı yok; `amount`, `action_type`, `user_id` boş olabilir. `merchant_oid` PK. `created_at`/`updated_at` saat dilimsiz, üyelik ve etkinlik zamanları saat dilimli. | Ödeme olayının türü/tutarı/hesap bağı ve zaman yorumu uygulamaya bırakılmış. İşlem geçmişi ve callback tekrarları için durum geçişi ve idempotency kuralı denetlenmeli. | Şema kesin; iş kuralı ve gerçek callback etkisi açık. |
| DB-08 | `event_tickets` yalnız `ticket_number` benzersizliğini zorunlu kılıyor; `event_id` ve `user_id` nullable, çift için unique kısıtı yok. `attendance` ise `UNIQUE(event_id,user_id)` kullanıyor. | Aynı etkinlik/üye için tekrar bilet ihtimali veritabanında engellenmiyor. Çoklu biletin ürün kararı olup olmadığı netleştirilmeli. | Şema kesin; tekrar bilet örneği canlıda yok (tablo boş). |
| DB-09 | `public_visitors` için e-posta unique kısıtı yok. Salt okunur sayımda aynı küçük harfli e-postayı taşıyan **5 e-posta grubu** bulundu; kişi bilgisi alınmadı. | Aynı kişinin farklı etkinlik başvuruları meşru olabilir. Tekillik anahtarı e-posta mı, etkinlik+e-posta mı, başvuru kimliği mi belirlenmeli; mevcut tekrarlar körlemesine silinmemeli. | Veri örüntüsü kesin; mükerrer/normal ayrımı açık. |
| DB-10 | `server/init.sql` ile `server/src/config/migrate.js` toplam **31** farklı tablo tanımlar; diğer **3** tablo için `server/migrate_friends.js` ve `server/create_blogs_table.js` bulundu. Vercel başlatmasında `runMigrations()` atlanıyor (`server/src/index.js:4618–4625`). | 34 tablonun kaynak adı bulundu, fakat sıralı migration/yürütüm geçmişi ve canlı şemanın yeniden kurulabilirliği kanıtlanmadı. | Kod/katalog kesin; yürütüm geçmişi açık. |
| DB-11 | Supabase performans danışmanı **30 indekslenmemiş yabancı anahtar** ve **8 kullanılmayan indeks** bildiriyor. Örnek: `events.group_id`, `event_tickets.event_id/user_id`. | Sorgu büyüdükçe ilişki join/silme maliyeti artabilir. Yük ve sorgu planı ölçülmeden tüm indeksleri ekleme/silme kararı verilmemeli. | Danışman bulgusu; performans etkisi ölçülmedi. [Supabase kuralı](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys). |
| DB-12 | Canlı `notifications` alanları `title/message/read`; kurulum ve API `content/is_read` bekliyor (`server/src/config/migrate.js:211–220`, `server/src/index.js:425,2970,2979,3668`). Canlı tabloda 0 kayıt var. | Bildirim INSERT ve okundu UPDATE SQL'i şemayla uyumsuz. `title/message` NOT NULL olduğundan yalnız eski alanları eklemek de INSERT'i çalıştırmaz. | Şema+kod kesin; canlı işlem denenmedi. |
| DB-13 | `public_visitors` için ayrı kurulum scripti `group_id` ve `email NOT NULL` tanımlıyor; canlıda `group_id` yok, e-posta nullable ve 2 kayıt boş/null. API `inviter_id` alanını istek sırasında `ALTER TABLE` ile eklemeye çalışıyor (`server/src/index.js:2521,2790,2839`). | Birden fazla kurulum yolu farklı şemalar üretir; HTTP istekleri şemayı değiştirebilir. Başvuru ilişkisi ve e-posta zorunluluğu tek şemada tanımlanmalı. | Kod+canlı katalog/toplu sayım kesin; script yürütümü açık. |
| DB-14 | `payment_transactions.user_id` canlı 5/5 kayıtta boş; bunların 2'si `membership/PENDING`, 3'ü ziyaretçi ödemesi. Kod `merchant_oid` ile callback kaydını buluyor (`server/src/index.js:2365`). | Üyelik ödemesinin kullanıcıyla kalıcı bağı veritabanı sütununda görülmüyor; `action_data` veya başka ilişki kullanılıyorsa sözleşmesi doğrulanmalı. Kayıt içeriği/kişisel veri açılmadı. | Toplu sayım ve kod kesin; uçtan uca sahiplik davranışı açık. |
| DB-15 | `public_visitors.status` check kısıtı yok; 402 kayıttan 1'i `PENDING/CONTACTED/CONVERTED/REJECTED` dışında. `users.company` 23 hesaptan 5'inde boş/null. | Durum sözlüğü ve şirket uygunluğu bugün DB tarafından zorlanmıyor; geçmiş verinin anlamı açıklanmadan veri temizliği yapılmamalı. | Toplu sayım kesin; kayıtların nedeni açık. |

## Toplu veri bütünlüğü kontrolleri

Salt okunur denetimde kullanıcı e-postası için küçük harfe indirgenmiş tekrar **0**, birden fazla ACTIVE gruba bağlı kullanıcı **0**, `group_members`/`power_team_members` boş status **0**, başlangıcından önce biten etkinlik **0**, sıfır veya negatif ödeme tutarı **0** bulundu. Bu değerler mevcut verinin anlık durumudur; şemanın gelecekte bu durumları tümüyle önlediği anlamına gelmez.

## Denetimin sınırı ve geliştirme öncesi doğrulama

Canlı 307 alanın katalogu, 43 ilişki, kısıt/indeks/trigger envanteri ve kritik yazma yollarının kaynak karşılaştırması tamamlandı. Bu, her endpointin çalışma zamanında başarıyla yürüdüğü veya migration geçmişinin bilindiği anlamına gelmez.

1. Puan yazımı, shuffle transaction'ı, ziyaretçi dönüşümü, bildirim ve callback tekrar davranışını izole test veritabanında doğrula; üretime yazma yapma.
2. Geliştirme planından önce hedef veri yaşam döngülerini (aylık puan, dönem, çıkarılma/yasak, hizmet çakışması) ve geçiş kurallarını kararlaştır.
3. `notifications`, ödeme sahipliği ve çok kaynaklı migration farkları için değişiklik taslağını canlı veriyle uyumlu migration olarak hazırla.

Bilinen erişim/gizli değer güvenliği işi kullanıcı kararıyla ertelenmiştir; [[E4N/00-Proje/Calisma-Sirasi|çalışma sırası]] geçerlidir.
