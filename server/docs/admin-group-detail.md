# WEB-12 — Yönetici grup detayı

`GET /api/admin/groups/:id/detail`, JWT ve işlem başlangıcında mevcut DB ADMIN rolü gerektirir. İddiadaki ADMIN rolü tek başına yeterli değildir. Mevcut olmayan kullanıcı 401, diğer roller 403, olmayan grup 404, geçersiz UUID/query 400. Yanıt `private, no-store`; read-only REPEATABLE READ transaction. Kullanıcı ve grup okumasından son özete kadar aynı veri görünümü kullanılır. Gruplar DRAFT/ACTIVE ayrımı korunarak okunur.

## Veri kapsamı

- Grup ayarları ve o grubun tüm mevcut üyelik kayıtları (ACTIVE/REQUESTED); parola ve ham kullanıcı kaydı taşınmaz.
- Gruba bağlı eğitim dışı etkinlikler. Katılım sayısı attendance JOIN users tüm statüleridir; PRESENT ayrıca sayılır. Kayıt varlığı gerçekleşen katılımı doğrulamaz. Gelecek tarihli kayıt sayısı `start_at > transaction now()`; yayın/iptal kabulü değildir.
- Grubun ziyaretçileri, mevcut statüleri ve ekranın kullandığı iletişim/şirket alanları.
- Gönderenin **şu anda ACTIVE grup üyeliği** olan tüm geçmiş yönlendirmeleri; alıcı mevcut kullanıcı. EXISTS aynı kaydı çoğaltmaz. Bu tarihsel grup ataması veya yeni dönem politikası değildir.
- Her liste en fazla 5000; daha fazlası açık 503, kesilmiş başarı verilmez. Büyük gruplar için sayfalama ayrı gelecek kapsamdır.

Finans özetinde mevcut yönetici rapor sözleşmesi uygulanır: SUCCESSFUL kayıtların negatif olmayan, bilinen tutarı SQL numeric toplam/string. Başarılı eksik/negatif tutar varsa toplam `volume=null`, `knownVolume` ve eksik sayısı ayrıca gösterilir. PENDING/UNSUCCESSFUL tutarları ciro gibi eklenmez; sıfır bilinmeyene çevrilmez. PostgreSQL ondalık ve web BigInt formatı sayı birleştirme/yuvarlama hatasını önler. Şema değişmedi: 14 sürüm/41 tablo.

## Web

AdminGroupDetail ADMIN/grup kolu tek doğrulanan snapshot okur. Tipli servis owner/group, list bounds/duplicate, tarih/kayıt sayısı ve exact finans/list tutarlılığını doğrular. Diğer roller ve lonca eski okuma kolunda kalır; onların politikaları bu pakette seçilmez. Gerçek hata/tekrar, başarılı boş, yenileme, token/owner/grup değişiminde eski yanıtın gizlenmesi korunur. Mevcut roster/ziyaretçi yazımı sonrası bütün snapshot tekrar okunur; bu eski yazımların yetki/kabul politikaları ayrıca açıktır.

INVITED/ATTENDED/JOINED/NO_SHOW ve PENDING/SUCCESSFUL/UNSUCCESSFUL kendi anlamıyla gösterilir; legacy CONVERTED/COMPLETED ve bilinmeyen statüler açık fallback kullanır. Etkinlik Detay düğmesi mevcut `/events/:id` ekranına yönlenir. Mevcut yapay '1. Ay / 4. Ay dönem sonu' fallback kaldırıldı; yeni dönem/puan/kabul/rol atama kuralı seçilmedi.

## Doğrulama

`node server/test/admin-group-detail-contract.mjs`: gerçek izole PG17, sürümlü kaynak kurulum ve Express; gerçek TypeScript transport/DTO. Yetki/rol geri alma/query/cache/404, concurrent writer sonrası aynı read snapshot, 7 referral/5 başarılı/2 eksik/bilinen100.30, sıfır/tamamlanan103.30, eğitim/diğer grup sınırı, empty/5001-limit503, injected read failure/retry kontrolleri. Tüm test yazımları yalnız test container içindedir.

Gerçek AdminGroupDetail + bu testten yakalanan fixture ile Playwright: read500/retry, exact bilinen tutar ve0, tüm statüler, katılım2/PRESENT1, çalışan event navigasyonu, held read sonrası owner değişimi. Browser mail/alert yerine stub kullanır; üretim E2E değildir. Ekran görüntüsü gözle kontrol edildi. check/build/diff/syntax doğrulandı; mevcut bundle/browser-data uyarıları sürer.

Canlı Supabase yazma, migration, deploy, gerçek mail/ödeme yok. P09 canlı geçiş, P31/P39 ana kapsam, D01–D10 ve SEC kabulü açık; mobil/LMS ertelenmiş.
