# P10 — Hedef veri modeli ve eski veri eşlemesi taslağı

**1 Ekim 2026. Durum: ürün kararı bekleyen taslak.** Kaynak [[E4N/02-Mevcut-Sistem/Veri-Tabani-ve-Veri-Akisi|veri akışı]], [[E4N/02-Mevcut-Sistem/Canli-Sema-Katalogu|canlı katalog]], [[E4N/09-Dogrulama/P09-Kolon-Farklari|şema farkları]] ve 1 Ekim salt okunur toplu sayımlar. Bireysel kayıt içeriği okunmadı, veri değiştirilmedi. Linear: [E4N-82](https://linear.app/e4n/issue/E4N-82/p10-hedef-veri-modelini-ve-eski-veri-eslemesini-tasarla).

İlişki anahtarları, eski kolon eşlemesi, idempotency ve kademeli migration sırası [[P10-Fiziksel-Model-ve-Gecis-Matrisi|fiziksel model taslağında]] açıldı. D01–D10 olmadan bu taslak migration olarak uygulanmaz.

## Canlı baz çizgisi

| Veri | Toplu gözlem | Geçiş anlamı |
|---|---:|---|
| `users` | 23 hesap; 21 `account_status=ACTIVE`; hiçbirinde `subscription_end_date` dolu | `ACTIVE` hesabı tek başına ücretli üyelik kanıtı olarak alınamaz. D07 gerekir. |
| `users.company` | 5 boş | Tüzel kişilik doğrulaması geçmişe otomatik atfedilemez. D10 gerekir. |
| `groups` | 1 kayıt; `cycle_months=6` | Dört aya geçişin başlangıcı D06 ile belirlenir; geçmiş dönemler yeniden yazılmaz. |
| `group_members` | 11 kayıt, 11 ayrı kullanıcı, tamamı `ACTIVE` | Bugünkü yerleşim başlangıcı görülebilir; önceki başvuru/ayrılma olayları bilinmiyor. |
| `power_team_members` | 2 kayıt | Açık lonca ilişkisi kapalı grup yerleşiminden ayrı tutulmalı. |
| `payment_transactions` | 5 kayıt: 2 `SUCCESS`, 3 `PENDING`; beşinde de `user_id` boş | Başarılı işlem durumu bile tek başına hangi hesaba üyelik hakkı vereceğini kanıtlamaz. |
| `notifications` | 0 kayıt | P07 bildirim alan geçişinin canlı veri dönüşüm riski bugün düşük; gelecekte yeniden sayılmalı. |

## Hedef ilişki sınırları

| Alan | Bugünkü kaynak | Önerilen model sınırı | Açık karar |
|---|---|---|---|
| Kimlik ve rol | `users` | Hesap kimliği ile admin/başkan yetkisi tanımlı kalır; ödeme durumu rolden türetilmez. | Yetki tablosu P12/P30. |
| E4N üyeliği | `users.account_status`, `subscription_plan/end_date` | Tek E4N üyelik hakkı, geçerlilik dönemi, ödeme kanıtı ve iptal/iade ayrı izlenir. Üye, kapalı gruptan ayrılsa da uygun üyelik hakkı korunur. | D07. |
| Kapalı grup yerleşimi | `groups`, `group_members` | Başvuru/görüşme, kabul, aktif yerleşim ve ayrılma/çıkarılma olayları ayrılır. Bugünkü satır son durum; olay geçmişi değildir. | D02, D08, D09. |
| Açık lonca | `power_teams`, `power_team_members` | Lonca ilişkisi bağımsızdır; kapalı grubun kapasite/görüşme/ban kuralı otomatik miras alınmaz. | D07 ve P15. |
| Hizmet uygunluğu | `users.profession`, tetikleyici | Çoklu hizmet ve çakışma matrisi sürümlü veri olarak tutulur; kabul/shuffle aynı kurala bakar. Eski meslek metni tek başına kategori kanıtı değildir. | D05. |
| Shuffle dönemi | `groups.cycle_started_at/cycle_months` | Dönem ve yerleşim değişiklikleri önce/sonra bağlantılı olay olarak saklanır; tekrar çalıştırma aynı atamayı çoğaltmaz. | D06. |
| Puan ve çıkarma | `users.performance_score/color`; olay tablosu yok | Aylık puan olayı, kesinleşme, düzeltme ve grup çıkarma olayı ayrı tutulur; aynı çıkarma ikinci kez sayılmaz. Ban yalnız kapalı grup başvurusu kapısında değerlendirilir. | D01–D04. |
| Ödeme ve etkinlik hakkı | `payment_transactions`, `events`, `attendance`, `event_tickets` | Yeni işlemde kullanıcı sahibi ve işlem amacı zorunlu; callback tekrar anahtarı tek hak doğurur. Etkinlik/indirim hakkı üyelikten hesaplanır. | D07, P14/P25/P26. |

## Eski kayıtları taşıma ilkesi

Mevcut 11 aktif grup yerleşimi yalnız **bugünkü durum** olarak alınır; `joined_at` varsa başlangıç alanı olarak korunur ama kabul telefonu, önceki ayrılma veya shuffle geçmişi yerine kullanılmaz. Beş geçmiş ödeme işleminde `user_id` boş olduğu için kullanıcı bağlama denemesi yalnız denetlenebilir harici ödeme kanıtı varsa yapılır. 21 aktif hesabın üyelik süresi boş olduğundan otomatik ücretli üyelik dönemi üretilmez. Beş boş şirket alanına ülke, belge veya onay eklenmez. Yeni olay tablolarında “bilinmeyen geçmiş” açık temsil edilir; sahte olay üretilmez.

## Şema geçişi kapıları

- [[E4N/02-Mevcut-Sistem/Canli-Veri-Iliskileri|Canlı 43 FK]] silme eylemine göre 24 `CASCADE`, 3 `SET NULL`, 16 `NO ACTION`. `users.id` hedefine bağlı 25 FK'nin 12'si CASCADE, 1'i SET NULL, 12'si NO ACTION. Üye silme işlemi bu nedenle hem bazı geçmiş ilişkileri silebilir hem de kalan ilişkiler yüzünden engellenebilir. P08'deki iki DELETE handler'ı da farklı bağımlılık temizliği yapıyor; veri saklama kuralı P39/P40 öncesinde açık seçilmeli. İki farklı `ON DELETE` davranışlı kaynak/canlı FK ve `public_visitors.inviter_id` canlıya özgü FK P09 şema manifestine bağlanacak. Yeni olay/ödeme ilişkilerinde silme eylemi açık seçilecek; kullanıcı/bilet silinmesi geçmiş kaydı sessizce kaybettirmeyecek.
- Canlı `public_visitors.email` boş olabilir; `NOT NULL` dönüşümü iki mevcut boş satırı etkiler. Eski veriye e-posta uydurulmaz.
- `group_members`/`power_team_members` check'leri `REJECTED` veya `INACTIVE` kabul etmiyor. P11, yeni olay modeli ve eski status sözlüğü kararlaştırıldıktan sonra kısıt değişikliği yapar.
- Kod/şema geçişi P09'un yalıtılmış canlı kopya provasında satır sayımı ve ilişki sayımıyla kanıtlanır. Bu taslak tablo oluşturma veya canlı migration yetkisi vermez.

## Tamamlama için gerekenler

D01–D10 yanıtları, üyelik ve grup hakkı örnekleriyle onaylanmalı; bu taslaktan somut tablo/anahtar/nullable/default/FK şeması çıkarılmalı; 23/11/5 baz sayımı geçiş gününde yeniden alınmalı; kaynak ve canlı şema kopyasında veri/geri dönüş provası yapılmalı. Bunlar olmadan P10 Done değildir.
