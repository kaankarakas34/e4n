# E4N hareket planı — 2 Ekim 2026

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


**4 Ekim son teslim WEB-04 / E4N-137 Done, 47943b1 push.** Birebir mesaj veri/API/web + migration + izole kabul paketi tamamlandı. [[E4N/09-Dogrulama/WEB04-Birebir-Mesaj-Veri-API-Web-Paketi|Kanıt]]. Sonraki web sırası: **belge yaşam döngüsü → kursa bağlı sınav yönetimi → kararları hazır yönetici akışları**. Belge mevcut sahte '#' dosya hedefini kalıcı saklama/rol/metadata/indirme/yazma/silme ve testleriyle birlikte çöz; sınav zorunlu course ve attempt geçmişini korusun. D bağlı üyelik/grup/shuffle kararı uydurma. Mobil ayrı ve webden sonra. Şema 11/38 izole, canlı P09 geçişi açık. Eski messaging-next notları tarihsel.

**4 Ekim son teslim: WEB-03 / E4N-136 Done, 1962cf3 push.** Profil/bağlantı API + web + izole veri/lifecycle/tarayıcı paketi tamamlandı. [[E4N/09-Dogrulama/WEB03-Profil-Baglanti-API-Web-Paketi|Kanıt ve sıradaki paket bağımlılıkları]]. Sonraki web adayı birebir mesaj akışı: mevcut kabul edilmiş bağlantı UI sınırı, kalıcı mesaj modeli, owner/recipient API, gönderim tekrar güvenliği, profil alıcı navigasyonu ve ekran/kabul birlikte. Önce P08/P32 kapsamını doğrula. Belge/sınav paketleri de açık; rol/saklama/dosya hedefi ve zorunlu course/attempt geçmişi bağımlılıklarını çöz. Mobil ayrı, webden sonra. Ana P39 ve D bağlı üyelik/shuffle işi açık; önceki profil ve rapor sıra notları tarihsel.

## Güncel öncelik — 4 Ekim: web önce, mobil ayrı

**Son teslim WEB-02/E4N-135 Done4b11c1d/push:** yönetici raporu API+webthree tabs+izole veri/role/lifecycle/build/Playwright paketi tamam. [[E4N/09-Dogrulama/WEB02-Yonetici-Rapor-API-Web-Paketi]]. İlk sonrakiweb P39 aktif profil/bağlantı ve kalanAPI farklarından büyükpaket seçimi; PublicProfilefriendcheck/mesajlar/belgeler/examwrite/createMember/shufflenotify kaynak, veri veDbağımlılığı incelenir. Mobil134 ayrısonrasına. AşağıdakiWEB01→adminreport sırası teslim edilmiş tarihsel aşamadır.

**Son teslim: WEB-01/E4N-133 Done09a2731/push.** [[E4N/09-Dogrulama/WEB01-Kisisel-Rapor-API-Web-Paketi]]. API+web+izole veri/TSX/derleme/tarayıcı bütün paketi bitti. **İlk sonraki yapılabilir web paketi: P39 yönetici raporu veri doğruluğu**; AdminReports/aktif stats/charts/P08 incelemesi → sabit70/30, dönüşüm20 ve örnek grafikleri gerçek kaynak/tarih/kapsamla API+web+izole veri/rol kabulünde çöz. Mobil134 Low/Backlog ayrı;133 bağımlılığı teslim edildi. P39 ana kapsam kapanmadı; D01/D07 kararı uydurulmaz.

Kullanıcı sonraki görevlerde web'e öncelik istedi. Aşağıdaki eski ortak teslim sıraları tarihsel; geçerli sıra:

| Sıra | Kuyruk / Linear | Teslim kapsamı |
|---|---|---|
| Tamam | WEB-01 / E4N-133 — Done,09a2731 | Kişisel rapor API+web+izole kabul teslim edildi; yeniden yapılmaz. Mobil kabul ayrı. |
| 2 | WEB / P39 E4N-111, P40 E4N-112 | Yapılabilir mevcut web akışları/API sözleşmesi stabilizasyonu; gerekli ortak API/veri hazırlığı ve izole kabul birlikte. Kaynak/bağımlılık incelenerek sonraki bütün paket seçilir. |
| 3 | WEB / P30 E4N-102, P31 E4N-103 — High | Üye ve başkan/admin hedefleri. Mevcut D/hak/grup/puan/shuffle bağımlılıkları açıldıkça; yüksek öncelik kapıları atlama yetkisi değil. |
| Sonra | MOB-01 / E4N-134 — Low, P32 altında | WEB-01/E4N-133'e bağlı mobil Reports/service/Expo/kabul; doğrulanan API'yi kullanır. Yapılabilir web işi varken yeni mobil paket başlatılmaz. |

Ortak API/veritabanı değişikliği gerekli web paketine bağlanır. Mobil ekran/tsc/Android/cihaz/depo/release ayrı görev ve ayrı kabul; web Done mobil beklemez, mobil açık işi kapatmaz. PAR03/04 eşitlik koordinasyonu sürer. Tamamlanan ortak E4N-132 teslimi yeniden bölünüp tekrar yapılmaz. Büyük paketler kullanılır; bir düğme/test değişikliği ayrı Done teslim değildir.

E4N Linear otomasyon promptu aynı sıraya uyarlandı; mevcut PAUSED ve15dk ayarı korundu.

## Güncel öncelik — 3 Ekim 2026

[[E4N/07-Sprintler/Ilerleme-Raporu-2026-10-03]] güncel takip ve uygulama sırasıdır. Önce P08/P39/PAR02 aktif server/API sözleşmesi ve izole veri sonucu; ilk paket toplantı talepleri GET/status/alan eşlemesi. Ardından P40 sahiplik ve karar gerektirmeyen veri geçiş hazırlıkları. D kararları geldikçe P10/P11→üyelik→grup→puan/hak→shuffle; web/mobil kabul ve Sprint6 kapanışı. Eski aşağıdaki kayıtlar tarihsel teslimlerdir.

## Uygulama sırası

**4 Ekim paket sırası:** E4N-132 c1f5b10 referans API+web+mobil lifecycle tamamlandı/push; aynı iş tekrar yapılmaz. Sonraki **E4N-133 P32-E kişisel raporlar**: kaynak/owner/tarih/yön sözleşmesi → salt okunur ortak API → web Reports+mobil Reports → gerçek bearer/PG read-only ve actualTSX/build/Android/scoped patch → tek teslim. Mobil /users/me/stats hatası sonrasında0 ve doğrulanmayan yılbaşı/grup açıklaması mevcut; hedef yalnız kaydedilmiş metrikler, D01 aylık puan/katsayı/hak seçilmez. Sonrasında karar gerektirmeyen P09/P10/P11 geçiş/eşleme hazırlıkları; D bağımlı grup/üyelik/shuffle ana uygulamaları açık.

**4 Ekim PAR03-D — fc23015/E4N-131 Done:** web completed kayıt+calendar/summary refresh ve owner boundary uygulandı/test/push. [[E4N/09-Dogrulama/PAR03-Web-Gorusme-Kaydi-ve-Okuma-Paketi]]. Sonraki bağımsız lifecycle paket **mobil referans/yönlendirme**: mevcut yanlış snake_case gövde ve read failure→shared owner list/create/status API+ekranlar+izole kabul; aktif web/backend yeniden okunacak. D gelir/puan politikası seçilmez, tam native/DOM/depo/release ayrıca açık.

**4 Ekim P32-C — E4N-130 Done,21c7a00+d5e3f8c:** tamamlanmış kayıt API/atomic requester score+history/mobil akışı birlikte teslim;0010/37 tablo/10 sürüm. [[E4N/09-Dogrulama/P32-Tamamlanmis-Gorusme-Kayit-Paketi]]. **Sıradaki paket web Activities kayıt modalı** (mevcut form submit işlemi yok): desteklenen partner/date/notes, keyed ACK/context/pending ve calendar/summary read-refresh; süre/lokasyon şeması ve D kararları uydurulmaz. Mobil/server tamamlanan akış tekrarlanmaz; native/depo/release ve P09 canlı geçiş ayrı açık.

**3 Ekim P32-B — 0e6dba7 / E4N-129 Done:** mobil talep lifecycle/menu/service+izole PG/HTTP+Android1400 modül tamamlandı. [[E4N/09-Dogrulama/P32-Mobil-Toplanti-Talep-Paketi]]. Sonraki paket **H31 tamamlanmış görüşme kaydı**; mevcut activities ekranı `/activities` ve farklı gövde nedeniyle açık. Önce aktif `/one-to-ones` POST/web tüketicisi/tekrar+puan sınırı, sonra ortak DB/API/web-mobil kabul. Talep ayrı, puan formülü/üyelik/hak kararı seçilmez. Mobil depo/cihaz/release kabulü ayrıca açık.

**3 Ekim P32-A — 0c4951a / E4N-128 Done:** mobil destek lifecycle ortak API+üye/admin ekranları+gerçek transport PG kabulü ve Android Metro export birlikte tamamlandı. [[E4N/09-Dogrulama/P32-Mobil-Destek-Yasam-Dongusu-Paketi]]. Scoped patch/testler push; yerel dirty mobil kaynak ve diğer değişiklikler korundu. Ana P32/PAR cihaz/release/depo entegrasyonu nedeniyle açık. Sonraki paket adayı **mobil toplantı talepleri eşitliği**; gerçek route/bağımlılıklar önce doğrulanacak, destek işi yeniden yapılmayacak.

**3 Ekim P39-B — a2823cb / E4N-127 Done:** destek yaşam döngüsü DB/API/web birlikte tamamlandı,0009/36 tablo/9 sürüm. [[E4N/09-Dogrulama/P39-Destek-Yasam-Dongusu-Paketi]]. Sonraki paket **P32/PAR03–04 mobil destek eşitliği**: ortak API/key/ACK+üye/admin ekranları+izole doğrulama birlikte; mevcut dirty mobil kaynak izole ve korunarak kullanılacak. E4N-122/123 ekran baz çizgisi veya tamamlanan server destek paketi tekrar teslim edilmez. D/canlı/mobil cihaz kabul kapıları ayrıca açık.

**3 Ekim P14-B teslimi — e5d1925 / E4N-126 Done:** 0008 başlatma defteri + sahiplikli resume + web sekme yenileme kurtarması birlikte tamamlandı; izole HTTP/DB, kontrollü gerçek TSX, migration/check/build geçti. [[E4N/09-Dogrulama/P14-Odeme-Baslatma-Tekrar-ve-Kurtarma-Paketi]]. Aynı anahtar yeniden POS göndermez; NOT_SENT aynı kayıtla denenir. P14 ve gerçek/mobil kabul açık. **Sıradaki bağımsız akış paketi:** destek talebi oluşturma→mesaj→admin cevap/durum→üye/admin yeniden okuma; server DB transaction/tekrar anahtarı/olmayan hedef404, gerçek PG/Express rol sınırı ve iki web tüketicisi birlikte. E4N-122/123 yalnız ekran baz çizgisini tekrar teslim etme. Karara bağlı P10/P11/P12 kapsamı açılmadan politika uydurma.

**3 Ekim ikinci akış teslimi:** Sprint2 P14-A / E4N-125 / 7a2346e; ödeme sahipliği, sağlayıcıdan sonuç kontrolü, üç kayıt türünde atomik sonuç ve web recovery birlikte tamamlandı. [[E4N/09-Dogrulama/P14-Odeme-Islem-Butunlugu-Paketi]]. P14 In Progress; D07 fiyat/hak, eski sahipsiz ödeme ve canlı yedek kapıları ayrı. Sonraki seçimi veri/durum temelindeki bağımsız akışlardan yap; tekrar callback/ekran parçası teslimi üretme.

**3 Ekim teslim ve yöntem güncellemesi:** E4N-124 / 5dbafa3 ile toplantı talebi DB→API→iki web görünümü→form→izole kabul birlikte tamamlandı. [[E4N/09-Dogrulama/P39-Toplanti-Talep-Akis-Paketi]]. Bundan sonra ekran başına parça teslim yerine kullanılabilir akış paketi; her paketin veri, API, ilgili ekran ve test çıkışı birlikte. Mobil/canlı geçiş açık olduğunda ayrıca belirtilir. Aşağıdaki bağımlılık sırası korunur; tamamlanan toplantı sözleşmesini yeniden denetlemek yerine sonraki bağımsız pakete geçilir.

| Sıra | İş paketi | Linear | Çıkış koşulu |
|---|---|---|---|
| 1 | Rapor doğruluğu: örnek/sabit değerleri kaldır; bilinmeyen veri, gerçek sıfır ve sorgu hatasını ayır | P39/P41, E4N-111/113 | API + ekran testleri; hata görünür, gerçek sıfır korunur; hesaplanmamış metrik sayı göstermez |
| 2 | Aktif web/mobil çağrı farkları: referans, destek, görüşme, admin başvuruları; route sahipliği | P08/P40/P32, PAR-01/02 | Her akış için çağıran→API→veri eşlemesi, ilgili taraf/rol testleri; mobil kaynak ve yayın sürümü ayrımı |
| 3 | Veri modeli/status: P09 gerçek yedeğin izole geçiş provası hazırlığı, P10 eski veri eşleme, P11 geçişler | E4N-81/82/83 | Kurulum/yükseltme/geri dönüş kanıtı; gerçek eski veri için eksikler açık; tarihçe/hak uydurulmaz |
| 4 | Kararları uygulama: üyelik/ödeme → lonca/grup → puan/çıkarma/haklar → shuffle → ekranlar | P12–P33, PAR-03/04 | İlgili D kararı kayıtlı; eşzamanlılık, tekrar, rollback ve rol sınırı testleri |
| 5 | Operasyon ve sürüm: cron, dosya kalıcılığı, veri geçişi, web/mobil kabul, kapsamlı güvenlik | P34–P38, PAR-05, E4N-58/59/120 | Kritik regresyon + güvenlik + geçiş/geri dönüş kanıtı; yayın kararı ayrıca |

Sprintlere bağlı hedef uygulama sırası korunur. İlk iki pakette ürün kararı gerektirmeyen teknik parçalar bağımsız ilerler; bunların Sprint 5 görevleri olması önceki sprintlerin tamamlandığı anlamına gelmez.

## Karar ve dış bağımlılıklar

D01–D10 [[E4N/01-Kararlar/Sprint1-Karar-Paketi]] içindeki açık ürün kararlarıdır. Her uygulama işi yalnız ilgili karara kadar ilerler; başka bağımsız işe geçilir. P09 gerçek üretim yedeğinin erişimi/kopyası açık; mevcut katalog kopyası gerçek veri yedeği değildir. Mobil gerçek cihaz/yayın paketi doğrulaması da açık.

## Her işte çalışma döngüsü

Son commit/devam notunu kontrol et → tek somut değişiklik → gerekli izole API/ekran/rol testi → commit ve yönetilen dala push → Linear kanıt yorumu ve Obsidian güncellemesi → sonraki bağımsız iş. Ana görevi yalnız bütün kabul koşulları karşılandığında tamamlandı say.

Canlı Supabase yazması, gerçek ödeme ve üretim dağıtımı yapılmaz. Kapsamlı güvenlik Sprint 6'da; değişen akışın rol/veri sınırları geliştirme sırasında test edilir. GitHub PR 403 commit/push işini durdurmaz.

## İlk uygulama

- 3 Ekim heartbeat `d95bdc3`: P08/P09/P39/PAR02 toplantı sözleşmesi gerçek izole PostgreSQL17 + Express + istemci API ile yeniden üretildi. GET anonim401, taraflar200 doğru yön/isim/hedef, ilgisiz üye200/[]; meeting satırları değişmez. Mevcut 6 sürümlü temiz şemada one_to_ones.updated_at yok: status PUT500 ve satır değişmez. API GET500 ise getMyMeetingRequests [] yapıyor; default COMPLETED istemciye korunarak geliyor ama ekran Red fallback. Test başarı = hata baz çizgisi, düzeltme değil. [[E4N/09-Dogrulama/P39-Toplanti-API-DB-Sozlesmesi|kanıt]]. İzole fixture/container kaldırıldı; canlı yok. **Sonraki öncelik** P09 yeni sürümlü updated_at migration ve temiz/mevcut yükseltme provası; sonra status row ACK ve getMyMeetingRequests hata/shape sözleşmesi; ardından iki tüketici read/unknown-status/pending. D puan/kabul/rol kuralları ve ana işler açık.

- 3 Ekim heartbeat `c917bae`: SupportTickets create ticket-row ACK (id/owner/subject/OPEN/date), reply strict success=true, ortak same-tick kilit/pending. Belirsiz sonuçta taslak/modal ve GET kontrol; confirmed write sonrası list/detail refresh ayrı, retry yazmayı tekrarlamaz. Modal version close/reopen yeni taslağı korur; session/target/unmount geç ACK atılır. Gerçek TSX write/read+admin regresyonu, tam build ve diff başarılı; push. [[E4N/09-Dogrulama/PAR-03-Kullanici-Destek-Yazma|kanıt]]. HTTP/DB/DOM/Expo/server idempotency değil, ana kabul açık. **Sonraki bağımsız iş** MeetingRequestsList read + api.getMyMeetingRequests catch=>[]; list shape/owner/date, gerçek error/retry ve session/sequence; status ACK/tek pending sonraki paket.

- 3 Ekim `3c34a4c`: Kullanıcı SupportTickets liste/detail shape, sahiplik (ADMIN mevcut all-list sözleşmesi korunur), ticket/message hedef/tarih doğrulama; loading/error/retry/trueempty ayrı. Session/ref/sequence/unmount ve close/switch geç sonuçlar atılır; eski mesaj/draft/modal yeni hesapta gizlenir/temizlenir. Eski create/reply callback context/target guard eklendi. Gerçek TSX MEMBER list/detail malformed/owner/error/retry/logout/switch/close/session/unmount + check/diff başarılı; push. [[E4N/09-Dogrulama/PAR-03-Kullanici-Destek-Okuma|kanıt]]. HTTP/DB/Expo değil; **sonraki bağımsız iş** create dönen ticket ACK (success flag değil), reply success=true ve ortak pending/refresh ayrımı; create modal kapanma/yeniden açılma taslak sınırı. PAR02/03/04 ve Sprint6 açık.

- 3 Ekim `5f7b04f`: AdminSupportTickets reply/status strict success=true ACK, ortak senkron kilit ve pending; belirsiz sonuçta taslak korunur/görünür hata/GET kontrol. Onay sonrası detail/list read hatası ayrı, retry POST/PUT tekrarlamaz. ADMIN/context/hedef/sequence/unmount geç sonuç sınırı; durum yeniden server read. Gerçek TSX ACK/duplicate/status/refresh-retry/switch/close/session/unmount, check/build/diff başarılı; push. [[E4N/09-Dogrulama/PAR-04-Admin-Destek-Yazma|kanıt]]. HTTP/DB/DOM/mobil ve server idempotency/rowcount değil; ana PAR02/04 ve Sprint6 açık. **Sonraki bağımsız iş** kullanıcı SupportTickets liste read error/trueempty ve session/sequence sınırı; sonra detail/create/reply sözleşmesi.

- 3 Ekim `e5b3f47`: AdminSupportTickets detail ticket/id/user_id owner + messages row/ticket_id/metin/date doğrulama; loading/error/retry/trueempty, eski mesajlar anında gizli. Target/ref/sequence close/context/unmount geç yanıt atılır; eski send/status callback hedef sınırı eklendi. Gerçek TSX malformed/wrongtarget/owner/message/retry/switch/close/session/unmount + liste regresyonu/tsc/diff başarılı; push/temiz dal. [[E4N/09-Dogrulama/PAR-04-Admin-Destek-Detay-Okuma|kanıt]]. HTTP/DB/server rol değil; reply/status ACK/pending ve başarılı yazma sonrası detail/list refresh ayrımı açık. **Sonraki bağımsız iş** bu yazma sözleşmesi: strict ACK/tek pending/taze hedef ve refresh hata sonucunun yazma ACK'den ayrılması; aynı-session liste refresh detay sequence etkileşimi de test et. Ana PAR02/04/Sprint6 açık.

- 3 Ekim heartbeat `829af97`: AdminSupportTickets liste array/row/id/metin/tarih doğrulama, görünür hata/retry ve gerçek0 ayrı; eski veri reload/context değişiminde gizli. ADMIN/current session/sequence/unmount sınırı, eski detail/yazma callback'lerinde session guard; contextte seçim/mesaj/draft temiz. Gerçek TSX loading/empty/count/network/null/malformed/retry/eski-admin-click/rol/unmount ve tsc/diff başarılı; push/temiz dal. [[E4N/09-Dogrulama/PAR-04-Admin-Destek-Liste-Okuma|kanıt]]. Detay aynı oturum hedef/row/malformed ve mesaj-status ACK/pending henüz açık, server rol değişmedi. Sonraki bağımsız iş destek detay loading/error/retry/hedef ve eski-ticket yanıt sınırı; ardından yazma ACK/tek pending/refresh ayrımı. HTTP/DB/mobil/ana PAR02/04/Sprint6 açık.

- 3 Ekim `9ff09bb`: AdminEvents edit group_id alanını göndermez; görünür grup seçim kontrolü olmayan formun chapter_id→null yazması kaldırıldı. Yeni create mevcut group_id=null davranışı; store modelde gerçek group_id nullable alanı eklendi. Gerçek TSX bağlı/null/eksik grup+çakışan legacy chapter omission, create null ve önceki rol/form; gerçek store ACK/read/context + tsc/diff başarılı; push/temiz dal. [[E4N/09-Dogrulama/PAR-04-Etkinlik-Grup-Bagi-Koruma|kanıt]]. HTTP/DB/mobil değil; API omission kaynakta group_id!==undefined koşuluyla korunur. **Sonraki bağımsız iş** AdminSupportTickets liste okuma: catch yalnızconsole ve0/boş, invalid yanıt ve eski ADMIN context; error/retry/fresh liste. Detay/yazma ACK/pending sınırı ayrı devam paketi. Ana PAR02/04/Sprint6 açık.

- 3 Ekim `d29c72e`: AdminEvents değişmemiş/bilinmeyen subtype düzenlemede type alanını göndermez; mevcut türü koru seçeneği. Açık yeni seçim mevcut typeMap, geçersiz/yeni boş seçim no-write; ters alt tür uydurulmadı. Gerçek TSX dört genel server türü/unchanged subtype/explicit/invalid ve önceki rol/form regresyonları, üç ekran/tsc/diff + npm run build başarılı; push/temiz dal. [[E4N/09-Dogrulama/PAR-04-Etkinlik-Tur-Koruma-ve-Build|kanıt]]. Kullanıcının46ac7cd Vercel bildirimi eski hata: 00eb5e3 ve8ff5a0d Vercel READY API doğrulandı; build-log tool sunucuda yok, exactremote log alınmadı. **Sonraki kaynak denetimi** edit chapter_id ile API group_id eşlemesi: başlık düzenlerken bağlı group_id=null yazma riskini kontrol et. Alt tür kalıcılığı/filtre, HTTP-DB/mobile, ana PAR02/04 ve Sprint6 açık.

- 3 Ekim heartbeat `8ff5a0d`: AdminEvents kartı eksik/malformed attendees0 değil Bilinmiyor; gerçek[]0 ve doğrulanmış list length. Kapasite bilinmeyen ayrı; eksik/tanınmayan event_type Sosyal fallback değil Tür bilinmiyor. Gerçek TSX kart+önceki rol/pending/fiyat/tarih regresyonları, üç ekran/tsc/diff başarılı; push/temiz dal. [[E4N/09-Dogrulama/PAR-04-Admin-Etkinlik-Kart-Veri|kanıt]]. İlk test global Sosyal seçeneğini yakaladı, assertion yalnız Badge'e daraltılıp tekrar başarılı. Kaynak: UI NETWORKING/CONFERENCE/SOCIAL→meeting, WORKSHOP/SEMINAR→education; API event_type taşımıyor. Ters eşleme bilgi kayıplı, ürün türü uydurulmadı. **Sonraki bağımsız iş** editte bilinmeyen subtype için typeMap fallback meeting yazılmasını engelle; mevcut server type'ı koru/alanı değiştirmeden kaydetme sözleşmesini test et. HTTP/DB/mobil/ana PAR02/04 ve Sprint6 açık.

- 3 Ekim heartbeat `b3e6cee`: AdminEvents kapasite raw input/pozitif safe integer; parseInt kesme ve eksik edit kaynak varsayımı kaldırıldı. Submit API öncesi local datetime format/takvim ve bitiş<başlangıç kontrolü, geçerli tarih ISO; yeni varsayılan50 ve mevcut zorunlu iki tarih korunur. Gerçek TSX invalid/blank/fraction/no-write/calendar/reversed/valid ISO ve önceki fiyat/pending/rol regresyonları + tsc/diff başarılı; push/temiz dal. [[E4N/09-Dogrulama/PAR-04-Admin-Etkinlik-Kapasite-Tarih|kanıt]]. HTTP/DB/tarayıcı ve server kapasite yarışı/rol kabulü açık, kota/hak uydurulmadı. Sonraki bağımsız iş AdminEvents kartı attendees?.length||0 sahte katılımcı0 ve event list type→event_type eşlemesini denetle; kaynak alan yokluğu gerçek değer sayılmasın. Ana PAR02/04/D/Sprint6 açık.

- 3 Ekim `2498b14`: AdminEvents edit eksik/geçersiz price/currency boş; otomatik0/TRY yok. Submit ortak price/currency doğrulaması API öncesi, açık0 ücretsiz ve boş input parseFloat→NaN değil raw değer. Kaynak decimal price/currency korunur, payload numeric tutar; mevcut GBP gibi ekcurrency select'te korunur. Gerçek TSX eksik/geçersiz/no-write/ondalık/currency/clear-explicit0 ve önceki rol/pending regresyonları, üç ekran/tsc/diff başarılı. [[E4N/09-Dogrulama/PAR-04-Admin-Etkinlik-Fiyat-Form|kanıt]]. Sunucu tutar/para birimi desteği, HTTP/DB/mobil ve ana kabul açık. Yeni formun mevcut0/TRY varsayılanı korunur; ürün kararı eklenmedi. Sonraki bağımsız iş admin etkinlik kapasite/tarih alanlarının submit doğrulaması ve eksik kaynağın yazmaya dönüştürülmemesi.

- 3 Ekim heartbeat `f7cbbdd`: UserEvents ücret kartları artık eksik/geçersiz fiyatı ücretsiz saymaz. readEventPrice/readEventCurrency/formatEventPrice ortak utility, EventDetail aynı sözleşmeyle; gerçek numeric/string0 Ücretsiz, ondalık tutar+currency, yoksa Bilinmiyor. Gerçek liste TSX fiyat ve mevcut katılım testleri, detay ödeme/rol/ACK/stale regresyonu, üç ekran/tsc/diff başarılı; push/temiz dal. [[E4N/09-Dogrulama/PAR-03-Ortak-Etkinlik-Fiyat|kanıt]]. HTTP/DB/gerçek ödeme/mobil değil. Sonraki bağımsız kaynak bulgusu AdminEvents handleEdit price||0/currency||TRY: eksik kaynak düzenleme-kaydet ile yanlış0/TRY yazabilir; form validasyon/sözleşmesini denetle. Ana PAR02/03/04/D ve Sprint6 açık.

- 3 Ekim heartbeat `33607d8`: EventDetail ücret/kapasite sabitleri kaldırıldı; doğrulanmış numeric/decimal-string fiyat, gerçek0 Ücretsiz, eksik/geçersiz fiyat bilinmiyor ve kayıt/ödeme açılmaz. Paid TRY tam tutarlı modal; diğer/eksik para birimi mevcut TL modalına gönderilmez, dönüşüm uydurulmaz. Pozitif integer kapasite gerçek kişi sayısı, yoksa Bilinmiyor. Gerçek TSX önceki rol/ACK/stale ve yeni fiyat/currency/modal/kapasite testleri, TypeScript/diff başarılı; push/temiz dal. [[E4N/09-Dogrulama/PAR-03-Etkinlik-Ucret-Kontenjan|kanıt]]. Gerçek ödeme/HTTP/DB yok; modal yalnız istemci kanıtı. Sonraki bağımsız iş UserEvents kart ücretleri: eksik price hâlâ Ücretsiz fallback, ortak fiyat okuma/gösterim sözleşmesine geçir. Ana PAR02/03/D kararları ve Sprint6 açık.

- 3 Ekim heartbeat `ff24bb2`: EventDetail render hedef/user/rol değişiminde eski veri anında gizli; current-context read/registration/payment callback sınırı ve geç yanıt state koruması. Temel kayıt/title/date/public/text/attendee-row doğrulama; eksik katılım bilinmiyor alert/retry ve yeni gönderim engeli. Gerçek TSX ödeme bildirimi/FREE regresyonu + malformed/cleanup öncesi stale/unknown-retry/tsc/diff başarılı; push/temiz dal. [[E4N/09-Dogrulama/PAR-03-Etkinlik-Detay-Okuma|kanıt]]. HTTP/DB/tarayıcı/ödeme değil; server rol/status/hak değişmedi. Sonraki bağımsız iş EventDetail ücretin sabit Ücretsiz ve kontenjanın sabit Sınırlı Sayıda gösterimini doğrulanmış fiyat/kapasiteyle düzelt; eksik fiyatı0 sayma ve ödeme açılışını doğrula. Kişisel katılım API/ana PAR02/03/D kararları/Sprint6 açık.

- 3 Ekim heartbeat `32ee55a`: UserEvents attendees kaynakta yokken Katılacağım sayısı/boş mesajı ve kişi/kalan kontenjan sahte0 olmaktan çıktı; eksik/geçersiz alan Bilinmiyor/alert/retry, gerçek[]0 korunur. Katılım tabı sayısı görünür yaklaşan etkinliklerle aynı kapsamda. İstemci TSX eksik/null/malformed/gerçek boş/kayıt/anon/kontenjan testleri, üç ekran regresyonu/tsc/diff başarılı; push/temiz dal. [[E4N/09-Dogrulama/PAR-03-Etkinlik-Katilim-Kaynak|kanıt]]. Liste GET attendees seçmiyor, detail GET ayrı alan döndürüyor: statik kaynak kanıtı, HTTP/DB değil. Kişisel kayıt API kaynağı eksik ve ana PAR02/03 açık; status/hak kararı uydurulmadı. Sonraki bağımsız iş EventDetail okuma hata/yanıt/hedef/oturum ve katılım-kontenjan gösterimini aynı doğruluk sınırlarıyla denetlemek.

- 3 Ekim heartbeat `675bc62`: AdminDashboard üye/grup/lonca sayaçları ayrı doğrulanmış okuma/yükleme/hata/tekrar; yalnız gerçek boş liste0. ADMIN dışı sayaç API çağrısı yok; kullanıcı değişiminde eski sayı ve geç yanıt gizli, unmount cleanup. Ekranda kullanılmayan LMS okuması kaldırıldı. Gerçek TSX kontrollü hata/null/malformed/retry/oturum/unmount ve üç etkinlik ekranı regresyonu/tsc/diff başarılı; push/temiz dal. [[E4N/09-Dogrulama/PAR-04-Admin-Sayac-Okuma|kanıt]]. HTTP/DB/tarayıcı kabulü değil, kaynak liste uzunluğu semantiği korunur. Sonraki bağımsız iş UserEvents Katılacağım Etkinlikler kaynağı: attendees yokluğunu kesin boş sayma, mevcut API/katılım kaydını denetle. Render'a bağlı olmayan handleRegister aktif akış sayılmaz. Ana PAR02/04/D kararları/Sprint6 açık.

- 3 Ekim heartbeat `8b1abdd`: AdminEvents create/update/delete/status ortak tek pending, disabled düğmeler ve taze ADMIN/hedef/oturum sınırı; iptal edilip yeniden açılan form eski yanıtla kapanmaz. eventStore ADMIN istemci kontrolü ve eski oturum/yazma yanıtı cache koruması. Gerçek TSX/store testleri, TypeScript ve diff başarılı; commit push, dal temiz. [[E4N/09-Dogrulama/PAR-04-Etkinlik-Tek-Gonderim-ve-Oturum|kanıt]]. Sunucu idempotency/rol/rowcount ve gerçek tarayıcı-HTTP-DB kabulü açık. Sonraki bağımsız iş AdminDashboard üye/grup/lonca sayaçlarında hata ile gerçek sıfır ayrımı. Ana PAR02/04 ve Sprint6 açık.

**3 Ekim etkinlik liste teslimi:** `fa17ead` scoped/fresh read ve source seçimi, üç ekran cache/loading/error/empty ayrımı; gerçek store/TSX/mutation regresyonu/tsc/diff testli/push. [[E4N/09-Dogrulama/PAR-04-Etkinlik-Liste-Okuma|kanıt]]. mode=admin JWT/online_link kaynak açığı Sprint6 açık, istemci düzeltmesi güvenlik çözümü değil. Sonraki iş admin genel mutation pending/stale bağlam. Ana kabul açık.

**3 Ekim etkinlik yazma teslimi:** `46ac7cd`/`00eb5e3` store error reject/valid target/cache, API DELETE ACK dönüşü ve admin form/error; gerçek store/TSX/API/sonTypeScript/diff testli/push. [[E4N/09-Dogrulama/PAR-04-Etkinlik-Yazma-Yanit|kanıt]]. Sonraki iş eventStore read/cache/optional description ve üç ekranın fresh loading/error/empty sözleşmesi; mutation pending/stale ve ana kabul açık.

**3 Ekim admin katılımcı teslimi:** `bb29e2d` modal fresh/hata/tekrar/boş; ADMIN/taze satır/tek pending DELETE, ACK ve katılımcı GET hatası ayrımı; kontrollü bileşen/API testli/push. [[E4N/09-Dogrulama/PAR-04-Admin-Etkinlik-Katilimci|kanıt]]. Sonraki iş eventStore okuma/cache/error ve mutation hata→sahte başarı; etkinlik özeti refresh hata kabulü henüz açık. Ana kabul/Sprint6 açık.

**3 Ekim toplantı detay teslimi:** `cfc9729` shared API failure/true[]/hedef doğrulama, başkan modal loading/error/retry/boş/stale ve bilinmeyen durum; API/bileşen/panel-yoklama regresyonu/TypeScript/diff başarılı/push. [[E4N/09-Dogrulama/PAR-04-Toplanti-Detay-Okuma|kanıt]]. Sonraki bağımsız iş AdminEvents katılımcı modalı ve silme ACK/tek pending/refresh-hata ayrımı. Ana kabul/Sprint6 açık.

**3 Ekim başkan panel okuma teslimi:** `cd5d214` bütün kaynaklar doğrulanmış/atomik, hata/referrals[]/detayfallback ve activities[] kaldırıldı; gerçek boş ve stale user yanıt ayrımı; 11 kaynak hata/null/retry + yoklama/API regresyonları/TypeScript/diff başarılı/push. [[E4N/09-Dogrulama/PAR-04-Baskan-Panel-Yukleme-Hata|kanıt]]. Sonraki bağımsız iş getMeetingAttendance ve başkan toplantı detay modalı hata/boş/stale/retry. Ana kabul/Sprint6 ve D kararları açık.

**3 Ekim başkan yoklama teknik teslimi:** `8d79052` strict ACK/dolu eventId, tek pending/ACTIVE payload, stale user-role/unmount, kayıt onayı ve liste yenileme hatası ayrımı; bilinmeyen oranlar. Kontrollü gerçek bileşen/TypeScript/diff testli/push; [[E4N/09-Dogrulama/PAR-04-Baskan-Yoklama-Yanit-ve-Tek-Gonderim|kanıt]]. Sonraki bağımsız iş başkan ilk okuma/cache/hata/referrals[] ve shared activities/attendance hata→[] sözleşmesi. Sunucu rol/tekrar/puan, D01 ve ana kabul açık.

**3 Ekim üye grup detay teslimi:** `517fd3f` adminle aynı atomik okuma/hata/tekrar/eski bağlam ve gerçek veri metrikleri; yerel sahte yoklama kaldırıldı. Üye/admin/sharedAPI bileşen regresyonu ve TypeScript/diff başarılı/push; [[E4N/09-Dogrulama/PAR-04-Uye-Grup-Detay-Dogruluk|kanıt]]. Sonraki bağımsız iş GroupManagerDashboard null sayılar ve mevcut submit yanıt/hata/tek pending/eski hedef. D01/Sprint6 ve gerçek kayıt kabulü açık.

**3 Ekim admin yoklama doğruluk teslimi:** `0eeb279` yerel sahte all-present/save kaldırıldı, kullanılamayan kayıt açıklaması; shared toplantı API null/sayı/gerçek0, admin bilinmeyen/tutarsız oran ayrımı testli/push. [[E4N/09-Dogrulama/PAR-04-Web-Yoklama-Sahte-Kayit|kanıt]]. Sonraki bağımsız iş GroupDetail benzer sahte kayıt/oranlar, ardından GroupManagerDashboard submit yanıt/hata ve shared null tüketimi. Gerçek yazma/puan/rol/idempotency ve D01 kararları açık.

**3 Ekim web grup detay teslimi:** `e9be608` atomik doğrulanmış okuma/hata/tekrar, eski route/oturum yanıtı ve mevcut rol sınırı; gelecek etkinlik Veri yok, ACTIVE sayımı. Gerçek bileşen/TypeScript/diff testli/push; [[E4N/09-Dogrulama/PAR-04-Web-Grup-Detay-Yukleme|kanıt]]. Sonraki bağımsız iş yerel sahte yoklama kaydının gerçek API/attendance eşlemesi; lonca grup yolları ve kalan kaynaksız metrikler açık. Ana eşitlik/güvenlik kabulü kapanmadı.

**3 Ekim mobil grup/lonca detay teslimi:** `6bb352e` kart navigasyonu, ADMIN istemci salt okunur detay, hata/tekrar/boş alanlar; izole gerçek GET rol/veri ve değişmeyen fixture, bileşen/navigasyon/mobil tsc/reverse-check başarılı, kendi patch/test push. Sunucu tüm geçerli roller için 200/e-posta döner; güvenlik sınırı çözülmedi. [[E4N/09-Dogrulama/PAR-04-Mobil-Grup-Lonca-Detay-Okuma|kanıt]]. Sonraki bağımsız iş web grup detay yükleme/hata ve kaynaksız metrikler. D kararları, cihaz/yayın ve ana kabul açık.

**3 Ekim mobil grup listesi teslimi:** `facdfd3` hata/null/boş/0-bilinmeyen ve ADMIN istemci sınırı, gerçek bileşen/mobil TypeScript/reverse-check, yalnız kendi patch/test push. Kart detay navigasyonu açık; sonraki iş izole grup/lonca detay+members salt okunur rol/alan sözleşmesi, ardından mobil detay route. [[E4N/09-Dogrulama/PAR-04-Mobil-Grup-Liste-Hata-Sozlesmesi|kanıt]].

**3 Ekim FREE etkinlik teslimi:** `fea3644` strict success=true/ilk-repeat sözleşmesi, null/hata/tek pending ve eski route/user/role/unmount sınırları; mail iddiası yok, testli/TypeScript/push. Sonraki bağımsız PAR04 iş web/mobil grup detay ve admin kart navigasyon/kaynak/hata. [[E4N/09-Dogrulama/PAR-04-Ucretsiz-Etkinlik-Kayit-Yaniti|kanıt]]. D07/Sprint6/P26 ve ana kabul açık.

**3 Ekim FREE ziyaretçi teslimi:** `6213aca` gerçek id/hata ve tek pending submit, eski token/unmount sonucu sınırları; Promise/alert/mail iddiası testli/TypeScript/push. Sonraki bağımsız iş EventDetail ücretsiz kayıt yanıt/tekrar ve e-posta metni. [[E4N/09-Dogrulama/PAR-04-Ucretsiz-Ziyaretci-Basvuru-Yaniti|kanıt]]. Sunucu idempotency ve ana kabul açık.

**3 Ekim davetiye API teslimi:** `8e6ce1a` JWT invalid400 ve lookup500 ayrımı/istemci eşleme; gerçek izole HTTP/controlled failure/recovery, API ve ekran regresyonları/TypeScript/push. Sonraki bağımsız iş FREE submit gerçek id/null-bozuk yanıta başarı/tekrar ve geç token sonucu. [[E4N/09-Dogrulama/PAR-02-Davetiye-API-Hata-Sozlesmesi|kanıt]].

**Davetiye istemci hata teslimi:** `bbc9e45` loading/transport/malformed artık ödeme zorunluluğu sayılmaz; ilk render/token değişimi/retry kontrolü testli/push. Sonraki bağımsız iş bağlı invite verify JWT-invalid ve DB-error aynı400 ayrımı + izole HTTP/istemci sözleşmesi; ardından ücretsiz submit yanıt/tekrar sınırı. [[E4N/09-Dogrulama/PAR-04-Ziyaretci-Davetiye-Yukleme-Hata|kanıt]].

**Etkinlik/ziyaretçi tek yazma teslimi:** `a292747` ödeme bildirimi ikinci PAID başvurusu yapmaz; etkinlik taze kayıt, ziyaretçi doğrulanmamış bildirim ekranı. Üç rol/ücretsiz kayıt/davetiye ve hata/yanıt testli, TypeScript/push. Sonraki bağımsız denetim kalan etkinlik/ziyaretçi kayıt API hata ve token sınırları. [[E4N/09-Dogrulama/PAR-04-Etkinlik-Ziyaretci-Odeme-Tek-Yazma|kanıt]]. Doğrulanmış ödeme/başvuru durum okuması, D07 ve güvenlik açık.

**Ödeme popup yaşam döngüsü teslimi:** `fcc8f24` kaynak temizliği/gecikmiş yanıt/tek gönderim/kapanış ve tüketici hata senaryoları kontrollü bileşen testli, TypeScript/push. Sonraki bağımsız inceleme PaymentModal EventDetail/ziyaretçi çağıranları ile sunucu action tekrar yazma sözleşmesi. [[E4N/09-Dogrulama/PAR-04-Odeme-Penceresi-Yasam-Dongusu|kanıt]]. Provider/invoice/origin doğrulaması ve D07 açık.

**Ödeme sonrası tek yazma teslimi:** `645509b` tarayıcı üyelik mutation'ı kaldırıldı; sunucu mevcut action uygular, bildirim yalnız kendi kayıt okumasını yeniler. Üç rol/cache ve hata/tekrar bileşen testli/TypeScript/push. Önceki ADMIN-only API iddiası kaynakla düzeltilip Sprint6 girdisine taşındı; kaynakta JWT-only, yeni HTTP rol kanıtı yok. Sonraki bağımsız teknik iş PaymentModal popup/listener lifecycle. [[E4N/09-Dogrulama/PAR-04-Odeme-Bildirimi-ve-Tek-Yazma|kanıt]].

**Kendi üyelik kaydı okuma teslimi:** `e6af2b8` MembershipPage taze /users/me plan/bitiş, hata/tekrar/oturum ve geç yanıt sınırı testli/push. Durum/hak bilinmiyor korunur. Sonraki bağımsız inceleme ödeme callback ve bağlı bildirim/aktivasyon akışının salt okunur eşlemesi; D07 değişmeden tekrar ödeme/aktivasyon tasarlama. [[E4N/09-Dogrulama/PAR-04-Abonelik-Okuma-ve-Cache|kanıt]].

**Profil abonelik okuma teslimi:** `f504971` MemberProfile ADMIN taze okuma/hata/tekrar ve MEMBER/PRESIDENT cache/düğme sınırı testli/push. Sonraki bağımsız iş MembershipPage kendi kayıt okuması ve kaynaksız kalıcı cache gösterimi; account_status/hak anlamı varsayılmaz. [[E4N/09-Dogrulama/PAR-04-Abonelik-Okuma-ve-Cache|kanıt]].

**Abonelik yazma hata teslimi:** `03183b9` başarısız create/update/renew/expire artık sahte başarı değildir; gerçek store/iki ekran testli/TypeScript/push. Sonraki bağımsız iş abonelik okuma/cache hata sınırları. Gerçek ödeme ve üyelik kuralı D07'ye bağlı kalır.

**Web abonelik doğruluk teslimi:** `5543b53` sabit MRR kaldırıldı, cache/loading/error ve bozuk yanıt ayrımı testli/push. Store mutation hata→başarı bildirimi diğer tüketicilerde ayrı denetlenecek. D07 fiyat/dönem ve model/tarihçe açık; yeni formül seçilmez.

**Muhasebe veri doğruluğu:** `3fd1b5c` varsayılan tutarlar kaldırıldı, nullable tutar/toplam/hata webde anlamlı. İzole API ve bileşen/TypeScript testli/push. Sonraki bağımsız inceleme web abonelik MRR sabit tarifeleri ve store kaynağı; D07'ye bağlı yeni formül seçilmez.

**Mobil ödeme geçmişi teknik teslimi:** `8275d77` ADMIN salt okunur kayıtlı işlem listesi ve yerel mobil hata/boş/durum gösterimi, izole rol/veri ve bileşen/TypeScript testli. Accounting özetinin sabit tutarları ve ödeme tarihi anlamı ayrı açık; next bağımsız denetim bunların kaynak doğruluğu. D07 ve geçmiş sahipsiz veri eşlemesi çözülmeden abonelik/hak işlev eşliği kapanmaz.

**Mobil rapor veri doğruluğu teslimi:** `dc0820e` hata/bozuk yanıt alert/retry ve null Veri yok; gerçek0 korunur. Bileşen ve mobil TypeScript testli/yama push. Sonraki API denetimi subscriptions /payments/history ve beklenen üye/status alanları; finansal hak/kimlik eşlemesi uydurulmaz.

**Mobil dashboard metrik teslimi:** `9c6bdd0` yerel statik54/1/2 yerine API gerçek kayıt sayıları; hata/boş/bilinmeyen ve ADMIN istemci sınırı testli; izole ADMIN yanıtı DB COUNT ile eş. Mobil yama/yayın entegrasyonu açık. Sonraki bağımsız ekran mobil reports aynı API null/hata değerlerini0 gösteriyor; bu ayrım düzeltilecek.

**Meslek DELETE ve mobil hata/boş teslimi:** `6e02cc0` DELETE rol/yanıt, `7d8b4a1` mobil yerel alert/retry ve yanlış boşun giderilmesi testli/push. Reddet=DELETE tarihçesi ve kullanıcı metni ilişkisinin ürün anlamı açık. Sonraki bağımsız API/ekran denetimi mobil admin dashboard sabit metrikler. Mobil yama/yayın deposu ve cihaz kabulü açık.

**Meslek kayıt tarihi ve oluşturma teslimi:** `215d63b` mevcut created_at ADMIN GET/eksik tarih UI; `e475770` ADMIN POST gerçek status kaydı. İzole API ve tarih bileşen/TypeScript testleri geçti. Eski ACTIVE eşlemesi yapılmadı; mobil eşlik/DELETE sınırı açık. Sonraki bağımsız sözleşme meslek DELETE rol/olmayan kayıt; Reddet=DELETE karar anlamı ayrıca değerlendirilecek.

**Web meslek hata/boş teslimi:** `0a6ca53` alert/retry, yükleme, gerçek boş ve eski yanıt yarışı bileşen testli; TypeScript geçti/push tamam. Sıradaki bağımsız konu talep tarihi: created_at API yanıtında yok; kaynağı doğrula, yoksa tarihi bilinmiyor göster. Mobil özellik eşliği ve eski durum eşlemesi ayrıca açık.

**Meslek API sözleşmesi:** `788b7ac` ADMIN PUT status kaydı ve `c0b818a` ADMIN GET gerçek status/tam liste, izole testli/push edilmiş. Kullanıcı–meslek ilişkisi, ACTIVE/APPROVED eski veri eşlemesi ve mobil talep/onay/ekleme/düzenleme eksikleri açık. [[E4N/09-Dogrulama/PAR-04-Meslek-Onay-API-Provasi]]. Sonraki bağımsız iş web meslek yükleme hata/boş ayrımı.

**Mobil hata/boş ayrımı yerelde uygulandı:** applications ekranında catch→[] kaldırıldı; hata/retry ve gerçek boş ayrımı testli. Mobil repo kaynakları henüz commit edilmemiş ve remote yok; yalnız ilgili yama/test `fb8338e` yönetilen dalda. Gerçek mobil entegrasyon/cihaz kabulü açık. Bu farkı kayıt altında tutarak bağımsız API/karar zinciri denetimlerine devam et.

**Başvuru liste tamlığı:** `cb89b72` ile ADMIN users 50 kayıt kesimi giderildi;51 erken fixture sonrası PENDING bulunuyor, MEMBER50 ve admin alan sınırı korunuyor. İzole testli. Mobil hata/boş ayrımı ve cihaz doğrulaması açık; sonraki değişikliklerde mobil ayrı/dirty repo ve gerçek yayın kaynağı korunmalı.

**Paket2 sonraki teslim:** `c407834` mobil admin başvuru durum alanı ve public-visitors liste yolu. İlgili ADMIN/MEMBER/oturumsuz sınırları izole testli. Görüşme aliası yapılmadı: tarihsiz TAMAMLANDI ile tarihli istek modelinin anlamı/puanı karar gerektiriyor. Admin limit50 ve mobil hata→boş, meslek onayı, gerçek cihaz/yayın testi açık.

**Paket2 kısmi teslim:** `cf78ccf` referans receiverId/receiver_id uyumu; `d20afb9` mobil support yolları aynı tickets handler'larıyla. İlgili kimlik/veri/rol sınırları izole testli. Mobil gerçek cihaz/yayın doğrulaması açık. Sonraki bağımsız alt iş activities/one-to-ones semantik ve alan eşlemesi; sonra admin başvuru yanıtı. Bu iki akış çözülmeden paket2 tamamlanmış sayılmaz.

**İlk teknik teslim tamamlandı:** `7f419f7` dalda. Sabit stats değerleri null/Veri yok; eksik revenue_entries kaynağı null, boş kaynak 0, örnek toplam 125, bozuk sütun sorgusu 500. İzole API ve gerçek tarayıcı sentetik yanıt testleri geçti. Gerçek metrik tanımları ve rapor rol politikası hâlâ açık; P39/P41 ana görevleri Done değil. Sıradaki bağımsız paket aktif web/mobil çağrı farkları.

Rapor stats: sabit %20 dönüşüm, 70/30 dağılım ve kayıp üye 0 yerine bilinmeyen metrik; eksik gelir kaynağı ile gerçek sorgu hatasını ayır. Yeni metrik formülü oluşturulmayacak. Sonraki paket, mevcut aktif çağrı/veri sahipliği kanıtlarına göre seçilecek.


## 5 Ekim WEB-05 teslimi

E4N-138 Done / b56d119 push: kalıcı document_library + document_files bytea, 0012 migration; authenticated multipart/typed web, current DB role/owner list/download/archive, keyed upload/race/rollback/replay birlikte tamamlandı. [[E4N/09-Dogrulama/WEB05-Belge-Veri-API-Web-Paketi|Kanıt]]. PDF/PNG/JPEG 3MB; private backend tables; arşiv geçmişi korur. Canlı Supabase'e uygulanmadı; şema 12 sürüm/40 tablo; P09 release açık. HTTP/PG fresh/repeat/11→12, actual typed service/byte equality/roles/rollback/RLS; smoke/messages; check/build/diff PASS. Playwright actual component + captured isolated fixture: error/retry/file selection/uncertain response/same-key one row/owner hiding, screenshot gözle kontrol edildi. Production E2E değil. Kendi browser/Vite/konteyner kapandı; output kanıtları korunur.

Sonraki web bütün paket: kursa bağlı sınav yönetimi; önce mevcut course zorunluluğu, soru/cevap gizliliği ve attempt geçmişi, API/admin/üye ekranları ve P08 kapsamını birlikte incele; yalnız POST ekleme. Üyelik/shuffle D01–D10 kararı seçme. Mobil ayrı ve web kuyruğundan sonra. Harici Storage/büyük dosya/kota/malware/purge ve mevcut accounting /uploads ayrı takip kapsamı; belge paketinde bitti sayılmaz. Upload retry hafızada aynı key/file; reload sonrası yeniden yüklemeden önce liste kontrolü gerekir. Linear toplam/değerler görev sayımıdır, ürün yüzdesi değildir.

