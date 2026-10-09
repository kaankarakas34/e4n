# E4N devam durumu — 10 Ekim 2026

## Güncel — Canlı Yayın Başarıyla Tamamlandı (10 Ekim 2026)

- Kullanıcının doğrudan talimatı üzerine (`codex/e4n-sprint1-foundation` dalındaki tüm commitler: P21, P22, P23, P24 ve BAŞ-02 / `1558969`) `main` dalına fast-forward merge edilerek pushlandı (`origin/main`).
- Vercel production build otomatik tamamlandı ve canlıya alındı.
- Canlı ortam entegrasyon ve doğrulama denetimi (`test_live_production.js`): **13/13 PASS**.
  - `https://www.event4network.com/api/health-check`: HTTP 200, `dbAttempt: "success"`, DB aktif.
  - `https://www.event4network.com/api/auth/referral-preview`: HTTP 200 (yeni API devrede).
  - Güvenlik ve yetki bariyerleri: `/api/user/membership-referral` (401), `/api/admin/members` (401), `/api/groups` (401) anonim engelleri devrede.
  - Kayıt API bariyeri: Boş POST `/api/auth/register` (400) geçerli doğrulama hatası dönüyor.
  - Canlı web sayfaları: Ana sayfa (200), `/auth/register` (200), `/auth/login` (200), `event4network.com` yönlendirmesi (307) ve `robots.txt` (200) aktif.
- Sıfır DDL kuralı korundu; canlı DB'de 28 sürüm ve 50 tablo invariyantı sağlam.

## Güncel teslim — BAŞ-02 / E4N-162 tamamlandı

- **E4N-162 (BAŞ-02) Done:** Davetiye zorunluluğu kalkarken üyelik referans ilişkisi, kalıcı takip ve web görünümü kuruldu.
  - Referanssız normal kayıt özgürlüğü korundu; davetiye kapısı kaldırıldı, referans alanı tamamen opsiyoneldir.
  - Referanslı kayıtta URL parametresi (`?ref=...`), davet linki (`token` içindeki `inviter_id`) veya girilen kod kalıcı olarak çözümlenir (`resolveReferrer`) ve transaction içinde `system_settings` (`membership_referral:${userId}`) üzerinde atomik kaydedilir (`recordMembershipReferral`).
  - Public doğrulama API'si: `GET /api/auth/referral-preview` ile kayıt öncesinde sponsorun ad ve şirket bilgisi teyit edilir.
  - Güvenlik sınırları: Kendi kendine referans (self-referral) ve geçersiz/sahte UUID'ler 400 ile engellendi. Referrer veya sıradan üyeler başkasının referansını izinsiz değiştiremez (403). Üyelik referansına ücret, ödül veya puan mekanizması eklenmedi.
  - Yetkili admin görünümü: `GET /api/admin/members` listesinde `referred_by` ve `referrals_count` eklendi; `GET /api/admin/members/:id/referrals` ve `POST /api/admin/members/:id/set-referrer` ile gerekçeli sponsor düzeltmesi ve snapshot audit geçmişi (`history`) kuruldu.
  - Doğrulanabilir legacy ilişki: `visitors` tablosunda `status = 'JOINED'` olan eski kayıtlar otomatik olarak `source: 'VISITOR_CONVERSION'` olarak haritalandı. Bilinmeyen referanslar tahmin edilmez.
  - Web ekranları: `Register.tsx` (canlı sponsor kartı ve opsiyonel referans alanı) ve `AdminMembers.tsx` (üyelik referans sütunu ve yönetim/düzeltme modalı) entegre edildi.
  - Testler: `server/test/membership-referral-contract.mjs` (11/11 senaryo), `server/test/route-ownership-contract.mjs` (199 rota, 31 sağlayıcı), `server/test/second-removal-ban-contract.mjs`, `server/test/low-score-removal-contract.mjs`, `server/test/monthly-score-finalization-contract.mjs`, `server/test/score-ledger-contract.mjs`, `node server/test/isolated-smoke.mjs` (50 tablo, 28 sürüm korundu, 0 DDL), `npm run check` ve `npm run build` PASS. Kanıt [[E4N/09-Dogrulama/BAS-02-Uyelik-Referansi-ve-Web-Gorunumu-2026-10-10]].

## Güncel teslim — P24 / E4N-96 tamamlandı

- **E4N-96 (P24) Done:** İkinci kez gruptan çıkarılan üyeler için 8 aylık (2 dönem / 240 gün) kapalı grup başvuru yasağı (`403 REMOVAL_BAN_ACTIVE` - R11, D03, D04) kuruldu.
  - İlk çıkarılmada yeniden başvuru koşulu beklemesizdir (D02); 2. çıkarılmada 240 günlük yasak devreye girer.
  - `POST /api/groups/:id/join` kapısında `daysLeft`, `bannedUntil` ve `removalCount` ile 403 engeli sağlandı.
  - `GET /api/group-discovery` uç noktasında istemci ve web için `removal_ban` nesnesi sunuldu.
  - Kapsam güvencesi: Yasak yalnızca kapalı grupları kısıtlar; lonca (Power Team) katılımı (`POST /api/power-teams/:id/join`) ve dış etkinlik/bilet hakları (`users.account_status = 'ACTIVE'`) açık kalır.
  - 240 gün (8 ay) tamamlandığında yasak otomatik olarak kalkar ve başvuru yeniden açılır.
  - Testler: `server/test/second-removal-ban-contract.mjs`, `server/test/group-application-workflow-contract.mjs`, `server/test/low-score-removal-contract.mjs`, `server/test/monthly-score-finalization-contract.mjs`, `server/test/score-ledger-contract.mjs`, `server/test/route-ownership-contract.mjs` (195 rota, 30 sağlayıcı), `npm run check`, `npm run build` ve `node server/test/isolated-smoke.mjs` (50 tablo, 28 sürüm korundu) PASS. Kanıt [[E4N/09-Dogrulama/P24-Ikinci-Cikarilmada-Sekiz-Ay-Yasagi-2026-10-10]].

## Güncel teslim — P23 / E4N-95 tamamlandı

- **E4N-95 (P23) Done:** Puana bağlı otomatik / incelemeli gruptan çıkarma motoru kuruldu.
  - Kesinleşmiş dönem şartı: Yalnızca kesinleştirilmiş dönem puanları (`period_finalized:${periodKey}`) üzerinden değerlendirme yapılır; kesinleşmemiş dönem istekleri `400 PERIOD_NOT_FINALIZED` ile reddedilir.
  - API'ler: `GET /api/reports/low-score-evaluations` (yönetici önizlemesi; başkan muafiyeti `EXEMPT_PRESIDENT`, aktiflik kontrolü ve aday listesi) ve `POST /api/reports/apply-low-score-removals` (atomik çıkarma yürütmesi; `exemptUserIds` muafiyeti, `LOW_SCORE` gerekçesi ve notu).
  - Güvenceler: R12 gereği kullanıcının genel E4N hesap statüsü (`users.account_status = 'ACTIVE'`) ve dış hakları korunur. `group_membership_history` trigger'ı ve `notifications` tablosuna `LOW_SCORE` / `MEMBER_REMOVAL` olarak işlenir.
  - Tekrar güvenliği: `low_score_removals:${periodKey}` kaydı ile aynı dönemde mükerrer çalıştırmada sıfır yeni çıkarma ve sıfır mükerrer bildirim/geçmiş kaydı üretilir.
  - Testler: `server/test/low-score-removal-contract.mjs`, `server/test/monthly-score-finalization-contract.mjs`, `server/test/score-ledger-contract.mjs`, `server/test/route-ownership-contract.mjs` (195 rota, 30 sağlayıcı), `npm run check`, `npm run build` ve `node server/test/isolated-smoke.mjs` (50 tablo, 28 sürüm korundu) PASS. Kanıt [[E4N/09-Dogrulama/P23-Puana-Bagli-Otomatik-Cikarma-2026-10-09]].

## Güncel teslim — P22 / E4N-94 tamamlandı

- **E4N-94 (P22) Done:** Ay sonlarında puanların dondurulması motoru (`finalizePeriod` -> `system_settings` üzerinde `period_finalized:${periodKey}` kaydı, idempotent replay), gerekçeli idari puan düzeltmesi (`applyScoreAdjustment` -> `score_adjustments`, canlı skor ve `sourceKind: ADJUSTMENT` defter entegrasyonu), aylık puanlar/liderlik tablosu (`GET /api/reports/monthly-scores`) ve son 6 aylık UTC-safe üye karnesi (`GET /api/reports/scorecard/:userId`) tamamlandı.
- Testler: `server/test/monthly-score-finalization-contract.mjs`, `server/test/score-ledger-contract.mjs`, `server/test/route-ownership-contract.mjs` (193 rota, 30 sağlayıcı), `npm run check`, `npm run build` ve `node server/test/isolated-smoke.mjs` (50 tablo, 28 sürüm korundu) PASS. Kanıt [[E4N/09-Dogrulama/P22-Aylik-Puan-Kesinlestirme-ve-Tablo-2026-10-09]].

## Güncel teslim — P21 / E4N-93 tamamlandı

- **E4N-93 (P21) Done:** Aylık puan olay defteri (`score-ledger`) ve tekrar güvenliği (`idempotency_key`) kuruldu.
  - Kaynak faaliyetler: Katılım (`PRESENT`: +10, `ABSENT`: -10, `LATE`: +5, `SUBSTITUTE`: +10; `REGISTERED` kesinlikle 0 puan), iç referans (+10), dış referans (+5), başarılı ciro bonusu (+5), ziyaretçi (+10), birebir görüşme (+10).
  - Tekrar anahtarı: `${source_kind}:${source_id}` ile tekilleştirme. `POST /api/visitors` opsiyonel `id` desteğiyle idempotent hale getirildi (`ON CONFLICT (id) DO NOTHING`), mükerrer çağrılarda 200 dönüp skoru artırmaz; eski `id`siz çağrılarda 201 dönerek baseline'ı korur.
  - API'ler: `GET /api/reports/score-ledger` (dönem/kaynak dökümü, üye/admin yetkisi) ve `GET /api/reports/score-reconciliation` (canlı skor ile defter karşılaştırması; uydurma geçmiş kayıt yok, drift/unreconciledLegacyScore raporu).
  - Şema sürümü 28, tablo sayısı 50 olarak sabit kaldı. `traffic-lights` kontratı korundu.
  - Testler: `server/test/score-ledger-contract.mjs`, `server/test/isolated-smoke.mjs`, `server/test/referral-contract.mjs`, `server/test/personal-reports-contract.mjs`, `server/test/admin-reports-contract.mjs`, `server/test/group-application-workflow-contract.mjs`, `server/test/membership-history-contract.mjs`, `npm run test:routes`, `npm run check` ve `npm run build` PASS. Kanıt [[E4N/09-Dogrulama/P21-Aylik-Puan-Olay-Defteri-2026-10-09]].

## Güncel teslim — P19 / E4N-91 tamamlandı

- **E4N-91 (P19) Done:** Gruptan çıkarılma gerekçeleri (`LOW_SCORE`, `ATTENDANCE`, `VOLUNTARY`, `ADMIN_DISCIPLINARY`) ve açıklama notu, ilk çıkarılmada beklemesiz başvuru (D02), 2. çıkarılmada 1 dönem (4 ay / 120 gün) grup başvuru yasağı (`403 REMOVAL_BAN_ACTIVE` - D03/D04/R11), başkan başvuru kuyruğunda önceki çıkarılma geçmişinin (`removal_history`) gösterimi ve geçmiş ekranı çıkarılma kartı rozetleri tamamlandı.
- Testler: `server/test/group-application-workflow-contract.mjs`, `server/test/membership-history-contract.mjs`, `npm run check`, `npm run build` ve `node server/test/isolated-smoke.mjs` PASS. Commit `5bd8da4` `codex/e4n-sprint1-foundation` dalına pushlandı. Kanıt [[E4N/09-Dogrulama/P19-Gecmis-Nedeni-ve-Cikarilma-Baglari-2026-10-09]].

## Güncel teslim — BAŞ-03 / E4N-163 ve BAŞ-05 / E4N-165 tamamlandı

- **E4N-163 (BAŞ-03) Done:** D07 5 günlük gecikme hatırlatma akışı ve 5. gün sonu hesap kısıtlaması (`RESTRICTED`), kısıtlanan haklar / borç ödeme istisnası ve borç kapandıktan sonra `account_status = 'ACTIVE'` olarak otomatik yeniden açılma tamamlandı. `server/test/payment-flow.mjs` ve `server/test/subscription-reminder-contract.mjs` PASS. Kanıt [[E4N/09-Dogrulama/Abonelik-Uctan-Uca-Denetim-2026-10-09]].
- **E4N-165 (BAŞ-05) Done:** Zenginleştirilmiş başvuru mail şablonu, `deliverPendingApplicationMails` outbox batch retry worker, 7 günlük başkan SLA aşım takibi (`sla_breached`, `days_waiting`) ve eşzamanlı çoklu grup başvurusu engeli (`409 CONCURRENT_APPLICATION_DENIED`) tamamlandı. `server/test/group-application-workflow-contract.mjs`, `npm run check` ve `npm run build` PASS. Kanıt [[E4N/09-Dogrulama/BAS-03-04-05-Grup-Basvuru-Akisi-2026-10-09]].

## Güncel — P37 başlangıç dahil web kabul paketi

- E4N-109 In Progress / releaseReady=false. Tek runnera normal kayıt, site/abonelik ve başkan görüşme/karar browserları, son DB raporları ve shared fiyat kaynak özeti eklendi. Test/prova/kanıt değişikliği; uygulama/şema/canlı davranış değişmedi.
- 41API/build/89ana browser PASS; eski grup/geçmiş testinin başkan doğrudan onay/aboneliksiz başvuru beklentileri düzeltildi. Odaklı grup7+lonca6+geçmiş6+kayıt3+site/abonelik23+başvuru3 PASS; birleşik137browser. İlk kök başarısız rapor korunur; tek yeni frozen root PASS denmez. [[E4N/09-Dogrulama/P37-Guncel-Baslangic-Dahil-Web-Kabulu-2026-10-09]] ve server/docs/web-current-acceptance-2026-10-09.json.
- Sonraki işte 41API/137browser'ı yeni ürün teslimi gibi tekrar sayma. D07 ve 162/165 ürün kararları, puan/shuffle, üretim scheduler/alarm ve SEC6 kalan; yapılabilir bağlı büyük web paketini ilgili Linear kabulüne göre seç. Mobil/LMS ertelenmiş. Canlı ürün c0194f2; yeni gerçek ödeme/mail/test kaydı yok.

## Güncel teslim — P33 / E4N-105 ve abonelik canlı yayını

- be40450 abonelik düzeltmeleri main/production READY (dpl_4zfBfAXLt7tdRBPbi5UVGjFXBzv2), canlı asset/yeni durum/anon401 doğrulandı. E4N-163 D07 ve sağlayıcı sandbox kalanlarıyla açık.
- P33 / E4N-105 Done: normal hesap → abonelik → grup keşfi/istek → başkan görüşmesi/kararı anlatımı 7 sayfa, menü/footer ve abonelik vaatlerinde birleştirildi. Eski ziyaretçi refId korunur; eğitim girişleri ertelendi. Yeni API/veri kuralı veya migration yok. 23 browser/API/PG/sahte sağlayıcı/finalDB/reload, own-read ve build PASS. Ürün c0194f2 main/foundation push; production dpl_BkC4UaKscRGgbPw5uZ8cyokctQMQ READY. www/event4network alias, yeni index-CrF9EWTe.js/metin/anon401 doğrulandı. Kanıt [[E4N/09-Dogrulama/P33-Normal-Uyelik-Site-Anlatimi-2026-10-09]]. Bu paketi tekrar uygulama.
- E4N-109/111 bütün kalan kapsamlarıyla açık; 162 referans ve 163/165 ürün kararlarını uydurma. Mobil/LMS son aşamada.

## Son teslim — abonelik denetim düzeltmeleri / E4N-163
- 9 Ekim kullanıcı düzeltme istedi: ortak yayımlanmış fiyat kataloğu + sunucu tutar/kod doğrulaması; tarayıcıda keyfi 3.000 TL indirim kaldırıldı. Yenileme kalan dönem üzerine eklenir; kullanıcı kilidi/eşzamanlı ödeme ve UTC ay sonu korunur. SUSPENDED ve diğer kısıtlı hesaplar yeni ödeme başlatamaz; sonradan gelen kısıtlama ödeme sonucuyla kalkmaz. Web kendi kayıt kaynağından aktif/bitmiş/abonesiz/kısıtlı/bilinmeyen gösterir.
- Payment-flow gerçek API/PG/sahte sağlayıcı ve ek fiyat/yenileme/ay sonu/askı regresyonları; modal/API/own-read; build PASS. Yerel browser 3/3/finalDB/reload ve Abonelik aktif PASS. Kanıt [[E4N/09-Dogrulama/Abonelik-Uctan-Uca-Denetim-2026-10-09]], output/subscription-fix-*. Tam web/SEC kabulü değil.
- E4N-163 InProgress: günlük5mail başlangıcı/kısıtlanan haklar D07 açık, soru gönderildi; job/env gerçek mail etkinleştirme ve sağlayıcı sandbox kabulü kalan. Gerçek ödeme/mail/production write/deploy yok. Ücret/paket dönüşümü/grace kuralları uydurulmaz. İlk denetimin 4 kod bulgusu yeni teslimle giderildi; tekrar hata olarak uygulama.

## En son — BAŞ-03/04/05 bütün grup başvuru paketi
- Ürün 0004f8d main/foundation origin'e push. Canlı migration28: 28 kullanıcı korunuyor, 0 aktif grup/başvuru/outbox; RLS/client deny doğrulandı. Production dpl_DmdeFzUGdSoFxZfoaLRT6Lf4imyS READY; canlı www/event4network/e4n alias ve yeni asset+anon401 doğrulandı. E4N-164 Done;163/165 kalan kararlar için In Progress,162 Backlog.
- Abonelik başvuru kapısı, gerçek grup/meslek/35 kapasite keşfi, başkan dashboard görüşme görevi + deep link + bildirim/outbox, görüşme ön şartı, atomik kabul/kalıcı ret tamamlandı. Başkan görev linkli browser3/3/finalDB ACCEPTED/ACTIVE ve build PASS. Geniş41API:40PASS/1timeout; workflow bağımsız iki tekrar PASS, ilk rapor korunur. Bütün web/SEC releaseReady değil.
- Tek kanıt: [[E4N/09-Dogrulama/BAS-03-04-05-Grup-Basvuru-Akisi-2026-10-09]]. Hesap silme FK hatası düzeltildi; ilgili geçmiş/kapasite/ödeme/restore PASS.
- 162 referans yöntemi,163 ücret/grace/shuffle ayrıntıları,165 başkan/çoklu başvuru/ret tekrar istisnaları açık. İlk grup adı ve başkanı kullanıcıdan bekleniyor; uydurma veri veya gerçek mail/ödeme testi yok. Eski90/102/103/92 aynı teslim kanıtını kullanır, daha geniş kalanlarını kapatma. Mobil/LMS ertelenmiş.
- Güncel kullanıcı yetkisi bu paket için canlı geçiş/deploy içerir; aşağıdaki eski “canlı yazma/deploy yok” kayıtları tarihseldir. Yeni bağımsız canlı veri/gerçek mail-ödeme testlerini yetkisiz yapma.

## En son — zorunlu standart il kaydı
- Kayıtta 81 il seçimi + API geçerli il kontrolü/standart `users.city` kaydı. İstanbul/Ankara/İzmir grup ayrımı henüz kapalı; her ilde en az70 kişi ön koşulu. Otomatik etkinleştirme/sayım durumları uydurulmadı; E4N-164 açık. [[E4N/01-Kararlar/Il-Bilgisi-ve-Grup-Ayrimi-2026-10-09]]. Normal registration PG17/API/veri sözleşmesi +3/3 kayıt browser PASS; build PASS. Kanıt output/normal-registration-browser-1791552929583/report.json ve output/province-registration.log. Main/foundation push ile yayınlanır; üretimde gerçek kayıt açılmaz.

## En son — canlı yayın tamamlandı
- Kullanıcı tüm yapılanları canlıya alma yetkisi ve DB parolasını sağladı. main/foundation ürün SHA2fefd8a push; production dpl_7NZF4USEqSCdsToRdfeYPQQdFSfN READY/custom domains www.event4network.com ve event4network.com doğrulandı. Normal üyelik formu ve API canlı; eski source-only/not-live satırları aşağıda tarihseldir.
- Tam PG17 yedeği + gerçek public restore34tablo/581satır; 27 gerçek geçiş/repeat0, drift rollback ve veri koruma PASS. Canlı28kullanıcı,11normalrolgeçişi,3kalıcıvergi rezervasyonu. RLS/client revoke47tablo, anonymous47/47denial ve ownerAPI PASS. Blog2tablo/4functionwarn, parola rotasyonu ve kapsamlıSEC açık; secrets Git'e eklenmedi, eski gömülü helper/config kaldırıldı.
- 40API/veri PASS7bc1ff2; fixture/katalogallowlist düzeltmesi sonrası 03a99de build+108browser/finalDB/cleanup PASS; yalnız2fefd8a izinSQL/manifest farkı gerçekrestore/API/anon gate ile ayrıca doğrulandı. Aynı committe40+108 iddiası yok. Gerçek hesap/ödeme/mail üretim testi yapılmadı. YeniJWT nedeniyle eskioturum tekrar giriş gerektirir.
- P09/E4N-81 Done; P37/E4N-109 InProgress/releaseReady=false. E4N-161 canlı kabul eklendi,162–165 hâlâ kalanbaşlangıçakışı. Mobil/LMS ertelenmiş. Sonraki bağımsız web işi ilgili Linear karar/kabulüne göre seçilir; bu geçişi tekrar yapma. Üretim dağıtımı tamamlandı; sonraki kod işleri için normal izole doğrulama sınırı devam eder.
- Ayrıntı/rollback/kanıt: [[E4N/09-Dogrulama/Canli-Yayin-Gecisi-2026-10-09]]. Yerel gerçek yedek/kişisel satırları Obsidian/Linear/Git'e kopyalama.

## Çalışma
- Checkout: C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2; dal codex/e4n-sprint1-foundation. Son ürün491ec05, kabul5c9deaa; kod/kanıt push sonucunu git ile kontrol et.
- Eğitim dışı web; bağlı veri/API/ekran/test işleri bütün paket. MobilSprint7, kurs/eğitim/sınavSprint8 en son.
- 9 Ekim kullanıcı yeni görevler istedi: E4N-160 başlangıç parent/Acil. İlk161 açık normal üyelik+şirket/vergi tekilliği+legacy geçiş →162 üyelik referansı →163 abonelik/grup başvuru kapısı →164 grup keşfi/analiz →165 başkan görüşme görevi/bildirim/mail/karar. 161 Done,162–165 Backlog;161/163/165 Acil,162/164 Yüksek. Bağlar161→162/163/164;163+164→165. [[E4N/07-Sprintler/Baslangic-Akisi-Oncelik-Plani-2026-10-09]]. Eski84/85/105/90/102/103/92 ilgili kapsamları yeni kuyruğa bağlandı; aynı teslimi iki kez sayma. 161 açık kayıt/kalıcı vergi tekilliği ürün paketi uygulandı ve doğrulandı; canlı migration yok.

## Son durum
- E4N-150–158 Done; yeniden uygulama.157 kapalı grup,158 lonca başvuru/onay/ret/çıkarma; currentDByetki, ACK/doğrulanmışGET, işlem kilidi. Ayrıntı ilgili P39 grup/lonca9Ekim paket notunda.
- E4N-159 Done: kapalı grup üyelik aktörü/teknik işlem/ortak kimlik veri-API-web paketi;25şema fresh/19+24upgrade/restore ve ilgili contractlar PASS; temiz fc42c49 build ve6browser/finalDB+cleanup PASS. [[E4N/09-Dogrulama/P19-Uyelik-Islem-Aktoru-API-Web-2026-10-09]]. Yeniden uygulama.
- P37 önceki24şema bütün kabulü:39API/build/102browser PASS, d3c6e96; [[E4N/09-Dogrulama/P37-Grup-Lonca-Dahil-Butun-Web-Kabulu-2026-10-09]]. Yeni25şema için yenilenmiş bütün kabul değildir. Root rehearsal aktör browserını içerir. E4N-109 InProgress; releaseReady=false.
- Ana açıklar: E4N-98 bilet/ödeme/legacy;91 geçmiş nedeni/dönem/puan-ban/retention;101 dönem/uygunluk/bildirim;106 üretim operasyonu;111 kalan ürün/API;109 nihai kabul. Sonraki bağımsız büyük web paketini seç; yalnız ilgili görev/kararı oku.
- Kararlar: [[E4N/01-Kararlar/Acik-Kararlar]]. COMMUNITY_MEMBER yeni ürün kodunda kaldırıldı; normal kayıt davetiye/admin üyelik onayı olmadan, zorunlu şirket adı+tekil VKN/TCKN+vergi dairesi+şirket/fatura adresiyle (belge dosyası yok). Kimin kimin üyelik referansı olduğu korunacak. Grup isteği için aktif abonelik zorunlu; kayıt olmak abonelik değil. Başkan görüşme sonrası kendi grubuna kabul/ret. Başkan hariç35; gecikmede5gün günlükmail sonra kısıtlama; shuffle öncesi1gün ödeme. Referanssız kayıt/seçim yöntemi, vergi legacy/ülke-tür, başkan istisna/SLA ve ödeme kesim/hak ayrıntılarını uydurma.
- CanlıSupabasewrite/deploy/gerçek ödeme-mail yok. İzole doğrula. İlgili rol/veri sınırları şimdi; kapsamlıSEC58/59/120 Sprint6.

## Az bağlamla devam
Bu not+git → yalnız ilgili Linear görevi/karar/kod. Linear durum kaynağı; Obsidian teknik/karar kaynağı. Tam geçmişi tekrar tarama. Kanıt tek paket notunda; Linear'a kısa sonuç/kalan kapsam/link. Gerçek bütün teslimi doğrulayıpDone, kalan ana işi açık tut. Başarılı logları dosyada tut, yalnız özet/hata oku. İlgili testleri çalıştır; bütün kabulü yeni somut risk veya sürüm kapısı gerektiğinde yinele. Aktif işi kesme/kopyalama. Eski günlük [[E4N/99-Arsiv/Devam-Notu-2026-10-09]].

## Son teslim — BAŞ-01 / E4N-161
- 491ec05 ürün +5c9deaa kabul origin'de. API/DB, 8-way race, deleted reservation, VKN/TCKN, normal login, abonesiz join403 ve browser3/3/finalDB/cleanup PASS. Build, geniş isolated-smoke, six ilgili contract, restore49 tablo ve error-level local advisors PASS. [[E4N/09-Dogrulama/BAS-01-Acik-Normal-Uyelik-Vergi-Tekilligi-2026-10-09]]. Önceki39API/102browser bütün kabulü yeni26şemaya güncel bütün kabul değildir.
- Türkiye VKN/şahıs TCKN; hesap silinse de rezervasyon kalır. Biçim+tekillik, resmi sahiplik doğrulaması değil. Migration eski topluluk rolünü MEMBER'e geçirir; status/abonelik/gruplar korunur; legacy boş kimliklere değer uydurulmaz. Preflight yalnızSELECT/UUID; duplicate/bozuk numara/email varsa adoption durur.
- Sıra162 üyelik referansı →163 abonelik →164 keşif →165 başkan görev/mail/karar.162 için isteğe bağlı özel link veya referans kodu yöntemi kullanıcıya soruldu, yanıt bekliyor; karar uydurma. Bağımsız164 hazırlığı ilerletilebilir. Kanıt tek paket notunda, eski84/85/105 ayrıca aynı teslim olarak sayılmıyor.

## En son kullanıcı düzeltmesi — dört zorunlu şirket alanı
- E4N-161: şirket adı, VKN/TCKN, vergi dairesi ve şirket/fatura adresi zorunlu. Web/API, profil-admin boşaltma engeli ve visitor dönüşümü düzeltildi. Yeni migration27, önceki26 checksum değişmedi; eksik legacy veriler UUID-only preflight v2 raporunda, uydurma yok. API/PG17 + browser3/3/finalDB, self-profile/upgrade/repeat, build ve local error-level advisor PASS. Kanıt aynı BAŞ-01 notunda; bütün web sürüm kabulü sayılmaz. Canlı migration/deploy yok. Sonraki162 referans seçimi yanıtı bekliyor;164 keşif hazırlığı bağımsız.

- Son login düzeltmesi: topluluk üyeliği alanı kaldırıldı; Üye Ol doğrudan /auth/register normal kayıt formuna gider. Kanıt aynı BAŞ-01 notunda.

- Kullanıcı production yayını istedi: Login.tsx düzeltmesi eski canlı main üzerine ayrı c5d6323 commit'iyle main'e push edildi. Vercel production READY/custom domains c5d6323, canlı browser link/metin PASS. Ana foundation branch267f7f5 kodu korunuyor. Canlı SELECT-only incelemede yeni normal kayıt migration26/27 yapıları yok; yeni üyelik API'si yayında değil. İleride main/foundation birleşirken aynı Login hunk'ı korunmalı; canlı DB geçişi ayrı iş. Ayrıntı BAŞ-01 notunda.
