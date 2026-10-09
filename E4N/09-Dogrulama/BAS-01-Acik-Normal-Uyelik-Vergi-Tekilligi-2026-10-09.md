# BAŞ-01 — Açık normal üyelik ve kalıcı vergi tekilliği

Görev: E4N-161. Ürün commit: `491ec05`, `codex/e4n-sprint1-foundation`; origin'e gönderildi. Bu paket eğitim dışı web başlangıç akışının ilk teslimidir; referans, abonelik doğrulama ve grup görüşme akışı ayrı 162–165 kapsamıdır.

## Uygulanan akış

- Herkese açık `/auth/register`; üst menü Üye Ol. Davetiye veya admin kayıt onayı gerekmez. Eski `/auth/register-community` normal ekrana query korunarak yönlenir.
- Ad/e-posta/telefon/şehir/meslek, şirket ve VKN/TCKN zorunlu. Belge uploadu yok. Kayıt metinleri doğrulanır. Yeni hesap MEMBER ve UNSUBSCRIBED; abonelik, ödeme veya grup kaydı oluşturmaz. Giriş ve normal üye navigasyonu çalışır; hesap durumu oturumun kendi DTO'sunda taşınır.
- Numara string olarak boşluk/tire temizlenerek saklanır; başlangıç sıfırları korunur. Türkiye şirketleri için 10 haneli VKN, şahıs işletmesi için ilk hanesi sıfır olmayan 11 haneli TCKN biçimi kabul edilir. Bu biçim/tekillik kontrolüdür; GİB/Nüfus üzerinden gerçeklik veya belge sahipliği doğrulaması yapılmış sayılmaz.
- DB UNIQUE ve `company_tax_registry` tetikleyicisi ikinci sahibin kayıt/profil/admin/ziyaretçi/direkt SQL yollarını engeller. Numara değişirse önceki rezervasyon da korunur. Hesap silinse de rezervasyon silinmez; kayıt tablosunun UPDATE/DELETE/TRUNCATE işlemleri engellenir. Registry sahibi UUID'dir; cascade FK yoktur. İki özel tablo RLS ve anon/authenticated/PUBLIC yetki kaldırmayla korunur.
- Yeni kayıtların şirket/numarası sonradan boşaltılamaz. Çakışma 409 ve anlamlı hata; şirket/biçim hatası 400. Transaction başarısızsa hesap ve rezervasyon birlikte geri alınır.
- Admin ziyaretçi dönüşümü de şirket/numara ister; başka mevcut hesabın kimliğine bağlanamaz. Başarılı dönüşüm veritabanındaki geçerli JOINED durumunu kullanır. Önceki CONVERTED yazımı şema CHECK'iyle uyumsuzdu. Gerçek mail göndermez, şifresiz eski dönüşüm hesabının mevcut şifre oluşturma akışı korunur.

## Geçiş sınırı

CLI ile oluşturulan migration `20261009083750_open_normal_registration.sql`, sürüm `0026_open_normal_registration`.

Migration eski COMMUNITY_MEMBER rollerini MEMBER'e geçirir ve önceki rolü özel snapshot tablosuna kaydeder. Diğer görev rolleri, hesap durumu, ödeme ve grup verileri korunur. Belgelerdeki eski rol izinleri normal MEMBER iznine dönüştürülür. Kimliği eksik eski hesaba numara/şirket/abonelik uydurulmaz; `company_registration=false` uyumluluğu korunur.

Önce SELECT-only envanter: `server/scripts/company-registration-preflight.mjs`. Hedef yalnız açıkça verilen `E4N_PREFLIGHT_DATABASE_URL` değişkeninden alınır; .env taramaz. Read-only repeatable-read transaction, sınırlı sorgu süresi. Rapor yalnız hesap UUID'leri ve sayıları içerir, vergi numaralarını yazdırmaz. Eksik şirket/numara ve eski topluluk hesapları ayrı raporlanır; geçersiz/mükerrer numara veya case-insensitive e-posta çakışması migration'ı durdurur. Kimin kalacağı tahmin edilmez, hesap silinmez/birleştirilmez.

Canlı envanter/adoption/deploy yapılmadı. Eksik legacy kimliklerin tamamlama politikası ve mükerrer eski kayıtların sahibi kullanıcı kararıdır. Yeni kayıt kabulü bunu beklemeden izole olarak doğrulandı. Referans bağlantısının kalıcı ilişkiye dönüşümü 162'dir; bu teslim referansın kaydedildiğini iddia etmez.

## Kanıt

- İzole PG17, 26 şema; 26 öncesi kimlik/rol snapshotından normalizasyon/rol geçişi ve migration replay; duplicate preflight atomik ret; private RLS/ACL.
- Gerçek Express API: 8 eşzamanlı kayıt → 1 hesap/7 çakışma; VKN/TCKN; required/consent/role/protected-field hataları; büyük-küçük harf e-posta; profil/admin/visitor duplicate; rollback; silinmiş hesaptan kalan rezervasyon ve registry immutability. Yeni abonesiz hesabın group join403 ve sıfır başvuru kaydı.
- İlgili self-profile, admin-member-directory, documents, group-capacity/roster, membership-history/actor, backup/restore contractları PASS. Restore 49 tablo/ACL/RLS/veri hash'i ve repeat0 karşılaştırır. Geniş isolated-smoke PASS: 48 uygulama tablosu + schema ledger; eski null consent/veriler, kontrollü init adoption ve mevcut API sınırları korunur. Güncellenen şema beklentileri ayrıca bu geçişi kapsar; bütün ayrı 39 kontratın yeniden çalıştığı iddia edilmez.
- Supabase security advisors: yalnız owned loopback PG17 üzerinde error seviyesi, exit0 ve `No issues found`. Kapsamlı Sprint6 denetiminin yerine geçmez.
- Ürün commit'indeki production build ve route ownership PASS. İlk API/tarayıcı kabulü 3/3 PASS. Commit sonrası tekrarın sonuçları aşağıda tamamlanır; doğrulanmadan Done yapılmaz.

Tekrar komutu: `node server/test/normal-registration-contract.mjs <kurulu-playwright-cli.js>`; disposable PostgreSQL ve full web fixture açılır, gerçek web→API→DB kontrolü ve owned cleanup yapılır. Başarılı loglar output altında tutulur; normal-registration-browser artifact'ında form ekran görüntüsü ve JSON raporu vardır. Üretim yazımı, gerçek e-posta ve ödeme yoktur.

## Son kabul

Ürün491ec05 + kabul sürücüsü5c9deaa origin'e pushlandı. Güncel test içeriğinde API/veri kabulü, yeni hesabın join403 kapısı, browser3/3 ve final DB PASS; owned fixture exit0 ile kapandı. Log: output/normal-registration-final-acceptance.log. Tarayıcı artifact: output/normal-registration-browser-1791545220331/report.json ve normal-registration-form.png. Build: output/normal-registration-clean-build-491ec05.log, PASS. Geniş API denetimi: output/registration-isolated-smoke-final.log, exit0.

İlk temiz tekrarların yerel HTTP keepalive/kullanılmayan race yanıtları ve soğuk Vite/browser hazır olma süreleriyle ilgili başarısız sonuçları korunur. Kabul sürücüsü tüm race yanıtlarını tüketir, owned API denemelerinde bağlantıyı kapatır, ekrandaki öğelerin hazır olmasını bekler; ürün hatasını retry ile gizlemez. Son tekrar başarılıdır. Migration/advisors ve altı ilgili contract kanıtı aynı ürün içeriğini kapsar.

E4N-161 ürün teslimi tamamlandı; parent160 başlangıç akışının tamamı değildir. Sıradaki162 referans ilişkisidir; yöntem sorusu kullanıcıya gönderildi.163 aktif ödeme kanıtını legacy ACTIVE alanından ayıracak;164 keşif/analiz;165 başkan görev/mail/karar paketi. Mobil/LMS ertelenmiştir. Canlı veritabanı adoption, gerçek sağlayıcılar ve nihai sürüm kabulü yapılmış sayılmaz.
