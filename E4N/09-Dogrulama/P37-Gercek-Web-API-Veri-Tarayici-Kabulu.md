# P37 — Gerçek web → API → veri tarayıcı kabulü

5 Ekim 2026. Commit/push [7687799](https://github.com/kaankarakas34/e4n/commit/7687799d4eb417c56506638002d63292761b08cb). P37/E4N-109 In Progress; sürüm kabulü açık.

## Bütün paket

Bu kez bağımsız HTML/component mockları yerine uygulamanın gerçek App/router/ekranları çalıştırıldı. İzole PostgreSQL 17'de 15 migration, gerçek Express ve gerçek Vite uygulaması; admin/üye/başkan/başvuru hesabı, 35 üye + başkanlı grup, boş grup, 2 katılımcılı etkinlik ve kabul edilmiş bağlantı oluşturuldu. Tarayıcı `localhost:4005` API çağrılarını gerçek loopback Express'e yönlendirdi; JSON yanıtları mock edilmedi. Diğer ağ hedefleri engellendi. Sahte SMTP, sentetik Supabase ayarları ve env yüklemeyen Vite kullanıldı; üretim verisi/ödeme/mail/deploy yok.

## Sonuç ve matrisi

Son taze fixture'da **21 PASS / 0 FAIL**:

- Gerçek admin ve üye girişleri; gerçek JWT/auth-store yenileme.
- Admin dashboard, rapor, üye hesap dizini, ziyaretçi kuyruğu, muhasebe ve grup kataloğu.
- Etkinlik kartında **2 / 50 katılımcı**, gerçek katılımcı modalında aynı iki kişi. Kullanıcının sıfır sayım örneği izole gerçek akışta yeniden doğrulandı; canlı kayıt sorgulanmadı.
- 35 üye + 1 başkanlı grupta gerçek kabul API'si 409; başvuru REQUESTED kalıyor; dört grup sekmesi açılıyor.
- Admin PDF yüklemesi, üye listesinde görünürlük ve gerçek indirme; veritabanında aynı 40 bayt korunuyor.
- Üye raporu, grupları, aktivite merkezi, seçilen günde veriden gelen etkinlik takvimi ve Kayıtlısınız/katılacağım etkinlik filtresi.
- Üyeden kabul edilmiş bağlantısı olan başkana mesaj gönderimi; tek mesaj doğru sender/receiver ile veritabanında.
- Üye oturumuna geçince admin kataloğu görünmüyor.
- Son veri kontrolü: 36 ACTIVE grup kaydı (35 üye + başkan), başvuru REQUESTED, 2 yoklama kaydı, 1 PDF/aynı bayt, 1 doğru mesaj; gerçek e-posta sayısı 0.

## Kanıtlar ve teknik sınır

Yönetilen checkout `C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2`:

- `output/web-browser/2026-10-05T18-27-57-502Z/browser-report.json`, CLI log ve 20 ekran görüntüsü. Sonuç 18:30:01 UTC'de kaydedildi.
- İlk giriş denemesi eski iki heading locator'ı ve CLI native-confirm davranışı nedeniyle eksik kaldı; log/screenshot korundu, tamamlanmış test sayılmadı.
- Ara prova `2026-10-05T18-25-21-350Z` 20 PASS; son taze fixture seçilen gün/veri ve PDF bayt kontrolünü ekledi.
- Kaynak: `server/test/web-browser-fixture.mjs`, `web-browser-acceptance.js`, `run-web-browser-acceptance.mjs`; `server/docs/web-acceptance.md` kullanım ve sınırlar.

Native confirm/alert fixture'da deterministik; native diyalog UX kabulü değildir. Sayfa kontrolleri pageerror ve beklenmeyen 5xx'i reddediyor. Rapor base HEAD b8058d4; test edilen helper eklemelerinin final commiti 7687799. Runtime/SQLmigration/ürün politikası değişmedi; build yeniden çalıştırılmadı. Syntax/diff check PASS; başlatılan tarayıcılar, Vite, Express ve Docker fixture'ları kapandı. HEAD/origin eşit, tracked temiz; output ve CLI temp scratch korunuyor.

## Gerçek kalan bulgu — sonraki bütün profil/panel paketi

Gerçek üye gezinmesinde `/api/users/:id` mevcut detay SQL'i `one_to_ones.receiver_id` alanını kullanıyor, ancak sürümlü şemada alan `partner_id`. Yakalanan SQL hatası basic-profile fallback'ine dönüyor. HTTP 200 ve ekran render'ı, profile metric_one_to_ones/last_meetings sözleşmesinin doğru olduğu anlamına gelmiyor. P30/P40'a kanıt eklendi; üyelik/puan politikası seçmeden mevcut profil/dashboard veri sözleşmesi ayrı bütün paket olarak doğrulanmalı.

Aktivite ekranındaki eski TasksCard demo görev/puan vaatleri ve eğitim satırı bu kabulde yeni hedef kural olarak onaylanmadı; D01 ve eğitim dışı kapsamla panel temizliği ayrıca değerlendirilir. Mevcut puanları yeni ürün kuralı sayma.

Yeni typed rapor/takvim kontratları belirtilen senaryolarda geçti; profil fallback ve untested akışlar hâlâ açık. D01–D10 kalanları, exact shuffle/grace/hak/reopen, canlı şema/veri provası, tam shuffle/history, rol/DB invariant ve geniş güvenlik/sürüm kabulü tamamlanmadı. **releaseReady=false; 21/21 PASS web %100 değildir.** Mobil/LMS başlamadı; en son.

Önceki 26 kontrat raporu [[P37-Web-Butun-Kabul-Paketi]] içinde; iki ayrı kabul paketi birbirinin yerine geçmez. Sonraki uygun büyük iş P30 mevcut profil/dashboard verisi + P40 kalan çağrı sözleşmesi veya P10/P17 model/invariant; kesin hak/puan/başvuru ürün kuralları uydurulmaz.
