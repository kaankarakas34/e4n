# P19 — Grup üyelik geçmişi: veri, API ve web

7 Ekim2026. Eğitim dışı web; kalıcı bağlantı geçmişi, üye ve yönetici ekranları birlikte teslim edildi.

## Tamamlanan paket

- Sürümlü migration0020: mevcut bağlantılar başlangıçta gözlenen kayıt olarak alınır. Bu, gerçek geçmiş katılma veya çıkarılma olayının yeniden oluşturulması değildir.
- Sonraki bağlantı ekleme, değişiklik ve silme işlemleri önceki/sonraki grup, bağlantı rolü, durum ve tarihiyle aynı transaction içinde kaydedilir. Geçmiş yazılamazsa üyelik işlemi de geri alınır. Değişmeyen UPDATE yeni olay oluşturmaz.
- Grup değişimi iki tarafı korur. Kullanıcı kimliği değişiminde iki ayrı sahip için yalnız ilgili önceki veya sonraki taraf kaydedilir; bir üye başka hesabın durumunu almaz.
- Grup ve kullanıcı silinse bile geçmiş kalır. Daha önce yakalanan adlar korunur; cascade sırasında zaten silinmiş üst kaydın adı bilinmeyebilir. Uydurulmuş ad/işlemi yapan kişi/neden/dönem yok.
- Geçmiş UPDATE/DELETE/TRUNCATE engellenir. Kaynak bağlantıların TRUNCATE işlemi de satır geçmişini atlamaması için engellenir. Bu, yetkili DB sahibinin triggerı devre dışı bırakmasına karşı kriptografik koruma değildir.
- Özel tablo ve yardımcı fonksiyonlar PUBLIC/anon/authenticated erişimine kapalıdır; RLS açık, fonksiyonlar invoker ve sabit search_path kullanır.
- Üye kendi geçmişini, güncel DB ADMIN hesabı seçilen hesabın geçmişini okuyabilir. Silinen hesabın korunmuş kayıtları yöneticiye açıktır; silinen kişinin eski tokenı reddedilir.
- API özel no-store ve read-only repeatable-read sayfa döndürür. Gerçek toplam, son50 ve mikro saniye+UUID cursor ile daha eski kayıtlar; farklı sayfalar farklı snapshot olduğundan eşzamanlı yazımlar karşısında tek donmuş küresel geçmiş iddiası yoktur.
- Webde önceki/sonraki kayıt, yenileme, daha eski kayıtları yükleme, boş/hata/yetki durumları ve hesap/rol/token/hedef izolasyonu vardır. Grup yönetimi ve üyelik kayıtları detayından ulaşılır.

## Kabul kanıtı

- Odaklı gerçek PostgreSQL17/Express/JWT/web transport testi PASS: fresh20/repeat0/19upgrade, bir gerçek BASELINE, insert/update/delete, no-op replay, rollback ve historyoutage, grup transferi, kimlik değişiminde sahip ayrımı, rename/cascade, immutability/ACL/RLS, mevcut rol ve sahte JWTrol sınırları,106 satırda50'lik tüm sayfalar ve tekrar olmayan UUIDler, eşzamanlı yazar altında sayfa snapshotı, DTO/SQL500/redacted/recovery.
- Bütün API/veri:33PASS/0FAIL — output/web-acceptance/2026-10-07T18-21-36-986Z/report.json. Önceki18-16-52 koşusunda31PASS/2FAIL yeni tablo ve migration sayısını unutan eski fixture beklentileriydi; düzeltildi. Başarısız rapor kabul değildir.
- Son SQL index sıralama düzenlemesinden sonra odaklı test tekrar PASS; UI build/TypeScript PASS.
- Gerçek App/Vite→Express/JWT→PG17 browser37PASS/0FAIL — output/web-browser/2026-10-07T18-26-37-721Z/browser-report.json. Admin ve üye gerçek geçmiş;50'den eski kayıtları yükleme, yenilemeyle ilk sayfaya dönüş, diğer üyeye ait verinin gizlenmesi ve member-adminroute reddi. Yeni shared ekranın üye görüntüsü gözle incelendi.
- Son DB gerçek shuffle arşivleme ACTIVE→INACTIVE ve yeniden ACTIVE kayıtlarını içerir;37 benzersiz ACTIVE atama ve tek shuffle execution, ödeme/fatura/hatırlatma ve önceki web akışları korunur.
- Sentetik yedek/geri yükleme46table (45app+ledger), satırhashleri/catalog/ACL/RLS/triggerlar ve iki gerçek üyelik geçmişi kaydı dahil PASS. Geri yüklenmiş gerçek history API ve immutable delete engeli doğrulandı. Bu canlı üretim verisi yedeği/provası değildir.
- Build/TS/syntax/diff PASS;174route/23provider/17korunmuşlegacy. Mevcut bundle/Browserslist uyarıları sürüyor. Ownedbrowser/Vite/API/DB süreçleri kapalı.
- Rapor baseHEAD66550ad; teslim kaynakları rapor sırasında çalışma ağacındaydı. Final teslim commit'i daha sonra oluşturulur, basehash tek başına bu paketi tanımlamaz.

## Kalan ana hedefler

P19 In Progress; tek aktif kapalı grup, canonical dönem ve çıkarılma nedeni/puan/yeniden başvuru politikası tamamlanmadı. P20/P30/P31/P09/P36/P37 ve releaseReady=false sınırları sürer. Geçmişte silinmiş kayıtlar üretilemez. İşlemi yapan kullanıcı, neden ve retention politikası için yeni varsayım yok. Bu paket mevcut kabul/taşıma/çıkarma yetkisini değiştirmez.

Üyelik ücret/dönem, grace başlangıcı, kısıtlanan haklar/açılma ve kesin shuffle kesimi; hizmet sınıflandırması/kabul yetkisi ve D01–D04 puan kararları açık. Karara bağlı davranışlar uygulanmaz. MobilSprint7 ve LMS8enson. Canlı Supabase yazma/migration/deploy/realmail/payment yok; yeni tabloyu canlıya almak ayrı P09/P36 kabulü gerektirir. Sonraki büyük grup/üyelik hedefleri bu karar ve şema kapılarıyla tamamlanacak; teslim edilen teknik geçmiş paketi tekrar iş sayılmaz.
