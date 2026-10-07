# P39 — Yönetici raporu yükleme hatası

2 Ekim 2026, commit `92d98ae`, yönetilen dala gönderildi.

`AdminReports` gerçekten `getAdminStats?.()` ve `getAdminCharts?.()` çağırıyor. Çağrı aramalarında optional chaining biçimi de dikkate alınmalı. İstemcinin API hatasında 5.425.000 ciro/1.250 üye gibi örnek sayılar veya başarılı boş grafik döndürmesi kaldırıldı. HTTP/ağ hatası çağırana iletiliyor.

Rapor ekranında altı isteğin herhangi biri başarısız olursa rapor yerine görünür hata ve “Tekrar dene” düğmesi var. Diğer başarısız istekleri sessizce sıfıra/boş listeye çeviren ekran akışı bu durumda çalışmıyor. Yeni denemede yükleniyor durumu gösteriliyor. Başarılı gerçek sıfır ve boş grafik yanıtları korunuyor.

`node test/referral-api.mjs` gerçek API modülünde stats/charts için HTTP 503, ağ hatası, başarılı sıfır/boş yanıt ve JWT başlığını doğruladı. `npm run check` ve `git diff --check` geçti. Tarayıcı yeniden deneme akışı ayrıca doğrulanmadı; canlı ağ/DB kullanılmadı.

## Kalan doğruluk sorunları

### Hareket planı 1. teknik teslim — `7f419f7`

Stats sabit %20 dönüşüm, toplamın 70/30 bölüşümü ve kayıp üye 0 kaldırıldı; ilgili alanlar null. Gerçek hesaplama henüz yok. Web bilinmeyen toplam/dönüşüm için Veri yok, kırılım/kayıp sayımı için açıklayıcı boş veri etiketi gösteriyor. Mevcut gerçek tablo sayımları korunuyor.

Gelir toplamının mevcut revenue_entries SUM kaynağı korundu: kaynak tablo yoksa null; boş tablo gerçek0; başka SQL hatası 500. Eski geniş catch artık SQL hatasını başarılı0 göstermez. Üyelik ücreti dahil toplam veya yeni gelir kaynağı varsayılmadı.

`npm run test:isolated`: gerçek disposable PostgreSQL/API'de eksik tablo null; yalnız bu fixture için tablo oluşturulup boş0, 100+25=125, amount sütunu kaldırılınca500 test edildi. Fixture tablosu kaldırıldı; üretim şeması değişmedi. Oturumsuz stats401, mevcut MEMBER sınırı korunuyor. `node test/admin-reports.mjs` gerçek0 ile null etiketlerini ayırıyor; `npm run check`, `git diff --check` başarılı.

Gerçek Chromium sentetik API'de hata/tekrar/₺0 ve ayrı null stats yanıtında toplam/kırılım/kayıp/dönüşüm Veri yok etiketleri, sahte ₺0 olmaması doğrulandı. Harness `test/admin-reports-browser-unavailable.cjs`; browser/Vite kapatıldı. Commit uzak dala gönderildi. Ana P39/P41 kabulü, gerçek metrik hesabı ve rol politikası açık.

### Aylık örnek serilerin kaldırılması — `1249290`

Bağlı `GET /api/reports/charts` sabit Ocak–Haziran ciro/üye büyümesi serileri artık dönmüyor. Sözleşme `revenue: []`, `growth: []`, `availability: { revenue: false, growth: false }`. Aylık hesaplama henüz yok; boş gerçek rapor sanılmaması için bulunabilirlik açıkça false. Web kartları korunup iki grafikte Veri yok gösteriliyor. Eski sunucuda availability alanı yoksa mevcut seri render yolu çalışmaya devam ediyor.

`npm run test:isolated` geçti: izole API 200/0 gelir noktası/0 büyüme noktası/iki false; oturumsuz istek 401. Mevcut MEMBER JWT'si 200 almaya devam ediyor; ADMIN'a özel erişim bu değişiklikte uygulanmadı, rol politikası güvenlik denetiminde açık. Veritabanı şeması/verisi canlı ortamda değiştirilmedi. Önceki bilinen hata baz çizgileri testte korunuyor; test başarısı bütün sistem hatalarının giderildiği anlamına gelmiyor.

`node test/admin-reports.mjs` unavailable durumunda üç Veri yok (iki grafik ve ortalama) ve 0 grafik konteyneri doğruladı. `npm run check`, `git diff --check` geçti. Gerçek Chromium sentetik API provasında hata/tekrar/₺0 ve iki Veri yok grafik 1280/390 genişlikte taşmasız; 0 seri/konteyner, 0 grafik boyut uyarısı. Ayrı browser/Vite kapatıldı. Commit uzak dalda.

Sonraki kalanlar: stats içindeki sabit %20 dönüşüm, 70/30 gelir bölüşümü, kayıp üye 0 ve gelir sorgusu hatasının 0'a çevrilmesi. Hedef hesaplamalar D kararlarıyla eşleştirilmeden icat edilmeyecek. P39/P41 tamamı açık.

### 14:51 UTC devamı — gerçek tarayıcı provası, `e76a844`

Playwright CLI ile gerçek Chromium/React DOM'da izole `AdminReports` ve CSS çalıştırıldı. Tüm dış ağ yolları engellendi; API yolları sentetik yanıtlarla karşılandı. İlk stats 503 → görünür alert ve KPI gizleme; Tekrar dene → gerçek ₺0 ve Veri yok; trafik/katılım sekmeleri → boş tablo başlıkları doğrulandı. 390×844 ve 1280×900 görünümde yatay taşma yok. Grafik konteynerleri mobil 278×320, masaüstü 544×320. Mobil ekran görüntüsü: ![[P39-Rapor-Mobil-Ekran.png]].

Recharts ilk render sırasında -1 boyut uyarıları üretti; yerleşim tamamlanınca ölçülen iki grafik boyutu da pozitifti. İlk fixture yanlış `/reports/attendance` yolu nedeniyle isteği engelledi; gerçek istemcinin `/reports/attendance-stats` yoluna düzeltilip prova baştan tekrarlandı.

Tekrar edilebilir harness ve CLI adımları `test/admin-reports-browser*` dosyalarında. `npm run check`, `git diff --check` geçti. Canlı DB/ağ/dağıtım yok. Bu, önceki notlardaki rapor ekranının DOM/tarayıcı eksikliğini bu hata/tekrar/sıfır akışı için kapatır; uygulama login/route, sunucu verisi ve backend rol denetimini doğrulamaz. P39/P37 genel kabul koşulları açık. Yerel Vite ve ayrı tarayıcı oturumu kapatıldı.

### 13:50 UTC devamı — `f288d54`

API'ye bağlı olmayan sabit 78.5 ortalama başarı puanı “Veri yok” olarak düzeltildi; bir hesaplama/ürün kuralı icat edilmedi. Kart ve rapor ekranı korunuyor. Aşağıdaki önceki sabit 78.5 bulgusu bu commit ile giderildi.

`node test/admin-reports.mjs` gerçek AdminReports bileşenini kontrollü React hook'ları/API yanıtları ve JSX ağacıyla çalıştırdı: başarısız yüklemede alert ve KPI'nın gizlenmesi, Tekrar dene tıklamasında yükleme durumu, başarılı tekrar sonrası gerçek ₺0, bilinmeyen ortalama için Veri yok. `npm run check` ve `git diff --check` geçti. Bu bileşen akış provasıdır; gerçek React renderer, DOM/tarayıcı, grafik boyutları ve canlı ortam testi değildir.

`getAdminGeoStats` örnek dağılımı çağrılıp state'e yazılıyor ancak mevcut AdminReports JSX'inde kullanılmıyor. Bu nedenle görünen coğrafya raporu diye sayılmamalı; P41 koru/kaldır kararı bekliyor.

Sunucunun sabit altı aylık grafikleri ve dönüşüm oranı; istemcinin `getAdminGeoStats` örnek dağılımı, ekrandaki sabit 78.5 ortalama başarı puanı bu değişiklikte çözülmedi. Gerçek rapor verisinin tanımı/hesaplanması ve uçtan uca doğrulama P39/P41'de açık. Yönlendirme güncellemesi de halen doğrudan Supabase kullanıyor; API `PUT /referrals/:id` yoluna taşınmadan önce ilgili taraf/rol sınırları izole testlerle doğrulanmalı.
