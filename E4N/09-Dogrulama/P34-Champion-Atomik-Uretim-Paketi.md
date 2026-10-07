# P34 — Champion üretimi işlem ve tekrar paketi

Mevcut index cron callback'leri `runChampionCalculation` üzerinden çalışır. Eski üç metrik korunur: belirtilen zaman aralığındaki SUCCESSFUL referrals COUNT; visited_at DATE aralığındaki tüm visitors COUNT; SUCCESSFUL referrals SUM(amount). İlk metrik ile gelir metriklerinin farklı kazananları olabilir. Tarih parametrelerinin eski DATE/timestamptz tipleri, value DESC tie davranışı ve cron zaman/dönem hesabı korunur. Yeni puan, beraberlik veya üyelik politikası seçilmez.

## Atomik sonuç

Tek transaction, `(period_type, UTC çalışma günü)` advisory transaction try-lock ve 5s lock/30s statement timeout kullanılır. Üç agregasyon aynı SQL statement snapshot'ında hesaplanır. Üç INSERT bir bütün commit edilir; üçüncü metrik hata verirse önceki INSERT'ler de geri alınır. Aynı helper'ın on iki eşzamanlı çağrısı tek batch üretir; busy çağrı SKIPPED/ALREADY_RUNNING olur. RunId/status/elapsedMs ve SQLSTATE gözlemi var; satır/SQL/bağlantı hata metni loglanmaz. İşleyici hatayı çağırana iletir, cron sarmalayıcı hata kaydı sonrası çalışmaya devam eder. Log transport hatası committed sonucu değiştirmez.

Aynı type/gün için herhangi bir eski sonuç varsa EXISTING/PRESERVED_PERIOD_RESULTS döner; geçmiş silinmez veya otomatik yeniden hesaplanmaz. Bu anahtar mevcut `period_date=today UTC` davranışına dayanır; gerçek dönem kimliği değildir. Legacy tek metrikli/çift sonuçlu bir gün de korunur. Sonuçların orijinal start/end penceresi kaydedilmediğinden EXISTING sonucu önceki hesaplamanın doğru pencereye ait olduğunu kanıtlamaz. Karar olmadan eksik metrik uydurulmaz. Kazanan olmayan boş dönemde INSERT0 olur; kalıcı boş dönem checkpoint'i bulunmadığından ileride kaynak değişirse tekrar hesaplanabilir.

## Kabul

`npm --prefix server run test:champion-job`: gerçek disposable PG17 fresh14/repeat0; farklı üç kazanan/değer (2 referral/3 visitor/100 revenue), aralık dışı/PENDING referral dışlanması; 12 concurrent tek3row/replay0; legacy partial korunması; başka connection lock'u tutarken SKIPPED; üçüncü INSERT trigger hatasında0row/FAILEDredacted ve retry3; empty0/invalidperiod-reversedwindowreject; log outage sonucu koruma. Gerçek Express/JWT `/api/champions` anonymous401, üye okumasında yeni MONTH üçlü sonucu ve doğru gelir sahibi gösterir. Sahte mail transport kullanılır, çağrı yapılmaz. Şema14/41/yol163/18provider/17legacy değişmez; route static/runtime exactmatch ve check/diff/syntax sonuçları teslim notunda.

Yeni API veya ekran eklenmedi. Web mevcut champion DTO'sunu alır; eski web kartlarının ayrı yeni Done teslimi veya yeni browser kabulü olduğu iddia edilmez. Üretim DB'ye yazma/deploy/mail/ödeme yok; mobil/LMS başlatılmadı. Eski kaynak eğitim tabloları değişmedi.

## Açık P34/P21 hedefleri

D dönem/puan/beraberlik kararları; Ağustos30+31 TERM çift cron tanımı ve dönem sınırları; replay key yerine kalıcı doğru dönem/input ledger; eski partial/duplicate uzlaştırması; NULL kazanan ve NULL SUM legacy veri davranışı; global unique kısıt ve helper dışı yazım kapıları; missed champion dönemlerinin backfill'i açık. Bu helper tarih penceresini ileri/geri planlamaz; kaçırılmış geçmiş champion çalışmasını otomatik uydurmaz. Vercel'de sürekli scheduler/invocation/auth/deploy/log history/monitoring hâlâ açık. Üyelik hatırlatma notification/mail/last_reminder_trigger işlem paketi de açık. P34 veya P21 Done değil.

Transaction advisory lock commit/rollback ile bırakılır ([PostgreSQL17](https://www.postgresql.org/docs/17/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS)); bu tek başına veritabanı unique kısıtı yerine geçmez. Her production geçişi P09 gerçek yedek/adoption/release kapılarına bağlıdır.


Commit/push925956e8e6d8b3fc2fe81713908eb96c61769142. PG17contract/gerçekExpresschampionsDTO/static-runtime163/check/diff/syntaxPASS. UI değişmedi yeni browser/build çalıştırılmadı. Linear106IP kanıt güncellendi.
