# P09 — İzole kurulum ile canlı Supabase kolon farkları

**1 Ekim 2026.** İzole PostgreSQL 17.11 üzerinde dört adımlı sürümlü prova koşucusunun oluşturduğu 34 uygulama tablosunun `information_schema.columns` çıktısı, aynı gün salt okunur olarak kaydedilmiş [[E4N/02-Mevcut-Sistem/Canli-Sema-Katalogu|canlı 34 tablo/307 kolon kataloğu]] ile tablo/alan adına göre karşılaştırıldı. Kaynak JSON geçici yerel dosyada üretildi; canlıya yazma yapılmadı. Kısıt/FK/indeks/tetikleyici ayrı [[P09-Kisit-Indeks-Tetikleyici-Farklari|notta]] karşılaştırıldı. İlk üç adımlı provada kaynak 297 kolondu; P07 `0004_notifications_contract` sonrası aşağıdaki güncel sayımlar alındı.

**2 Ekim ek not:** Aşağıdaki sayımlar 1 Ekim'in tarihsel dört adımlı baz çizgisidir. Sonraki `0005` `public_visitors.inviter_id` ekledi; `0006` dört `users` izin kolonunu ekledi. Temiz kurulum kayıt 500'ü ve sürümlü düzeltme [[P09-Kayit-Izin-Kolonlari-Provasi|ayrı provada]] doğrulandı. Canlı şema için yeni tam diff ve veri yedekli geçiş hâlâ açık.

| Ölçüm | Sonuç |
|---|---:|
| Uygulama tablo adı | Her iki tarafta 34 |
| Canlı kolon | 307 |
| İzole kaynak kolonu | 300 |
| Yalnız canlıda | 9 |
| Yalnız kaynak kurulumunda | 2 |
| Aynı alan adında tür farkı | 11 |
| Aynı alan adında nullable farkı | 1 |
| Aynı alan adında varsayılan ifade farkı | 4 (3 davranışsal, 1 tür cast'i) |

## Yalnız canlıda görülen alanlar

| Tablo | Alanlar | Geçiş değerlendirmesi |
|---|---|---|
| `groups` | `meeting_time`, `meeting_link`, `description` | Kaynak kurulumuna körlemesine eklenmeden kullanım ve gerçek tür/varsayılan doğrulanmalı. |
| `public_visitors` | `inviter_id` | Kaynak API bu alanı HTTP sırasında DDL ile ekliyor; sıralı şemaya taşınmalı. |
| `users` | `kvkk_consent`, `marketing_consent`, `explicit_consent`, `consent_date`, `group_title` | Bazıları ayrı scriptlerde var; bugün üç adımlı kurulumda yok. Eski veriye varsayılan değer uydurulmaz. |

## Yalnız kaynak kurulumunda görülen alanlar

`notifications.content` ve `notifications.is_read`. P07 geçişi bu eski alanlardaki veriyi hedef `title/message/read` alanlarına taşır ve API yanıtından eski alanları çıkarır. Kolonların fiziksel kaldırılması, dağıtım uyumu ve geri dönüş tasarımıyla yapılmalıdır.

## Tür ve boş değer farkları

| Tablo | Alan | Canlı tür | İzole kaynak türü |
|---|---|---|---|
| `notifications` | `type` | text | character varying |
| `notifications` | `created_at` | timestamp with time zone | timestamp without time zone |
| `public_visitors` | `name`, `email`, `phone`, `company`, `profession`, `source`, `status` | text | character varying |
| `public_visitors` | `created_at` | timestamp with time zone | timestamp without time zone |
| `users` | `company` | text | character varying |

Kalan nullable farkı: `public_visitors.email` canlıda nullable, kaynakta **NOT NULL**. Canlıda boş e-postalı iki kayıt olduğu önceki denetimde saptandı; `NOT NULL` değişikliği veri temizliği/ürün kararı olmadan uygulanamaz. `notifications.type` zorunluluğu P07 adımında kaynakta eşitlendi.

## Varsayılan değer farkları

| Alan | İzole kaynak | Canlı | Not |
|---|---|---|---|
| `power_team_members.role` | `MEMBER` | varsayılan yok | Yeni lonca ilişkisinde rolün nereden verileceği kararlaştırılmalı. |
| `professions.status` | `ACTIVE` | `APPROVED` | Mevcut durum sözlüğü farklı; yalnız varsayılanı eşitlemek iş kuralını düzeltmez. |
| `public_visitors.source` | varsayılan yok | `web` | Eksik kaynak bilgisi canlıda otomatik `web` olur; geçişte geçmişe kaynak uydurulmaz. |
| `public_visitors.status` | `'PENDING'::varchar` | `'PENDING'::text` | Metin değeri aynı; tür farkının SQL cast gösterimi. |

Bu, P09'un mevcut canlı veritabanını otomatik baseline olarak kabul etmemesinin somut nedenidir. Her fark için korunacak veri, dönüşüm, API uyumu ve geri dönüş kararı P07/P08/P10/P11 ile eşlenmelidir. Üretim migration'ı henüz hazır değildir.
