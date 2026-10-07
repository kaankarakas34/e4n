# Meslek onayı API provası — 2 Ekim 2026

## Bulgular ve uygulama

Web ve mobil meslek güncellemesinde gönderilen `status` alanı PUT API tarafından yok sayılıyordu. `788b7ac` ile alan kaydediliyor; gönderilmezse mevcut durum korunuyor. Güncelleme ADMIN oturumu gerektiriyor. Geçersiz durum biçimi 400, bulunmayan geçerli UUID 404 döndürüyor. Mevcut ad/kategori içeren PUT sözleşmesi korunuyor; yalnız status gönderen PATCH sözleşmesi eklenmedi.

## Kanıt

`server/npm run test:isolated` başarılı (çıkış 0). Geçici PostgreSQL üzerinde oturumsuz 401, MEMBER 403, reddedilen isteklerden sonra PENDING korunması, ADMIN 200 ve APPROVED kaydı, status gönderilmezse korunması, sayısal status 400 ve olmayan kayıt 404 doğrulandı. Canlı Supabase yazması ve dağıtım yapılmadı. Commit yönetilen `codex/e4n-sprint1-foundation` dalına gönderildi.

## Açık sınırlar

Altıncı teslim `6e02cc0`: DELETE professions ADMIN oturumu gerektiriyor. İzole testte public401/MEMBER403 ve kayıt korunması; ADMIN204/kaydın silinmesi; tekrar ve olmayan UUID404 geçti. Test exit0/push. Önceki POST/DELETE açık notlarının POST kısmı e475770, DELETE kısmı bu commit ile dar API rol sözleşmesi düzeyinde giderildi; kapsamlı güvenlik tamamlanmış sayılmaz.

Karar/veri bulgusu: web pending listede Reddet düğmesi handleDelete ile DELETE kullanıyor; REJECTED durumu ve red tarihçesi bırakmıyor. Kullanıcı profession metni sakladığından satır silinmesi kullanıcı metnini temizlemiyor. Red ile fiziksel silmenin ürün anlamı ve meslek kayıtlarına bağlı eski veri denetimi açık; bu turda red davranışı değiştirilmedi.

Yedinci teslim `7d8b4a1`: yerel mobil admin professions ekranı yükleme/malformed yanıt hatasını kalıcı alert/retry olarak gösterir; hatada eski kayıt ve yanlış boş mesaj görünmez. Gerçek boş liste korunur. Gerçek bileşen kontrollü hook/API testi hata/bozuk yanıt/tekrar/eski satırın gizlenmesi/gerçek boş senaryolarında geçti. Mobil TypeScript önce/sonra exit0. Yalnız bizim yama ve test yönetilen dala gönderildi; yerel mobil repo geniş mevcut değişikliklere sahip ve remote yok. Reverse-check geçti. Cihaz/yayın deposu entegrasyonu hâlâ açık. Mobil ekle/düzenle/talep/onay bu değişiklikle eklenmedi.

Beşinci teslim `e475770`: web yeni meslek formu APPROVED gönderirken POST bunu yok sayıp ACTIVE kaydediyordu; yeni kayıt onaylı listeden kayboluyordu. POST artık ADMIN oturumu gerektirir ve gönderilen status kaydedilir. Alan gönderilmezse eski ACTIVE varsayılanı korunur; eski kayıtlar dönüştürülmez. Kayıt formu yeni meslek talebini kendi register SQL akışıyla PENDING oluşturur; istemcilerde POST professions yalnız admin oluşturma çağrısında bulundu.

İzole test: public401/MEMBER403 ve hiç satır oluşmaması; ADMIN201/APPROVED yanıt ve DB durumu; status yokken ACTIVE; geçersiz sayısal status400 ve satır oluşmaması. Fixture oluşturulan kayıtlar temizlendi; test exit0/push/temiz ağaç. Meslek DELETE yetki sınırı hâlâ açık; tüm kaynak güvenli ilan edilmez. Ana PAR04 bitmedi.

Dördüncü teslim `215d63b`: hem sürümlü migration hem eski seed şeması professions.created_at kaynağını içeriyor. ADMIN GET bu gerçek kayıt zamanını döndürüyor; public/MEMBER yanıtına eklenmiyor. Ekran etiketi Kayıt Tarihi; ayrı bir talep zamanı olduğu iddia edilmiyor. Eksik/null/boş/geçersiz/sayısal tarihte Tarih bilgisi yok gösteriliyor, tarih üretilmiyor. İzole API testinde sabit fixture zamanı birebir eş; bileşen testi geçerli Türkçe tarih ve eksik/bozuk değerleri geçti; TypeScript exit0. Canlı yazma/şema değişikliği yok. Tarayıcı/cihaz kabulü açık.

Üçüncü teslim `0a6ca53`: web AdminProfessions yükleme hatası artık alert ve tekrar dene sunuyor. Hata/yükleme sırasında listeler ve boş mesajları gizli; talep sayısı bilinmiyor işareti, form pasif. Gerçek boş liste normal mesajını koruyor. Arama inputu yüklemede sökülmüyor. İstek sürümü ve effect cleanup eski yanıtın yeni aramayı ezmesini önlüyor.

`node test/admin-professions.mjs` gerçek bileşeni kontrollü hook/API ile çalıştırdı: ilk hata, bozuk yanıt, tekrar, gerçek boş, başarılı liste sonrası hata, bekleyen sekmesinde hata/boş ve geciken istek yarışını doğruladı. `npm run check` exit0. Tarayıcı veya gerçek cihaz testi sayılmaz; bu kabul açık. Commit push/temiz ağaç.

Yeni açık bulgu: bekleyen listede `prof.created_at` tarih olarak gösteriliyor, mevcut GET bunu döndürmüyor. Kaynak sütun doğrulanmadan tarih eklenmeyecek; eksik tarih ekranında anlamlı gösterim sıradaki bağımsız iş.

İkinci teknik teslim: GET professions yalnız ADMIN oturumuna gerçek status alanını ve tam listeyi verir. 51 alfabetik erken fixture varken bekleyen kayıt bulunuyor; arama aynı kaydı döndürüyor. Oturumsuz/MEMBER araması 50 sınırı ve önceki üç alanıyla korunuyor. Geçersiz gönderilmiş JWT 403. İzole test exit 0; fixture satırları temizlendi.

Ek denetim: kayıt akışı tanınmayan mesleği PENDING oluşturuyor, kullanıcıda yalnız meslek metni saklıyor. GET önceden status döndürmediğinden webde `!p.status` koşulu bekleyenleri onaylı listesine yerleştiriyordu. Mobil meslek ekranında ise ekleme/düzenleme/onay ve talep sekmesi bulunmuyor; yalnız liste/silme var. ACTIVE ile APPROVED eski kayıt anlamı ayrıca veri eşleme kapsamında çözülmeli; otomatik dönüşüm yapılmadı.

- Kullanıcıdaki meslek metni ile meslek kaydı arasında doğrulanmış kimlik ilişkisi yok; admin üye yanıtı profession_status ACTIVE ve profession_id null üretiyor. İsim eşlemesi veya yeni ürün kuralı uydurulmadı.
- Meslek onayı ve üye aktivasyonu iki ayrı istek; atomik onay zinciri tamamlanmadı.
- Meslek POST/DELETE yollarının mevcut yetki eksikleri bu dar PUT düzeltmesinde kapanmadı; bütün meslek kaynağı güvenli ilan edilemez. Sprint 6 güvenlik kapsamına dahil edilmeli.
- Mobil cihaz ve yayın deposu entegrasyonu açık. P32/PAR04 tamamlandı sayılmıyor.

Sonraki iş: mevcut meslek tüketicileri ve kayıt akışını inceleyip ilişki/karar bağımlılığını kaydet; karar gerektirmeyen API farklarıyla devam et.
