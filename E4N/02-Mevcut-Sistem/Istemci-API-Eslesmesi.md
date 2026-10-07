# Web ve mobil istemci → bağlı API eşleşmesi

1 Ekim 2026, üretim commit'i `7ead1690ab1b7344fe2ea98d6217700e3f39e0ab` ve mevcut mobil çalışma ağacı statik taraması. Karşılaştırma [[E4N/02-Mevcut-Sistem/API-Uc-Noktalari|bağlı 151 Express route'u]] temel alır; bağlanmamış `server/src/routes/*` dosyalarının uçları dahil değildir. Dinamik kimlik segmentleri adından bağımsız eşleştirildi. Bu tablo her çağrının çalıştırıldığını iddia etmez.

## Web `src/api/api.ts`

`request(...)` çağrılarının yol kalıpları karşılaştırıldığında **19 çağrı konumunun yoluna karşılık gelen bağlı route bulunmadı**:

| İstemci çağrısı | Kaynak satır | Özellik kümesi |
|---|---:|---|
| `/payment/get-token` | 45 | Ödeme |
| `/tickets/stats` | 139 | Destek özeti |
| `/power-teams/:id/events` | 407 | Takım etkinlikleri |
| `/lms/courses/:id/lessons` | 411 | LMS |
| `/lms/lessons/:id/materials` | 412 | LMS |
| `/lms/exams/:id` | 415 | LMS silme |
| `/lms/courses/:id/exams` | 416 | LMS |
| `/lms/exams/:id/questions` | 417 | LMS |
| `/lms/exams/:id/attempts` | 418 | LMS |
| `/documents` | 434, 437 | Belgeler okuma/yazma |
| `/documents/:id` | 440 | Belgeler silme |
| `/events/report` | 498 | Toplantı raporu |
| `/messages/:id` | 573, 579 | Mesaj okuma/yazma |
| `/messages/conversations` | 576 | Mesaj listesi |
| `/user/friends/check/:id` | 604 | Arkadaş kontrolü |
| `/shuffle/notify` | 615 | Shuffle bildirimi |
| `/one-to-ones/request` | 618 | Birebir talep |

Yol mevcut olup **istemci yönteminin karşılığı bulunmayan** iki kalıp: `POST /admin/members` (`src/api/api.ts:457`; bağlı route yalnız GET) ve `POST /lms/exams` (`src/api/api.ts:414`; bağlı route yalnız GET). Bunlar çağrı tanımlarıdır; arayüzden aktif kullanımı ayrıca işaretlenmelidir.

Diğer önemli çalışma zamanı kanıtı: üretim `GET /api/events` 500 döndü. Route vardır; açık görünümde `events` ile `groups` JOIN'inin ardından `status` alanı tablo adı olmadan kullanılmıştır (`server/src/index.js:1867`), Vercel günlüğünde `42702 ambiguous column` doğrulandı. Bu yol eksik route olarak sınıflandırılmaz.

## Mobil

[[E4N/02-Mevcut-Sistem/Mobil-Envanteri|Mobil envanterinde]] mobil çağrıların yöntem/yol eşleşmeleri tek tek gruplandı. `activities`, `payments/me`, `payments/history`, `support`, `users/me/stats`, `shuffle`, `public-visitors` yolları bağlı API ile uyuşmuyor. Mobil üretim URL'si ayrıca 404 döndü; bu yüzden mobil çağrıların mevcut web API dağıtımıyla uçtan uca çalıştığı doğrulanmadı.

## Yorumlama sınırı

Eksik yol, çağrı yapıldığında bu kod sürümündeki bağlı Express uygulamasında eşleşme bulunmayacağını gösterir. Ekranın gerçekten kullanıcının menüsünden ulaşılır olması, başka bir sunucunun aynı URL'yi karşılaması ve yanıt sözleşmesi ayrı kanıt gerektirir. Bu nedenle bu liste hedef kararlarıyla karşılaştırmaya girdi olarak kullanılır; kendi başına özellik silme kararı değildir.
