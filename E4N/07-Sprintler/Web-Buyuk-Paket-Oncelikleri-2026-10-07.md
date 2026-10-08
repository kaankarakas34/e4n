# Güncel büyük web paketleri

8 Ekim yeniden düzenlemesi: [[Web-Birlestirilmis-Paketler-2026-10-08]] güncel ve bağlayıcı çalışma sırasıdır. 34 açık ana görev 7 ortak epic/paket altında; SEC58/59/120 son sürüm paketinde. Üye/admin ekranı, ödeme/fatura ve geçiş/geri dönüş aynı akış paketinde birlikte teslim edilir. Aşağıdaki önceki notlar tarihsel kanıttır.

# Büyük web paketlerinin uygulama sırası

Eğitim dışı web öncelikli. Mobil Sprint 7 ve kurs/eğitim/sınav Sprint 8 en son. Her paket API/veri/ekran/test/commit bütünlüğüyle değerlendirilir; küçük alt düzeltmeler ana teslim sayılmaz.

| Öncelik | Büyük paket | Büyüklük | Mevcut durum / koşul |
|---|---|---|---|
| 1 | Üyelik, ödeme, haklar ve tekrar açılma | XL | Üye/admin gerçek hesap-ödeme-fatura-hatırlatma kayıt paketi 32 API +34 browser kabulüyle teslim; mevcut ödeme ve hatırlatma altyapısı hazır. Fiyat/dönem, beş gün başlangıcı, kısıtlanan haklar, kesin shuffle kesimi ve ödeme sonrası açılma kararları açık. |
| 2 | Grup başvuru, kabul, kapasite, transfer | XL | Başkan hariç 35 DB invariantı ve0020 ile atomik bağlantı geçmişi+üye/admin web görüntüleme teslim (33API/37browser). Hizmet koltuğu/sınıflandırma, kabul yetkisi ve grup bazlı rol modeli kalan bütün akışı belirliyor. |
| 3 | Puan, çıkarma ve başvuru engeli | XL | D01–D04 kesin eşik/dönem/yeniden başvuru kararları bekleniyor. Yeni kural uydurulmaz. |
| 4 | Shuffle önizleme, atomik dağıtım, kalıcı geçmiş | XL | Gerçek mevcut dağılım ve eski taslak 409 koruması teslim. 0019 ile mevcut atomik kayıt ve önceki/sonraki immutable execution geçmişi + web görüntüleme teslim. Ödeme uygunluğu/kesim, başkan davranışı, dönem ve bildirim kabulü açık. |
| 5 | Web operasyonları ve kalıcı çalışma geçmişi | L | b942636 ile migration + mevcut runnerlar + yetkili dış/yönetici çağrı + admin ekranı + izole bütün kabul teslim. Üretim planlayıcı kabulü ayrıca açık. |
| 6 | Bütün web sürüm kabulü ve güvenlik | XL | Her teslim sonrası bütün regresyon + gerçek tarayıcı. D/şema/üretim kabulü ve Sprint 6 kapsamlı güvenlik kapanmadan releaseReady=false. |

Linear öncelikleri: E4N-102/103 üyelik ve grup web akışları; E4N-100/101 shuffle/geçmiş; E4N-106 operasyon; E4N-109 bütün kabul High olarak sıralandı. Karar bekleyen XL işler nedeniyle bağımsız operasyon paketi uygulanıyor. Teslim edilen WEB-01/02/03/04/05 ve diğer kayıtlı WEB paketleri tekrar yapılmaz. Eğitim/mobil kabulü bu web kuyruğunu engellemez.

## 8 Ekim — bağımsız P26 kayıt/yoklama paketi

Yeni REGISTERED migration0021 + writer + scorepaydası izolasyonu + admin/grup web etiketleri + kayıt/bilet/ödeme/sayaç regresyonu.33API/veri+38browserPASS0FAIL; admin newbooking2→3/finalDB. AnaP26IP; actualcheck-in/düzeltmekaynağı ve geçmişbelirsizliği ayrı açık. Üyelik/hak/grup/puan/shuffle büyük hedeflerinde açıkDkararları korunur.

## 8 Ekim — P37 görüşme, yönlendirme ve destek bütün web kabulü

[[P37-Gorusme-Yonlendirme-Destek-Web-Kabulu-2026-10-08]]: Mevcut üç akış gerçek web/API/veri boyunca doğrulandı. Destek oluşturma/yanıt/kapatma; grup içi yönlendirme oluşturma/alıcı tarafından 120.50 başarılı sonuç; görüşme talebi oluşturma/alıcı kabulü. Yenileme, aynı hesaba geri dönüş, ilgisiz hesapta veri gizliliği ve son DB uzlaştırması aynı pakette. Kabul edilen talep gerçekleşmiş görüşme değildir.

Son taze tarayıcı turu **50 PASS / 0 FAIL**, exit0: `output/web-browser/2026-10-08T08-53-33-947Z/browser-report.json`. Gerçek UI → Express/JWT → izole PG17 akışları ve son veritabanı uzlaştırması geçti. Yönetici destek ekranı görsel olarak incelendi; bu tura ait tarayıcı/API/Vite/veritabanı test ortamı kapatıldı.

Üç tarayıcı test dosyası değişti; uygulama/API/şema değişmedi. Önceki 33 API/veri PASS (08-16-50-617Z) aynı kaynak için tekrar kullanılmaktadır; yeniden build/API koşuldu iddiası yok. Syntax/diff PASS. İlk 44/4 ve 47/3 turlar kabul değildir.

P39/E4N-111 açık bulgu: EXTERNAL “Bağlantılar” alıcı listesi acceptedfriend_requests yerine ortak ACTIVE grup/lonca üyelerini kullanıyor; shuffle sonrası kabul edilmiş farklı grup bağlantısı kaybolabilir. Bu tur mevcut INTERNAL akışını doğrular; yeni uygunluk veya ürün politikası seçilmedi. P37 In Progress, releaseReady=false. Sonraki işler P39 alıcı sözleşmesi ile P26 açık yoklama/check-in bütün paketidir; D kararlarına bağlı üyelik/grup/puan/shuffle XL kapıları açık. Mobil/LMS en son; canlı yazma, dağıtım, gerçek e-posta/ödeme yok.

Teslim kaydı: 5b3340a mevcut codex/e4n-sprint1-foundation dalına push edildi. E4N-109 ve E4N-111 Linear kayıtları güncellendi; ikisi de In Progress.
