# P11 — Durum sözlüğü ve geçiş matrisi taslağı

**1 Ekim 2026. Durum: baz çizgisi; nihai geçiş kuralları bekleniyor.** Kaynak [[P08-API-ve-Durum-Sozlesmesi|P08 API/durum denetimi]], [[E4N/09-Dogrulama/P09-Kolon-Farklari|P09 şema farkı]], izole PostgreSQL `23514` testleri ve canlı Supabase salt okunur toplu sayımları. Linear: [E4N-83](https://linear.app/e4n/issue/E4N-83/p11-durum-kisitlarini-ve-canli-kod-sema-driftini-uyumla).

Alan bazında yazma kapıları ve uygulanacak sıra [[P11-Yazma-Kapilari-ve-Durum-Gecisleri|ayrı geçiş notunda]].

2 Ekim'deki izole gerçek HTTP/DB önce-sonra denemeleri: [[E4N/09-Dogrulama/P11-HTTP-Durum-Yazma-Provasi|P11 HTTP durum yazma provası]].

| Alan | DB'nin bugünkü kabulü / canlı kayıt | Kodun yazdığı veya beklediği | Hedef model sorusu |
|---|---|---|---|
| `users.account_status` | Canlı 21 `ACTIVE`, 2 `PENDING`; üyelik bitiş tarihi 0 dolu | Grup/lonca başvurusu `ACTIVE` ister | Hesap aktifliği ile ücretli E4N hakkı aynı anlamda mı? D07. |
| `group_members.status` | CHECK `ACTIVE`, `REQUESTED`; 11 `ACTIVE` | Ret `REJECTED`, taşıma/shuffle `INACTIVE`, çıkarma DELETE | Başvuru sonucu ile aktif yerleşim/çıkış olayı ayrılmalı. D02–D04,D08,D09. |
| `power_team_members.status` | CHECK `ACTIVE`, `REQUESTED`; 1/1 | Ret `REJECTED` | Açık lonca başvurusunun onay/ret akışı P15'te netleşmeli. |
| `visitors.status` | CHECK `INVITED`, `ATTENDED`, `JOINED`, `NO_SHOW` | Dönüşüm `CONVERTED` yazıyor | `CONVERTED` ile `JOINED` aynı olay mı? P11 kapsamında karar gerekir. |
| `public_visitors.status` | Serbest metin; 402 kaydın 1'i tanımlı küme dışında | Çeşitli başvuru/ödeme yolları | Geçmiş değerin anlamı okunmadan yeni check eklenmez. |
| `notifications.type` | Canlı CHECK `SYSTEM`, `EVENT_REMINDER`, `INVITATION`, `GROUP_UPDATE`, `PAYMENT`; 0 kayıt | İstemci `FRIEND_REQUEST`, `FRIEND_ACCEPTED`, `MESSAGE` dalları da bekliyor | Tip üreticileri ve yönlendirme aynı listeyi kullanmalı. |
| `notifications` okundu alanı | Canlı `title/message/read`; kaynakta eski `content/is_read` de bulunuyor | P07 API/web/mobil `title/message/read` biçiminde birleşti | Eski alanların fiziksel kaldırılma zamanı dağıtım/geri dönüş planına bağlı. |
| `professions.status` | 79 `APPROVED`, 26 `PENDING`; canlı varsayılan `APPROVED` | Temiz kaynak kurulumunda varsayılan `ACTIVE` | `ACTIVE` yerine onaylı durum mu kullanılacak; mevcut seçim/filtreler ne bekliyor? |
| `payment_transactions.status` | 2 `SUCCESS`, 3 `PENDING`; hepsinde `user_id` boş | Callback ödeme/hak güncelliyor | Başarılı ödeme için kullanıcı bağı ve tekrar anahtarı P14'te tanımlanmalı. |

## Sözlük tasarım kuralı

Bir alanın `ACTIVE` değeri diğer alanın hakkını otomatik vermemeli. Başvuru durumu, kapalı grup yerleşimi, lonca ilişkisi, ücretli üyelik ve ödeme işlemi ayrı yaşam döngüleridir. Grup üyeliğini `INACTIVE` yapmayı check listesine eklemek tek başına yeterli değildir; neden, tarih ve tekrar işleme kimliği kaybolur. Ret için `REJECTED` de karar olayı ile yerleşim satırında farklı anlam taşıyabilir. Nihai tablo/enum/check P10 ve D kararlarından sonra yazılacak.

## İzole doğrulama planı

1. Her API yazma yolunun gerçek durum değeri kataloglanır; DB check'i ve yanıt kodu aynı örnekle sınanır.
2. Geçerli başvuru → görüşme → kabul/ret, aktif yerleşim → ayrılma/çıkarma/taşıma, ziyaretçi → üyelik ve bildirim okundu akışlarında önce/sonra satır sayısı kanıtlanır.
3. Geçersiz veya tekrarlı geçişler atomik reddedilir; son koltuk eşzamanlı kabul ve shuffle tekrar testi ayrı yapılır.
4. Mevcut canlı kopyada eski status dağılımı dönüşümden önce/sonra eşlenir; bilinmeyen değerler otomatik uydurulmaz. Geri dönüş için eski alanlar geçiş süresince korunur.

P11'in şema/kod uygulaması ve Done koşulu D01–D10, P09 geçiş provası ve P10 somut veri modeliyle bağlıdır. Bugün canlı veri veya şema değiştirilmedi.
