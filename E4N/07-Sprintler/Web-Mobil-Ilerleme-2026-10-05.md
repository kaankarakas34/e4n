# Web ve mobil ilerleme — 5 Ekim 2026

## 5 Ekim — WEB15 teslim / sıradaki öncelik

E4N-149 Done; commit/push97460a1c51d90054d3bba534d129873e128a1f58. Yönetici grup kataloğu gerçek grup durumları ve toplam/ACTIVE/REQUESTED/diğer/null üyelik sayımları, Türkçe filtre/detail bağlantısı, lonca okumasından bağımsız katalog ve WEB11 keyed create readback birlikte teslim. Kanıt [[WEB15-Yonetici-Grup-Katalog-Veri-API-Web-Paketi]]. Gerçek PG17/HTTP/TS contract ve WEB11 group-settings regresyonu PASS; gerçek AdminGroups captured fixture browser7catalogGET/1failedguildGET/2sameUUIDPOST açık passed=true. check/build/diff/syntax PASS, screenshot incelendi. Baseline INACTIVE reddiyle test fixture düzeltildi; other status yalnız izole runtime legacy variantında test edildi. Üretim constraint değişmedi. Browser ilk mock meeting_dates eksikliği düzeltildi; son run PASS. Canlı yazma/migration/deploy/realmail/payment yok, source14/41.

Linear93 görev:37Done/15In Progress/41Backlog. Eğitim dışı web/ortak33/80=%41,25; mobil4/12=%33,3; LMS0/1. Ağırlıksız görev sayımı, yayına hazır ürün yüzdesi değildir. Mobil12 ayrı IDs78/104/114/115/116/117/118/119/128/129/130/134, ortak132 iki kez sayılmaz.

Kullanıcı [[Web-Oncelik-Plani-2026-10-05]] sıra1 E4N149 kapandı. Sıradaki sıra2 P39/P40 bütün paket: güncel aktif web çağrıları ve server giriş/modül sahipliği envanterini delivered WEB01–15 ile uzlaştır; unused eski17module otomatik mount/silme yapma. Güncel files18/admin bağlı17eski bağlı değil; eski auth/events/reports davranışı yeni testli sözleşmenin yerine geçmez. Kalan web/API gerçek çağrı farklarını, yetki/veri/hata/tekrar kabulü ve kullanılmayan5write yolu bağımlılığıyla tek matriste değerlendir; bu inceleme yeni küçük read-only ekran taskı değildir. P30/P31 D hedefleri ayrı, aşağıdaki yayın kapıları açık.

Sonraki paketler: etkinlik/ödeme bütünlüğü P26/P14; gerçek schema/filecopy/rollback P09/P11/P35/P36; planlayıcı/kritik regresyonP34/P37; Sprint6SEC58/59/120 ve P38 release. D01–D10 uydurulmaz; mobil/LMS enson. Own browser/Vite/container kapalı; managed tracked tree temiz, scratch output untracked; HEAD/origin eşit. Bu update önceki WEB15 taslak/devam notlarını tarihsel yapar.


## 5 Ekim — WEB14 teslim / güncel devam

E4N-148 Done; 2330cc8423cda2a20f8ce5ad911809bd3b33d47a push. Yönetici üye dizini gerçek hesap + tüm ayrı grup üyelik durumları, readonly ADMIN snapshot, typed filtre/detail ve izole API/veri/web kabulü birlikte teslim. Kanıt [[WEB14-Yonetici-Uye-Dizini-Veri-API-Web-Paketi]]. Eski yazım/kabul/rol/taşıma/ücret kolu ayrı; yeni admission veya meslek onayı hesaplanmadı. check/build/contract/browser PASS, şema14/41 değişmedi, canlıya uygulanmadı.

Linear92 görev:36Done/15In Progress/41Backlog. Web/ortak32/79=%40,5; mobil4/12=%33,3; LMS0/1. Ağırlıksız görev sayımı, ürünün yayına hazır yüzdesi değildir. Mobil IDs78/104/114/115/116/117/118/119/128/129/130/134; LMS139 ayrı, ortak132 çift sayılmaz.

Sonraki bağımsız eğitim dışı web paketi adayı: yönetici grup kataloğu ve grup detayına doğru veri bağlamıyla geçiş. Güncel managed AdminGroups loadData önce getGroups sonra getPowerTeams okuyarak tüm grup görünümünü lonca okumasına bağlıyor. Kart g.member_count||0 gösteriyor; eski GET/groups tüm group_members kayıtlarını sayıyor, ACTIVE/REQUESTED ayrı değil. WEB12 gerçek grup detay snapshotını tamamladı; yeniden yapılmaz. Katalog için mevcut DB ADMIN/read-only tutarlı snapshot, ayrı grup/kayıt status sayıları/unknown, typed arama-filtre ve detail navigasyonu, hata/empty/retry/token-owner kabulünü bütün paket olarak planla; lonca/shuffle ayrı eski kola ayrılabilir. Kapasite35, kabul/hak/taşıma/dönem/shuffle kuralları D kararları olmadan seçilmez. WEB11 create/update korunur, kaynak14/41 ve canlı P09 açık. Önce P08/P31/P39/route envanteriyle bağımlılık karşılaştır; legacy silme/başkan atama kapsamı ayrı kalır.

Mobil/LMS başlamaz. P30/P31/P39/P40 ana hedefleri ve P09 canlı geçiş/SEC release kapıları açık. WEB14'ü yeniden yapma. Browser/Vite kendi işlemleri kapatıldı; managed tracked tree temiz, output scratch untracked, HEAD/origin eşit.


## 5 Ekim — WEB13 teslim / güncel devam

E4N-147 Done; commit/push 016910b7dc8128f5b1e5db0a1c523422d84d268f. Ziyaretçi başvuru inceleme ve iletişim API/veri/web/test bütün paketi teslim. Kanıt [[WEB13-Ziyaretci-Inceleme-Iletisim-Veri-API-Web-Paketi]]. E4N-146/WEB12 yeniden yapılmadı; bilinmeyen statü helperının prototype anahtar fallback'i bu paket içinde doğrulandı. Şema14/41 değişmedi, canlıya uygulanmadı.

Linear güncel:91 görev,35 Done/15 In Progress/41 Backlog. Web/ortak31/78=%39,7; mobil4/12=%33,3; LMS0/1. Ağırlıksız görev sayımı, yayına hazır ürün yüzdesi değildir. Mobil IDs78/104/114/115/116/117/118/119/128/129/130/134; LMS139 ayrı, ortak132 çift sayılmaz.

Sonraki bağımsız eğitim dışı web paketi adayı: yönetici üye dizini ve mevcut hesap/grup görünümü. Managed AdminMembers mevcut getMembers/getGroups paralel bağımlılığı; catch üyeleri [] yapıyor, mount-only fetch/account bağlamı yok, status/subscription ve tek group_name varsayımı incelenecek. P39 kapsamında mevcut hesap durumları/aktif grup listesi/dizin arama-filtre/detail verisini typed readonly ADMIN snapshot + gerçek hata/boş/token-owner koruması + izole kabul olarak planla. Yeni rol atama/kabul/ücret/şirket/grup taşıma hak kuralı D01–D10 seçilmez; mevcut ayrı yazım kolu ve legacy SEC açık tutulur. Önce gerçek /admin/members route kaynağı ile canlı-kod kaynak şeması ve P08/P31 bağımlılıklarını karşılaştır. Mobil/LMS başlamaz. E4N-147/PENDING→CONTACTED yeniden yapılmaz; yeni üyelik kabulü veya mail gönderimi değildir.


## 5 Ekim — WEB12 teslim / güncel devam

E4N-146 Done; commit/push 16b446d074d22165fef64617d09077a131fe6b0e. Yönetici grup detayı API/veri/ekran/test bütün paketi tamamlandı. Kanıt [[WEB12-Yonetici-Grup-Detay-Veri-API-Web-Paketi]]. Kaynak 14 migration/41 tablo, canlıya uygulanmadı. P31/P39/P09 ve D01–D10 ana hedefleri açık; mobil/LMS ertelenmiş.

Linear son okuma: 90 görev; 34 Done / 15 In Progress / 41 Backlog. Web ve ortak: 30/77 = %39,0; mobil: 4/12 = %33,3; LMS 0/1. Bu ağırlıksız görev sayımıdır; ürünün yayına hazır yüzdesi değildir. Mobil sınıflaması 78/104/114/115/116/117/118/119/128/129/130/134; LMS139 ayrı, ortak132 çift sayılmaz.

Sonraki bağımsız eğitim dışı web paketi adayı: yönetici ziyaretçi ekranının gerçek public_visitors kaydı / başvuru durumları / iletişim ve davet sonuçları. Önce yönetilen checkout AdminVisitors/API ile P39 ve mevcut mail sözleşmesini karşılaştır; frontend durumları/veri saklama/API karşılığını bütün paket olarak seç. Ziyaretçiyi yeni üyeliğe kabul, şirket uygunluğu, ücret/hak ve başkan onayı D kararları bu incelemeyle uydurulmaz. Gerçek mail/üretim testi yapılmaz. E4N-146 yeniden yapılmaz; legacy başkan/lonca okuma ve grup silme/kabul/rol atama SEC hedefleri ayrıca açık.



## 5 Ekim WEB-11 — güncel devam noktası

E4N-145 Done / 14ae684 push: yönetici grup ayarları şema+API+web paketi tamamlandı. Additive0014 eksik meeting_time/link alanlarını değerleri koruyarak kaynak şemaya ekler; source artık **14 sürüm/41 tablo**. POST/PUT güncel DB ADMIN, transaction/rollback, strict tarih/saat/http(s)/payload validation, status/omitted field koruma ve sameUUID create retry/concurrency içerir. Liste retry/account scope; detail gerçek saved DTO, save-lock/stale response ve modal overflow düzeltmesi birlikte doğrulandı. [[E4N/09-Dogrulama/WEB11-Yonetici-Grup-Ayarlari-Sema-API-Web-Paketi|Kanıt]]. PG17/HTTP/TS, smoke fresh/upgrade/knownlegacy, WEB09 compatibility ve gerçek AdminGroups+Detail captured fixture browser PASS; check/build/diff/syntax PASS. Canlı migration/deploy yapılmadı.

Linear **89 = 33 Done / 15 In Progress / 41 Backlog**. Web/ortak **29/76=%38,2**; mobil **4/12=%33,3**, LMS0/1 ayrı. Görev sayımıdır, ürün hazır yüzdesi değildir. Done E4N133/135/136/137/138/140/141/142/143/144/145 yeniden yapılmaz. Geçmiş notlarda13/41 tarihsel kalır; güncel bootstrap14/41. Contract başlangıç sayımları14'e güncellendi, bütün contractlar yeniden çalıştırıldı iddiası yok.

Sıradaki bağımsız web paket adayı: yönetici grup detayındaki salt okunur veri bütünlüğü. Şimdiki totalTurnover string amount toplamı yanlış olabilir; ayrı roster/referral/visitor/meeting okumaları aynı snapshot değildir. Önce mevcut veri alanlarını ve P31/P39 sınırlarını denetle; sadece hazır yönetici okuma/finansal volume/count/unknown/error/period kaynağına dayanarak bütün API+web+test paketi seç. Grup kabul/rol atama/şirket/kapasite/shuffle/puan politikaları D01–D10 uydurulmaz. P09 gerçek yedek/geçiş, P11 kalan drift, P35 eski dosyalar ve kapsamlı SEC açık; mobil/LMS son aşama.


## 5 Ekim WEB-10 — güncel devam noktası

E4N-144 Done / 07a8eb3 push: eğitim dışı kişisel aktivite özeti API+web paketi tamamlandı. Dört mevcut veri kaynağı tek JWT owner readonly snapshot, son10 deterministic kayıt, minimal typed DTO, gerçek status/direction/created/ilgili tarih, dashboard+activities retry/refresh/token/account guard ve navigasyon birlikte teslim. Eğitim API hatası özeti artık engellemez; kabul edilen/gelecek görüşme yapılmış gibi ve PRESENT kayıt doğrulanmış katılım gibi gösterilmez. [[E4N/09-Dogrulama/WEB10-Aktivite-Ozeti-API-Web-Paketi|Kanıt]]. PG17+gerçek Express/TS transport, fixture gerçek ActivitySummary browser, check/build/diff/syntax PASS. Production E2E değil. Şema13/41 değişmedi; canlıya uygulanmadı.

Linear **88 = 32 Done / 15 In Progress / 41 Backlog**. Web/ortak **28/75=%37,3**, mobil **4/12=%33,3**, LMS0/1 ayrı. Ana/alt görev sayımıdır, ürün hazır yüzdesi değildir. WEB01–10 Done; E4N133/135/136/137/138/140/141/142/143/144 yeniden yapılmaz. P30/P31/P39/P40 ana hedefleri D bağımlılıkları ve kalan sözleşmelerle açık.

Sıradaki web paket adayı: WEB09'da gerçek izole şemada görülen admin grup create/update time/link drift ve mevcut grup ayar ekran/API/veri sözleşmesi. Önce güncel AdminGroups/AdminGroupDetail ile P09/P11/P39 kaydını karşılaştır; mevcut name/status/date/time ayarlarını doğru validate/persist/readback + rol sınırı + izole kabul şeklinde bütün paket olarak planla. Yeni kapasite/iş kolu/kabul/shuffle/ücret politikası D01–D10 seçilmez; mobil/LMS başlamaz. P26 kayıt-yoklama hedefi, P09 canlı yedek/geçiş ve P35 eski dosyalar açık.


## 5 Ekim WEB-09 — güncel devam noktası

E4N-143 Done / b1dc464 push: üye dashboard grup/roster/toplantı API+web paketi tamamlandı. JWT sahibinin ACTIVE grup+üyelik snapshot'ı ve minimal roster; çoklu grupta açık seçim, profil linkleri, yerel gün ve sıralı tekil gelecek toplantılar, hata/retry/account guard birlikte doğrulandı. [[E4N/09-Dogrulama/WEB09-Grup-Toplanti-API-Web-Paketi|Kanıt]]. PG17+gerçek Express/TS API ve fixture gerçek widget browser, check/build PASS. Canlıya uygulanmadı. Başlangıç schema13/41; fixture yalnız opsiyonel time/link sütunlarını ayrıca test etti. Kaynak migration yok.

Yeni drift: baseline groups meeting_time/link alanlarını içermiyor, legacy admin create/update bunları kullanıyor. Yeni readonly API opsiyonel JSON alanlarıyla çalışır; admin yazma/geçiş uyumu P09/P11/P39'da açık kaydedildi. Bilinmeyen saat/online bağlantı bilgisi fiziksel toplantı gibi sunulmaz. D01–D10 üyelik/hak/kabul/puan kararları seçilmedi.

Linear **87 = 31 Done / 15 In Progress / 41 Backlog**. Web/ortak **27/74=%36,5**, mobil **4/12=%33,3**, LMS0/1 ayrı; bunlar görev sayımı, ürün hazır yüzdesi değil. WEB01–09 Done; E4N133/135/136/137/138/140/141/142/143 yeniden yapılmaz. P39/P30/P31/P40 ana hedefleri açık.

Sıradaki bağımsız web paketi adayı: mevcut ActivitySummary veri/API/ekran bütünlüğü. Şu an beş eski çağrıya bağlı, eğitim hatası tüm özeti bozabilir; ACCEPTED/future birebir kaydı geçmişte yapılmış gibi sunuluyor, attendance kayıt-yoklama ayrımı ve yönlendirme alan adları tekrar denetlenmeli. Mevcut durumları dürüst gösteren eğitim dışı kişisel salt okunur feed+web+API/rol/test olarak planla; yeni puan veya tamamlanma kuralı seçme. P09 gerçek yedek/geçiş, P35 eski dosya ve admin group yazma drift kapıları açık; mobil/LMS son aşama.


## 5 Ekim WEB-08 — güncel devam noktası

E4N-142 Done / 9541dff push: eğitim dışı aktivite takvimi API+web paketi tamamlandı. Yerel gün kayması ve ay sonu grid hatası giderildi; sahibi/grup erişimiyle sınırlandırılmış salt okunur API, gerçek ay yükleme, gün ajandası, etkinlik linki, hata/yenileme ve hesap değişimi birlikte doğrulandı. [[E4N/09-Dogrulama/WEB08-Aktivite-Takvim-API-Web-Paketi|Kanıt]]. PG17/HTTP gerçek TS transport, check/build ve gerçek panel+izole fixture tarayıcı PASS. React best-practices kontrolü: türetilmiş görünüm, lazy state, stale response/account guard, erişilebilir gün/ay düğmeleri. Canlıya uygulanmadı; şema13/41 değişmedi.

Linear **86 = 30 Done / 15 In Progress / 41 Backlog**; web/ortak **26/73=%35,6**, mobil **4/12=%33,3**, LMS0/1 ayrı. Görev sayımıdır, ürün hazır yüzdesi değildir. Done E4N133/135/136/137/138/140/141/142 tekrar yapılmaz. P39/P30/P31/P40 kalan hedefleri açık. Sıradaki paket güncel aktif eğitim dışı web ekranlarını ve kalan API çağrılarını inceleyerek seçilmeli; D01–D10 politikası uydurulmaz. P34 P21/P27 bağımlılıkları, P09 gerçek geçiş ve P35 eski dosya geçişi açık. Mobil/LMS son aşama.

## 5 Ekim WEB-07 — güncel devam noktası

E4N-141 Done / 5774b40 push: etkinlik kişisel kayıt API+web paketi tamamlandı. Liste/detail is_registered JWT sahibi+DB mevcut kullanıcı sınırı true/false/null; listeye diğer katılımcı kimlikleri eklenmedi. Katılacağım sekmesi ve Kayıtlı rozeti, refresh; EventDetail uncertain POST sonrası read-only recovery ve ACK/read-error ayrımı, account/token scope birlikte teslim edildi. [[E4N/09-Dogrulama/WEB07-Etkinlik-Kisisel-Kayit-API-Web-Paketi|Kanıt]]. Kayıt/ödeme mevcut detay navigasyonunda; yeni doğrudan liste butonu yok.

İzole PG17/HTTP gerçek TS API+fake mail, smoke, build/diff/syntax PASS. Gerçek UserEvents/EventDetail + captured fixture tarayıcı: read retry, lost response/recovery tek POST; mine1→owner switch0; ACK/read500/retry tek POST; screenshot kontrolü PASS. Production E2E değil. Kendi browser/Vite/konteynerler kapandı. HEAD/origin 5774b40; yalnız output kanıtları untracked. Şema13/41, canlı uygulanmadı.

Linear **85 = 29 Done / 15 In Progress / 41 Backlog**. Web/ortak **25/72=%34,7**; mobil **4/12=%33,3**; LMS0/1 ayrı. Ana/alt görev sayımıdır, ürün/ekran hazır yüzdesi değildir. P39/P26 kaynak kanıtı eklendi ama ana hedefler kapanmadı. P26 registration/attendance ayrımı, ticket/payment/capacity/FE hedefleri ile SEC mevcut attendee/online-link erişim sınırları açık. Mevcut attendance satırı is_registered demektir; gerçekleşen katılım değildir. Ürün kuralları D01–D10 uydurulmadı.

Sonraki bağımsız web paketi seçilirken P30/P31/P39/P40 açık kapsamı ve gerçek ekran/API eksiklerini yeniden oku; P34 metin bağımlılıkları P21/P27 içerdiğinden champion dönem/üyelik politikası seçme. P09 gerçek yedek+geçiş ve P35 eski fatura dosyaları açık; source-only teslimleri canlı kabul sayma. Mobil/LMS son aşama. Done E4N133/135/136/137/138/140/141 yeniden yapılmaz. Art arda gelen heartbeatler bu paket çalışırken yeni paralel iş başlatmadı.


## Platform sayım kuralı

Mobil kayıtlar: E4N-78, E4N-104, E4N-114, E4N-115, E4N-116, E4N-117, E4N-118, E4N-119, E4N-128, E4N-129, E4N-130, E4N-134. LMS ayrı E4N-139. Diğer kayıtlar web/gerekli ortak API/veri/operasyon kapsamıdır. E4N-132 referans ortak teslimi yalnız web/ortak kapsamında sayılır; mobilde ikinci kez sayılmaz. Ana epic/alt görev sayımı ağırlıksızdır; In Progress kredisi Done değildir. Yeni bütün paket kaydı paydada da sayılır.

## Linear anlık kayıtlar

| Görev | Durum | Başlık |
|---|---|---|
| E4N-98 | Backlog | P26 / Etkinlik katılım, bilet ve ödeme bütünlüğünü düzelt |
| E4N-111 | In Progress | P39 / Web API sözleşmesindeki aktif yol ve yöntem farklarını kapat |
| E4N-141 | Done | WEB-07 / Etkinlik kişisel kayıt durumunu ve web kayıt kurtarma akışını tamamla |
| E4N-81 | In Progress | P09 / Sürümlü migration tabanını ve şema kurulum provasını oluştur |
| E4N-107 | In Progress | P35 / Fatura dosyasını kalıcı depolama ve yetkili erişime taşı |
| E4N-140 | Done | WEB-06 / Muhasebe fatura dosyasını kalıcı veri, API ve web ile tamamla |
| E4N-119 | Backlog | PAR-05 / Web ve mobil özellik eşitliğini uçtan uca doğrula |
| E4N-118 | Backlog | PAR-04 / Başkan ve admin işlevlerini web ve mobilde eşitle |
| E4N-117 | Backlog | PAR-03 / Genel, ziyaretçi ve üye akışlarını web ve mobilde eşitle |
| E4N-116 | Backlog | PAR-02 / Ortak API, veri ve rol davranışını iki platformda denetle |
| E4N-114 | Backlog | PAR / Web ve mobil özellik eşitliği programı |
| E4N-134 | Backlog | MOB-01 / Kişisel rapor mobil ekranını doğrulanmış web API sözleşmesine eşitle |
| E4N-104 | Backlog | P32 / Mobil API ve ekran sözleşmesini mevcut hedefe eşitle |
| E4N-138 | Done | WEB-05 Belge merkezini kalıcı dosya, API ve web ile tamamla |
| E4N-80 | In Progress | P08 / API eksikleri, tekrarlar ve status yollarını karara bağla |
| E4N-110 | Backlog | P38 / Sürüm kararı, dokümantasyon ve izlenebilirliği kapat |
| E4N-71 | In Progress | EPIC-E7 / Web/mobil kullanıcı akışları |
| E4N-113 | Backlog | P41 / Demo ve kullanılmayan parçaların korunma veya kaldırılma kararını ver |
| E4N-103 | Backlog | P31 / Başkan ve admin web işlemlerini gerçek akışlara bağla |
| E4N-102 | Backlog | P30 / Üye web panelini yeni üyelik ve grup haklarıyla tamamla |
| E4N-112 | In Progress | P40 / Tekrarlanan Express route'larını ve bağlantısız modülleri düzenle |
| E4N-115 | Backlog | PAR-01 / Web ve mobil yetenek, navigasyon ve rol matrisi denetimi |
| E4N-120 | Backlog | SEC-03 / Web, API ve Supabase sürüm güvenlik denetimi |
| E4N-109 | Backlog | P37 / Web kritik uçtan uca regresyonunu tamamla |
| E4N-139 | Backlog | LMS-SON / Kurs, eğitim ve sınav yaşam döngüsünü son aşamada tamamla |
| E4N-137 | Done | WEB-04 / Birebir mesaj yaşam döngüsünü veri, API ve web ile tamamla |
| E4N-136 | Done | WEB-03 / Profil ve bağlantı isteği yaşam döngüsünü tamamla |
| E4N-135 | Done | WEB-02 / Yönetici raporlarını tek salt okunur veri sözleşmesiyle tamamla |
| E4N-133 | Done | WEB-01 / Kişisel raporları gerçek API ve veri kaynağına bağla |
| E4N-132 | Done | P32-D / Referans yaşam döngüsünü API, web ve mobil birlikte tamamla |
| E4N-131 | Done | PAR03-D / Web birebir görüşme kaydı ve kayıt sonrası okuma akışı |
| E4N-130 | Done | P32-C / Tamamlanmış birebir görüşme kayıt bütünlüğü ve mobil eşitlik |
| E4N-129 | Done | P32-B / Mobil toplantı talep yaşam döngüsü ve navigasyon eşitliği |
| E4N-128 | Done | P32-A / Mobil destek üye/admin yaşam döngüsünü ortak API ile eşitle |
| E4N-127 | Done | P39-B / Destek talebi, yanıt ve durum akışını DB/API/web birlikte tamamla |
| E4N-86 | In Progress | P14 / Ödeme işlem sahipliği ve callback tekrar güvenliğini kur |
| E4N-126 | Done | P14-B / Ödeme başlatma tekrarı ve sayfa yenileme kurtarma paketini tamamla |
| E4N-67 | In Progress | EPIC-E3 / Üyelik, ödeme ve haklar |
| E4N-125 | Done | P14-A / Ödeme sahipliği, sağlayıcı doğrulaması ve atomik sonuç paketini tamamla |
| E4N-84 | Backlog | P12 / Tek üyelik ile grup erişimini ayrı hak politikası olarak uygula |
| E4N-124 | Done | P39-A / Toplantı talebi akışını DB, API ve web birlikte tamamla |
| E4N-82 | In Progress | P10 / Hedef veri modelini ve eski veri eşlemesini tasarla |
| E4N-75 | In Progress | P03 / Üyelik, şirket ve ödeme kararlarını netleştir |
| E4N-74 | In Progress | P02 / Grup, hizmet çakışması ve shuffle kararlarını netleştir |
| E4N-73 | In Progress | P01 / Puan, çıkarma ve sekiz ay kararlarını netleştir |
| E4N-83 | In Progress | P11 / Durum kısıtlarını ve canlı-kod şema driftini uyumla |
| E4N-123 | Done | PAR-04-A / Web admin destek okuma ve yazma sınırlarını doğrula |
| E4N-122 | Done | PAR-03-A / Web kullanıcı destek okuma ve yazma sınırlarını doğrula |
| E4N-121 | Done | P09-A / İzole sürümlü kurulum ve HTTP içi DDL kaldırma paketini doğrula |
| E4N-66 | In Progress | EPIC-E2 / Şema ve veri geçiş temeli |
| E4N-65 | In Progress | EPIC-E1 / Karar ve stabilizasyon |
| E4N-101 | Backlog | P29 / Shuffle'ı atomik uygula ve atama geçmişi tut |
| E4N-100 | Backlog | P28 / Kapasite ve hizmet kuralını koruyan shuffle önizlemesi üret |
| E4N-99 | Backlog | P27 / Dört aylık dönem ve shuffle uygunluğunu tanımla |
| E4N-97 | Backlog | P25 / Dış etkinlik ve indirimli bilet hakkını üyelikten hesapla |
| E4N-94 | Backlog | P22 / Aylık puanı kesinleştir ve tablo olarak sun |
| E4N-93 | Backlog | P21 / Aylık puan olay defterini ve tekrar anahtarını kur |
| E4N-92 | Backlog | P20 / Grup kabul, ret ve taşıma status yollarını doğrula |
| E4N-91 | Backlog | P19 / Grup üyeliği ve çıkarılma geçmişini koru |
| E4N-90 | Backlog | P18 / Başvuru ve başkan görüşmesi kaydını oluştur |
| E4N-89 | Backlog | P17 / 35 kişilik kapasite ve eşzamanlı kabulü koru |
| E4N-88 | Backlog | P16 / Hizmet sınıflandırması ve çakışma kontrolünü kur |
| E4N-87 | Backlog | P15 / Açık lonca üyeliği yaşam döngüsünü kur |
| E4N-85 | Backlog | P13 / Şirket uygunluğu ve eski hesap geçişini uygula |
| E4N-59 | Backlog | SEC-02 / Depodaki veritabanı bağlantısı ve JWT varsayılanını güvenli geçişe hazırla |
| E4N-58 | Backlog | SEC-01 / Supabase public tabloları için RLS ve erişim planını hazırla |
| E4N-64 | Done | AUD-05 / Mevcut hata ve çalışma durumu envanterini çıkar |
| E4N-78 | Done | P06 / Mobil API adresini ve temel bağlantıyı doğrula |
| E4N-79 | Done | P07 / Bildirim veri ve istemci sözleşmesini birleştir |
| E4N-77 | Done | P05 / Etkinlik listesinin 500 hatasını ve GET yan etkisini gider |
| E4N-76 | Done | P04 / Üretim dışı veritabanı ve akış doğrulama ortamını kur |
| E4N-63 | Done | GAP-01 / R01–R15 hedeflerini mevcut E4N sistemiyle karşılaştır |
| E4N-62 | Done | AUD-04 / Canlı Supabase şemasını uygulama ihtiyaçlarına göre denetle |
| E4N-61 | Done | AUD-01 / Mevcut E4N web/API/mobil mimarisini ve aktif kod yollarını doğrula |
| E4N-60 | Done | AUD-03 / Grup kabulü, üyelik, puan ve shuffle iş kurallarını uçtan uca denetle |
| E4N-57 | Done | AUD-02 / Supabase bağlantılarını, canlı şemayı ve veri kayıt yerlerini haritala |
| E4N-108 | Backlog | P36 / Veri geçişini prova et ve geri dönüş koşullarını yaz |
| E4N-96 | Backlog | P24 / İkinci çıkarılmada sekiz ay başvuru yasağını uygula |
| E4N-95 | Backlog | P23 / Puana bağlı otomatik çıkarmayı tekrar güvenli uygula |
| E4N-106 | Backlog | P34 / Cron ve zamanlanmış işleri tekrar güvenli çalıştır |
| E4N-72 | Backlog | EPIC-E8 / Operasyon ve sürüm doğrulama |
| E4N-105 | Backlog | P33 / Site anlatımını tek üyelik ve açık/kapalı yapıya güncelle |
| E4N-70 | Backlog | EPIC-E6 / Dört aylık shuffle |
| E4N-69 | Backlog | EPIC-E5 / Puan, çıkarma ve yasak |
| E4N-68 | Backlog | EPIC-E4 / Lonca ve kapalı grup |
