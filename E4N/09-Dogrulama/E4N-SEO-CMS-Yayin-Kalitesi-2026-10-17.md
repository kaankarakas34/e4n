# E4N-292 — CMS-01 küme, yayın incelemesi ve güvenli kapak paketi

Tarih: 17 Ekim 2026 (TSİ). Yönetilen checkout: `C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2`, dal `codex/e4n-sprint1-foundation`.

## Canlı geçiş — 17 Ekim 2026

- Üretim kodu `17c59d2a7b0625facfea37419b331a6ff21ebaa5` main'e fast-forward push edildi. Temiz commit arşivinden iki staging üretim build'i READY; sonuncusu `dpl_9hMnN9se22gUkRVKRmoAzfc1yQt5` sekiz HTTP kontrolünden sonra promote edildi. Git entegrasyonu aynı commit'i `dpl_Bf22p7hYnEPkffp5M69W2JdutHR9` ile yeniden kurdu ve gerçek alan adları bu READY dağıtıma bağlandı.
- Canlı migration `20261017075027 / blog_editorial_workflow` uygulandı. Hazırlanan `20261017071555` dosyası SQL içeriği değişmeden gerçek ledger sürümüne yeniden adlandırıldı; sözleşme aynı 38 HTTP isteğiyle tekrar geçti. Genel 28 sürümlü rehearsal runner'ı değiştirilmedi.
- Yedi yeni kolon eklendi. Var olan tek yayımlanmış yazının eski alan parmak izi önce/sonra aynı: `306e2cced9ea552860ca5e64a4c167e9`; kayıt sayısı 1. RLS ve ACL parmak izleri korundu; blog/storage politikası eklenmedi. Advisor: ERROR0/WARN0/INFO51; INFO'lar mevcut server-only, kapalı varsayılan modelidir.
- Sunucu `SUPABASE_URL` ve sensitive `SUPABASE_SERVICE_ROLE_KEY` üretim değişkenleri yapılandırıldı. Değerler dosyaya/sohbete/kanıta yazılmadı; istemci değişkeni eklenmedi. Son dağıtımda raw stdin ile satır sonu olmadan yapılandırıldı.
- Gerçek Supabase Storage üzerinde sentetik geçici 1200×630 kapak: uygulamanın `prepareBlogImage` ve `storeBlogImage` koduyla yükleme, anonim public GET ve birebir byte/SHA256 okuma PASS; anonim INSERT reddi PASS. Yalnız bu testin rastgele yolları temizlendi ve public GET'in artık erişemediği doğrulandı. Bu, üretim admin route'una giriş yaparak yapılmış bir upload testi değildir.
- Gerçek alan adı HTTP8 PASS: health/blog liste/tekil/HTML/sitemap200, yönetici seçenekleri ve upload401, eksik içerik404; tek canonical, sitemap23, published1, özel editoryal alanlar yok. Gerçek anonim Chrome390: makale, üyelik açık kayıt bağlantısı ve topluluklar3 akış; taşma0/pageerror0, WhatsApp daveti10 PASS. Gerçek kayıt gönderimi, ödeme, mail veya WhatsApp katılımı yok.
- Kanıtlar `E4N-SEO-CMS-2026-10-17/release/` içindedir. Mevcut makale metni/kapak/yazarı değiştirilmedi. Canlı public gelecek etkinlik0; gerçek etkinlik/konum/program uydurulmadı.
- Açık kabul: Chrome'daki Kaan hesabı üye görünümünde; yönetici oturumu ile editör/kapak upload son kabulü bekliyor. Ayrıca izinli gerçek kapak, ilk yazının editoryal alanları ve uzman onayı, BRAND-01 uzlaşması ve gerçek etkinlikle CRO katılım testi açık. **E4N-292 In Progress.**

## Teslim

- ARC-01 belgesindeki 18 küme editöre bağlandı. Kurumsal Event4Network yazarı veya mevcut yönetici yazarı seçilebilir; üye kimliğine yazarlık atama ve sahte uzman kaydı yok.
- İçerik briefi/kaynak kontrolü, ana rehber (pillar), en fazla altı ilgili yazı ve görsel kullanım izni kaydı eklendi. Bağlantı hedefi yayımlanmış olmalı; kendine bağlantı, tekrar, taslak ve eksik hedef reddedilir. Hedef sonradan arşivlenirse kamu API/HTML/React bağlantıyı gizler.
- Yayın kapısı içerik, açıklama, küme, brief ve yönetici inceleme onayı ister. İnceleyen kimlik ve tarih sunucuda kaydedilir; istemciden taklit edilemez. Editör değişikliği mevcut onay kutusunu sıfırlar. Bu, yöneticinin inceleme beyanıdır; bağımsız uzman değerlendirmesi yapıldığı iddiası değildir.
- Mevcut revision/çakışma, arşiv ve yayımlanmış slug koruması devam eder. PostgreSQL numeric sitemap önceliğinin editöre sayı olarak dönmesi düzeltildi; tam editör kaydı doğrulandı. Planlandı durumu manuel yayın bekler; otomatik zamanlanmış yayın eklenmedi.
- Tarayıcıdaki doğrudan Supabase upload kaldırıldı. JWT + güncel DB ADMIN kontrolünden sonra 4 MB/tek dosya sınırı, gerçek PNG/JPEG/WebP çözümleme, 24 MP sınırı, hareketsiz görsel, en az 600×315 px ve en çok 1600 px WebP dönüşümü uygulanır. Metadata taşınmaz. Sunucu yalnız rastgele `covers/<uuid>.webp` oluşturur; üzerine yazma yok. Alt metin ve izin/kaynak notu gereklidir.
- Özel brief, kullanım izni ve inceleyen kimliği kamu API'sine çıkmaz. Ana rehber/ilgili yazılar hem ilk HTTP HTML'de hem React görünümünde gerçek bağlantıdır. Kamu sorguları migration öncesi şemada da çalışır.
- Kaydetme sonucu/hatası sayfa içi erişilebilir bildirimdir. Form etiketleri bağlandı; kayıt/yayın kontrollerinin dokunma alanları büyütüldü. 768 px'te yönetici üst menüsünün taşma kaynağı bulundu; kompakt menü eşiği 1024 px'e alındı.

## Doğrulama ve kanıt

- İzole gerçek PostgreSQL 15: **38 HTTP isteği PASS**. Rol/silinmiş kullanıcı, taslak gizliliği, revision, yayın onayı, yazar, bağlantı, HTML, özel alan, dosya türü/boyut/piksel ve depolama hata sınırları: [api-contract.json](E4N-SEO-CMS-2026-10-17/api-contract.json).
- Son üretim build'i üzerinden gerçek Playwright: **6 akış PASS**, pageerror 0. CMS API/veritabanı gerçektir; oturum kabuğu fixture yanıtıdır. Dış ağ çağrıları engellendi; görsel testi sentetik yerel dosya ve kontrollü storage adaptörü kullanır. Gerçek Supabase Storage upload kabulü değildir.
- Son build/type ve 244 rota sahipliği, 26 statik SEO sayfası ve 10 dinamik sözleşme senaryosu PASS. 320/390/768/1440 px: editörün dört sekmesi ve makale için **20 ölçümde taşma 0, pageerror 0**. Kompakt menü aç/kapa ve üç temel kontrolün en az 44 px yüksekliği doğrulandı. Son viewport sonucu ve build/lint kayıtları aynı kanıt klasöründe tutulur. İlk ölçümde 768 px yönetici menüsü 865 px'e taşıyordu; ilk ölçüm `viewports-before.json` içinde saklıdır.
- Son build sonrasında yalnız menünün önceden kullanılmayan importları temizlendi; ardından type/244 rota ve hedefli lint yeniden geçti. Hedefli lintte hata yok; BlogPostPage'deki önceden var olan `requestSequence` cleanup hook uyarısı ayrı kaydedildi. Genel repo lint veya bütün web sürüm kabulü çalıştırılmış sayılmaz.
- Test çalıştırma: kökte `npm run build`, `npm run seo:check`, `npm run seo:content`, `node server/test/blog-cms-contract.mjs`. `--browser-fixture` seçeneği yalnız loopback PostgreSQL ve üretim preview'si açar; fixture bilgisi git dışı output klasöründedir. `/__fixture/stop` fixture anahtarıyla kapatılır; test veritabanı durdurulur. Tarayıcı senaryoları aynı kanıt klasöründe saklanır.

## Canlı geçiş ve kalan kabul

1. Eklemeli migration: `server/supabase/migrations/20261017075027_blog_editorial_workflow.sql`. Önce migration, sonra uygulama yayını gerekir. Bu, mevcut 28 sürümlü genel rehearsal runner'ından ayrı CMS yayın migration'ıdır; tarihsel migration checksum'ları değiştirilmedi. Mevcut veri, RLS, grant ve storage politikası değiştirilmez. Migration önce izole PostgreSQL'de doğrulandı, ardından yukarıdaki canlı geçişte uygulandı.
2. Sunucuda `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` gerekir. Anahtar istemci/VITE değişkenine konmaz. Mevcut public `blog-images` bucket'ının sunucu üzerinden provider erişimi canlıda doğrulandı; anonim upload izni açılmaz.
3. Uygulama yayını ve Linux native Sharp modülünün API startup kabulü geçti. Yönetici oturumundan izinli gerçek kapak kabulü henüz yapılmadı. Geri dönüşte eski uygulama sürümü yayımlanabilir; ek kolonlar silinmez, yazılar korunur. Yüklenip yazıya bağlanmayan kapaklar otomatik silinmez; kontrollü temizlik ayrı değerlendirilir.
4. Mevcut yayımlanmış makalenin metni/kapak/yazarı bu turda değiştirilmedi. İlk gerçek yazıda yeni editoryal alanların doldurulması ve gerçek uzman onayı yayın kabulünde yapılır.
5. CRO-01 gerçek gelecek etkinlikle katılım kabulü ve E4N-299/BRAND-01 ürün metni uzlaşması açık. Eski yedi etkinlik noindex kararı korunur; program/mekân uydurulmaz. Gerçek indekslenme/Rich Results/CWV bu turda ölçülmedi.

**E4N-292 In Progress kalır.** Yeni küçük issue açılmaz; teknik paket üretime çıktı; yönetici kabulü ve yukarıdaki ürün/CRO kapsamı tamamlanmadan bütün teslim Done sayılmaz. Başka aktif hardening dosyaları ve mobile değişiklikleri korunmuştur.

Kaynaklar: [Sharp constructor ve giriş sınırları](https://sharp.pixelplumbing.com/api-constructor/), [Supabase standard uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads). Sharp 0.35.5 sabitlendi (Apache-2.0, Node >=20.9); yalnız sunucu yükleme yolunda kullanılır.
