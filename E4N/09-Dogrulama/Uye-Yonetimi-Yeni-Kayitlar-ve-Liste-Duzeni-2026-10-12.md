# Üye yönetimi — yeni kayıtlar ve liste düzeni / 12 Ekim 2026

Kullanıcı mevcut ekranı anlaşılmaz buldu; yeni gelen kişinin görünmesini, son gelenin en üstte olmasını ve ekranın düzgün düzenlenmesini istedi. Mevcut WEB14 / E4N-148 dizin düzeltmesi; yeni teslim görevi oluşturulmaz.

- API users sırası created_at DESC NULLS LAST,id. İstemci ve mevcut diğer üye işlemleri listesi de aynı tarihe göre sıralanır; eşit tarihte UUID sabit sıra, tarihsiz kayıtlar sonda. Türkçe ad/şirket/meslek/şehir aramasına telefon eklendi.
- Varsayılan Üye Yönetimi: belirgin ad/rol/Yeni rozeti, şirket/meslek/şehir, e-posta/telefon, gerçek grup/üyelik durumu, kayıt tarihi ve hesap durumu sütunları. Üstte son3 kayıt, toplam/son7gün/grup kaydı olmayan sayıları. Yeni rozeti ve Son7gün filtresi sunucu asOf zamanına göre; gelecekteki/tarihsiz kayıt Yeni sayılmaz.
- Profil yönetimi linkleri, detay paneli, yeni üye ekleme ve mevcut diğer üye işlemleri erişimi. Arama/rol/hesap/grup filtreleri; refresh filtreleri korur, hata/tekrar/boş sonuç ayrımı ve token-owner görünürlük koruması. Mobilde tablo kendi alanında kaydırılır.
- Hesap aktifliği abonelik hakkı olarak sunulmaz; ücret/abonelik/grup kabul politikaları değişmez. Migration ve production kullanıcı verisi yazımı yok.

## Kanıt

- check/build/235rota/syntax/diff PASS. Yenilenen AdminMemberDirectory hedefli lint PASS; API/legacy dosyalarının önceki lint açıkları bu teslimle topluca kapanmış sayılmaz.
- admin-member-directory-newest-contract.mjs gerçek HTTP handler+TS yardımcı/DTO, newest/null/tie/immutable/7gün sınırı/future/telefon401/403/private-no-store PASS. Sorgu adaptörü izole; PostgreSQL kontratı çalıştırılmadı (Docker kapalı).
- Canlı salt okunur anonimleştirilmiş aggregate:29hesap; name/email/profession/created_at NULL0. Kişisel satır alınmadı.
- Gerçek web sayfası + izole API fixture: alfabetik gönderilen yanıtta Zeynep(new)→Ece→Ali→tarihsiz; üst kartlar aynı sıra; Son7gün2, telefon arama1, detay/profil doğru UUID, filtre temizleme, GET500→tekrar→4kayıt geri dönüşü doğrulandı. Desktop1280 ve390px mobil görsel incelendi. output/playwright/member-management-{before,recent,search,detail,error,retry}.txt; desktop/mobile.png. Dış analitik engellendi. Gerçek oturumlu production E2E değildir.
- Canlı yayın tamamlandı: ürün 6705726146e51989a152be097a3afe13819410f5 main/foundation; production dpl_6JXamf6dvKT1GZ1gKpg2XT7ot8dQ READY, iki custom domain doğru sürüme bağlı. /admin/members 200; index-CemrhYzB.js 200 ve UTF-8 metin doğrulaması Son katılan üyeler/En yeni kayıt en üstte/Son7gün filtre metinlerini içeriyor. Anon member-directory 401. Gerçek oturumlu production E2E yapılmadı. Migration/kullanıcı veri yazımı yok.
