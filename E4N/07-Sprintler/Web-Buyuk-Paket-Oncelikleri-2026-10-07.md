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
