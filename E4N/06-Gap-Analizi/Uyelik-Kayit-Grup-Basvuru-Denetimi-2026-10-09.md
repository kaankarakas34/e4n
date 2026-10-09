# Açık üyelik kaydı → grup keşfi → başkan görüşmesi denetimi

## 9 Ekim kullanıcı kararları

- Ayrı topluluk üyeliği/COMMUNITY_MEMBER kaldırılır; normal üyelik kullanılır.
- Normal üyelik kayıt kapısında davetiye/admin üyelik onayı kaldırılır.
- Vergi numarası ve şirket bilgisi yeterlidir; vergi levhası dosyası zorunlu değildir.
- Bir vergi numarası en fazla bir kişiye bağlı olabilir; ikinci kayıt tüm yazım yollarında engellenir.
- Üye grup seçer, analizleri ve aktif üyelerin mesleklerini inceler, Katıl ile başvurur.
- Başvuru ilgili grup başkanına görüşme görevi + uygulama bildirimi + e-posta olarak düşer. Başkan telefon görüşmesini kaydettikten sonra kendisi kabul/ret verir; admin son onayı zorunlu değildir.

Bu karar üyelik ücretini veya ücretli hakları ücretsiz yapmaz. Ödeme/gecikme/shuffle'ın önceki açık ayrıntıları korunur. Vergi numarası biçimi/tekilliği kontrolü gerçek şirket sahipliğinin resmi doğrulaması değildir.

## Mevcut kod ve kanıt

Denetlenen kaynak: codex/e4n-sprint1-foundation /96c6811. Canlı dağıtımın veya canlı kayıtların aynı durumda olduğu doğrulanmadı. Üretim DB/deploy/gerçek mail-ödeme kullanılmadı.

| Alan | Mevcut | Eksik/fark |
|---|---|---|
| Kayıt | src/pages/Register.tsx iki akış; server/src/index.js:469 normal kayıt davetiye ister, MEMBER/PENDING oluşturur; community ACTIVE olur | Tek açık kayıt; admin üyelik onayı kaldırılacak; kayıt ve ödeme hakları ayrılacak |
| Vergi bilgileri | Register state taxNumber/taxOffice içeriyor ama görünür vergi inputu yok; kayıt API'si bu alanları INSERT etmez. Vergi levhası uploadu yok | Gerçek alanlar + zorunlu API doğrulaması + kalıcı kayıt |
| Vergi tekilliği | Sürümlü şemada tax_number VARCHAR(50), UNIQUE/normalizasyon yok; self-profile/admin güncellemeleri metin kabul eder | DB invariant, ortak normalize/validate, tüm writerlar ve mevcut duplicate geçişi |
| Topluluk ayrımı | Register route, Dashboard özel görünümü, admin üye filtresi/rol seçimi, belge rol listelerinde COMMUNITY_MEMBER var | Mevcut hesapların kontrollü MEMBER dönüşümü ve eski link/filtre/hak metinleri |
| Grup seçimi | /chapter-management Tüm Gruplar, detay modalı, isim-meslek listesi ve Katıl mevcut | Tam analiz/aktif doluluk/boş koltuk; güçlü yükleme/hata/owner değişimi/ACK teyidi |
| Keşif verisi | Eski /groups ve /groups/:id member_count tüm bağlantıları sayar; /groups/:id/members aktif/pending ayrımı olmadan email/puan/devamsızlık döndürür | Keşfe özel az alanlı API; yalnız aktif ad-meslek, başkan hariç35 gerçek sayım; özel veriyi ayrı yetkili ekranda tut |
| Detaylar | /groups/:id mevcut üyeler ve referans/toplantı/ziyaretçi gibi yönetim alanları yükler; admin detail API özel currentDBadminli ayrı yüzdür | Keşif ekranı yönetim detayını topluca kullanmamalı; analizler gerçek kaynaktan toplulaştırılmalı |
| Başvuru | /groups/:id/join yalnız account_status ACTIVE kontrol eder; group_members REQUESTED kaydı atomik/tekrar güvenli, aktör geçmişi var | Kayıt/ödeme/grup uygunluğu ayrımı; görüşme görevine atomik bağ; grup ACTIVE şartı/başvurulabilirlik |
| Başvuru UI | Başarılı dönüşte local pendingId ekler; hata çoğunlukla console'da; modal hemen kapanır; grup üyesiyken Tüm Gruplar alanı gizlenir | Görünür hata ve tekrar; doğrulanmış canonical durum; keşif/transfer haklarının ayrı tasarımı |
| Başkan | GroupManagerDashboard bekleyenleri listeler, Onayla/Reddet mevcut | Arama görevi/sahibi, görüşme zamanı-sonucu-notu, görev durumu; telefonun yalnız ilgili başkana uygun API ile sağlanması |
| Görüşme/karar | Mevcut ACTIVE güncellemesi görüşme kaydı aramaz; ret üyelik bağlantısını silebilir, teknik geçmiş korunur | Görüşme ön şartı API'de, kalıcı başvuru/ret nedeni/sonuç; kullanıcı kendi durumunu görür |
| Bildirim/mail | Genel bildirim okuma ve mail altyapısı var; join endpoint görev/notification/mail/outbox yaratmaz | Başvuruya bağlı üç kanallı teslim, retry/idempotency, başarısız/UNKNOWN mail görünürlüğü |
| Kapasite/geçmiş | Başkan hariç35/concurrency ve kalıcı aktör/işlem geçmişi teslim edilmiş | Korunup yeni görüşme-kabul senaryolarıyla birleşecek; yeniden yazılmayacak |

## İzole tekrar üretim

Owned PG17/25şema ve gerçek mounted Express kayıt endpointi; sentetik @example.invalid kişiler. Normal kayıt davetiye olmadan403. İki farklı e-postalı COMMUNITY_MEMBER kaydı201/ACTIVE; taxNumber ve tax_number gönderildiği halde iki users.tax_number da null. Ardından aynı vergi numarasına eşzamanlı iki DB güncellemesi kabul edildi (2sahip; hedef1). Fixture cleanup PASS. Bu mevcut kural eksikliğinin kanıtıdır, hedef davranışın PASS olduğu anlamına gelmez.

Ham rapor: output/registration-group-audit.json; kalıcı kısa rapor server/docs/registration-group-audit-2026-10-09.json. Ürün kodunda değişiklik yapılmadı.

## Önerilen kullanıcı akışı

1. Açık normal kayıt: ad/telefon/e-posta/şifre/meslek/şirket/vergi numarası. API doğrular, normalize numarayı DB tekillik kuralıyla sahiplenir. Kayıt için admin onayı aranmaz.
2. Üye ana ekranda belirgin **Grup seç** alanına gelir. Aktif gruplarda şehir/toplantı, aktif üye/35, boş koltuk ve meslek dağılımı görülür.
3. **Grubu incele**: aktif kişilerin ad-meslek/şirket bilgileri ve seçilen toplu analizler. Telefon/e-posta/vergi/kişisel referans detayları keşif yanıtına eklenmez. Analiz önerisi: meslek dağılımı, doluluk, toplu katılım/referans özetleri; hangi KPI'ların herkese açılacağı kesinleşmeli.
4. **Katıl**: pending başvuru ve başkana görüşme görevi aynı transactionda; uygulama bildirimi ve mail için kalıcı outbox. Başvuru tekrarında ikinci görev/mail yok; mail hatası başvuruyu kaybettirmez.
5. Başkan **Görüşmelerim** kuyruğunda ilgili kişinin telefonuna ulaşır, arar, görüşme kaydı oluşturur. Ardından kendi grubunda kabul/ret verir. API görüşme/yetki/kapasite sınırlarını uygular; karar ve geçmiş kalıcıdır.
6. Üye **Başvurularım** ekranında bekleme/görüşme/kabul/ret sonucunu görür; kabul edilince grubuna erişir. Bildirim ve mail durumları izlenir.

Görev/başvuru state adları ve e-posta retry ayrıntıları teknik tasarımda seçilebilir; yeni ücret/uygunluk/SLA/alternatif grup ürün kuralları tahmin edilmez.

## Bağlı büyük paketler / Linear

Yeni küçük görev açılmadı; ilgili mevcut görevler yüksek öncelik ve bu kabul kapsamıyla güncellendi. Henüz kod teslimi veya Done değildir.

| Sıra | Bütün paket | Mevcut görevler/durum |
|---|---|---|
| 1 | A — Tek açık üyelik, vergi tekilliği ve eski hesap geçişi | E4N-75 karar InProgress; E4N-84 P12 Backlog; E4N-85 P13 Backlog; E4N-105 P33 Backlog |
| 2 | B — Grup keşfi/analiz → başkan görüşme görevi/bildirim/mail → karar | E4N-74 karar InProgress; E4N-90 P18 Backlog; E4N-102 P30 InProgress; E4N-103 P31 InProgress; E4N-92 P20 Backlog |

P16/E4N-88 hizmet sınıflandırması grup meslek koltuğuna bağlıdır; salt meslek metnini kesin hizmet tekilliği saymayacağız. Kapasite E4N-89, roster E4N-157, aktör geçmişi E4N-159 teslimleri korunur. Yeni akışın final P37/E4N-109 kabulüne girmesi gerekir.

### Kabul denetimleri

- Aynı normalize numara + farklı e-posta; aynı anda iki kayıt; boş/bozuk numara; baştaki sıfırlar; profile/admin/visitor-conversion/direkt DB yazımı: ikinci sahip yok. DB conflict anlaşılır API cevabı; e-posta tekilliği ayrıca korunur.
- Legacy duplicate/null şirket-numara ve COMMUNITY_MEMBER geçiş envanteri; otomatik kişi silme/birleştirme/sahip seçme yok.
- Başvuruyu çift tıklama/timeout; görev-notification-outbox birlikte commit/rollback; SMTP hata/retry/UNKNOWN, aynı başvuruya tek görev; görev sahipliği ve başkan değişimi.
- Görüşme olmadan direkt ACTIVE isteği; başka grup başkanı;35'in son koltuğuna eşzamanlı kabul; silinmiş/pasif grup; ret/iptal/geçmiş; üyenin yalnız kendi başvurusunu görmesi.
- Keşif API'sinde yalnız gerekli üye bilgileri; active/pending sayım ayrımı, hata/boş/bilinmeyen veri; gerçek browser→API→DB ve build.

## Kalan ürün noktaları

- Vergi numarasının ülke/tür kapsamı ve normalizasyonu; şirket sahipliğine dair şimdilik resmi doğrulama istenmedi.
- Eski aynı numaralı hesaplarda sahip kim; numarasız eski üyeler nasıl tamamlar; hesap kapanınca numara tekrar kullanılabilir mi?
- Yeni kayıt hemen gruba başvurabilir mi, ödeme önce mi? Kayıt onayı kalkması ödeme şartını kendiliğinden kaldırmaz (mevcut account_status/payment çakışması düzeltilecek).
- Grubun görülebilir analiz KPI'ları, dolu/meslek koltuğu uygun olmayan gruba başvuru/bekleme davranışı, eşzamanlı farklı grup başvuruları.
- Başkanı olmayan/çelişen grupta görev kime gider; başkan değişince görev devri; görüşme için süre/hatırlatma/ulaşılamama ve admin istisnası.

Bu açıklar bütün denetimi engellemez; bağımsız teknik tasarım devam edebilir, bağlı davranış kullanıcı kararı olmadan seçilmez.
