# Sprint 1 — Ürün karar paketi (P01–P03)

**1 Ekim 2026. Durum:** Hazırlandı, kullanıcı kararları bekleniyor. Bu belge kural seçmez; R01–R15 kesin hedeflerini ve D01–D10 açık noktalarını uygulama için cevaplanabilir hale getirir. Linear: [P01 / E4N-73](https://linear.app/e4n/issue/E4N-73/p01-puan-cikarma-ve-sekiz-ay-kararlarini-netlestir), [P02 / E4N-74](https://linear.app/e4n/issue/E4N-74/p02-grup-hizmet-cakismasi-ve-shuffle-kararlarini-netlestir), [P03 / E4N-75](https://linear.app/e4n/issue/E4N-75/p03-uyelik-sirket-ve-odeme-kararlarini-netlestir).

## P01 — Aylık puan ve gruptan çıkarma

| Kod | Kullanıcı kararı gereken durum | Uygulamayı belirleyen örnek |
|---|---|---|
| D01 | Hangi faaliyetler kaç puan? Aylık eşik nedir? Ay hangi takvim/saat diliminde kapanır? Mazeret ve düzeltme kim tarafından, ne zamana kadar yapılır? | 31 Ocak gecesi girilen faaliyet Şubat'a mı Ocak'a mı yazılır? Ay kapandıktan sonraki düzeltme çıkarma kararını geri alır mı? |
| D02 | İlk gruptan çıkarılmadan sonra yeniden başvuru mümkün mü; bekleme veya görüşme şartı var mı? | Aktif E4N üyeliği devam eden kişi ertesi gün farklı kapalı gruba başvurabilir mi? |
| D03 | İkinci çıkarılma ömür boyu mu belirli dönem içinde mi sayılır; üçüncü çıkarılmada ne olur? | Beş yıl arayla iki gerçek çıkarılma aynı yasak sonucunu doğurur mu? |
| D04 | Sekiz ay hangi tarihte başlar ve takvim ayı olarak nasıl hesaplanır? Son gün/saatte başvuru mümkün mü? | 31 Ocak çıkarılmasında bitiş 30 Eylül mü, 1 Ekim mi? “İki shuffle dönemi” ile 8 takvim ayı ayrışırsa hangisi geçerli? |

Kesin kalan kural: Çıkarma E4N üyeliğini iptal etmez; aktif üyeliğin dış etkinlik ve indirimli bilet hakkı korunur. Aynı olayın yeniden işlenmesi ikinci çıkarılma sayılmaz. D01–D04 tamamlanmadan canlı otomatik çıkarma ve yasak açılmaz.

## P02 — Kapalı grup, hizmet çakışması ve shuffle

| Kod | Kullanıcı kararı gereken durum | Uygulamayı belirleyen örnek |
|---|---|---|
| D05 | Hizmet çakışması hangi kategori/alt hizmet ilişkisine göre? Bir şirket birden çok hizmet sunarsa hangileri kontrol edilir? | Web tasarım ve dijital pazarlama aynı grupta çakışma mı? Şirket iki hizmet veriyorsa ikisi de koltuk tutar mı? |
| D06 | Dört aylık shuffle'da şehir, mevcut iş ilişkileri, başkan, görüşme ve doluluk koşullarından hangileri kesin engel, hangileri tercih? Yerleşemeyen üye ne yapar? | Aynı şehirde boş yer yoksa şehirler arası atama yapılabilir mi? Başkan sabit mi? Çakışma varken üye boş kalır mı? |
| D08 | Başkan telefon görüşmesinden sonra son kabulü kim verir; yönetici veto/onay hakkı var mı? | Başkan uygun buldu, ama kapasite/hizmet kontrolü son anda başarısız oldu: ret ve alternatif öneri kimde? |
| D09 | 35 kişi kesin üst sınır mı hedef doluluk mu; başkan sayıya dahil mi? | Başkan + 34 üye varken yeni başvuru alınır mı? Aynı son koltuğu iki yetkili eşzamanlı onaylarsa hangisi başarılı olur? |

Kesin kalan kurallar: Loncalar geniş/açık yapı; 35 sınırı yalnız kapalı grup hedefi. Çakışan hizmetler aynı kapalı gruba yerleştirilmez. Shuffle dört ayda bir yapılır. Eski `cycle_months=6` kaydının hangi tarihten itibaren dört aya geçeceği ayrıca kayıt altına alınmalı.

## P03 — Tek üyelik, şirket ve ödeme

| Kod | Kullanıcı kararı gereken durum | Uygulamayı belirleyen örnek |
|---|---|---|
| D07 | Ücret ve dönem nedir? Ödeme gecikince üyelik, grup başvurusu, dış etkinlik ve indirimli bilet hakları hangi sırada değişir? İptal/iade etkisi nedir? | Ödemesi ay ortasında başarısız olan üyeye ertesi gün indirimli bilet satılır mı? Gruptan çıkarılmış ama üyeliği ödenmiş kişi dış etkinliğe katılır mı? |
| D10 | Şirket/tüzel kişilik şartı başvuruda mı, ücretli üyelikte mi, kapalı gruba girişte mi aranır; hangi kanıtlar yeterli ve eski boş şirket kayıtları nasıl ele alınır? | Yurt dışında kayıtlı şirket kabul edilir; belge ve doğrulama kim tarafından yapılır? Canlı 23 kullanıcıdan şirket alanı boş 5 hesabın geçişi nedir? |

Kesin kalan kurallar: E4N tek üyelik olacak; grup katılımı üyelikten ayrı; şirket/tüzel kişilik şartında ülke sınırlaması yok; Pardus Business Chamber ayrı, ücretsiz ve seçici kalır. Geçmiş 5 ödeme kaydının kullanıcı sahipliği kaynağı açıklığa kavuşmadan eski işlemlere yeni hak atfedilmez.

## Kararların uygulanma sınırı

Yanıtlar [[E4N/01-Kararlar/Acik-Kararlar|D01–D10 kayıtlarına]] tarih ve kararı veren kişiyle işlenecek; her biri en az bir sınır örneğiyle doğrulanacak. Bu belge kararların yerine geçmez. Bağımsız P04–P09 izole hazırlıkları sürebilir; P10/P12–P29'un bağlı canlı iş kuralı görevleri açık kararlar tamamlanmadan Done yapılamaz.
