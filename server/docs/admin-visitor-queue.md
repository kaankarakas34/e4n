# WEB-13 — Eğitim dışı ziyaretçi inceleme ve iletişim

`GET /api/admin/visitor-queue`: mevcut DB ADMIN rolü, JWT owner, read-only REPEATABLE READ transaction, private/no-store. UUID owner/query kontrolü; eksik hesap401, diğer güncel roller403. En çok5000 kayıt, taşma açık503. Eğitim source ve education etkinliğine bağlı kayıtlar dışarıda. Mevcut ekranın kaynak kurallarıyla visitor_invite/visitor_payment ayrı katılım kategorisi; web/form ve başvuru amacı dolu legacy kayıtlar form kategorisi. Dışarıdaki diğer legacy kaynaklar bu kuyrukta bulunmaz.

İlişkili etkinlik özel veya geçmiş olabilir: filtre public/gelecek etkinlik kataloğundan değil, okunan kayıtların event_id/title/start_at alanlarından üretilir. Aynı adlı etkinlikler UUID ile ayrılır. Tüm statüler/gerçek boş sonuç gösterilir; tüm kayıtlar 'bekleyen' gibi sunulmaz.

DTO ekrandaki kimlik/iletişim/şirket, kaynak/statü/tarih, davet eden/etkinlik, üst düzey form yanıtları ve allowlist form_data cevaplarıyla sınırlıdır. Parola, ham ödeme/indirim/fatura/token metadata yok; JSON object cevabı UI nesnesi olarak render edilmez. Cevaplar plain text/string[]; bağlantı alanı plain text. Source `public_visitors.created_at` timezone içermeyen timestamp olarak saklanır; kaynak UTC varsayımı açıkça UTC'ye bağlanır. Canlı farklı zaman dilimiyle eski veri dönüşümü P09/P36 ayrı doğrulamasıdır.

`PUT /api/admin/visitor-queue/:id/contacted`, yalnız boş JSON body. Mevcut DB ADMIN rolü FOR SHARE ve public_visitors satırı FOR UPDATE ile transaction. Sadece mevcut PENDING→CONTACTED; mevcut CONTACTED tekrarında aynı saved DTO200. Başka statü409; eğitim/kapsam dışı/olmayan404, geçersiz body/UUID/query400. SQL failure rollback500. Diğer alanlar, ödeme, users, visitors, group_members değişmez; mail gönderilmez. Yeni üyelik veya grup kabulü değildir.

## Web ve kapsam

AdminVisitors varsayılan eğitim dışı görünümünde AdminVisitorQueue: kategori/etkinlik filtresi, mevcut başvuru detayları, gerçek statü, read retry/refresh/loading/empty, contact lock ve owner/token değişimi koruması. PUT sonucu belirsizse GET-only durum kontrolü; tekrar PUT otomatik yapılmaz. Okuma da başarısızsa yeni yazım kilitli, ayrı salt okunur kontrol düğmesi. ACK'de gerçek saved DTO uygulanır.

Mevcut üyelik/grup yönetim ekranına ayrı düğmeden ulaşılır; bu eski kolun kabul/silme/ret/şirket/ücret ve yetki politikaları tamamlandı sayılmaz. Eski davet/üyelik/LMS kaynakları silinmedi. Yeni kuyruk ilk yüklemede eski genel kullanıcı/grup/eğitim API çağrılarına bağlı değildir. Mobil/LMS şimdi geliştirilmedi. P31/P39 ana hedefleri ve D01–D10/SEC açık kalır.

## Kanıt

`node server/test/admin-visitor-queue-contract.mjs`: izole PG17,14 migration/repeat0, gerçek Express ve gerçek TypeScript transport. Current admin/revocation/auth/query/cache, kaynak/education/özel-geçmiş etkinlik ayrımı, safe DTO, concurrent contact replay/conflict/404/rollback, malformed DTO, admission tablolarına yazılmama, empty ve5001-limit503 PASS.

Gerçek AdminVisitors+AdminVisitorQueue ve testten yakalanan fixture ile Playwright: error/retry/kategori/detay/etkinlik filtresi, kayıp committed PUT sonucu tek PUT/GET recovery, PUT+GET failure sonrası read-only kontrol/yeni kullanıcı tekrarı, gerçek saved statü, empty ve held GET sonrası account guard PASS. İlk tarayıcı CLI open/run yarışı ve test locator belirsizliği düzeltildi; son uçtan uca run açık passed=true/7GET/3 ayrı kullanıcı PUT içerir. Browser fixture üretim E2E değildir. Ekran görüntüsü incelendi; check/build/diff/syntax PASS, mevcut bundle/browser-data uyarıları sürer.

Yeni migration yok: kaynak14 sürüm/41 tablo. Canlı Supabase yazma, deploy, gerçek mail/ödeme testi yok.
