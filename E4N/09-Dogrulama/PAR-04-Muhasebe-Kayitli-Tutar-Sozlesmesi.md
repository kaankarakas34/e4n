# Muhasebe kayıtlı tutar sözleşmesi — 2 Ekim 2026

`3fd1b5c`: accounting/payments visitor kaynağı payment_amount eksikse artık1000 varsaymaz; member kaynağı last_membership_payment_amount eksikse6000/7200/39000/69000 varsaymaz. Eksik tutar NULL; kayıtlı0 ve diğer gerçek sayısal tutar korunur. Tarifeler ve D07 kararı seçilmedi, eski veri dönüştürülmedi. API'nin kaynak/filtre/rol sahipliği değişmedi.

Web tablo/detay tutarı nullable olarak işler. Herhangi bir eksik tutar varsa o kapsamın toplamı bilinmiyor gösterilir; eksik tutarı0 sayarak tam toplam iddiası yok. Tümü biliniyorsa gerçek toplam, gerçek boş kapsamda0. Sabit ₺1k başlığı kaldırıldı. Başlıklar Kayıtlı Tutarlar Toplamı, Ziyaretçi Kayıtlı Tutarları ve Kayıt Tarihi. Users/public_visitors kayıt tarihinin ödeme zamanı olmadığı açık; tüm başarılı ödemeler listesi iddiası kaldırıldı. Bu hâlâ son üyelik ve ziyaretçi formu özetidir, transaction geçmişi/sağlayıcı mutabakatı değildir.

Yükleme/hata sırasında özet gizli, hata görünür alert/retry; eski tablo ve yanlış boş mesaj görünmez. Yenilemede açık detay kapatılır. Bozuk kök yanıt hatadır.

## Kanıt

- `server/npm run test:isolated` exit0: üç üye planında NULL/0/125 ve üç visitor kaydında NULL/0/25, ADMIN200/MEMBER403/oturumsuz401. Fixture kayıtlar temizlendi. Mevcut geniş testte kayıtlı eski riskler kapanmış sayılmaz.
- `node test/admin-accounting.mjs` gerçek bileşen kontrollü hook/API ile null toplam/satır/detay,0,150toplam/25visitor, hata/retry, malformed ve eski metrik gizlenmesini doğruladı.
- `npm run check` exit0; diff check temiz; commit yönetilen dala push/ağaç temiz.
- Tarayıcı görsel/kabul testi ayrı açık; canlı DB yazması/ödeme/dağıtım yok.

Ana PAR04 tamamlanmadı. Mobil ödeme işlem listesi ve web muhasebe özeti farklı kaynak/kapsamdır; tam eşlik ilan edilmez. Sonraki bağımsız denetim web AdminSubscriptions MRR tahminindeki sabit7200/6500/5750/6000 değerleri ve membershipStore veri/hata kaynağı. D07 netleşmeden yeni MRR formülü/tarife kurulmayacak.
