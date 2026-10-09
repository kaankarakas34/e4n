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


## 9 Ekim düzeltmesi — mevcut şirket formunun dört zorunlu alanı

Kullanıcının netleştirdiği kayıt koşulu: şirket adı, VKN/TCKN, vergi dairesi ve şirket/fatura adresi birlikte zorunlu. Vergi dairesi/adresin önceki isteğe bağlı davranışı kaldırıldı. Yeni küçük görev açılmadı; E4N-161 kabulü bu koşulla yeniden doğrulandı.

- Web formunda required ve uzunluk sınırları; API'de eksik/boş/yalnız boşluk/null/sayı/uzunluk ve çelişen snake-camel alanların reddi. Kaydedilen değerler trim edilir.
- Ziyaretçiden üye oluşturma ekranı/API'si de dört bilgiyi ister ve saklar. Profil/admin güncellemesi kayıtlı zorunlu bilgileri boşaltamaz; DB constraint hatası anlaşılır 400 yanıtına çevrilir.
- CLI ile üretilen yeni migration `20261009115143_required_company_billing.sql`, sürüm27. Önceki26 migration/checksum değiştirilmedi. `users_company_billing_check` NOT VALID: yeni kayıt/güncellemelerde uygulanır; mevcut eksik hesapları silmez veya bilgilerini uydurmaz. Önceki26 sırasında eksik açılmış company_registration=true hesabın sonraki güncellemesi eksik alanlarını da tamamlamalıdır. Eski false kayıtlarının uyumluluğu korunur. Eksik eski kayıtlar tamamlanmadan constraint VALIDATE edilmez; UUID-only preflight v2 vergi dairesi/adres eksiklerini de raporlar.
- İzole PostgreSQL17/27schema gerçek API + tarayıcı3/3 + son DB kontrolü PASS. Dört alanın saklanması, eksik alanlarla kayıt reddi, profil/admin/directSQL boşaltma reddi, ziyaretçi dönüşümü, 8-way vergi tekilliği, silinen hesaptan kalan rezervasyon, legacy migration/replay ve yeni DB constraint doğrulandı.
- Self-profile contract PASS: fresh27/repeat0/22upgrade (23–27) ve legacy bilgiler korunuyor. Supabase error-level security advisors yalnız owned loopback veritabanında exit0/No issues found. Bu sonuç kapsamlı Sprint6 güvenlik kabulü değildir.
- Üretimde migration, dağıtım, gerçek mail veya ödeme yapılmadı. Önceki geniş kabul kanıtları tarihsel; burada bütün39API/102browser testlerinin yeniden çalıştığı iddia edilmiyor.

- Düzeltmenin production build'i PASS. İlgili React form erişilebilirliği/required alanları tarayıcıda doğrulandı; ziyaretçi dönüşümünde boş/cancel işlem oluşturmaz. Test harness'lerinin fresh/upgrade/repeat beklentileri sürüm27'ye taşındı.

## Login kayıt alanı düzeltmesi
- Kullanıcı isteğiyle giriş ekranındaki eski topluluk üyeliği başlığı/açıklaması kaldırıldı. Normal üyelik bilgilerini açıklayan Üye Ol bağlantısı doğrudan /auth/register rotasına gider; gerçek Link, klavye odağı ve mevcut görsel düzen kullanılır. Eski link için geriye uyumluluk yönlendirmesi korunur. Bu aynı E4N-161 kayıt akışının düzeltmesidir, ayrı küçük görev değildir.
- Doğrulama: tsc -b PASS; login içinde eski topluluk/register-community metni yok, doğrudan normal register Link hedefi ve App rotası kontrol edildi. Bu görsel/metin değişikliği için API/DB veya bütün browser kabulü yeniden çalıştırılmadı.

## Login production yayını — kullanıcı onayıyla 9 Ekim
- Canlı eski main7ead169 üzerine yalnız Login.tsx düzeltmesi uygulandı; production commit c5d6323, main fast-forward push. Managed checkout e4n-login-production; build PASS.
- Vercel dpl_EQFvR7rHDNRiouU8Jnw69RouE5PK, target production/READY; event4network.com ve www aynı c5d6323 commit'ine bağlı.
- Canlı browser PASS: topluluk üyeliği metni yok, Üye Ol görünür, href /auth/register, tıklayınca normal kayıt rotası açılıyor. Form gönderimi/ödeme/mail yapılmadı.
- SELECT-only canlı şema kontrolü: schema_migrations ve company_tax_registry yok, company_registration alanı ve required billing constraint yok. Bu nedenle bütün foundation dalı production'a taşınmadı. Yeni açık normal üyelik API'si ve dört zorunlu alan/tekillik henüz canlı değildir; kontrollü canlı DB geçişi ve üyelik sürümü ayrıca gerekiyor. Production mevcut kayıt backend'ini kullanır.

## Son güncelleme — canlı kabul tamamlandı
9 Ekim production 2fefd8a/main, dpl_7NZF4USEqSCdsToRdfeYPQQdFSfN READY; www.event4network.com login Üye Ol→normal kayıt formu gerçek browser PASS. Migration26/27 artık canlı: 28 hesap korunuyor, 11 COMMUNITY_MEMBER→MEMBER, 3 kalıcı vergi rezervasyonu; users RLS ve anon SELECT kapalı. Dört şirket alanı görünür, DB health200, eksik kayıt400. 40 API/veri ve 108 browser kabulünün kaynak kapsamı, gerçek yedek/restore ve rollback sınırları [[E4N/09-Dogrulama/Canli-Yayin-Gecisi-2026-10-09]] notundadır. Yukarıdaki source-only/canlı migration yok satırları tarihsel durumu anlatır. Gerçek canlı kullanıcı/ödeme/mail testi yapılmadı. E4N-161 mevcut Done teslimine canlı kanıt eklendi; 162–165 bu yayınla kapanmadı.
