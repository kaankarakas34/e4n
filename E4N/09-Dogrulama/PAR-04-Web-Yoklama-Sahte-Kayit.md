# PAR-04 — Admin yoklama sahte kaydı ve bilinmeyen sayılar

3 Ekim 2026. Commit `0eeb279`, yönetilen dala push edildi.

## Kaynak denetimi

AdminGroupDetail Yeni Yoklama/Kaydet kontrolleri hiçbir API çağırmıyordu: Math.random id'li yerel toplantı, bütün üyeler PRESENT sayımı ve yoklama geçmişine ekleme. Radyo seçimleri/toplantı konusu kayda bağlanmamıştı.

Aktif `server/src/index.js` POST `/events/attendance` group_id/meeting_date/topic/items alır; her çağrıda yeni events kaydı, attendance kayıtları ve commit sonrası async puan hesabı vardır. Kaynakta JWT kontrolü var; rol/grup sahipliği/idempotency ve lonca eşlemesi bu yolda doğrulanmış değil. Bu tur endpoint çağrılmadı; bunlar kaynak bulgusudur. D01 puan/mazeret/düzeltme kararları açık; yeni yazma akışı/kuralı icat edilmedi.

GET `/groups/:id/events` bütün grup etkinliklerini getirir (yalnız meeting filtresi yok), PRESENT kayıtlarını ve grubun sorgu anındaki ACTIVE üye sayısını sayar. PRESENT etkinlik başvurusunda da kullanıldığı için bu sayı gerçek fiziksel katılım kanıtı değildir; denominator geçmiş toplantı üye sayısı değildir.

## Teslim

Admin ekranının sahte kayıt formu, tarih seçicisi ve yerel başarı/ekleme kaldırıldı. Sekmede mevcut veriler okunur; “Bu ekranda yoklama kaydı henüz kullanılamıyor.” açıklaması gösterilir. Yeni gerçek yoklama özelliği tamamlanmış sayılmaz.

Başlık Gruba Bağlı Etkinlikler; Katılım Kaydı / Aktif Üye ve Kayıt Oranı etiketleri mevcut kaynağı anlatır. API getGroupMeetings list/row yanıtını doğrular; eksik/geçersiz/negatif/kesirli sayılar null kalır, integer/stringinteger gerçek0 korunur. Admin ekranda bilinmeyen sayı Veri yok; denominator0, bilinmeyen veya numerator>denominator için oran Veri yok. NaN/Infinity/%150 gösterilmez.

## Kanıt ve sınırlar

- `node test/meeting-read-api.mjs` gerçek api.ts kontrollü fetch: GET/JWT/path, array/row validation, null/boş/geçersiz/safe integer, gerçek0, HTTP/ağ reject başarılı. Gerçek ağ yok.
- `node test/admin-group-detail.mjs` gerçek TSX kontrollü hooks/API: bütün önceki hata/tekrar/rol/route/unmount testleri; yoklama sekmesi açıklaması/gerçek boş liste ve save/new kontrollerinin yokluğu; 0/0, null, 0/2, 1/2, 3/2 oranları ve yalnız get çağrıları başarılı.
- `npm run check` exit0, diff kontrolü başarılı; `0eeb279` push, yönetilen dal temiz. API/server HTTP/DB rol yazma testi yapılmadı; yazma bağlanmadı. Canlı Supabase/ödeme/e-posta/dağıtım yok.

Shared getGroupMeetings diğer tüketicilere de null taşır; GroupDetail/GroupManagerDashboard kendi oran/aggregate/fake save davranışlarını ayrıca düzeltmelidir. Ana PAR04/02 ve Sprint6 kapanmadı. Detay düğmesi işlevi, lonca grup yolları, ciro/dönem varsayımları ve gerçek kayıt/tekrar/puan/rol kabulü açık.

## Sonraki bağımsız iş

GroupDetail aynı yerel fake save/all-present ve oran kusurunu taşıyor; aynı dürüst kayıt/boş/bilinmeyen sözleşmesine geçir. Ardından GroupManagerDashboard shared null sayıları/yanıt doğrulama ve mevcut submit hata→başarı/tek pending denetimi; D01 veya yeni yetki kuralı seçme.
