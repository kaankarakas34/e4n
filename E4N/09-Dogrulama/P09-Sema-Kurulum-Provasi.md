# P09 — 34 tabloluk sürümlü şema kurulum provası

**1 Ekim 2026. Linear:** [E4N-81](https://linear.app/e4n/issue/E4N-81/p09-surumlu-migration-tabanini-ve-sema-kurulum-provasini-olustur). Kod dalı `codex/e4n-sprint1-foundation`; ilgili commit'ler `9e0fab6` ve `785cc80`.

## Kurulum yolu

`server/src/config/versioned-schema.js` yalnız izole prova içinde kullanılan dört sıralı adımı tek transaction ve advisory lock ile çalıştırır:

1. `0001_init_schema`: `server/init.sql` dosyasının demo seed öncesi şema bölümü.
2. `0002_runtime_extensions`: eski `runMigrations()` DDL'sinin `server/migrations/0002_runtime_extensions.js` içine sabitlenmiş sürümü, aynı DB istemcisi üzerinden. Mevcut import yolu ince uyumluluk sarmalayıcısıdır.
3. `0003_legacy_tables`: eskiden yalnız ayrı scriptlerde olan `friend_requests`, `blog_categories`, `blogs` ve blog indeksleri (`server/migrations/0003_legacy_tables.sql`).
4. `0004_notifications_contract`: kaynak bildirim tablosuna canlıdaki hedef `title/message/read` alanlarını ekler; eski alanları kontrollü taşır.

`schema_migrations` sürüm/checksum/tarih kaydı tutar. Bilinen sürümlerin checksum'u değişirse, sıra bozulursa veya var olan sürümsüz bir veritabanı otomatik sahiplenilmeye çalışılırsa işlem reddedilir. Bu son engel özellikle canlı Supabase şeması için önemlidir: tabloların adlarının aynı olması kolonların, kısıtların ve verilerin aynı olduğu anlamına gelmez.

## İzole doğrulama

`server/` içinde `npm run test:isolated`, geçici PostgreSQL 17.11 ve sentetik verilerle başarılı:

| Ölçüm | Sonuç |
|---|---|
| Boş DB'de sıralı adım | 4/4 uygulandı; meta tablo hariç 34 uygulama tablosu. |
| Aynı adımları tekrar çalıştırma | 0 yeni sürüm. |
| Değiştirilmiş checksum | Reddedildi. |
| Sürümsüz ama mevcut tablolar | Otomatik baseline kabulü reddedildi. |
| Bilinen eski `init.sql` yapısının açık adoption'ı | PostgreSQL 17.11 üzerinde 20 tablo/144 kolon/75 kısıt/35 indeks/1 tetikleyici/1 fonksiyon katalog hash'i iki bağımsız provada aynıydı. Açık `adoptLegacyInit` seçeneğiyle `0001` geçmişi transaction içinde kaydedilip `0002`–`0004` uygulandı; sonuç 34 tablo. Sentetik kullanıcı korundu, tekrar 0 yeni sürüm. |
| Eski şemada drift | Ek kolonlu kopya hash eşleşmediği için reddedildi; başarısız transaction sonrası `schema_migrations` tablosu bile kalmadı. |
| Kaynak hash'i platform farkı | CRLF/LF normalize edildi; Windows çalışma dosyası ile Git blob'u aynı `0001` checksum'unu üretti. `init.sql` içeriği değişirse eski adoption manifesti geçersiz olur ve işlem reddedilir. |
| Temiz `meeting_day` kurulumu | Yerel shim olmadan başarılı. |
| Bilerek oluşturulan migration hatası | `42P01` çağırana ulaştı. |
| Test verisi | 3 sentetik etkinlik; canlı satır çekilmedi. |

Prova ayrıca [[E4N/09-Dogrulama/Sprint1-Izole-Test-Ortami|P04/P05 API testlerini]] ve [[E4N/08-Teknik-Kararlar/P08-API-ve-Durum-Sozlesmesi|P08 durum kısıt testlerini]] çalıştırır. `schema_migrations` dahil fiziksel toplam 35 tablodur; 34 sayısı uygulama tablolarıdır.

## Tamamlanmadan önce gerekenler

- Bu koşucu uygulama açılışına veya üretime **bağlanmadı**. İkinci adım `f3f4aa3`/`c88f8c8` ile ayrı sürüm dosyasına taşındı; uygulamanın açılış ve manuel yönetici yolu hâlâ bu eski DDL'yi doğrudan çağırabiliyor. Bilinen saf `init.sql` başlangıcı için açık opt-in adoption provası var; bu canlı Supabase adoption'ı değildir.
- Canlı 34 tablo/307 kolon ile kaynak kurulumunun farkları ele alınmalı. [[P09-Kolon-Farklari|Kolon karşılaştırması]] ve [[P09-Kisit-Indeks-Tetikleyici-Farklari|kısıt/indeks/tetikleyici karşılaştırması]] tamamlandı; `notifications`, `public_visitors` ve silme eylemleri eşit değil.
- Güncel alan adı/tür/nullable/varsayılan karşılaştırması [[E4N/09-Dogrulama/P09-Kolon-Farklari|P09 kolon farkları]] notunda: kaynak 300, canlı 307 kolon; 9 yalnız canlıda, 2 yalnız kaynakta, 11 tür, 1 nullable ve 4 varsayılan ifade farkı. Nesne karşılaştırmasında kaynakta 111 kısıt/57 indeks/1 kullanıcı tetikleyicisi, canlıda 113/58/1 bulundu; üç canlıya özgü nesne ve iki davranışı farklı FK [[P09-Kisit-Indeks-Tetikleyici-Farklari|ayrı notta]].
- Mevcut şemanın güvenli baseline kabulü, satır/ilişki sayımları, yedek, geri dönüş ve başarısız adımın yeniden denemesi prova edilmeli. Üretimde `init.sql` veya runtime migration doğrudan çalıştırılmamalı.
- HTTP isteklerindeki DDL ve ayrı migration scriptlerinin kullanımı sona erdirilmeden tek kaynak hedefi sağlanmış sayılmaz.

P09 **In Progress**. Canlı Supabase'e hiçbir şema veya veri yazımı yapılmadı.

Mevcut canlı şemanın ayrı geçiş/geri dönüş adımları [[P09-Mevcut-Sema-Gecis-Tasarimi|geçiş taslağında]] sıralandı. Bazı status, silme eylemi ve ödeme sahipliği farkları ürün/veri kararı gerektirdiğinden otomatik baseline kaydı yapılmadı.

Canlı `public` katalogdan veri içermeyen şema yeniden kurma ve geri yükleme deneyi [[P09-Canli-Katalog-Kopya-Provasi|ayrı notta]]. Bu 34/307 şema, `adoptLegacyInit` seçeneğiyle reddedildi; gerçek canlı veri yedeği ve yükseltme yapılmadı.
