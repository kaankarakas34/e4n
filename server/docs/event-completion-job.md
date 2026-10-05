# P34 — Geçmiş etkinlik tamamlama çalışma paketi

Mevcut on dakikalık görev artık `cron/event-completion.js` tek işleyicisini kullanır. Mevcut ürün kuralı korunur: yalnız `PUBLISHED` ve `COALESCE(end_at,start_at) < database cutoff` satırları COMPLETED olur. Gelecek, DRAFT, CANCELLED, zaten COMPLETED ve geçmiş başlangıç/gelecek bitiş değiştirilmez. Katılım, kayıt, bilet, ödeme, üyelik veya puan yazılmaz.

## İşlem, tekrar ve gözlem

Tek DB transaction içindeki `pg_try_advisory_xact_lock(4020,34)` aynı DB'deki bu işleyicilerin çakışmasını atlar. Transaction lock commit/rollback/bağlantı kapanmasıyla serbest kalır; session lock kullanılmaz. Statement timeout30s, row lock timeout5s; hata tüm batch'i geri alır. Başarılı tekrar changed0 döndürür. Önceki tetikleme kaçırılmışsa sonraki çağrı yalnız son on dakikayı değil bütün geçmiş uygun satırları tarar. Bu olay bitiş kuralıdır; gerçek yoklama kanıtı değildir.

Structured JSON log alanları job/runId/status/elapsedMs/cutoff/changed; DRY_RUN'da eligible; çakışmada SKIPPED/ALREADY_RUNNING; hatada FAILED ve SQLSTATE. SQL hata metni, bağlantı bilgisi ve satır kişisel bilgileri loglanmaz. Hata runner çağıranına ulaşır; gerçek timer callback loglanan hatayı yakalar. Log transport hatası committed sonucu FAILED diye yeniden yorumlamaz.

`npm --prefix server run events:completion:inspect` varsayılan READ ONLY transaction ile yalnız uygun sayıyı gözlemler. Manuel değişiklik provası aynı runner/lock/rule üzerinden `node src/cron/run-event-completion.js --apply-isolated`: NODE_ENV=test, açık loopback DB_HOST ve bağlantı URL'leri yoksa çalışır. Üretim uygulama veya dış URL uygulaması bu CLI'nın seçeneği değildir. Test bu komutu yalnız disposable DB env ile çalıştırır. Yeni HTTP kontrol/yazma endpoint'i açılmadı.

## Kabul kanıtı

`npm --prefix server run test:event-job`: PostgreSQL17 fresh14/repeat0, gerçek kayıt ve transaction. Dry-run durum değiştirmez; CLI dry-run/isolatedapply ve production apply denial; başka connection lock'u tutarken SKIPPED; SQL trigger hatasında batch rollback/redacted FAILED; on paralel koşuda toplamiki geçiş/replay0; gecikmiş1990 event sonraki timer callback ile yakalanır. Gerçek scheduler registration ifadesi/callback test edildi; clock tick veya gerçek hosting availability testi olarak sunulmaz. AttendanceABSENT/PENDINGticket korunur. Gerçek Express/JWT detailCOMPLETED/registration/ticket/count korunur; public liste geçmişi gizler, admin liste aynı COMPLETED sonucu gösterir. E-posta/testprovider yok.

Route ownership163/18/17 retainedlegacy ve runtime exactmatch yeniden doğrulanır; yeni yol/şema yok. Build/diff/syntax sonuçları teslim notunda kayıtlıdır. UI değişmedi; önceki kart/status ekranını yeni ayrı Done teslimi veya yeni tarayıcı kabulü diye saymayız.

## P34 ana kabulü açık

Bu runner üretimde sürekli çalışan scheduler kurulduğu iddiası değildir. Vercel serverless içindeki node-cron process timer kalıcı scheduler garantisi vermez; dış planlayıcı/uygun korumalı invocation, deploy ve gözlem kabulü ayrı gerekir. VerceI cron konfigurasyonu/secret/deploy bu paketle eklenmedi. Persisted job history/alerting/kaçırılmış çalışma monitoring'i yok; JSON loglar mevcut log altyapısına gider. Timer ifadelerinin timezone'u değiştirilmedi.

Champion period/TERM Ağustos30+31 çift tanımı, hafta/ay/yıl sınırları ve mevcut hata yutma; subscription reminder notification/mail atomicity, last_reminder_trigger ve zaman dilimi P34 kalan paketidir. D puan/üyelik/hak kuralları seçilmedi. `src/cron/jobs.js` eski bağlanmayan kopyası bu package içinde bağlanmadı veya silinmedi. P34 bu teslimle Done değildir. Canlı DB yazma/deploy/mail/payment yok; mobil ve eğitim geliştirilmedi.

Dayanak: [node-cron schedule](https://www.nodecron.com/api-reference.html), [PostgreSQL17 transaction advisory locks](https://www.postgresql.org/docs/17/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS). Kullanılan schedule API kurulu pakette kontrol edildi; dokümandaki yeni distributed seçenekler eklenmedi.
