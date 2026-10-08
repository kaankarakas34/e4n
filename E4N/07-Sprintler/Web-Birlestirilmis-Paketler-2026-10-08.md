# Birleştirilmiş web paketleri — 8 Ekim 2026

## 8 Ekim — P39 bağlantı kaynağı ve yönlendirme bütün web paketi

Sorun: Bağlantılarım ve EXTERNAL yönlendirme alıcıları /user/friends ortak ACTIVE grup/lonca satırlarından geliyordu; acceptedfriend_requests kaynağı kullanılmıyordu. Shuffle/grup değişikliği kabul edilmiş bağlantıyı görünümden silebiliyordu.

Çözüm: GET /api/user/connections güncel DB sahibi, private/no-store, readonly repeatable-read ve minimal id/name/profession/company/city DTO ile iki yöndeki ACCEPTED bağlantıları okur. Ortak üyelik kabul değildir; PENDING/REJECTED/self hariç. Çelişkili çift kayıt409,1000üzeri503; sahip query override400, silinmiş hesap401. Eski friend_requests verisi yeniden yorumlanmadı, migration yok. Bağlantılarım ve EXTERNAL formu aynı tipli kaynakta; INTERNAL grup/lonca listesi korunur.

Web: yükleme/hata/gerçek boş/yenileme/Türkçe isim-meslek-şirket-şehir arama, çalışan profil ve doğru recipient parametreli mesaj bağlantısı. Hesap+rol+token bağlamı/eski yanıt koruması; alıcı listesi yenilenirken silinmiş/reddedilmiş seçimi temizler. Sahte sıfır performans rozeti ve çalışmayan mesaj düğmesi yeni gerçek akışa taşınmadı. Grup/lonca katalog ve başvuru kolları korunur.

Kanıt: gerçek uygulama/Express/JWT/izole PG17 taze browser **61PASS0FAIL**, output/web-browser/2026-10-08T09-59-34-816Z/browser-report.json. Önceki55senaryo +6bağlantı/yönlendirme senaryosu ve sonDBuzlaştırması: kabul edilmiş farklı grup/ortak üyelik olmayan admin görünür; pending applicant/common seat hariç; hata/retry/arama/profil/mesaj; EXTERNAL kayıpPOSTyanıtı+aynıkeyretry tekDBsatırı, yenileme, iptal edilen seçimin temizlenmesi, ilgisiz hesapta empty. Fake500 yalnızUIhata testi; veritabanına gerçek API üzerinden erişildi. SonDBtekEXTERNALPENDING ve önceki tüm invariants korundu.

Üç odaklı gerçek API/veri kontratı PASS: connections (iki yön, grup ayrılığı, privacy/DTO/owner/duplicate409/readfailure/recovery/bounded503/read-only), referral --web-only (mevcut lifecycle/score rollback + acceptedsource ve grup/lonca ayrılığı), route ownership (177exactstatic/Expressroute,24provider,17retainedlegacy). Loglar output/p39-connections-contract.log, output/p39-referral-contract.log, output/p39-route-contract.log. Build/diff PASS, output/p39-connections-build.log; mevcut bundle/browser-mapping uyarıları. Güncel kaynakla toplu34APIrun yapılmış iddiası yok; önceki P26 birleşik34kanıt ayrı. Screenshot gözle incelendi. Ownedfixture/browser/API/Vite/DB kapatıldı.

Sınırlar: bu paket kabul edilmiş bağlantıların liste/alıcı kaynağını düzeltir. Mevcut POST /referrals alıcı uygunluğunu yeni friend/group politika kuralıyla kısıtlamaz; EXTERNAL yalnız farklıgrup olmalıdır veya INTERNAL yazımı ortakgrup zorunluluğudur diye yeni ürün kararı seçilmedi. Eski /user/friends ortaküyelik endpointi uyumluluk için korunur; mobil ertelenmiştir. Tüm legacywriters/auth/rol/broadRLS güvenlik kabulü ve P39 D'ye bağlı diğer yollar açık. CanlıSupabase/deploy/gerçekmail/ödeme yok; şema22migration/46apptable+ledger=47 değişmedi. P39/P37 InProgress, releaseReady=false; yeni küçükDoneiş yok.

Sonraki büyük web işi: mevcut kabul edilmiş bağlantı/yönlendirme kaynağı tamamlandı; P39'un kalan aktif web çağrıları ve P37 kabul matrisindeki karar bağımsız boşluklar güncel envanterle ele alınır. Üyelik/grup/puan/shuffle XL ürün kararları ve gerçekcanlıgeçiş/provider kapıları açık; mobil7/LMS8 enson.


## 8 Ekim — P26 yönetici yoklama ve düzeltme paketi

Mevcut ADMIN için gerçek kayıt üzerinden PRESENT/ABSENT gözlemi ve REGISTERED geri alma tamamlandı. Açıklama zorunlu; önceki/sonraki durum, yönetici ve zaman değiştirilemeyen ayrı geçmişte. Veri, iki özel API, tipli web sözleşmesi ve yönetici ekranı birlikte teslim edilir. Başkan yetkisi, yeni puan/hak/fiyat kararı veya eski kayıtların doğruluğu varsayılmadı. Gelecek/iptal/eğitim etkinliğine yeni yoklama yazılmaz.

Doğrulama: gerçek web → API → izole PG17 taze **55 PASS / 0 FAIL**: output/web-browser/2026-10-08T09-38-57-431Z/browser-report.json. Kayıp PUT yanıtında tek yazma ve GET ile uzlaştırma; açıklamalı düzeltme/geri alma/yenileme; kayıt sayısı korunur. API/veri **34 PASS birleşik kanıt**: output/p26-attendance/combined-api-report.json; toplu 09-38-36 turu 33 PASS + eski tablo sayımı beklentisi onarılan isolated-smoke ayrıca exit0. Bu yeni bir 34/0 toplu tur değildir; ilk başarısız raporlar korundu. Yeni kontrat sekiz eşzamanlı aynı istek, replay/stale409, rollback, güncel DB rolü ve geçmiş UPDATE/DELETE/TRUNCATE yasağını doğruladı. Build ve diff kontrolü PASS; 176 route/24 provider/17 retained legacy.

Şema0022: 22 migration, 46 uygulama tablosu + schema_migrations =47; fresh/repeat/0021 yükseltme ve sentetik restore geçti. Canlı migration/deploy/gerçek mail/ödeme yapılmadı. 0021+0022 üretim geçiş kapısı ayrı açıktır.

Sınır: geçmiş yalnız yeni yönetici API işlemlerini kapsar; eski bulk writer/doğrudan SQL tümüyle denetlenmiş sayılmaz. Son manuel durum mevcut duruma eşitse kaynak zamanı gösterilir; legacy PRESENT otomatik doğrulanmaz. Son50 işlem gösterilir, toplam belirtilir. P26/P37/P39 In Progress: bilet/hak/fiyat/provider sandbox, eski veri yorumu ve kalan ürün kararları açık. Sonraki bağımsız web paketi P39 bağlantı alıcı kaynağı/API/ekran uyumu; üyelik, grup, puan ve shuffle XL karar kapıları korunur. Mobil/LMS ertelenmiştir.


## 8 Ekim — Küçük işleri ana teslimlere gömme (güncel)

Önceki 7 büyük paket korunur; aşağıdaki işler artık aynı seviyede ayrı paketler değildir. Linear'da gerçek parent/alt görev ilişkileri değiştirildi.

| Ortak teslim | İçine alınan işler | Ardışık çalışma |
|---|---|---|
| P14 / E4N-86 ödeme ve fatura | P35 / E4N-107 | ödeme/tekrar/callback → fatura kaydı/dosya/erişim → üye/admin ekranı → bütün kabul |
| P26 / E4N-98 etkinlik | P25 / E4N-97 | kayıt/bilet/ödeme → onaylı bilet hakkı → yoklama/düzeltme → sayaç/ekran/veri kabulü |
| P39 / E4N-111 web tutarlılığı | P08 / E4N-80, P41 / E4N-113, P33 / E4N-105 | API kararı → gerçek API/ekran farkları → demo/kullanım kararı → onaylı metinler → bütün akış kabulü |

Beş görev üç ana teslimin altına taşındı. API, dosya erişimi, ekran, metin, düğme, yenileme, hata gösterimi ve aynı akıştaki test düzenlemeleri ana paketle beraber bitirilir. Bu parçalar için ayrı “bitti” teslimi veya ayrı uygulama turu açılmaz. Görev kimlikleri/kanıtları alt iş olarak korunur; kalan iş silinmez.

P41'in artık parent olan P39'un tamamen Done olmasını beklemesi gereksiz kapanış döngüsü yaratacağından bu ilişki kaldırıldı. P08 karar bağımlılığı korundu; P39'un API/ekran uyumu adımının kabulü P41'den önce paket kontrol listesinde yer alır. P25 mevcut hak/karar/engel bağımlılıkları korunur; mevcut etkinlik akışının bağımsız kısmı ilerleyebilir.

8 kayıtta parent ve durum tekrar okundu; 5 taşıma doğru, durumlar değişmedi, parent'a bekleme ilişkisi kalmadı. Uygulama kodu/test sonuçları değişmedi. Mobil/LMS ertelenmiş; D kararları uydurulmaz.


Kullanıcı talebi: bağlantılı işleri ardışık yürütmek ve ayrı duran paketleri birleştirmek. Linear canlı envanteri ve mevcut bağımlılıklar kontrol edildi. **34 açık ana görev 7 mevcut epic altında toplandı**; ayrıca SEC58/59/120 sürüm epic'ine alındı. Yeni küçük görev açılmadı. Kimlikler, geçmiş kanıtlar, Done kayıtları ve açık ürün kararları korunur.

## Ortak paketler ve sıra

| Sıra | Ortak paket | Boyut | Paket içi uygulama sırası |
|---|---|---|---|
| 01 | Üyelik, ödeme, haklar ve etkinlik | XL | E4N-75 → E4N-84 → E4N-85 → E4N-86 → E4N-107 → E4N-97 → E4N-98 → E4N-102 |
| 02 | Grup başvuru, görüşme, kabul ve transfer | XL | E4N-74 → E4N-87 → E4N-88 → E4N-90 → E4N-91 → E4N-92 → E4N-103 |
| 03 | Puan, çıkarma ve yeniden başvuru | XL | E4N-73 → E4N-93 → E4N-94 → E4N-95 → E4N-96 |
| 04 | Ödeme uygunluğu ve shuffle | XL | E4N-99 → E4N-100 → E4N-101 |
| 05 | Ortak veri modeli, geçiş ve geri dönüş | XL | E4N-81 → E4N-82 → E4N-83 → E4N-108 |
| 06 | Aktif web sözleşmesi ve ürün anlatımı | L | E4N-80 → E4N-111 → E4N-113 → E4N-105 |
| 07 | Operasyon, güvenlik ve web sürüm kabulü | XL | E4N-106 → E4N-109 → E4N-110 |

## 01 — Üyelik, ödeme, haklar ve etkinlik

Ana kayıt: E4N-67. Üyelik/şirket kararı → hak modeli ve eski hesap eşleme → ödeme/callback/fatura → bilet hakkı ve etkinlik kaydı/yoklama → üye paneli.

D07/D10 fiyat/dönem, gecikme başlangıcı, kısıtlanan haklar/açılma ve bilet kuralları açık. P30'un puan/başvuru engeli ekranları 03 paketine bağlıdır. Şimdiki uygulama: P26 mevcut kayıt/yoklama akışının kalan bütün paketi; ödeme sağlayıcısı sandbox ve eski fatura kabulü aynı para akışının parçalarıdır.

## 02 — Grup başvuru, görüşme, kabul ve transfer

Ana kayıt: E4N-68. Grup/hizmet/başkan yetkisi kararı → açık lonca ve hizmet koltuğu → başvuru/başkan görüşmesi → kabul/ret/transfer + atomik geçmiş → üye/başkan/admin ekranları.

Başkan hariç 35 kapasite P17 Done; yeniden yapılmaz. D05/D06/D08 ve grup bazlı rol modeli açık. P31'in shuffle yönetimi 04 paketinden sonra kapanır; grup kabul ekranı bunun yüzünden ertelenmez.

## 03 — Puan, çıkarma ve yeniden başvuru

Ana kayıt: E4N-69. D01–D04 → kaynak olay defteri → aylık kesinleşme/tablo → tekrar güvenli çıkarma/geçmiş → yeniden başvuru engeli → üye/admin açıklaması.

Etkinlikte REGISTERED puan kaynağı değildir; doğrulanmış yoklama kaynağı 01 paketinden gelir. Çıkarma üyelik geçmişi 02 ile ortak kullanılır. Eşik/dönem/itiraz/ikinci çıkarılma ayrıntıları uydurulmaz.

## 04 — Ödeme uygunluğu ve shuffle

Ana kayıt: E4N-70. Üyelik/ödeme/başvuru engeli + hizmet/kapasite + dönem → uygunluk/kesim → önizleme → atomik uygulama/kalıcı geçmiş → bildirim ve üye/başkan/admin ekranı.

01/02/03 verilerini tüketir. Kesim saati, grace etkileşimi, başkan davranışı ve dönem ayrıntıları açık. Önizleme/atomik geçmişin teslim edilmiş kısmı tekrar iş sayılmaz.

## 05 — Ortak veri modeli, geçiş ve geri dönüş

Ana kayıt: E4N-66. Sürümlü şema → D kararlarıyla hedef/eski veri eşleme → durum kısıtları/drift → üretim kopyasında geçiş provası/geri dönüş.

Bu ortak hat her ürün paketiyle ilerler; tüm veri paketinin kapanması bağımsız web işlerinin başlangıç şartı değildir. P36 nihai provası shuffle hedef modeli ve gerçek yedek gerektirir. Canlı yazma/dağıtım yetkisi içermez.

## 06 — Aktif web sözleşmesi ve ürün anlatımı

Ana kayıt: E4N-71. Aktif yol/yanıt kararı → bağlantı/yönlendirme gibi gerçek sözleşme farkları → demo/kullanılmayan parça kararı → onaylı ürün metinleri.

P39 API+ekran+veri testleri ilgili ürün paketiyle beraber teslim edilir; yalnız endpoint kapatmak ayrı teslim değildir. EXTERNAL alıcı kaynağı farkı açıktır. P40 ve WEB01–15 Done; tekrar yapılmaz. Mobil/eşitlik mevcut Sprint7'de ayrı kalır.

## 07 — Operasyon, güvenlik ve web sürüm kabulü

Ana kayıt: E4N-72. Ürün paketleri boyunca tekrar güvenli job/scheduler ve bütün regresyon → son veri/geri dönüş provası → Sprint6 kapsamlı güvenlik → sürüm kararı.

P34 üyelik, puan ve shuffle işlerini tek ortak operasyon hattında destekler; bu runnerları üç defa yapmayız. P37 testleri her paketle ilerler, nihai kapanış tüm web kapılarına bağlıdır. SEC58/59/120 Sprint6; mobil Sprint7 ve LMS Sprint8 en son.

## Birleştirilen teslimler

- P30 üye web paneli üyelik/haklar epic'ine taşındı. Puan/engel ekranının nihai kabulü 03 paketinden sonra; üyelik bölümü önce uygulanabilir.
- P31 başkan/admin web işlemleri grup epic'ine taşındı. Grup başvuru ve kabul ekranı grup işleriyle; shuffle bölümü 04'le birlikte doğrulanır.
- P35 kalıcı fatura/erişim, ödeme ve callback paketiyle birleşti.
- P26 etkinlik kayıt/bilet/yoklama, üyelik–ödeme–haklar paketine alındı. P25 yeni bilet hakkı kararına bağlıdır; mevcut P26 akışı bunun tamamlanmasını beklemek zorunda değildir.
- P36 veri geçişi ve geri dönüş, P09/P10/P11 ile ortak veri epic'ine taşındı. Final prova hedef model + gerçek yedek gerektirir.
- P01/P02/P03 kararları ilgili puan/grup/üyelik paketinin başına alındı; D kuralları uydurulmaz.
- P08/P39/P41/P33 web sözleşmesi ve ürün anlatımı epic'inde toplandı. API düzeltmesi ilgili ürün akışının veri/ekran/test kabulüyle beraber teslim edilir.
- P34 ortak operasyon, P37 bütün regresyon, SEC58/59/120 ve P38 son sürüm kabulü aynı operasyon/sürüm epic'indedir.

Açık görevlerin sprinti parent epic ile eşlendi; Done alt görevlerin tarihsel sprintleri değiştirilmedi. Paket sırası UI'daki açıklamalarda kayıtlıdır; Linear'ın elle sürükleme sırası değiştirildi iddiası yok.

## Gerçek bağımlılık düzeltmeleri

- P13 şirket/eski hesap geçişi ← P03 üyelik kararı ve P10 hedef model.
- P15 açık lonca yaşam döngüsü ← P02 grup kararı ve P12 hak modeli.
- P22 aylık kesinleşme ← P21 puan olay defteri.
- P27 ödeme uygunluğu ← P12 hak modeli; mevcut grup/engel/karar bağımlılıkları korunur.
- P37 nihai bütün web kabulü ← P26, P30, P31, P33, P41; mevcut bağımlılıklar da korunur.

Bu kapılar görevlerin **tam kapanışı** içindir. Bağımsız mevcut akış düzeltmeleri ve test hazırlığı yapılabilir. Epic'ler arasında yapay bir tamamlama zinciri kurulmadı. Değişen görevlerde önceki blockedBy kayıtları korundu; açık görev grafiğinde döngü yok. 34 görev için parent/sprint doğrulaması: 0 uyuşmazlık.

## Şimdiki hareket sırası

1. **01 paketinin yapılabilir kısmı: P26 kayıt → gerçek yoklama/check-in → düzeltme geçmişi → bilet/ödeme/sayaç/web bütün kabulü.** Açık yoklama semantiği kaynak ve mevcut yetki modelinden netleştirilmeden yeni politika seçilmez.
2. Aynı ürün akışını etkileyen P39 API/ekran farkları birlikte kapatılır. EXTERNAL bağlantı alıcı kaynağındaki fark için kabul edilmiş bağlantı/uygunluk sözleşmesi ayrıca açık kalır.
3. D07/D10 cevaplarıyla 01'in hedef üyelik/hakları; D05/D06/D08 cevaplarıyla 02; D01–D04 ile 03; bu çıktılarla 04 tamamlanır. Kararsız hedefler olmuş gibi Done sayılmaz.
4. 05 veri hattı ve 06 sözleşme hattı ilgili ürün paketleriyle ilerler; 07 regresyonu her teslimde, kapsamlı güvenlik ve nihai sürüm kararı en sonda.

## Ortak teslim ölçütü ve sınırlar

Veri/migration + API ve rol/veri sınırları + gerçek web ekranları + izole bütün akış testi + commit/push + Linear/Obsidian tek paket kabulüdür. Alt endpoint, düğme veya cron tek başına ana paket teslimi sayılmaz. Bu düzenleme ilerleme yüzdesini artırmaz, iş durumlarını Done yapmaz.

Mobil Sprint7, kurs/eğitim/sınav Sprint8 en son. Web kabulü bunlara bağlanmaz. Canlı Supabase yazma, üretim dağıtımı, gerçek mail/ödeme yok. Bu tur plan/Linear düzenlemesidir; uygulama kodu ve test sonucu değişmedi.
