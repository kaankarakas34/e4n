# E4N kapsam ve kuyruk ayrımı

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


## 5 Ekim WEB-06 — güncel devam noktası

E4N-140 Done / 519a3ec commit push tamamlandı. Muhasebe fatura kaydı + private kalıcı PDF + keyed upload/tek mail girişimi + sahip/ADMIN download + web retry/hesap değişim temizliği bütün paket teslim edildi. [[E4N/09-Dogrulama/WEB06-Muhasebe-Fatura-Veri-API-Web-Paketi|Doğrulama]]. İzole invoices-contract, smoke, documents-contract; check/build; gerçek bileşenle fixture tarayıcı kabulü PASS. Şema 13 sürüm / 41 tablo, canlı uygulanmadı.

Linear 84 = 28 Done / 15 In Progress / 41 Backlog. Web/ortak **24/71=%33,8**; mobil **4/12=%33,3**; LMS **0/1** ayrı son aşama. Bu ana/alt görev sayımıdır, ürün/ekran hazırlığı yüzdesi değildir. [[E4N/07-Sprintler/Web-Mobil-Ilerleme-2026-10-05|Sayım ve kalan hat]]. P35 In Progress: yeni faturalar tamam, eski dosya geçişi açık. P09/P39 kaynak teslim kanıtı güncellendi.

Aktif sıra eğitim dışı web + ortak API/veri → operasyon/web regresyonu/Sprint 6 güvenlik/sürüm → mobil/LMS. Sonraki bütün paket P39/P40 aktif web akışları veya P34 operasyon; kaynak/Linear bağımlılıklarını inceleyerek seç. D01–D10 kararı seçme; mevcut kullanıcı üyelik/grup/shuffle hedeflerini eski teknik düzeltmelerle tamamlandı sayma. E4N-133/135/136/137/138/140 Done tekrar seçilmez. Geçmişteki kurs/sınav next önerileri geçersizdir.


## 5 Ekim — mobil ve LMS en son

Kullanıcı kararı: şimdi kurs/eğitim/sınav kullanılmayacak; mobil ile birlikte görevlerden ayrılıp en son yapılacak. Aktif sıra **eğitim dışı web + gerekli API/veri → web stabilizasyon/operasyon/Sprint 6 güvenlik ve sürüm kabulü → son aşamadaki mobil ve LMS kuyrukları**. Eski sıradaki kursa bağlı sınav önerileri geçersizdir. Sınav için yalnız kaynak okundu; uygulama başlamadı.

Linear doğrulandı: Sprint 7 — Ertelenen mobil uygulama: E4N-104,134,114,115,116,117,118,119 (8 açık kayıt) Backlog/Low; aktif cycle kaldırıldı. Sprint 8 — Ertelenen kurs, eğitim ve sınav: yeni E4N-139 LMS-SON Backlog/Low. Önceki Done mobil/web teslimleri korunur. Ana PAR ve alt görev sayımı ürün yüzdesi değildir. Aktif web/ortak API işi P30/P31/P39/P40 kapsamında sürer; web kabulünde mobil veya LMS eksikleri tamamlandı gibi gösterilmez, ertelenmiş kapsam olarak ayrılır.

P37/E4N-109 web regresyonu olarak ayrıldı ve E4N-104 mobil blockedBy bağı kaldırıldı; diğer web/veri bağımlılıkları korundu. SEC-03/E4N-120 web/API/Supabase sürüm denetimi olarak güncellendi; mevcut yayındaki LMS erişim riskleri göz ardı edilmez, yeni LMS özellik geliştirme/kabulü ertelidir. Gelecek mobil/LMS sürümünde ayrıca regresyon ve güvenlik kabulü yapılır. D01–D10 kapıları ve canlıya yazmama sınırı korunur.

Zamanlanan E4N Linear görevlerini sürdür talimatı güncellendi; ACTIVE/15 dakika, mevcut iş varsa sessiz atlama korunur. Teslim edilen E4N-133/135/136/137/138 tekrar seçilmez; web işi varken mobil ve LMS başlamaz.

Güncel Linear: **83 toplam = 27 Done / 14 In Progress / 42 Backlog**. Bunun 9 kaydı ertelenen son aşama; bunlar çıkarıldığında 74 kayıt = 27 Done / 14 In Progress / 33 Backlog. Sayı değişimi kapsam/durum düzenlemesidir, yeni kod ilerlemesi değildir. Son kod b56d119; şema12/40 canlı uygulanmadı. Genel belge merkezi E4N-138 Done eğitim/sınav teslimi değildir. Mevcut menüleri/kodu/veriyi silme veya saklama kararı verilmedi.

Sonraki seçim: eğitim dışı aktif web/API/rol/veri akışlarında karar gerektirmeyen bütün paket; P39/P40 mevcut kaynak+Linear ilişkileri tekrar okunarak seçilir. Üye oluşturma ve shuffle için D bağımlılıkları atlanmaz.

