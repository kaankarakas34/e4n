# E4N — Güncel ilerleme raporu

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


**4 Ekim WEB-04 — E4N-137 Done / 47943b1:** mesaj yaşam döngüsü veri/migration/API/web + izole kabul tamam. [[E4N/09-Dogrulama/WEB04-Birebir-Mesaj-Veri-API-Web-Paketi|Kanıt]]. Linear tam liste **81 kayıt: 26 Done / 20 In Progress / 35 Backlog**; ana/alt iş sayımı ürün yüzdesi değil. Şema izole **11 sürüm/38 tablo**. Canlı migration/üretim deployment yapılmadı; P09/release/güvenlik ve ana P39 açık. Sıradaki web paketleri belge yaşam döngüsü, kursa bağlı sınav yönetimi; mobil sonrada.

**4 Ekim WEB-03 teslimi — E4N-136 Done, 1962cf3:** profil + bağlantı yaşam döngüsü API/web birlikte tamamlandı; gerçek HTTP/PG yarış/rollback/scope, gerçek TSX/typed servis, check/build ve izole Playwright doğrulandı. [[E4N/09-Dogrulama/WEB03-Profil-Baglanti-API-Web-Paketi|Kanıt]]. Güncel Linear tam liste: **80 kayıt, 25 Done / 20 In Progress / 35 Backlog**. Ana ve alt görevler birlikte sayılıyor; ürün bitiş yüzdesi değildir. P39, D bağımlı hedefler, mobil eşitlik, canlı geçiş ve Sprint 6 açık. Sonraki web adayı mevcut bağlantı temelindeki birebir mesaj yaşam döngüsü; gerekli kapsam/veri/izole kabul bütünüyle planlanır.

Tarih: 3 Ekim 2026, Europe/Istanbul. Linear aktif proje kayıtları ve Obsidian kanıtlarından derlendi. Proje: E4N — Platform Denetimi ve Geliştirme.

## Ölçüm

**4 Ekim WEB-02 teslim4b11c1d/E4N-135 Done:** yeni gerçekraporkaynak API+webthree tabs+typed/readonly/role/date/decimal/unknown/PG/TSX/build/browser bütünpaket. [[E4N/09-Dogrulama/WEB02-Yonetici-Rapor-API-Web-Paketi]]. Lineartamliste79: **24 Done/20 In Progress/35 Backlog**. P39 ana kapsam ve mobil134 ayrı açık; eski sabit-rakam düzeltmesi yeniden teslim sayılmaz; ürün bitiş yüzdesi değildir. Sonrakiweb aktifprofil/bağlantı ve karşılıksız APIpaketlerinin bağımlılık seçimi.

**4 Ekim WEB-01 teslim:** E4N-133 Done/push09a2731; API+web kişisel rapor bütün paketi, gerçek HTTP/PG+actual TSX/typed service+build/check+izole Playwright kabulü tamam. [[E4N/09-Dogrulama/WEB01-Kisisel-Rapor-API-Web-Paketi]]. Güncel78 kayıt: **23 Done/20 In Progress/35 Backlog**. P39 ana kapsam ve mobil134 ayrı açık; ürün yüzdesi değil. Sonraki web P39 yönetici raporu gerçek veri/kapsam/tarih paketidir.

**4 Ekim kullanıcı yönlendirmesi — platform ayrımı:** E4N-133 WEB-01 API+web işi High/P39; E4N-134 MOB-01 Low/P32/Backlog ve web133'e bağlı. Web kabul ve mobil kabul ayrı takip edilir; webden sonra mobil. P30/P31 High, D bağımlılıkları korunur. Bu düzenleme yeni kod/ürün tamamlanması değildir. Linear tam liste doğrulandı:78 kayıt,22 Done/20 In Progress/36 Backlog. Son teslim c1f5b10/E4N-132.

**4 Ekim son Linear tam sayfa:** 77 kayıt = **22 Done /20 In Progress /35 Backlog**. E4N-132 teslim ve E4N-133 bütün rapor paketi planı dahil; ürün bitiş yüzdesi değildir. Sprint5 artık7 Done/6 In Progress/9 Backlog; diğer sprintlerin önceki 4 Ekim dağılımı aynı. Ana kabul/D/cihaz/release açık.

**4 Ekim paket teslimi — c1f5b10 / E4N-132 Done:** referans API/web/mobil yaşam döngüsü birlikte push; gerçek HTTP/PG, actual iki TSX/domain/store/API, smoke/build/final check/tsc/Android1401/scoped patch geçti. [[E4N/09-Dogrulama/P32-Referans-Web-Mobil-Yasam-Dongusu-Paketi]]. Yeni E4N-133 kişisel rapor ortak API/web/mobil planı Backlog; adımlar küçük Done işlerine bölünmedi. Ana P32/PAR/D/cihaz/release ve Sprint6 açık. Şema10/37; canlı yok. Aşağıdaki 132 devam durumu tarihsel, son teslim bu satırdır.

### 4 Ekim 2026 — güncel kontrol

Linear tam sayfa: **76 kayıt; 21 Done / 21 In Progress / 34 Backlog**. Epic/ana/alt görevler birlikte sayılır; ürün tamamlanma yüzdesi değildir. Aşağıdaki eski sayılar tarihsel anlık görüntülerdir.

| Sprint | Done | Devam | Backlog |
|---|---:|---:|---:|
| 0 Denetim | 6 | 0 | 0 |
| 1 Kararlar ve stabilizasyon | 5 | 8 | 0 |
| 2 Veri ve üyelik | 3 | 6 | 2 |
| 3 Lonca ve kapalı grup | 0 | 0 | 7 |
| 4 Puan, çıkarma ve haklar | 0 | 0 | 7 |
| 5 Shuffle ve arayüz | 6 | 7 | 8 |
| 6 Operasyon ve sürüm | 0 | 0 | 10 |
| Sprint atanmamış E4N-131 | 1 | 0 | 0 |

Son tamamlanan/push paket: E4N-131 fc23015 web completed görüşme formu ve calendar/summary yenileme. E4N-124–131 toplantı talep, ödeme bütünlüğü/kurtarma, web+mobil destek, mobil talep/completed kayıt ve web kayıt paketleri teslim edildi.

Aktif E4N-132 referans API/mobil paketi: yerel kod, mobil TypeScript ve gerçek mobil bearer transport→izole Express/PG17 testi geçti. Mobil TSX lifecycle, web regresyonları, son build/Android, scoped patch/commit/push hâlâ yapılacak; **tamamlandı sayılmadı**. Yeni migration yok; şema10/37. Son remote HEAD fc23015.

Sprint3/4 ve shuffle hedef uygulaması henüz başlamadı. D01–D10 kararlarına bağlı puan/çıkarma/üyelik/hizmet/kabul/kapasite/shuffle kuralları açık. P09 üretim yedeğiyle izole adoption/rollback provası, gerçek mobil cihaz/depo/release ve Sprint6 kapsamlı güvenlik açık. Sonraki uygulama önce E4N-132'yi paket olarak doğrulayıp teslim etme; ardından ortak web referans tüketicilerinin lifecycle/ACK/scope eşitliği ve karar gerektirmeyen veri eşleme/durum/prova hazırlıkları.

**4 Ekim E4N-131 Done — fc23015:** Linear API tam sayfa **75 kayıt:21 Done/20 In Progress/34 Backlog**. Web Activities gerçek submit/ACK/keyretry ve calendar/summary read-refresh tamamlandı; ilgili owner sınırı API'de test edildi. [[E4N/09-Dogrulama/PAR03-Web-Gorusme-Kaydi-ve-Okuma-Paketi]]. Kod+actualTSX/client+izole HTTP/PG/check/build kanıtı; DOM/native/depo/release/D kabulü değildir. Sonraki paket mobil referans/yönlendirme lifecycle eşitliği. Ürün bitiş yüzdesi değildir.

**4 Ekim doğrulanan anlık görüntü — E4N-130 Done:** Linear API tam sayfa **74 kayıt:20 Done/20 In Progress/34 Backlog**. P32-C completed aktivite kayıt/mobil/atomic score-history paketi push;0010 ile37 tablo/10 sürüm ve izole gates geçti. [[E4N/09-Dogrulama/P32-Tamamlanmis-Gorusme-Kayit-Paketi]]. Web kayıt oluşturma formu hâlâ submit handler olmayan sonraki iş; web completed okuma düzeltildi. Ürün bitiş yüzdesi veya tam web/mobil/cihaz kabulü değildir. Sonraki paket web Activities formu+read-refresh.

**Son doğrulanan anlık görüntü — 0e6dba7 / E4N-129 Done:** Linear API tam sayfa **73 kayıt:19 Done/20 In Progress/34 Backlog**. Mobil toplantı talep yaşam döngüsü/navigasyon/typed service, gerçek transport izole PG ve Android Metro1400 modül geçti; scoped patch/test push. [[E4N/09-Dogrulama/P32-Mobil-Toplanti-Talep-Paketi]]. Cihaz/release/depo entegrasyonu ve tamamlanmış görüşme kayıt akışı açık. Sonraki H31 paket bu kayıt akışıdır; talep teslimi puanlı aktivite teslimi sayılmaz. Ürün tamamlanma yüzdesi değildir.

**Son doğrulanan anlık görüntü — 0c4951a / E4N-128 Done:** Linear API **72 kayıt:18 Done,20 In Progress,34 Backlog** (sayfa tamamı). Mobil destek member/admin ortak lifecycle API+ekran+izole PG/HTTP testleri ve offline Android Metro1398 modül başarılı; scoped patch/testler push. [[E4N/09-Dogrulama/P32-Mobil-Destek-Yasam-Dongusu-Paketi]]. Ürün tamamlanma yüzdesi değildir. Cihaz/release/authoritative mobil repo entegrasyonu açık; ana P32/PAR korunur. Sonraki paket adayı mobil toplantı talep akışı eşitliği, route ve bağımlılık kanıtıyla seçilecek.

**Son anlık görüntü — a2823cb / E4N-127 Done:** Linear API **71 kayıt:17 Done,20 In Progress,34 Backlog**. Destek talebi/mesaj/admin durum yaşam döngüsü0009 DB+API+iki web ekranı birlikte teslim ve push;36 tablo/9 sürüm. [[E4N/09-Dogrulama/P39-Destek-Yasam-Dongusu-Paketi]]. Ana P39/PAR ve canlı/mobil kabul açık. Sonraki paket mevcut mobil kaynak korunarak destek eşitliği; yalnız ekran catch/buton değişikliği değil ortak API+üye/admin+test. Aşağıdaki sayılar tarihsel; ürünün bitiş yüzdesi olarak yorumlanmaz.

**Son doğrulanan anlık görüntü — e5d1925 / E4N-126 Done:** Linear API: **70 kayıt; 16 Done, 20 In Progress, 34 Backlog**. EPIC-E3 In Progress. Sprint2 ödeme başlatma/yenileme kurtarma akış paketi DB/API/web birlikte teslim edildi ve push; 35 tablo/8 sürüm. [[E4N/09-Dogrulama/P14-Odeme-Baslatma-Tekrar-ve-Kurtarma-Paketi|kapsam ve kanıt]]. Bu kayıt sayımı ürünün tamamlanma yüzdesi değildir; aşağıdaki eski sayılar tarihsel. P14 eski ödeme sahipliği, D07 fiyat/yenileme/hak, gerçek sağlayıcı ve mobil/cihaz kabulü nedeniyle açık. Sonraki paket destek yaşam döngüsünün gerçek API/DB/ekran kabulüdür.

**Sprint2 uygulama teslimi — 7a2346e:** E4N-125 Done; P14 In Progress. Ödeme sahipliği/sağlayıcı doğrulaması/atomik üç sonuç/web recovery birlikte kodlandı ve izole HTTP/DB + gerçek istemci/component testleriyle doğrulandı. [[E4N/09-Dogrulama/P14-Odeme-Islem-Butunlugu-Paketi]]. D07 fiyat/hak ve eski sahipsiz ödemelerin eşlemesi nedeniyle tam ödeme/üyelik hedefi açık. Aşağıdaki ilk rapor sayıları tarihsel anlık görüntüdür; bu teslim takip yüzdesi düzeltmesi değil gerçek veri/API/web uygulamasıdır.

**Sonraki uygulama teslimi — 5dbafa3:** E4N-124 Done, toplantı talebi DB/API/web akış paketi. Önceki 67 kayıtlık takip anlık görüntüsüne bir tamamlanan akış alt görevi eklendi; aşağıdaki eski sprint yüzdeleri o anın kayıtlarıdır. Bu teslim gerçek kod içerir: 0007 migration, oluşturma/tekrar/list/status, iki web görünümü ve form. [[E4N/09-Dogrulama/P39-Toplanti-Talep-Akis-Paketi]]. Ana P39/P09/PAR kabulü açık; mobil/canlı geçiş tamamlanmadı. Kullanıcı geri bildirimiyle sonraki ölçümde ekran düzeltmesi yerine tamamlanan akış paketleri vurgulanacak.

67 kayıt: 13 Done, 18 In Progress, 36 Backlog. Sayıma epicler, ana görevler ve üç dar kapsamlı tamamlanmış alt görev dahildir. İş yükü veya ürün tamamlanma yüzdesi değildir. Aynı commit P/PAR görevlerinde referans verildiğinde tek teslim sayılır. Bu güncelleme takip düzenlemesidir; yeni ürün kodu yazılmadı.

## Sprintler ve gerçek kapsam

| Sprint | Linear ilerlemesi | Done / devam / backlog | Gerçek durum ve kalan iş |
|---|---|---|---|
| 0 — Denetim | %100 | 6 / 0 / 0 | Mimari, Supabase/veri haritası, DB ihtiyaç, hata ve hedef fark denetimi tamamlandı. Güvenlik uygulaması anlamına gelmez. |
| 1 — Kararlar ve stabilizasyon | %50 | 4 / 8 / 0 | İzole ortam, etkinlik liste hatası, mobil temel bağlantı, bildirim sözleşmesi tamamlandı. 17 gölgeli route temizlendi; modül sahipliği ve API/durum hedefleri açık. D01–D10 karar paketleri hazır, kullanıcı kararı bekliyor. |
| 2 — Veri ve üyelik | %22 | 1 / 4 / 4 | Sürümlü kurulum/yükseltme ve HTTP içi DDL kaldırma paketi Done. P09 gerçek yedekli geçiş/geri dönüş açık. P10/P11 model ve durum taslakları var. P12–P14 hedef üyelik/şirket/ödeme politikası uygulanmadı; ödeme callback izole hata deneyi var. |
| 3 — Lonca ve kapalı grup | %0 | 0 / 0 / 7 | Tetikleyici, son koltuk, yetkisiz/görüşmesiz kabul, çoklu ACTIVE ve geçmiş kaybı izole denetimlerle gösterildi. Yeni yaşam döngüsü, kapasite, hizmet çakışması ve geçmiş uygulaması bekliyor. |
| 4 — Puan, çıkarma ve haklar | %0 | 0 / 0 / 7 | Tekrar puan ve aylık kaynak eksikliği denetimleri var; olay defteri, kesinleşme, otomatik çıkarma/yasak ve hak motoru uygulanmadı. Etkinlik istemci doğruluğu ilerledi; ödeme/bilet/katılım DB kabulü tamamlanmadı. |
| 5 — Shuffle ve arayüz | %22 | 2 / 6 / 8 | Web destek, etkinlik alanları/ACK/context, grup ve rapor doğruluğunda uygulamalar var; bazı mobil grup/lonca kaynak parçaları var. Shuffle hedef algoritması ve atomik atama yok; kalan web/mobil işlevler, gerçek cihaz/yayın ve API/DB eşitliği açık. |
| 6 — Operasyon ve sürüm | %0 | 0 / 0 / 10 | Kapsamlı güvenlik, cron, dosya kalıcılığı, gerçek veri geçişi, uçtan uca kabul ve yayın kararı bekliyor. Güvenlik kullanıcı kararıyla bu aşamaya ertelendi. |

Linear yüzdelerinin eski %48/%9/%2 değerlerinden yükselmesi durum/alt görev kaydı düzeltmesinden kaynaklanır; bu rapor sırasında yeni kod üretildiğini göstermez.

## Tamamlanan dar uygulama paketleri

- E4N-121 / P09-A: 34 tablo/5 sürüm, tekrar, bilinen legacy-init ve sürümlü yükseltme/satır koruma; API içi DDL kaldırma. 9aecd40, 0ee338e, 44bd1a2; izole PostgreSQL/API/CLI kanıtı. Gerçek üretim yedeği/adoption açık.
- E4N-122 / PAR03-A: web kullanıcı destek read/create/reply ACK, ortak pending, hedef/oturum/modal taslağı ve GET-refresh ayrımı. 3c34a4c, c917bae; gerçek TSX kontrollü hook/API ve derleme. DOM/HTTP/DB/Expo açık.
- E4N-123 / PAR04-A: web admin destek read/reply/status ACK, ortak pending ve refresh/target/context sınırı. 829af97, e5b3f47, 5f7b04f; TSX kontrollü test ve derleme. DOM/HTTP/DB/Expo/server idempotency açık.

Diğer kanıtlı kısmi işler: referans sahte başarı/cache ve rapor error/zero (P39 notları); etkinlik store/list/detail/ücret/kapasite/tarih/tür/grup bağı/ACK (PAR03/04 notları); web grup detail/yoklama sahte kaydı ve mobil grup/lonca okuma (PAR04 notları). Bunlar büyük hedef görevin bütün kabulü yerine geçmez.

## Açık karar ve erişim kapıları

| Kapı | Açık konu | Bağlı işler |
|---|---|---|
| D01–D04 / P01 | Faaliyet puanı, eşik, ay kapanışı, çıkarma/tekrar/8 ay sınırı | P21–P24 ve ilgili model |
| D05/D06/D08/D09 / P02 | Hizmet çakışması, shuffle koşulları, kabul yetkisi, 35 kişi kapsamı | P16–P20, P27–P29 |
| D07/D10 / P03 | Ücret/dönem/aksama hakları, şirket kanıtı/aşaması/eski hesap | P12–P14, P25 |
| Gerçek yedek / P09 | Yetkili üretim veri yedeği, izole restore/adoption/rollback | P09/P10/P11, P36 |
| Mobil kabul | Gerçek Expo/cihaz ve yayın paketinin kaynakla eşlemesi | P32, PAR01–05 |

Karar paketi: E4N/01-Kararlar/Sprint1-Karar-Paketi.md. Bu kapılar tüm teknik işleri durdurmaz; yalnız bağlı kurallar seçilmez.

## Bundan sonraki uygulama sırası

1. P08/P39/PAR02: kritik aktif API sözleşmeleri ve gerçek hata/veri sonucu. İlk somut paket toplantı talepleri: getMyMeetingRequests catch=>[] ve alan/sahip/yön/durum eşlemesi; server GET/status yanıtını izole HTTP/DB ile doğrula, ardından ekran read/ACK/pending'i buna bağla. Salt ekran yamaları yerine önce server→API→istemci sözleşmesi.
2. P40: kalan bağlantısız modüllerin aktif handler ile davranış/sahiplik karşılaştırmasını kapat; mevcut özelliklerin toplu mount/silmesi yapılmaz. P09/P10/P11 için karar gerektirmeyen eşleme/prova hazırlıklarını sürdür; gerçek yedek gerektiren işi erişim bekliyor olarak açık tut.
3. P01–P03 kararları geldikçe ilgili P10/P11→P12–P14 veri/üyelik temeli. Ardından P15–P20 grup, P21–P26 puan/hak ve P27–P29 shuffle bağımlılık sırası.
4. Web/mobil uygulama kapsamını bu ortak sözleşmelere bağla; P32 gerçek cihaz/yayın ve PAR05 uçtan uca kabulünü ayrı tamamla.
5. Sprint6 operasyon, kapsamlı güvenlik, gerçek veri geçişi/geri dönüş ve sürüm kararı.

Her teslim: dar kapsam ve kanıt → commit/push → Linear biten/kalan/engel → Obsidian. In Progress sayısı eşzamanlı çalışan 18 işlem anlamına gelmez; ana programlar, kısmi işler ve karar bekleyen kayıtlar dahildir.

## Linear düzenlemeleri

Proje ve başlamış E1/E2/E7, PAR03/04 In Progress; eski kodlama başlamadı açıklaması kaldırıldı. P39/E4N-111 ve P32/E4N-104 kısmi kaynak uygulaması nedeniyle In Progress. P01–P03/P08/P09–P11/P40/PAR03/04 açıklamalarına güncel biten/kalan/bekleme özeti eklendi. Güvenlik E4N-58/59/120 Sprint6 Backlog. Ana görevler kapsamları tamamlanmadan Done yapılmadı.

## Aktif görev envanteri

| Görev | Başlık | Linear durum | Sprint |
|---|---|---|---|
| [E4N-57](https://linear.app/e4n/issue/E4N-57/aud-02-supabase-baglantilarini-canli-semayi-ve-veri-kayit-yerlerini) | AUD-02 / Supabase bağlantılarını, canlı şemayı ve veri kayıt yerlerini haritala | Done | Sprint 0 — Denetim ve fark analizi |
| [E4N-58](https://linear.app/e4n/issue/E4N-58/sec-01-supabase-public-tablolari-icin-rls-ve-erisim-planini-hazirla) | SEC-01 / Supabase public tabloları için RLS ve erişim planını hazırla | Backlog | Sprint 6 — Operasyon ve sürüm |
| [E4N-59](https://linear.app/e4n/issue/E4N-59/sec-02-depodaki-veritabani-baglantisi-ve-jwt-varsayilanini-guvenli) | SEC-02 / Depodaki veritabanı bağlantısı ve JWT varsayılanını güvenli geçişe hazırla | Backlog | Sprint 6 — Operasyon ve sürüm |
| [E4N-60](https://linear.app/e4n/issue/E4N-60/aud-03-grup-kabulu-uyelik-puan-ve-shuffle-is-kurallarini-uctan-uca) | AUD-03 / Grup kabulü, üyelik, puan ve shuffle iş kurallarını uçtan uca denetle | Done | Sprint 0 — Denetim ve fark analizi |
| [E4N-61](https://linear.app/e4n/issue/E4N-61/aud-01-mevcut-e4n-webapimobil-mimarisini-ve-aktif-kod-yollarini) | AUD-01 / Mevcut E4N web/API/mobil mimarisini ve aktif kod yollarını doğrula | Done | Sprint 0 — Denetim ve fark analizi |
| [E4N-62](https://linear.app/e4n/issue/E4N-62/aud-04-canli-supabase-semasini-uygulama-ihtiyaclarina-gore-denetle) | AUD-04 / Canlı Supabase şemasını uygulama ihtiyaçlarına göre denetle | Done | Sprint 0 — Denetim ve fark analizi |
| [E4N-63](https://linear.app/e4n/issue/E4N-63/gap-01-r01-r15-hedeflerini-mevcut-e4n-sistemiyle-karsilastir) | GAP-01 / R01–R15 hedeflerini mevcut E4N sistemiyle karşılaştır | Done | Sprint 0 — Denetim ve fark analizi |
| [E4N-64](https://linear.app/e4n/issue/E4N-64/aud-05-mevcut-hata-ve-calisma-durumu-envanterini-cikar) | AUD-05 / Mevcut hata ve çalışma durumu envanterini çıkar | Done | Sprint 0 — Denetim ve fark analizi |
| [E4N-65](https://linear.app/e4n/issue/E4N-65/epic-e1-karar-ve-stabilizasyon) | EPIC-E1 / Karar ve stabilizasyon | In Progress | Sprint 1 — Kararlar ve stabilizasyon |
| [E4N-66](https://linear.app/e4n/issue/E4N-66/epic-e2-sema-ve-veri-gecis-temeli) | EPIC-E2 / Şema ve veri geçiş temeli | In Progress | Sprint 2 — Veri ve üyelik temeli |
| [E4N-67](https://linear.app/e4n/issue/E4N-67/epic-e3-uyelik-odeme-ve-haklar) | EPIC-E3 / Üyelik, ödeme ve haklar | Backlog | Sprint 2 — Veri ve üyelik temeli |
| [E4N-68](https://linear.app/e4n/issue/E4N-68/epic-e4-lonca-ve-kapali-grup) | EPIC-E4 / Lonca ve kapalı grup | Backlog | Sprint 3 — Lonca ve kapalı grup |
| [E4N-69](https://linear.app/e4n/issue/E4N-69/epic-e5-puan-cikarma-ve-yasak) | EPIC-E5 / Puan, çıkarma ve yasak | Backlog | Sprint 4 — Puan, çıkarma ve haklar |
| [E4N-70](https://linear.app/e4n/issue/E4N-70/epic-e6-dort-aylik-shuffle) | EPIC-E6 / Dört aylık shuffle | Backlog | Sprint 5 — Shuffle ve arayüz |
| [E4N-71](https://linear.app/e4n/issue/E4N-71/epic-e7-webmobil-kullanici-akislari) | EPIC-E7 / Web/mobil kullanıcı akışları | In Progress | Sprint 5 — Shuffle ve arayüz |
| [E4N-72](https://linear.app/e4n/issue/E4N-72/epic-e8-operasyon-ve-surum-dogrulama) | EPIC-E8 / Operasyon ve sürüm doğrulama | Backlog | Sprint 6 — Operasyon ve sürüm |
| [E4N-73](https://linear.app/e4n/issue/E4N-73/p01-puan-cikarma-ve-sekiz-ay-kararlarini-netlestir) | P01 / Puan, çıkarma ve sekiz ay kararlarını netleştir | In Progress | Sprint 1 — Kararlar ve stabilizasyon |
| [E4N-74](https://linear.app/e4n/issue/E4N-74/p02-grup-hizmet-cakismasi-ve-shuffle-kararlarini-netlestir) | P02 / Grup, hizmet çakışması ve shuffle kararlarını netleştir | In Progress | Sprint 1 — Kararlar ve stabilizasyon |
| [E4N-75](https://linear.app/e4n/issue/E4N-75/p03-uyelik-sirket-ve-odeme-kararlarini-netlestir) | P03 / Üyelik, şirket ve ödeme kararlarını netleştir | In Progress | Sprint 1 — Kararlar ve stabilizasyon |
| [E4N-76](https://linear.app/e4n/issue/E4N-76/p04-uretim-disi-veritabani-ve-akis-dogrulama-ortamini-kur) | P04 / Üretim dışı veritabanı ve akış doğrulama ortamını kur | Done | Sprint 1 — Kararlar ve stabilizasyon |
| [E4N-77](https://linear.app/e4n/issue/E4N-77/p05-etkinlik-listesinin-500-hatasini-ve-get-yan-etkisini-gider) | P05 / Etkinlik listesinin 500 hatasını ve GET yan etkisini gider | Done | Sprint 1 — Kararlar ve stabilizasyon |
| [E4N-78](https://linear.app/e4n/issue/E4N-78/p06-mobil-api-adresini-ve-temel-baglantiyi-dogrula) | P06 / Mobil API adresini ve temel bağlantıyı doğrula | Done | Sprint 1 — Kararlar ve stabilizasyon |
| [E4N-79](https://linear.app/e4n/issue/E4N-79/p07-bildirim-veri-ve-istemci-sozlesmesini-birlestir) | P07 / Bildirim veri ve istemci sözleşmesini birleştir | Done | Sprint 1 — Kararlar ve stabilizasyon |
| [E4N-80](https://linear.app/e4n/issue/E4N-80/p08-api-eksikleri-tekrarlar-ve-status-yollarini-karara-bagla) | P08 / API eksikleri, tekrarlar ve status yollarını karara bağla | In Progress | Sprint 1 — Kararlar ve stabilizasyon |
| [E4N-81](https://linear.app/e4n/issue/E4N-81/p09-surumlu-migration-tabanini-ve-sema-kurulum-provasini-olustur) | P09 / Sürümlü migration tabanını ve şema kurulum provasını oluştur | In Progress | Sprint 2 — Veri ve üyelik temeli |
| [E4N-82](https://linear.app/e4n/issue/E4N-82/p10-hedef-veri-modelini-ve-eski-veri-eslemesini-tasarla) | P10 / Hedef veri modelini ve eski veri eşlemesini tasarla | In Progress | Sprint 2 — Veri ve üyelik temeli |
| [E4N-83](https://linear.app/e4n/issue/E4N-83/p11-durum-kisitlarini-ve-canli-kod-sema-driftini-uyumla) | P11 / Durum kısıtlarını ve canlı-kod şema driftini uyumla | In Progress | Sprint 2 — Veri ve üyelik temeli |
| [E4N-84](https://linear.app/e4n/issue/E4N-84/p12-tek-uyelik-ile-grup-erisimini-ayri-hak-politikasi-olarak-uygula) | P12 / Tek üyelik ile grup erişimini ayrı hak politikası olarak uygula | Backlog | Sprint 2 — Veri ve üyelik temeli |
| [E4N-85](https://linear.app/e4n/issue/E4N-85/p13-sirket-uygunlugu-ve-eski-hesap-gecisini-uygula) | P13 / Şirket uygunluğu ve eski hesap geçişini uygula | Backlog | Sprint 2 — Veri ve üyelik temeli |
| [E4N-86](https://linear.app/e4n/issue/E4N-86/p14-odeme-islem-sahipligi-ve-callback-tekrar-guvenligini-kur) | P14 / Ödeme işlem sahipliği ve callback tekrar güvenliğini kur | Backlog | Sprint 2 — Veri ve üyelik temeli |
| [E4N-87](https://linear.app/e4n/issue/E4N-87/p15-acik-lonca-uyeligi-yasam-dongusunu-kur) | P15 / Açık lonca üyeliği yaşam döngüsünü kur | Backlog | Sprint 3 — Lonca ve kapalı grup |
| [E4N-88](https://linear.app/e4n/issue/E4N-88/p16-hizmet-siniflandirmasi-ve-cakisma-kontrolunu-kur) | P16 / Hizmet sınıflandırması ve çakışma kontrolünü kur | Backlog | Sprint 3 — Lonca ve kapalı grup |
| [E4N-89](https://linear.app/e4n/issue/E4N-89/p17-35-kisilik-kapasite-ve-eszamanli-kabulu-koru) | P17 / 35 kişilik kapasite ve eşzamanlı kabulü koru | Backlog | Sprint 3 — Lonca ve kapalı grup |
| [E4N-90](https://linear.app/e4n/issue/E4N-90/p18-basvuru-ve-baskan-gorusmesi-kaydini-olustur) | P18 / Başvuru ve başkan görüşmesi kaydını oluştur | Backlog | Sprint 3 — Lonca ve kapalı grup |
| [E4N-91](https://linear.app/e4n/issue/E4N-91/p19-grup-uyeligi-ve-cikarilma-gecmisini-koru) | P19 / Grup üyeliği ve çıkarılma geçmişini koru | Backlog | Sprint 3 — Lonca ve kapalı grup |
| [E4N-92](https://linear.app/e4n/issue/E4N-92/p20-grup-kabul-ret-ve-tasima-status-yollarini-dogrula) | P20 / Grup kabul, ret ve taşıma status yollarını doğrula | Backlog | Sprint 3 — Lonca ve kapalı grup |
| [E4N-93](https://linear.app/e4n/issue/E4N-93/p21-aylik-puan-olay-defterini-ve-tekrar-anahtarini-kur) | P21 / Aylık puan olay defterini ve tekrar anahtarını kur | Backlog | Sprint 4 — Puan, çıkarma ve haklar |
| [E4N-94](https://linear.app/e4n/issue/E4N-94/p22-aylik-puani-kesinlestir-ve-tablo-olarak-sun) | P22 / Aylık puanı kesinleştir ve tablo olarak sun | Backlog | Sprint 4 — Puan, çıkarma ve haklar |
| [E4N-95](https://linear.app/e4n/issue/E4N-95/p23-puana-bagli-otomatik-cikarmayi-tekrar-guvenli-uygula) | P23 / Puana bağlı otomatik çıkarmayı tekrar güvenli uygula | Backlog | Sprint 4 — Puan, çıkarma ve haklar |
| [E4N-96](https://linear.app/e4n/issue/E4N-96/p24-ikinci-cikarilmada-sekiz-ay-basvuru-yasagini-uygula) | P24 / İkinci çıkarılmada sekiz ay başvuru yasağını uygula | Backlog | Sprint 4 — Puan, çıkarma ve haklar |
| [E4N-97](https://linear.app/e4n/issue/E4N-97/p25-dis-etkinlik-ve-indirimli-bilet-hakkini-uyelikten-hesapla) | P25 / Dış etkinlik ve indirimli bilet hakkını üyelikten hesapla | Backlog | Sprint 4 — Puan, çıkarma ve haklar |
| [E4N-98](https://linear.app/e4n/issue/E4N-98/p26-etkinlik-katilim-bilet-ve-odeme-butunlugunu-duzelt) | P26 / Etkinlik katılım, bilet ve ödeme bütünlüğünü düzelt | Backlog | Sprint 4 — Puan, çıkarma ve haklar |
| [E4N-99](https://linear.app/e4n/issue/E4N-99/p27-dort-aylik-donem-ve-shuffle-uygunlugunu-tanimla) | P27 / Dört aylık dönem ve shuffle uygunluğunu tanımla | Backlog | Sprint 5 — Shuffle ve arayüz |
| [E4N-100](https://linear.app/e4n/issue/E4N-100/p28-kapasite-ve-hizmet-kuralini-koruyan-shuffle-onizlemesi-uret) | P28 / Kapasite ve hizmet kuralını koruyan shuffle önizlemesi üret | Backlog | Sprint 5 — Shuffle ve arayüz |
| [E4N-101](https://linear.app/e4n/issue/E4N-101/p29-shufflei-atomik-uygula-ve-atama-gecmisi-tut) | P29 / Shuffle'ı atomik uygula ve atama geçmişi tut | Backlog | Sprint 5 — Shuffle ve arayüz |
| [E4N-102](https://linear.app/e4n/issue/E4N-102/p30-uye-web-panelini-yeni-uyelik-ve-grup-haklariyla-tamamla) | P30 / Üye web panelini yeni üyelik ve grup haklarıyla tamamla | Backlog | Sprint 5 — Shuffle ve arayüz |
| [E4N-103](https://linear.app/e4n/issue/E4N-103/p31-baskan-ve-admin-web-islemlerini-gercek-akislara-bagla) | P31 / Başkan ve admin web işlemlerini gerçek akışlara bağla | Backlog | Sprint 5 — Shuffle ve arayüz |
| [E4N-104](https://linear.app/e4n/issue/E4N-104/p32-mobil-api-ve-ekran-sozlesmesini-mevcut-hedefe-esitle) | P32 / Mobil API ve ekran sözleşmesini mevcut hedefe eşitle | In Progress | Sprint 5 — Shuffle ve arayüz |
| [E4N-105](https://linear.app/e4n/issue/E4N-105/p33-site-anlatimini-tek-uyelik-ve-acikkapali-yapiya-guncelle) | P33 / Site anlatımını tek üyelik ve açık/kapalı yapıya güncelle | Backlog | Sprint 5 — Shuffle ve arayüz |
| [E4N-106](https://linear.app/e4n/issue/E4N-106/p34-cron-ve-zamanlanmis-isleri-tekrar-guvenli-calistir) | P34 / Cron ve zamanlanmış işleri tekrar güvenli çalıştır | Backlog | Sprint 6 — Operasyon ve sürüm |
| [E4N-107](https://linear.app/e4n/issue/E4N-107/p35-fatura-dosyasini-kalici-depolama-ve-yetkili-erisime-tasi) | P35 / Fatura dosyasını kalıcı depolama ve yetkili erişime taşı | Backlog | Sprint 6 — Operasyon ve sürüm |
| [E4N-108](https://linear.app/e4n/issue/E4N-108/p36-veri-gecisini-prova-et-ve-geri-donus-kosullarini-yaz) | P36 / Veri geçişini prova et ve geri dönüş koşullarını yaz | Backlog | Sprint 6 — Operasyon ve sürüm |
| [E4N-109](https://linear.app/e4n/issue/E4N-109/p37-kritik-uctan-uca-regresyonu-tamamla) | P37 / Kritik uçtan uca regresyonu tamamla | Backlog | Sprint 6 — Operasyon ve sürüm |
| [E4N-110](https://linear.app/e4n/issue/E4N-110/p38-surum-karari-dokumantasyon-ve-izlenebilirligi-kapat) | P38 / Sürüm kararı, dokümantasyon ve izlenebilirliği kapat | Backlog | Sprint 6 — Operasyon ve sürüm |
| [E4N-111](https://linear.app/e4n/issue/E4N-111/p39-web-api-sozlesmesindeki-aktif-yol-ve-yontem-farklarini-kapat) | P39 / Web API sözleşmesindeki aktif yol ve yöntem farklarını kapat | In Progress | Sprint 5 — Shuffle ve arayüz |
| [E4N-112](https://linear.app/e4n/issue/E4N-112/p40-tekrarlanan-express-routelarini-ve-baglantisiz-modulleri-duzenle) | P40 / Tekrarlanan Express route'larını ve bağlantısız modülleri düzenle | In Progress | Sprint 1 — Kararlar ve stabilizasyon |
| [E4N-113](https://linear.app/e4n/issue/E4N-113/p41-demo-ve-kullanilmayan-parcalarin-korunma-veya-kaldirilma-kararini) | P41 / Demo ve kullanılmayan parçaların korunma veya kaldırılma kararını ver | Backlog | Sprint 5 — Shuffle ve arayüz |
| [E4N-114](https://linear.app/e4n/issue/E4N-114/par-web-ve-mobil-ozellik-esitligi-programi) | PAR / Web ve mobil özellik eşitliği programı | In Progress | Sprint 5 — Shuffle ve arayüz |
| [E4N-115](https://linear.app/e4n/issue/E4N-115/par-01-web-ve-mobil-yetenek-navigasyon-ve-rol-matrisi-denetimi) | PAR-01 / Web ve mobil yetenek, navigasyon ve rol matrisi denetimi | In Progress | Sprint 1 — Kararlar ve stabilizasyon |
| [E4N-116](https://linear.app/e4n/issue/E4N-116/par-02-ortak-api-veri-ve-rol-davranisini-iki-platformda-denetle) | PAR-02 / Ortak API, veri ve rol davranışını iki platformda denetle | In Progress | Sprint 1 — Kararlar ve stabilizasyon |
| [E4N-117](https://linear.app/e4n/issue/E4N-117/par-03-genel-ziyaretci-ve-uye-akislarini-web-ve-mobilde-esitle) | PAR-03 / Genel, ziyaretçi ve üye akışlarını web ve mobilde eşitle | In Progress | Sprint 5 — Shuffle ve arayüz |
| [E4N-118](https://linear.app/e4n/issue/E4N-118/par-04-baskan-ve-admin-islevlerini-web-ve-mobilde-esitle) | PAR-04 / Başkan ve admin işlevlerini web ve mobilde eşitle | In Progress | Sprint 5 — Shuffle ve arayüz |
| [E4N-119](https://linear.app/e4n/issue/E4N-119/par-05-web-ve-mobil-ozellik-esitligini-uctan-uca-dogrula) | PAR-05 / Web ve mobil özellik eşitliğini uçtan uca doğrula | Backlog | Sprint 6 — Operasyon ve sürüm |
| [E4N-120](https://linear.app/e4n/issue/E4N-120/sec-03-gelistirmelerden-sonra-web-mobil-api-ve-supabase-guvenlik) | SEC-03 / Geliştirmelerden sonra web, mobil, API ve Supabase güvenlik denetimi | Backlog | Sprint 6 — Operasyon ve sürüm |
| [E4N-121](https://linear.app/e4n/issue/E4N-121/p09-a-izole-surumlu-kurulum-ve-http-ici-ddl-kaldirma-paketini-dogrula) | P09-A / İzole sürümlü kurulum ve HTTP içi DDL kaldırma paketini doğrula | Done | Sprint 2 — Veri ve üyelik temeli |
| [E4N-122](https://linear.app/e4n/issue/E4N-122/par-03-a-web-kullanici-destek-okuma-ve-yazma-sinirlarini-dogrula) | PAR-03-A / Web kullanıcı destek okuma ve yazma sınırlarını doğrula | Done | Sprint 5 — Shuffle ve arayüz |
| [E4N-123](https://linear.app/e4n/issue/E4N-123/par-04-a-web-admin-destek-okuma-ve-yazma-sinirlarini-dogrula) | PAR-04-A / Web admin destek okuma ve yazma sınırlarını doğrula | Done | Sprint 5 — Shuffle ve arayüz |

## 3 Ekim sonraki teknik bulgu

d95bdc3 izole meeting API/DB deneyi: mevcut temiz kurulum artık 6 migration içeriyor (E4N-121 eski 5-sürüm tesliminin kanıtını korur). updated_at yokluğu status PUT500; istemci GET500→[] sahte boş; default COMPLETED ekran Red fallback. Öncelik yeni sürümlü kolon/yükseltme provası, ardından API ACK/hata ve iki tüketici. Bu yeni denetimdir, düzeltme veya yüzde artışı değildir. [[E4N/09-Dogrulama/P39-Toplanti-API-DB-Sozlesmesi]].


## 5 Ekim WEB-05 teslimi

E4N-138 Done / b56d119 push: kalıcı document_library + document_files bytea, 0012 migration; authenticated multipart/typed web, current DB role/owner list/download/archive, keyed upload/race/rollback/replay birlikte tamamlandı. [[E4N/09-Dogrulama/WEB05-Belge-Veri-API-Web-Paketi|Kanıt]]. PDF/PNG/JPEG 3MB; private backend tables; arşiv geçmişi korur. Canlı Supabase'e uygulanmadı; şema 12 sürüm/40 tablo; P09 release açık. HTTP/PG fresh/repeat/11→12, actual typed service/byte equality/roles/rollback/RLS; smoke/messages; check/build/diff PASS. Playwright actual component + captured isolated fixture: error/retry/file selection/uncertain response/same-key one row/owner hiding, screenshot gözle kontrol edildi. Production E2E değil. Kendi browser/Vite/konteyner kapandı; output kanıtları korunur.

Sonraki web bütün paket: kursa bağlı sınav yönetimi; önce mevcut course zorunluluğu, soru/cevap gizliliği ve attempt geçmişi, API/admin/üye ekranları ve P08 kapsamını birlikte incele; yalnız POST ekleme. Üyelik/shuffle D01–D10 kararı seçme. Mobil ayrı ve web kuyruğundan sonra. Harici Storage/büyük dosya/kota/malware/purge ve mevcut accounting /uploads ayrı takip kapsamı; belge paketinde bitti sayılmaz. Upload retry hafızada aynı key/file; reload sonrası yeniden yüklemeden önce liste kontrolü gerekir. Linear güncel kontrol: **82 görev = 27 Done / 20 In Progress / 35 Backlog**. Bu sayım ana/alt görevleri içerir; ürün yüzdesi değildir.

