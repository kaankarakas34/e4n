# E4N — Denetim, Dokümantasyon ve Geliştirme Master Planı

**Hazırlanma tarihi:** 1 Ekim 2026  
**Çalışma temeli:** “Token Kullanımı Sorusu” konuşmasından erişilebilen kararlar ve son çalışma talimatı.  
**Kullanım:** Önce bu planı oku; ardından master promptları belirtilen sırayla Codex’e ver. Markdown biçimi Obsidian notlarına ve görev açıklamalarına aktarılabilecek şekilde hazırlanmıştır.

> Bu belge bir uygulama ve görev hazırlama planıdır. Konuşmanın tam dökümü erişilebilir sonuçlarda dönmemiştir. Bu nedenle doğrulanabilen kararlar korunmuş; bilinmeyen puanlar, ücretler, teknik altyapı ve işleyiş ayrıntıları kesinleşmiş gibi yazılmamıştır. Mevcut E4N deposu bu çalışma sırasında incelenmemiştir. Linear görevleri, Obsidian notları ve GitHub değişiklikleri için aşağıdaki içerikler hazırlanmıştır; dış sistemlerde oluşturulmuş iş kayıtları değildir.

## 1. Yönetici özeti

E4N geliştirmesinin ilk işi yeni ekran kodlamak değildir: önce eski yazılımın gerçekte ne yaptığı anlaşılacak. Sayfalar, komponentler, veritabanı, iş kuralları, yetkiler, entegrasyonlar ve yarım kalan özellikler kanıtlarıyla çıkarılacak. Bu bilgi Obsidian’da kalıcı proje hafızasına dönüştürülecek. Ardından mevcut sistem ile hedef E4N modeli karşılaştırılacak; korunacak, değiştirilecek, eklenecek ve kaldırılması değerlendirilecek parçalar belirlenerek Linear’da yürütülebilir görevlere çevrilecek.

Hedef model, geniş topluluk ve açık loncaların yanında 35 kişilik seçilmiş gruplar içeren tek üyelik yapısıdır. Grup kabulü şirket şartına, hizmet çakışmasının bulunmamasına ve grup başkanının görüşmesine bağlıdır. Gruplar dört ayda bir shuffle ile yeniden düzenlenir. Aylık puan tablosu ve otomatik gruptan çıkarma vardır. İkinci kez çıkarılan kişinin sekiz ay grup başvurusu engellenir; üyeliği devam ettiği sürece dış etkinlik ve indirimli bilet hakları sürer.

Bu nedenle yazılımın en önemli ayrımı **E4N üyeliği ile kapalı gruba katılımın birbirinden bağımsız yönetilmesidir.** Gruptan çıkarma, üyelik iptali olarak kodlanırsa hedef model bozulur. Aynı şekilde lonca ile kapalı grup aynı kabul ve kapasite mantığına bağlanmamalıdır.

Pardus Business Chamber ayrı, ücretsiz ve seçici bir yapıdır. E4N içine ortak ücretli üyelik paketi veya büyüme zorunluluğu olarak taşınmayacaktır. Sınırlı tanıtım görünürlüğü ayrı bir içerik işi olarak ele alınabilir.

İlerleme sırası: **mevcut sistem denetimi → sistem ve komponent dokümantasyonu → hedef fark analizi → Linear görevleri → veri ve iş kuralları → kullanıcı arayüzü → uçtan uca doğrulama → sürüm.**

## 2. Kararların güven düzeyi

### 2.1. Erişilen kullanıcı kararları

| Kod | Karar | Yazılıma etkisi |
|---|---|---|
| R01 | E4N’de tek üyelik olacak. | Circle erişimi için ikinci üyelik paketi icat edilmez. |
| R02 | Geniş topluluk/vitrin ile küçük seçilmiş çekirdek gruplar ayrılacak. | Üyelik, topluluk ve grup durumları ayrı tutulur. |
| R03 | Loncalar geniş ve açık olacak; büyüklükleri çekirdek grup gibi kritik olmayacak. | 35 kişi sınırı ve grup seçiciliği loncalara otomatik uygulanmaz. |
| R04 | Kapalı gruplar 35 kişilik olacak. | Kabul ve transferde kapasite kontrolü yapılır. |
| R05 | Dört ayda bir shuffle olacak. | Grup dönemi ve atama geçmişi gerekir. |
| R06 | Şirket/tüzel kişilik şartı var; ülke fark etmez. | Şirket bilgisi ve doğrulama akışı gerekir. |
| R07 | Çakışan hizmetler aynı grupta olmayacak. | Hizmet çakışması kabul ve shuffle sırasında kontrol edilir. |
| R08 | Grup başkanı başvuranı arayıp sistemi ve çalışma beklentisini anlatacak. | Görüşme görevi, sonucu ve kabul öncesi takip gerekir. |
| R09 | Aylık puan tablosu olacak. | Dönemli, izlenebilir puan kayıtları gerekir. |
| R10 | Puan sistemiyle otomatik gruptan çıkarma olacak. | Kesinleşmiş kurala bağlı, tekrar güvenli bir değerlendirme gerekir. |
| R11 | İkinci çıkarılmada sekiz ay grup başvurusu yasağı olacak. | Çıkarılma geçmişi ve yasak bitişi kontrol edilir. |
| R12 | Gruptan çıkarılınca üyelik/ödeme sürerken dış etkinlik ve indirimli bilet hakları korunacak. | Hak kontrolü sadece grup durumuna bağlanmaz. |
| R13 | Pardus Business Chamber ayrı, ücretsiz ve seçici kalacak. | E4N ticari üyeliğiyle birleştirilmez. |
| R14 | Önce mevcut yazılım envanteri ve audit, sonra ekleme/çıkarma karşılaştırması, sonra UI geliştirmesi. | Uygulama işi denetim çıktıları üzerine kurulur. |
| R15 | Obsidian yerelde kurulacak; Linear API ve GitHub ile çalışma yürütülecek. | Yerel notlar, görevler ve kod arasında izlenebilir bağlantı kurulur. |

Şirket şartının geniş toplulukta hesap açmaya mı, ücretli üyeliğe mi, yalnız grup başvurusuna mı uygulandığı ayrıntısı ayrıca netleştirilecektir. R06 korunur; kapsam sessizce genişletilmez.

### 2.2. Önceki asistan önerileri — kullanıcı kararı olarak alınmayacak

- “Business Circle” adlandırması ve tek bir ana kategori/koltuk yaklaşımı.
- Referral kotası veya referral puanı olmaması önerisi. Kullanıcının aylık puan sistemi kararı kesindir; hangi faaliyetlerin puanlanacağı kesin değildir.
- GitHub’ın kod kaynağı, Linear’ın iş takibi, Obsidian’ın proje hafızası olması ayrımı. Bu belge bunu önerilen çalışma düzeni olarak kullanır.
- Kontrollü shuffle, önce simülasyon sonra uygulama ve teknik karar kayıtları. Bunlar hedef modeli güvenilir uygulamak için hazırlanan teknik önerilerdir.

### 2.3. Açık karar alanları

| Kod | Açık konu | Karara kadar yapılabilecek iş |
|---|---|---|
| D01 | Aylık puan faaliyetleri, puanlar, eşik, değerlendirme anı ve mazeretler | Mevcut sistemi denetle; sürümlenebilir kural altyapısını tasarla. Canlı çıkarma eşiği uydurma. |
| D02 | İlk çıkarılmadan sonra yeniden başvuru koşulları | Çıkarılma geçmişini ve ilk/ikinci durum ayrımını modelle. |
| D03 | İki çıkarılmanın ömür boyu mu belirli dönemde mi sayıldığı; üçüncü çıkarılmanın sonucu | Tekil çıkarılma olaylarını sakla; bilinmeyen tekrar kuralını canlıya açma. |
| D04 | Sekiz ayın başlangıcı; ay hesabı; “iki shuffle dönemi” ile sınır ilişkisi | Tarih sınırı senaryolarını hazırla; sekiz ayı otomatik 240 güne çevirme. |
| D05 | Hizmet çakışmasının sınıflandırılması; birden fazla hizmet sunan şirketler | Kategori/hizmet matrisi ve örnek çakışmalar hazırlansın. |
| D06 | Shuffle’ın şehir, görüşme, başkan, mevcut ilişkiler ve doluluk koşulları | Sert koşulları kapasite ve hizmet çakışması olarak koru; diğerlerini öneri işaretle. |
| D07 | Ücret, ödeme dönemi, ödeme aksamasında haklar ve üyelik iptali | Mevcut ödeme akışını çıkar; eski ücretleri yeni karar gibi aktarma. |
| D08 | Grup başkanının yetki sınırı; son kabulü kimin verdiği | Görüşme ve onay adımlarını ayrı tasarla. |
| D09 | 35 sayısı kesin tavan mı, hedef doluluk mu; başkan kapasiteye dahil mi | Denetimde mevcut davranışı bul; kapasiteyi açık parametre yap. |
| D10 | Şirket şartının uygulandığı aşama ve kabul edilen kanıtlar | Ülke bağımsız veri yapısı tasarla; doğrulama şartını uydurma. |

Bu açık kararlar tüm çalışmayı durdurmaz. Yalnız bağlı kabul/çıkarma/ödeme davranışları karar gelene kadar bloke edilir.

## 3. Hedef ürünün temel ayrımları

### 3.1. Üyelik, grup ve haklar

**Önerilen teknik yaklaşım:** Kişinin platform hesabı, E4N üyeliği, grup başvurusu, gruptaki yeri ve geçici başvuru yasağı ayrı kayıtlarda yönetilir. Tek bir `active/inactive` alanı hepsini temsil etmemelidir.

| Örnek durum | Kapalı grup | Yeni grup başvurusu | Dış etkinlik/indirimli bilet |
|---|---|---|---|
| Üyelik aktif, gruba kabul edilmiş | Var | Transfer/çoklu başvuru kuralı açık | Üyeliğe göre korunur |
| Üyelik aktif, gruba hiç kabul edilmemiş | Yok | Uygunluk ve görüşme kurallarına göre | Üyeliğe göre korunur |
| Üyelik aktif, ilk kez çıkarılmış | Yok | D02 kararı gerekli | Korunur |
| Üyelik aktif, ikinci kez çıkarılmış; yasak sürüyor | Yok | Sekiz aylık yasak nedeniyle engellenir | Korunur |
| Üyelik aktif, sekiz aylık yasak dolmuş | Yok | Diğer şartlar uygunsa tekrar değerlendirilebilir | Korunur |
| Üyelik sona ermiş/ödeme aksıyor | Ayrıntı D07’ye bağlı | D07’ye bağlı | D07’ye bağlı |

Grup yasağı üyenin tüm hesaba girişini kapatmaz. Yasaklı üyeye “grup başvurun şu tarihte yeniden açılacak” durumu gösterilir; dış etkinlik ve bilet akışı erişilebilir kalır.

### 3.2. Başvuru ve başkan görüşmesi

Önerilen akış: uygunluk kontrolü → grup başvurusu → başkana görüşme işi → görüşme sonucu → kategori/kapasite kontrolü → kabul veya gerekçeli alternatif sonuç.

Görüşme kaydı için başvuru, sorumlu başkan, planlanan tarih, görüşme durumu, sonuç ve karar gerekçesi yeterli başlangıçtır. Sistem telefon aramasını otomatik yapan bir AI ajanı olarak yorumlanmayacaktır; kullanıcı başkanın aramasını istemiştir. Başkan yalnız yetkili olduğu grupların başvurularını görebilmelidir.

### 3.3. Hizmet çakışması

Kontrol yalnız “sektör” etiketine dayanırsa iki dijital pazarlama ajansı farklı alt etiketlerle aynı gruba girebilir. Denetim mevcut kategori yapısını araştıracak; önerilen çözüm ekonomik olarak çakışan hizmetlerin açık matriste tanımlanmasıdır. Kişinin ana hizmeti ve diğer hizmetleri arasındaki ilişki D05 kararıyla kesinleştirilir.

Kapasite ve çakışma kontrolü son kayıt anında sunucuda yapılmalıdır. İki başkan aynı son koltuğu eşzamanlı kabul ederse iki işlem birden başarılı olmamalıdır. Admin ekranı da aynı iş kurallarına tabi olmalıdır.

### 3.4. Aylık puan ve çıkarma

Puan bir toplam sayıdan ibaret olmamalıdır. Her değişiklik için kaynak faaliyet, dönem, puan, kural sürümü ve düzeltme ilişkisi tutulması önerilir. Tek faaliyet iki kez işlendiğinde puan iki kez yazılmaz. Aylık dönem kapatıldıktan sonra yapılan düzeltmenin etkisi görülebilir olmalıdır.

Otomatik çıkarma, kesinleşmiş D01 kurallarıyla çalışır. İş tekrar çalıştığında aynı kişi aynı olay nedeniyle ikinci kez çıkarılmış sayılmamalıdır. İkinci çıkarılma kaydı ile sekiz aylık başvuru yasağı tutarlı oluşturulur. Bu işlem üyeliği iptal etmez ve üyelikten gelen dış etkinlik haklarını silmez.

### 3.5. Dört aylık shuffle

Önerilen işleyiş: dönem kapanışı → uygun üyeleri belirleme → aday dağılım üretme → çakışma/kapasite kontrolü → sonuç önizlemesi → yetkili uygulama → atama geçmişi.

Algoritma her üyeyi mutlaka yerleştirmek uğruna çakışan hizmetleri aynı gruba koymamalıdır. Yerleştirilemeyen kişi ve gerekçesi açık raporlanır. Aynı dönem işleminin tekrar uygulanması mükerrer atama üretmez. Mevcut atamalar yeni dağılım başarılı tamamlanmadan bozulmaz. Şehirler arasında transfer ve başkanın sabit kalması gibi koşullar kullanıcı kararı bulunmadan varsayılmaz.

## 4. Mevcut sistem denetimi

### 4.1. Denetimin amacı

“Bu sistem nedir, ne işe yarıyor, hangi parçası çalışıyor?” sorularına teknik kanıtla cevap vermek. Bir sayfanın görünmesi, özelliğin uçtan uca çalıştığını kanıtlamaz. Kullanılmayan kod, demo veri, aktif özellik ve yarım implementasyon ayrılır.

### 4.2. Denetim paketleri

| Paket | İncelenecek alan | Beklenen çıktı |
|---|---|---|
| A01 | Repo, branch, build, çalışma komutları, ortam değişkeni adları | Tekrarlanabilir başlangıç rehberi; incelenen commit |
| A02 | Route, sayfa, menü, kullanıcı rolleri | Sayfa envanteri ve erişim tablosu |
| A03 | UI komponentleri, form, tablo, dialog, ortak bileşen | Komponent kataloğu ve kullanım haritası |
| A04 | Backend, API, servis, iş kuralı, zamanlanmış işlem | Modül ve veri akışı envanteri |
| A05 | Şema, migration, ilişkiler, kısıtlar | Veri modeli ve alan açıklamaları |
| A06 | Hesap, üyelik, şirket ve profil | Gerçek mevcut akış ve eksikler |
| A07 | Grup, lonca, kategori, kabul ve başkan | Mevcut davranış ve hedef farkları |
| A08 | Puan, aylık tablo, çıkarma, yasak ve shuffle | Kural envanteri; aktif/yarım/yok ayrımı |
| A09 | Etkinlik, bilet, indirim, ödeme | Hakların hangi kayıttan hesaplandığı |
| A10 | Yetki, hata kaydı, veri doğrulama ve kritik testler | Kanıtlı riskler ve doğrulama raporu |
| A11 | Deploy, yapılandırma ve veri taşıma | Sürüm ve geri dönüş koşulları |

### 4.3. Her bulgunun zorunlu biçimi

```text
Bulgu kodu: AUD-...
Modül / kullanıcı akışı:
Mevcut davranış:
Kanıt: repo dosyası + sembol/fonksiyon + incelenen commit
Çalıştırılarak doğrulandı mı?: evet / hayır / engel
Durum: çalışıyor / kısmen çalışıyor / kullanılmıyor / bulunamadı / doğrulanamadı
İlgili hedef kural: R...
Etki ve öncelik:
Önerilen aksiyon: koru / değiştir / ekle / kaldırmayı değerlendir / araştır
Bağlı açık karar: D... veya yok
Doküman yolu:
Takip görevi:
```

“Bulunamadı” ile “yok” aynı değildir. Arama kapsamı belirtilmeden yok sonucu yazılmaz. Test çalıştırılamadıysa başarı iddia edilmez. Gizli anahtar değerleri rapora alınmaz; gerekli değişken adları yeterlidir.

## 5. Komponent dokümantasyonu

Komponentlerin kullanıcıya sunduğu işlev, veriyi nereden aldığı ve değiştirilince nelerin etkileneceği açıklanacak. Aynı görünümdeki bir form farklı iş kuralı kullanıyorsa bunun ayrımı yazılacak.

Her aktif komponent için şu kart hazırlanır:

```markdown
# Komponent adı
Durum: doğrulandı / kısmen doğrulandı
Repo kaynağı: ...
İncelenen commit: ...
## Ne işe yarar?
Kullanıcının hangi işini çözdüğünü 2–4 cümlede açıkla.
## Nerelerde kullanılır?
Route/sayfa ve üst komponentler.
## Girdileri ve çıktıları
Props, form değerleri, olaylar ve gerekli veri tipleri.
## Veri ve yetki
API/servis bağlantıları; sunucudaki izin kontrolü.
## Görünüm durumları
Yükleniyor, boş, hata, başarı, erişim engeli.
## İş kuralları
İlgili R kodları; açık D kodları.
## Değişiklik etkisi
Bağlı komponentler, servisler ve testler.
## Hedef model farkı
Koru/değiştir/ekle; gerekçesi.
```

İlk turda envanter tüm aktif komponentleri kapsar. Ayrıntılı kartlar önce üyelik, başvuru, başkan paneli, puan tablosu, grup ataması ve bilet akışlarında tamamlanır. Ortak görsel komponentler daha kısa açıklanabilir; gereksiz sayfa sayısı üretmek amaç değildir.

## 6. Obsidian proje hafızası

### 6.1. Önerilen klasörler

| Klasör | İçerik |
|---|---|
| `E4N/00-Proje/` | İndeks, mevcut durum, çalışma özeti ve devam notu |
| `E4N/01-Kararlar/` | Kullanıcı kararları, açık kararlar, değişiklik geçmişi |
| `E4N/02-Mevcut-Sistem/` | Repo, sayfa, API, şema ve entegrasyon envanteri |
| `E4N/03-Komponentler/` | Komponent kataloğu ve kartları |
| `E4N/04-Is-Kurallari/` | Üyelik, şirket, grup, puan, çıkarma, yasak, shuffle ve haklar |
| `E4N/05-Akislar/` | Üye, başkan ve admin yolculukları |
| `E4N/06-Gap-Analizi/` | Gereksinim karşılaştırması ve önceliklendirme |
| `E4N/07-Sprintler/` | Sprint amacı, görev bağlantıları ve tamamlanma raporu |
| `E4N/08-Teknik-Kararlar/` | Mimari kararların gerekçe ve sonuçları |
| `E4N/09-Dogrulama/` | Kritik senaryolar ve sonuç kanıtları |
| `E4N/10-Surumler/` | Sürüm notları, migration ve geri dönüş planı |

### 6.2. İndeks ve devam notu

`00-Proje/INDEX.md` tüm projeyi tekrar anlatmak yerine ilgili notlara bağlanır. Başlangıç için `Mevcut-Durum.md`, `Kararlar.md`, `Acik-Kararlar.md`, `Gap-Matrisi.md` ve `Devam-Notu.md` bağlantılarını içerir.

`Devam-Notu.md` her oturum sonunda güncellenir: son görev, incelenen commit, yapılan değişiklik, test sonucu, açık engel ve bir sonraki somut adım. Böylece yeni oturum bütün konuşmayı yeniden taşımadan devam eder.

### 6.3. Yerel çalışma koşulları

Obsidian vault’un gerçek yerel yolu çalışmanın başladığı ortamda bulunacaktır. Bu dosya herhangi bir bilgisayar yolu icat etmez. Codex’in aynı makinede okuyup yazabildiği klasör kullanılmalı; erişim başka bir ortamdaysa erişim sağlanmış gibi davranılmamalıdır. Mevcut notların üzerine toplu yazmak yerine E4N klasörü kullanılır. Kısmi güncellemede ilgili bölüm değiştirilir, ilgisiz notlar korunur.

## 7. GitHub, Linear ve Obsidian arasındaki çalışma düzeni

| Araç | Temel görev | Bir işte tutulacak bilgi |
|---|---|---|
| GitHub / repo | Kod, migration, test ve değişiklik incelemesi | Branch, commit, PR, çalıştırma sonucu |
| Linear | Yapılacak iş, öncelik, bağımlılık ve durum | Problem, kapsam, kabul kriteri, bağlı kararlar |
| Obsidian | Sistemin nasıl çalıştığı ve neden böyle tasarlandığı | İş kuralı, mimari, akış, kanıt ve devam notu |

Bir görevin bağlantı zinciri: **R/D kararı → AUD bulgusu → GAP maddesi → Linear işi → PR/commit → doğrulama sonucu → güncel Obsidian notu.**

Yeni Linear işi oluşturmadan aynı kapsamda kayıt aranır. Başlık benzerliğinden fazlası kontrol edilir: modül, kural kodu ve kapsam. Var olan kayıt güncellenir veya ilişkilendirilir. API bağlantısı, takım ve proje doğrulanmadan başarılı oluşturma bildirilmez. İş kimlikleri bu belgede planlama kodlarıdır; gerçek Linear kimlikleri değildir.

## 8. Hedef fark analizi

Audit tamamlanınca aşağıdaki matris doldurulacaktır. “Mevcut durum” sütunu kod denetimi yapılmadan doldurulmaz.

| Alan | Mevcut durum | Hedef | Aksiyon | Bağımlılık |
|---|---|---|---|---|
| Üyelik | Denetlenecek | Tek üyelik; grup erişiminden ayrık | Audit sonrası | R01, R12, D07 |
| Şirket | Denetlenecek | Ülke bağımsız şirket şartı | Audit sonrası | R06, D10 |
| Açık lonca | Denetlenecek | Geniş/açık topluluk | Audit sonrası | R03 |
| Kapalı grup | Denetlenecek | 35 kişilik seçilmiş yapı | Audit sonrası | R04, D09 |
| Hizmet çakışması | Denetlenecek | Çakışan hizmet aynı grupta bulunmaz | Audit sonrası | R07, D05 |
| Görüşme | Denetlenecek | Başkan arar, sonucu takip edilir | Audit sonrası | R08, D08 |
| Puan | Denetlenecek | Aylık ve kanıtlı hesaplama | Audit sonrası | R09, D01 |
| Çıkarma | Denetlenecek | Otomatik, mükerrer işlem üretmez | Audit sonrası | R10, D01–D03 |
| Başvuru yasağı | Denetlenecek | İkinci çıkarmada sekiz ay | Audit sonrası | R11, D03–D04 |
| Etkinlik/bilet | Denetlenecek | Grup kaybı üyelik haklarını silmez | Audit sonrası | R12, D07 |
| Shuffle | Denetlenecek | Dört ayda bir, çakışmasız dağılım | Audit sonrası | R05, D06 |
| Pardus | Denetlenecek | Ayrı ücretsiz yapı; sınırlı görünürlük | Audit sonrası | R13 |

Kaldırılacak parça tespit edilirse ona bağlı route, veri, entegrasyon ve aktif kullanıcı etkisi araştırılır. Eski modelde vardı diye silinmez; yeni modelde gerekmediği ve geçiş yöntemi belgelendirilir.

## 9. Linear için hazırlanmış görevler

### 9.1. Görev şablonu

```markdown
Başlık: [E4N][Modül] Somut sonuç
Plan kodu:
Tür: audit / karar / geliştirme / doğrulama
Problem ve mevcut kanıt:
Hedef davranış:
Kapsam:
Kapsam dışı:
İlgili kurallar: R...
Açık kararlar: D...
Bağımlılıklar:
Kabul kriterleri:
Doğrulama senaryoları:
Obsidian notları:
Repo dosyaları / PR:
Öncelik ve gerekçesi:
Tamamlanma kanıtı:
```

### 9.2. Denetim görevleri — Sprint 0

| Plan kodu | Görev | Kabul kriteri |
|---|---|---|
| AUD-01 | Repo ve çalıştırma envanteri | Branch/commit ve gerçek çalışma komutları kayıtlı; engeller açık. |
| AUD-02 | Sayfa, route ve rol envanteri | Aktif sayfalar ve erişim rolleri çıkarılmış; demo sayfalar ayrılmış. |
| AUD-03 | Komponent kataloğu | Kaynak ve kullanım yerleri kayıtlı; kritik kartlar yazılmış. |
| AUD-04 | API, servis ve zamanlanmış işler | Giriş/çıkış, iş kuralı ve çağıran modüller belgeli. |
| AUD-05 | Veri modeli | Tablo/alan/ilişki ve mevcut kısıtlar kanıtlı. |
| AUD-06 | Üyelik, şirket ve hak denetimi | Grup kaybının üyelik/bilet etkisi açıklanmış. |
| AUD-07 | Grup, lonca, görüşme ve çakışma denetimi | Mevcut kabul koşulları ve hedef farkları belirlenmiş. |
| AUD-08 | Puan, çıkarma, yasak ve shuffle denetimi | Her özellik çalışıyor/kısmi/yok/doğrulanamadı olarak işaretli. |
| AUD-09 | Kritik akış ve yetki doğrulaması | Gözlenen sonuçlar ile statik çıkarımlar ayrı raporlanmış. |
| AUD-10 | R01–R15 fark matrisi ve backlog | Her hedef kuralın audit kanıtı ve takip işi var. |

### 9.3. Geliştirme görevleri — audit sonrasında uyarlanacak taslak

| Plan kodu | Görev | Kabul kriteri | Bağımlılık |
|---|---|---|---|
| DEV-01 | Üyelik ve grup erişimini ayır | Gruptan çıkarma üyeliği ve dış etkinlik haklarını iptal etmez. | AUD-05/06, D07 |
| DEV-02 | Şirket uygunluğunu uygula | Ülke bağımsız veri alınır; kararlaştırılmış aşamada kontrol edilir. | D10, DEV-01 |
| DEV-03 | Açık lonca ve kapalı grup ayrımı | Lonca, grup kapasite/kabul kuralını miras almaz. | AUD-07 |
| DEV-04 | Hizmet çakışması modeli ve kontrolü | Çakışan iki hizmet normal kabul ve admin atamasında engellenir. | D05 |
| DEV-05 | Başkan görüşmesi ve başvuru akışı | Görüşme görevi/sonucu izlenir; yetkisiz başkan erişemez. | D08, DEV-02/04 |
| DEV-06 | Grup kapasitesi ve eşzamanlı kabul | Son yere iki eşzamanlı kabul kapasiteyi aşamaz. | D09, DEV-04/05 |
| DEV-07 | Aylık puan kayıtları ve tablo | Kaynak faaliyet tekrarı puanı çoğaltmaz; dönem ve kural sürümü görülebilir. | D01, AUD-08 |
| DEV-08 | Otomatik gruptan çıkarma | Tek değerlendirme olayı iki çıkarılma yaratmaz; gerekçe kayıtlı. | D01–D03, DEV-01/07 |
| DEV-09 | İkinci çıkarılmada başvuru yasağı | Yasak API ve UI’da aynı uygulanır; bitiş sınırı test edilir. | D03/04, DEV-08 |
| DEV-10 | Etkinlik ve indirim hak kontrolü | Grup yasağı sürerken aktif üye uygun indirimli bileti kullanabilir. | D07, DEV-01/09 |
| DEV-11 | Dört aylık shuffle simülasyonu | Kapasite ve hizmet çakışması korunur; yerleşemeyenler gerekçeli. | D06, DEV-04/06/09 |
| DEV-12 | Shuffle uygulama ve geçmiş | Dönem tekrar uygulanamaz; eski/yeni atamalar izlenir. | DEV-11 |
| DEV-13 | Üye paneli | Üyelik, grup, puan, yasak ve bilet hakları anlaşılır gösterilir. | DEV-01–10 |
| DEV-14 | Başkan paneli | Başvuru kuyruğu, görüşme ve grup bilgisi role uygun çalışır. | DEV-05/06 |
| DEV-15 | Admin paneli | Kural, kategori, çıkarma ve shuffle işlemleri yetkili ve kayıtlıdır. | DEV-04–12 |
| DEV-16 | Hedef modelin site anlatımı | Tek üyelik ve açık/kapalı ayrımı doğru anlatılır; Pardus ayrı kalır. | R01–R13 |
| DEV-17 | Mevcut veriyi hedef modele taşı | Eski/yeni sayımlar tutarlı; çıkarma geçmişi uydurulmaz. | AUD-05, veri tasarımı |
| DEV-18 | Uçtan uca sürüm doğrulaması | Kritik senaryolar geçer; başarısız/engelli kontroller kayıtlıdır. | İlgili DEV işleri |

### 9.4. Önceliklendirme

**Önce:** yanlış üyelik iptali, çakışan hizmet kabulü, mükerrer çıkarma, sekiz aylık yasağın atlanması ve yetkisiz erişim. Bunlar temel iş modelini bozabilir.

**Sonra:** başvuru/görüşme yönetimi, shuffle, puan ekranları ve başkan/admin operasyonları.

**Ardından:** görsel düzenlemeler ve mevcut model anlatımının iyileştirilmesi. Akademi, yatırım, mentorluk veya AI eşleştirme gibi ek modüller bu konuşmanın zorunlu ilk geliştirme kapsamına kendiliğinden eklenmez.

## 10. Sprint planı

Takvim ve süreler repo denetiminden sonra tahminlenecektir. Aşağıdaki sprintler kapsam sırasıdır; haftalık teslim taahhüdü değildir.

| Sprint | Amaç | Başlıca işler | Çıkış koşulu |
|---|---|---|---|
| 0 | Mevcut sistemi anlamak | AUD-01–10, Obsidian envanteri | Mevcut durum ve hedef farkları kanıtlı. |
| 1 | İş kuralı ve veri temeli | D kararları, DEV-01–04, migration taslağı | Tek üyelik/grup ayrımı ve çakışma modeli tutarlı. |
| 2 | Başvuru ve grup kabulü | DEV-05/06, ilgili başkan ekranı | Başkan görüşmesi ve çakışmasız kabul uçtan uca çalışır. |
| 3 | Puan, çıkarma ve haklar | DEV-07–10, üye durum ekranları | Tekrar çalıştırma, yasak ve dış etkinlik hakkı doğrulanmış. |
| 4 | Shuffle | DEV-11/12, ilgili admin ekranları | Simülasyon ve uygulama kapasite/çakışma kurallarını korur. |
| 5 | UI bütünlüğü ve operasyon | DEV-13–16 | Üye, başkan, admin akışları tutarlı; hata/boş durumları tamam. |
| 6 | Geçiş ve sürüm | DEV-17/18, dokümantasyon | Veri geçişi, kritik testler ve sürüm notları hazır. |

Her sprint kapanışında Linear durumu, ilgili Obsidian notu, commit/PR ve doğrulama sonuçları güncellenir. Kod tamamlandı diye çalışmayan akış “Done” yapılmaz.

## 11. Kritik doğrulama senaryoları

| Kod | Senaryo | Beklenen sonuç |
|---|---|---|
| T01 | Aktif üye ilk kez gruptan çıkarılıyor | Üyelik ve dış etkinlik/bilet hakları korunur; başvuru D02’ye göre. |
| T02 | Aynı çıkarma işi yeniden çalışıyor | Çıkarılma sayısı artmaz. |
| T03 | İkinci gerçek çıkarılma | Sekiz aylık yasak oluşur; üyelik ayrı kalır. |
| T04 | Yasaklı kişi doğrudan API ile başvuruyor | UI’dan bağımsız sunucuda engellenir. |
| T05 | Yasak bitişinden hemen önce ve sınır anında başvuru | D04 ile belirlenen kesin tarih davranışı uygulanır. |
| T06 | Yasaklı aktif üye indirimli dış etkinlik bileti alıyor | Üyelik koşulları uygunsa hak korunur. |
| T07 | İki dijital pazarlama ajansı aynı gruba kabul ediliyor | Hizmet matrisiyle çakışma engellenir. |
| T08 | Aynı son yere eşzamanlı iki kabul | Grup kapasitesi aşılmaz. |
| T09 | Shuffle’da dağıtım imkânsız | Kural gevşetilmez; yerleşemeyenler gerekçeli raporlanır. |
| T10 | Aynı shuffle uygulaması yeniden çağrılıyor | Mükerrer atama oluşmaz. |
| T11 | Başkan başka grubun başvurusunu açıyor | Yetkisiz erişim engellenir. |
| T12 | Aynı faaliyet puanı iki kez kaydediliyor | Tek puan olayı oluşur. |
| T13 | Lonca üye sayısı 35’i geçiyor | Kapalı grup sınırı loncaya uygulanmaz. |
| T14 | Migration sonrası üyelik/atama sayımı | Dönüşüm kurallarına göre eski/yeni kayıtlar uzlaşır. |

## 12. Token tüketimini azaltan çalışma düzeni

Bu bölüm hazırlanmış çalışma önerisidir; eski konuşmadan doğrulanmış sayısal tasarruf iddiası içermez.

1. İlk audit tüm sistemi kapsar; sonraki işlerde yalnız ilgili modül ve değişen dosyalar okunur.
2. Her oturumda kısa devam notu, seçilen görev ve ilgili iş kuralları başlangıç bağlamı olur.
3. Uzun konuşmalar yerine R/D karar kayıtları kullanılır. Kesin kararlar yeniden tartışılmaz.
4. Repo önce hedefli aramayla taranır; tüm dosyalar tek seferde bağlama dökülmez.
5. Bir oturumda bir net çıktı hedeflenir: örneğin “başkan görüşmesi akışını denetle”.
6. Aynı audit değişmemiş commit için tekrar yapılmaz; önemli değişiklikte bağlı not yenilenir.
7. İş sonunda yapılan/engellenen/sonraki adım kısa yazılır. Büyük raporlar dosyada kalır.
8. Doküman, Linear ve kod aynı metnin üç uzun kopyası olmaz; her biri kendi görevini taşır.

## 13. Master promptlar

Her promptta gerçek repo/vault/proje bilgisi erişilen ortamdan bulunacaktır. Aşağıdaki köşeli alanlar bilinmiyorsa uydurulmaz. Erişilemeyen bağlantı açıkça raporlanır; erişilebilen bağımsız iş sürdürülür.

### Prompt 0 — Çalışmayı başlat ve bağlamı kur

```text
E4N üzerinde çalışıyoruz. Ekli E4N_Denetim_Dokumantasyon_ve_Gelistirme_Master_Plani.md dosyasını çalışma şartnamesi olarak oku.

Amaç: mevcut sistemi denetlemek, açıklamak, Obsidian’da dokümante etmek, hedef model farklarını Linear görevlerine çevirmek ve ardından geliştirmek.

Önce çalışma ortamını doğrula:
- E4N repo yolu, branch ve commit;
- varsa AGENTS.md ve proje talimatları;
- mevcut değişiklikler;
- yerel Obsidian vault yolu ve E4N klasörü;
- Linear bağlantısı, gerçek takım/proje ve mevcut ilgili işler;
- GitHub repo ilişkisi.

Mevcut kullanıcı değişikliklerini koru. Repo/vault/Linear kimliği uydurma. Eksik bağlantıyı bağlı değil diye kaydet; erişilen bölümde ilerle.

Şartnamedeki R01–R15 kullanıcı kararlarını koru; D01–D10 belirsizliklerini karar kaydına aktar. Önceki asistan önerilerini kesin kullanıcı kararı sayma.

Bu aşamada ürün kodunu değiştirme. INDEX, Mevcut-Durum ve Devam-Notu için başlangıç içeriklerini hazırla; vault erişimi varsa E4N klasöründe kaydet. Çıktı: doğrulanan ortam, bulunan eski doküman/görevler, erişim engelleri ve ilk audit işi.
```

### Prompt 1 — Mevcut sistemin kapsamlı denetimi

```text
E4N şartnamesine göre Sprint 0 auditini yürüt. Önce Mevcut-Durum ve Devam-Notu'nu oku; incelenen commit değişmişse ilgili envanteri yenile.

Repo yapısı, build komutları, route/sayfa, aktif komponent, API/servis, şema/migration, rol/yetki, üyelik, şirket, lonca, grup, kategori, başkan görüşmesi, puan, çıkarma, yasak, shuffle, etkinlik, bilet ve ödeme alanlarını incele.

Her bulgu için AUD kodu, mevcut davranış, kaynak dosya/sembol/commit, çalıştırılarak doğrulanma durumu, hedef R kuralı ve takip aksiyonunu yaz. Aktif kodu demo/ölü/yarım koddan ayır. Statik çıkarımı çalıştırılmış doğrulama gibi sunma. Bulunamadıysa arama kapsamını belirt.

Mevcut test ve çalışma komutlarını uygun ölçüde çalıştır; engelleri kaydet. Ürün kodunu bu aşamada yeniden tasarlama. Gizli değerleri çıktı veya dokümana alma.

Obsidian'da 02-Mevcut-Sistem notlarını, audit bulgularını ve Mevcut-Durum'u güncelle. Erişim yoksa aynı içerikleri taşınabilir Markdown dosyalarında hazırla. Sonunda: sistemin sade açıklaması, modül tablosu, kritik eksikler ve kanıtlı riskler ver.
```

### Prompt 2 — Komponentleri ve iş akışlarını açıkla

```text
Audit çıktılarından E4N komponent kataloğunu ve kritik akış notlarını oluştur. Yeni varsayımlarla audit bulgularını değiştirme.

Her aktif komponentin ne işe yaradığını, kaynak dosyasını, kullanıldığı sayfaları, girdilerini/çıktılarını, bağlı servisini, yetkisini ve yükleniyor/boş/hata/başarı durumlarını yaz. Kritik komponentlerde hedef R kuralını ve açık D kararını ilişkilendir.

Üyelik, şirket kontrolü, grup başvurusu, başkan görüşmesi, kabul, aylık puan, çıkarma, sekiz aylık yasak, shuffle ve dış etkinlik bileti akışlarını ayrı ayrı açıkla. UI'da görünen iş kuralının sunucuda uygulanıp uygulanmadığını belirt.

Obsidian 03-Komponentler, 04-Is-Kurallari ve 05-Akislar notlarını güncelle. Envanter tüm aktif komponentleri kapsasın; ayrıntı kritik iş akışlarında yoğunlaşsın. Kullanılmayan parçaları aktif özellik diye sunma. Çıktı olarak katalog indeksi ve sonraki fark analizinin dayanacağı notları ver.
```

### Prompt 3 — Hedef E4N fark analizini çıkar

```text
R01–R15 hedef kurallarını audit ve komponent notlarıyla tek tek karşılaştır.

Her maddeye GAP kodu ver: hedef davranış, mevcut kanıt, fark, koru/değiştir/ekle/kaldırmayı değerlendir/araştır aksiyonu, kullanıcı etkisi, veri etkisi, ilgili dosyalar, test ihtiyacı, bağımlılıklar ve açık D kararları.

Üyelik ile grup erişiminin ayrılması, lonca ile kapalı grup ayrımı, 35 kişilik yapı, hizmet çakışması, başkan görüşmesi, aylık puan, otomatik çıkarma, ikinci çıkarılmada sekiz ay yasak, dış etkinlik hakları ve dört aylık shuffle eksiksiz kapsansın. Pardus ayrı kalsın.

Puan eşiği, ücret, ilk çıkarılma sonrası hak ve tarih sınırı gibi belirsiz kararları uydurma. Bunlar yalnız bağlı görevleri bloke etsin. Kaldırılması önerilen parçalarda kullanım ve geçiş etkisini araştır.

06-Gap-Analizi/Gap-Matrisi.md ve 01-Kararlar/Acik-Kararlar.md oluştur/güncelle. Sonuçta öncelikli değişiklikleri ve karar gerektirmeden başlanabilen işleri göster.
```

### Prompt 4 — Linear denetim ve geliştirme görevlerini oluştur

```text
E4N audit ve gap matrisini gerçek Linear işlerine dönüştür. Şartnamenin plan kodları gerçek issue ID değildir.

Linear bağlantısını, takımını ve E4N projesini doğrula. Mevcut görevleri ara; aynı işi ikinci kez oluşturma. AUD görevlerini denetim kanıtıyla ilişkilendir; tamamlanan auditleri kanıtlarına göre işaretle. GAP maddelerinden somut geliştirme/karar/doğrulama görevleri üret.

Her görev: problem, mevcut kanıt, hedef davranış, kapsam/kapsam dışı, R/D kodları, bağımlılık, kabul kriteri, doğrulama senaryosu, Obsidian bağlantısı ve öncelik gerekçesi içersin. Kabul kriteri yalnız 'çalışsın' olmasın.

Sprint 0–6 düzenini gerçek kapsam ve bağımlılıklara göre uyarla; denetimsiz süre tahmini yapma. Bağlı açık karar nedeniyle ilerleyemeyen görevleri açıkça ayır.

Başarılı API çıktısındaki gerçek ID ve URL'leri notlara ekle. Oluşturma başarısızsa oluşturuldu deme; aynı görevleri aktarılabilir Markdown olarak bırak. Sonuç: oluşturulan/güncellenen görevler, gerçek bağlantılar ve sprint kapsamı.
```

### Prompt 5 — Veri modelini ve geçişi tasarla

```text
İlgili onaylanmış Linear işini, mevcut şemayı ve R/D kararlarını okuyarak hedef veri tasarımını hazırla. Mevcut tablo/isimleri görmeden yeni altyapı varsayma.

Tek üyelik ile grup katılımını ayır. Şirket, hizmet çakışması, başvuru, görüşme, grup dönemi, atama geçmişi, puan olayı, çıkarma olayı ve başvuru yasağı arasındaki ilişkileri tasarla. İsimler teknik öneri olabilir; gereksiz yeni tablolar üretme.

Kapasite ve çakışma eşzamanlı işlemlerde korunmalı. Tek puan/çıkarma/shuffle olayı tekrar çalışınca çoğalmamalı. D01–D10 belirsizliğinin bağlı olduğu alanları belirt; belirsiz kurala göre veri üretme.

Mevcut verinin dönüşümü, önizleme, kayıt sayımı, eski/yeni alan eşleşmesi ve geri dönüş koşullarını yaz. Canlı veriye migration uygulamayı tasarım tamamlandı diye yapılmış sayma.

08-Teknik-Kararlar ve 10-Surumler notlarını güncelle. Uygulama görevinin kapsamı migration kodunu içeriyorsa izole branch'te yaz ve mevcut proje kontrolleriyle doğrula. Çıktı: değişiklik gerekçesi, migration taslağı, riskler ve doğrulama.
```

### Prompt 6 — Tek bir geliştirme görevini tamamla

```text
Şu E4N işini uygula: [GERÇEK LINEAR İŞİ VEYA DEV KODU].

Önce işi, ilgili R/D kararlarını, Obsidian notlarını, mevcut dosyaları ve testleri oku. Kabul kriterini etkileyen açık karar varsa o kısmı bloke et; bağımsız kısmı tamamla. Karar uydurma.

Mevcut repo talimatlarına uy, kullanıcı değişikliklerini koru, kapsamı gereksiz genişletme. UI'daki kontrollerin sunucuda da uygulanmasını sağla. Hedef modelin üyelik/grup/hak ayrımlarını koru.

Değişiklikle ilgili anlamlı testleri ve gerekli proje kontrollerini çalıştır. Özellikle işin kapsamına göre kapasite, çakışma, tekrar işleme, yasak sınırı ve yetki kontrollerini doğrula. Gereksiz uygulama kopyası testleri üretme.

İlgili komponent/iş kuralı notunu ve Devam-Notu'nu güncelle. Linear işini ancak kabul kriteri ve doğrulama tamamlandıysa tamamlandı say. GitHub PR hazırlığı gerekiyorsa final davranışı ve doğrulamayı anlatan kısa açıklama yaz.

Çıktı: değişen davranış, değişen dosyalar, test sonuçları, gerçek commit/PR bağlantısı varsa bağlantı, kalan engeller ve sonraki adım.
```

### Prompt 7 — Kullanıcı arayüzünü hedef akışlara göre tamamla

```text
E4N hedef UI'sını doğrulanmış iş kuralları ve API'ler üzerine kur. Önce audit ve gap notlarını oku; mevcut tasarım sistemi ve tekrar kullanılabilir komponentleri kullan.

Üye panelinde tek üyelik durumu, kapalı grup durumu, puan dönemi, başvuru/görüşme sonucu, yasak bitişi ve dış etkinlik/bilet hakları anlaşılır olsun. Gruptan çıkarılan aktif üyeye tüm hesabı kapatan ekran gösterme.

Başkan panelinde kendi başvuruları, görüşmeler ve grup bilgisi; admin panelinde hizmet/kategori, puan kuralları, çıkarma geçmişi ve shuffle önizlemesi yer alsın. Yalnız gerçekten uygulanmış backend davranışlarını çalışan özellik gibi göster.

Mobil kullanım, form doğrulama, erişim engeli, boş veri, yüklenme, başarı ve hata durumlarını tamamla. Çakışma/kapasite engelinde kullanıcıya anlaşılır gerekçe göster. Kullanıcı ekranlarına teknik audit terimleri taşıma.

İlgili akışları test ortamında uçtan uca kontrol et; gözlemlenmiş sonucu kaydet. Komponent ve akış notlarını güncelle. Çıktı: doğrulanan ekranlar, eksik backend/karar bağımlılıkları ve kontrol sonuçları.
```

### Prompt 8 — Sprint kapanışı ve sürüm hazırlığı

```text
E4N sprintini kapatmadan gerçek kapsamı doğrula. Linear işleri, kod/PR'lar, kabul kriterleri ve Obsidian notları arasında uyuşmazlık var mı kontrol et.

T01–T14 senaryolarından bu sprintin değiştirdiği alanları çalıştır. Başarısız veya çalıştırılamayan kontrolleri ayrı yaz. Migration gerekiyorsa önizleme/sayım ve geri dönüş koşullarını doğrula. Canlı dağıtımı gerçekleşmiş gibi bildirme.

Kalan açık kararları, bilinen kusurları ve bir sonraki sprint bağımlılıklarını güncelle. Sürüm notunu kullanıcının göreceği davranışla yaz; uygulama geçmişini gereksiz anlatma.

Devam-Notu'nda son commit, tamamlanan iş, test, engel ve sıradaki somut adım bulunsun. Çıktı: hazır/tamam değil kararı ve kanıtı, gerçek görev/PR bağlantıları, migration durumu ve sonraki adım.
```

### Prompt 9 — Yeni oturumda düşük bağlamla devam et

```text
E4N çalışmasına kaldığımız yerden devam et. Önce INDEX, Mevcut-Durum, Devam-Notu ve aktif Linear işini oku. Son commit ile mevcut repo durumunu karşılaştır.

Tüm geçmişi veya tüm repoyu yeniden tarama. Yalnız aktif işin R/D kurallarını, bağlı notlarını ve ilgili değişmiş dosyalarını oku. Not ile kod çelişiyorsa kanıtı bul ve ilgili notu düzelt; belirsizliği kullanıcı kararı diye çözme.

Aktif işi kapsamı içinde tamamla, gerekli doğrulamayı yap, notları güncelle. Kısa rapor: tamamlanan sonuç, test, engel, sonraki somut adım.
```

## 14. İlk çalışma oturumunun somut teslimleri

- Doğrulanmış repo/commit ve çalışma ortamı kaydı.
- Mevcut sayfa, modül, veri ve komponent envanteri.
- R01–R15 karar listesi ve D01–D10 açık karar kaydı.
- Kanıtlı audit bulguları ve hedef fark matrisi.
- Obsidian proje indeksi ve devam notu; erişim yoksa hazır Markdown içerikleri.
- Linear audit görevleri ve geliştirme taslakları; bağlantı varsa gerçek kayıtlar ve ID'ler.
- İlk uygulanabilir geliştirme işinin kapsamı ve kabul kriterleri.

Bu teslimler tamamlanınca kodlama, sistemin ne olduğu ve neye dönüşeceği bilinen bir temel üzerinde başlayabilir.
