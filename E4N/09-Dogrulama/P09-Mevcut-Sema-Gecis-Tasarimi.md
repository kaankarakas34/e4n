# P09 — Mevcut Supabase şemasını sürümlü zincire alma taslağı

**1 Ekim 2026. Durum: canlı geçiş tasarımı; uygulanmadı.** Canlı Supabase `e4n` şemasına yalnız salt okunur sorgular yapıldı. Sürüm koşucusu boş izole PostgreSQL'de 34 uygulama tablosunu kuruyor ve varsayılan olarak sürümsüz mevcut veritabanını reddediyor. Canlı şema aynı tablo adlarına sahip olsa da [[P09-Kolon-Farklari|kolon/varsayılan]] ve [[P09-Kisit-Indeks-Tetikleyici-Farklari|kısıt/indeks/FK]] farkları var. Bu nedenle `0001`–`0004` sürümlerini canlıya geçmişte uygulanmış gibi yazmak yanlış olur.

**İzole ilerleme:** Bilinen, yalnız `init.sql` şemasından kurulmuş yerel veritabanı için katalog hash'iyle açık adoption seçeneği eklendi. 20 tabloluk yapısı tam eşleşirse `0001` kaydı ve `0002`–`0004` yükseltmesi tek transaction'da; ek kolonlu drift ise yarım ledger bırakmadan reddediliyor. Sentetik kullanıcı satırı korundu. Bu test canlı Supabase'in 34 tablo/307 kolonluk mevcut şemasına uygulanamaz; aşağıdaki ayrı geçiş hattı hâlâ gereklidir.

**Yeni teknik prova:** Canlı salt okunur katalogdan 34 tablo/307 kolonluk, veri içermeyen `public` şeması yerel PostgreSQL 17'de kuruldu ve şema-only yedekten geri yüklendi; sayımlar eşleşti. Eski `init.sql` adoption'ı bu kopyayı reddetti ve ledger bırakmadı. [[P09-Canli-Katalog-Kopya-Provasi|Kanıt ve sınırlar]]. Gerçek canlı yedek/veri kopyası ve aşağıdaki semantik geçiş hâlâ açık.

Bağlı API'nin HTTP ve açılış DDL noktaları [[P09-Istek-Icinde-DDL-Envanteri|ayrı envanterde]]. Temiz 0001–0004 kurulumunda `public_visitors.inviter_id` eksik; runtime DDL bu kolonu istek sırasında ekliyor. Bu nedenle önce yeni sürümlü şema adımı, sonra istek DDL'sinin kaldırılması gerekir.

**2 Ekim izole ilerleme:** yönetilen `codex/e4n-sprint1-foundation` çalışma ağacında `0005_public_visitor_inviter` sürümü eklendi ve [9aecd40](https://github.com/kaankarakas34/e4n/commit/9aecd40) commit'iyle dala gönderildi. Boş PostgreSQL 17.11 kurulumunda 34 tablo, 5 sürüm, tekrar çalıştırmada 0 yeni sürüm; `public_visitors.inviter_id` FK ve sentetik davetli kaydı doğrulandı. Bilinen `init.sql` adoption yolu 0002–0005 ile 4 sürümü uyguladı, kullanıcı satırını korudu. HTTP içindeki lazy DDL hâlâ duruyor; önce canlı mevcut şemanın ayrı güvenli yükseltme yolu ve uygulama dağıtım sırası netleşmeli. Bu prova canlı Supabase'e uygulanmadı.

Ek [0ee338e](https://github.com/kaankarakas34/e4n/commit/0ee338e) provasında önceden 0001–0004 sürümlü veritabanı taklit edildi: mevcut `public_visitors` satırı korunarak yalnız 0005 uygulandı, yeni `inviter_id` değeri eski satırda `NULL` kaldı. Bu, canlıdaki sürümsüz 34 tabloluk şemanın adoption provası yerine geçmez.

**2 Ekim API hazırlığı:** Yönetilen dalda `server/src/index.js` içindeki istek/import zamanı DDL ve HTTP migration ucu kaldırıldı; Vercel dışı başlangıç sürümlü koşucuyu çağırıyor. İzole API'de başvuru, durum ve bilet liste yolları yeni şemayla geçti. Bu kod yalnız geçişten **sonra** dağıtılabilir: canlı sürümsüz şemanın gerçek yedek/veri kopyası, açık adoption kaydı ve şema/uygulama sırası hâlâ kanıtlanmalı. Bu hazırlık P09'u Done yapmaz.

Kod [44bd1a2](https://github.com/kaankarakas34/e4n/commit/44bd1a2) commit'iyle dala gönderildi. `npm run migrate` artık sürümlü koşucudur; eski init/seed betiği varsayılan komuttan çıkarıldı. İzole testte 34 tablo/5 sürüm, tekrar 0; başvuru 201, durum 200, bilet 200, HTTP migration 404 ve migration CLI `applied=0 total=5` doğrulandı. Testte cron kapatılarak geçmiş etkinlik fixture'ının zamanlayıcıyla yarışması önlendi.

## Ayrı geçiş hattı

1. **Dondurulmuş baz çizgisi:** Değişim anından hemen önce canlı şema kataloğu, 34 tablo satır sayısı, FK yetim sayısı, ilgili status dağılımları ve ödeme–kullanıcı bağ sayısı salt okunur alınır. Bugünkü sayımlar (23 kullanıcı, 11 grup üyeliği, 5 ödeme) geçiş gününün sayımı yerine geçmez.
2. **Yalıtılmış kopya:** Yetkili veritabanı yedeğinden üretim dışı PostgreSQL kopyası oluşturulur; deneme yalnız bu kopyada yapılır. Yedek geri yükleme sınanır, gerekli süre kaydedilir. Kişisel veri erişimi kopyada sınırlandırılır.
3. **Açık kaynak manifesti:** Boş kurulumun sürümleri ile canlıdan yükseltilen yolun aynı hedef şemaya ulaşması gerekir. Canlıya özgü alanlar, check, FK, indeks ve varsayılanlar için ayrı, sıralı geçişler yazılır; sürümler yalnız başarıyla biten transaction sonunda ledger'a girer. Mevcut canlı şema için önceden doğrulanmış ayrı başlangıç kaydı gerekir; `0001`–`0004` körlemesine damgalanmaz.
4. **Veri dönüşümü:** `notifications` için eski `content/is_read` alanları ancak varsa taşınır; eski kolonlar hemen silinmez. `public_visitors.email` içindeki boş değerler uydurulmaz. `payment_transactions.user_id` boş geçmiş işlemler eşleşme kanıtı olmadan kullanıcıya bağlanmaz. Grup çıkarma/puan/yasak geçmişi geçmişe dönük üretilmez.
5. **Uygulama sırası:** Yeni API kodu önce eski ve hedef şemayı birlikte okuyabilecek biçimde prova edilir. Şema geçişi, uygulama sürümü ve cron durdurma/başlatma sırası tek çalıştırma planında belirtilir. HTTP isteklerinden DDL çalıştırma kapatılmadan tek migration kaynağı sağlanmış sayılmaz.
6. **Son koşullar:** Tablo/kolon/varsayılan/kısıt/indeks/tetikleyici manifesti, satır sayımları, ilgili FK yetim sayısı, bildirim okundu alanları ve kritik API smoke testleri karşılaştırılır. Tekrar çalıştırma 0 yeni sürüm uygulamalı; checksum ve sıra korumaları geçmeli.
7. **Geri dönüş:** Yalnız henüz uygulama verisi yeni alanlara yazılmadıysa ters DDL düşünülür. Veri yazımı başladıysa eskiye körlemesine dönmek yerine sürüm geri dağıtımı ve yedekten geri yükleme/ileri düzeltme kararı önceden tanımlanır. Başarısız transaction otomatik rollback, kısmi dış etkiler için ayrı sayım gerekir.

## Geçişte karar gerektiren somut ayrımlar

| Konu | Gözlenen fark | Karar/kanıt kapısı |
|---|---|---|
| Grup/lonca durumları | Kod `INACTIVE`, `REJECTED`; check yalnız `ACTIVE`, `REQUESTED` | D02–D04, D08 ve P10/P11 durum modeli; eski satırların gerçek olay anlamı. |
| Ziyaretçi dönüşümü | Kod `CONVERTED`; check `INVITED/ATTENDED/JOINED/NO_SHOW` | `CONVERTED` ile `JOINED` aynı mı, ayrı mı? |
| Bildirim tipleri | Canlı type check beş değere izin veriyor; bazı istemci dalları başka tip bekliyor | Üreticiler ve yönlendirme sözlüğü tekleşmeli. |
| `professions.status` | Kaynak varsayılan `ACTIVE`, canlı `APPROVED` | Mevcut yönetici akışındaki iki durumun anlamı. |
| İlişki silme | `notifications.user_id` ve `ticket_messages.ticket_id` FK silme eylemleri farklı | Üye/bilet silerken saklama politikası ve eski verinin etkisi. |
| `power_team_members.role` | Kaynak varsayılan `MEMBER`, canlı varsayılan yok | Lonca rolü atama kaynağı ve mevcut iki kaydın korunması. |
| `public_visitors` | Canlı `inviter_id` FK ve `source='web'` varsayılanı var; kaynakta yok | Eski kaynak bilgisini uydurmadan yeni kayıt varsayılanı; ilişki silme. |
| Üyelik/ödeme | Canlı beş ödemenin `user_id` alanı boş | D07 ve kanıtlı sahiplik eşlemesi; otomatik kullanıcı ataması yok. |

## P09 çıkış koşulu

Bu taslak ve boş kurulum provası tamam; canlı şemadan güvenli yükseltme henüz tamam değil. P09, üretim dışı canlı şema kopyasında geçiş ve geri yükleme provaları, karar gerektiren semantik eşleme ve tüm son koşullar kanıtlanınca Done olabilir. Geçiş planının varlığı canlıda DDL çalıştırma kararı değildir.
