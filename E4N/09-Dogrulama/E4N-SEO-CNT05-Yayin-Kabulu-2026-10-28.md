# E4N-293 — Networking Temelleri yayın kabulü

Tarih: 28 Ekim 2026 (TSİ). Linear: [E4N-293](https://linear.app/e4n/issue/E4N-293/e4nseo-ep-05-networking-temelleri).
Yönetilen checkout: `C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2`; dal: `codex/e4n-sprint1-foundation`.

## Kapsam ve neden

Kullanıcının “devam et” talimatıyla Networking Temelleri paketinin yayın çakışması, içerik doğruluğu, iç linkleri ve kabul kontrolleri ele alındı. Önceki “CMS olmadan yap” kararı korunur: güncel yayın kaynağı React statik sayfalardır. 22 Ekim CMS JSON/taslakları tarihsel hazırlıktır.

İlk canlı kontrol dört destek yazısında doğru 200/içerik gösterirken `/business-networking` eski 301 ile `/e4n-nedir` sayfasına gidiyordu. Aynı path App içinde hem yönlendirme hem yeni rehberdi; Vercel yönlendirmesi statik HTML'den önce çalışıyordu. Önceki build testi yalnız dosyayı okuyor, HTTP testi redirect izliyordu. Bu yüzden yanlış canlı sayfa eski kabulden kaçmıştı.

## Teslim

- Eski `/business-networking` yönlendirmesi kaldırıldı; 44 diğer 301 kuralı ve 63 istemci rotası korunur. Aynı path'in iki kez tanımlanması veya katalog sayfasının redirect olması build/check kapısında hata verir. İlk negatif prova gerçekten `Duplicate application routes: /business-networking` hatasını üretti.
- HTTP sözleşmesi redirect izlemeden 200 ve tam canonical eşitliği denetler. Eski browser sözleşmesindeki yanlış yönlendirme beklentisi, hâlâ geçerli `/is-insanlari-kulubu` yönlendirmesine taşındı.
- Beş rehberde karşılıklı dört bağlantı, `/blog` dizininde beş statik keşif bağlantısı var. İkincil gezinme düğmeleri aynı görünümde gerçek anchor oldu; mevcut `cn(buttonVariants(...), ...)` stil birleştirmesi korunur. Görsel kontrolde bulunan beyaz yazı/beyaz zemin hatası son build öncesinde düzeltildi.
- Kaynaksız %50+ / %2–3 dönüşüm oranları, kesintisiz referans ve çıkar çatışmasını sıfırlama vaatleri kaldırıldı. “Her grupta tek meslek” hatası, “her üye tek iş kolu; aynı meslekten bir kişi” olarak düzeltildi. Sabit haftalık toplantı yerine gruba özel takvim kullanıldı. Shuffle, eski ilişkiler sürerken yeni insan/meslek/konuların ağa katılmasıyla açıklandı.
- Görünür kurumsal hazırlayan/güncellenme tarihi, örnek çalışma planı açıklaması ve genel networking ilkeleri için [Cambridge Üniversitesi birincil rehberi](https://www.careers.cam.ac.uk/networking) eklendi. Bu kaynak E4N dönüşüm oranı veya ürün sonucu kanıtı değildir. Bağımsız uzman onayı taklit edilmedi.
- Beş sayfada görünür tarihle aynı `Article.dateModified`, gerçek canonical/mainEntityOfPage ve kurumsal author/publisher var. Sitemap beş rehber ve keşif dizini için gerçek değişim tarihini kullanır. Tasarımın mevcut bölüm/kart stili korundu; yeni görsel veya uydurma kişi/başarı örneği eklenmedi.

## URL ve niyet kararı

| URL | Rol ve ayrışan ihtiyaç |
|---|---|
| `/business-networking` | Kavramsal ana rehber: networking nedir, güven ve iş ilişkisi |
| `/is-cevresi-nasil-genisletilir` | Yeni ilişki alanlarını bulma, tamamlayıcı mesleklerle tanışma |
| `/profesyonel-is-agi-nasil-kurulur` | Mevcut ilişkileri haritalama, takip rutini ve örnek uygulama planı |
| `/networking-neden-kartvizit-toplamak-degildir` | Etkinlikte dinleme, izinli iletişim ve takip köprüsü |
| `/networking-ile-satis-arasindaki-fark` | Satış görüşmesi ve uzun vadeli iş ilişkisinin amaçlarını ayırma |

28 Ekim web arama örneklemi, “business networking nedir”, “iş çevresi nasıl genişletilir” ve “profesyonel iş ağı nasıl kurulur” sorgularında kavram/üyelik/eğitim ile genel kariyer rehberlerinin örtüştüğünü gösterdi. Bu sınırlı örneklem, Google Türkiye sıralama veya hacim raporu değildir. E4N için B2B örnekler ve yukarıdaki ayrışan işler korunur; iki uygulama rehberinin gerçek sorgu çakışması GSC verisiyle izlenecek. Ek URL üretilmedi. Kaynak örnekleri: [BNI kendi model anlatımı](https://kayit.bni.com.tr/), [Biymed kendi eğitim kapsamı](https://www.biymed.com.tr/egitim-detay-basvuru.php?id=2149). Rakip iddia/istatistikleri E4N kanıtı olarak kullanılmadı.

## Doğrulama

Kanıt kökü: `output/seo-cnt05-20261028/`; browser görselleri: `output/playwright/seo-cnt05-*.png`. Son durum ve canlı doğrulama aşağıya işlenecek.

- İlk build/type ve 244 API rota sahipliği başarılı. Hedefli lintte bulunan 32 önceden kullanılmayan icon importu bu beş dosyada temizlendi; son hedefli lint 0 hata/0 uyarı.
- İlk statik 31, dinamik 10 ve HTTP 31 sözleşmesi başarılı. Dinamik testteki `ECONNREFUSED` satırı beklenen kontrollü outage/503 senaryosudur.
- İlk gerçek yerel browser: 320/390/768/1440 px × 5 sayfa = 20 ölçüm; taşma 0, tek H1/canonical/description ve Article URL/tarih; 7 gezinme akışı, pageerror 0. Yerel API yanıtları salt okunur fixture; canlı DB kabulü değildir.
- Görsel düzeltme sonrası **son build/type/244 rota, hedefli lint 0/0 ve statik 31 sözleşmesi başarılı**. Son browser: **20 ölçüm, 8 gezinme akışı, taşma 0/pageerror 0**; ilave klavye Enter geçişi ve görünmez bağlantı kontrolü başarılı. Hero görseli ayrıca gözle incelendi; ikincil bağlantı görünür. Kaynaklar: `build-final.log`, `lint-final.log`, `static-final.log`, `check.log`, `browser-local-final.json`, `seo-cnt05-local-hero.png`. Canlı yayın kabulü henüz yapılmadı.

## Açık ana kapsam

E4N-293 In Progress. Teknik yayın kabulü ayrı kaydedilir; bağımsız gerçek uzman/editoryal onay tamamlanmış sayılmaz. GSC gerçek indekslenme/sorgu eşlemesi, Rich Results ve gerçek kullanıcı CWV bu turda ölçülmüş değildir. CMS yönetici editör/kapak upload kabulü E4N-292'de açık kalır; statik paket bununla teknik olarak kilitlenmez. Yeni küçük teslim görevi oluşturulmadı. Diğer hardening/mobile/silme değişiklikleri korunur.
