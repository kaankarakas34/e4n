# P34 — Web işlemleri, kalıcı geçmiş ve yetkili çağrı

## Bütün paket

- Migration0018: web_job_runs kalıcı ledgerı, durum/tarih tutarlılığı, indeks, RLS ve public/anon/authenticated erişim reddi.
- Mevcut etkinlik, üyelik hatırlatma ve champion zamanlayıcıları tek denetimli runnerdan çalışma geçmişi üretir. Mevcut dönem/filtre/gün kuralları korunur.
- Yönetici gerçek güncel DB rolüyle son100 kaydı okuyabilir; etkinlik ve mevcut üyelik hatırlatmasını onaylı çağırabilir. Oturum değişimi önceki kayıtları temizler; yükleme/yenileme/belirsiz sonuç ekranları vardır.
- Yetkili dış GET, en az32karakter CRON_SECRET Bearer ve etkinleştirme bayrağıyla çalışır. HEAD/query/bozuk payload/sahte JWTrol/üye/silinmiş veya rolü düşmüş hesap kabul edilmez.
- Aynıiş sessionlock ile tek yürütülür; eşzamanlı diğer çağrı SKIPPED olarak kalır. Başlangıç kaydı yoksa iş başlamaz. Sonuç kaydı yazılamazsa RUNNING korunur ve UNKNOWN döner; genel exception da yan etkiler geri alındı iddiası olmadan UNKNOWN.
- Özet beyaz liste sayımlardır; kullanıcı/email/exceptionmetni/anahtar tutulmaz. SMTP teslimat durumu migration0017 ledgerında kalır.

## Doğrulama kapsamı

Fresh18/repeat0 ve17→18 upgrade; gerçek Express/JWT/PG17; ACL/RLS; devredışı/anahtar/HEAD/query/body; gerçek past-eventCOMPLETED+replay0; concurrentSKIP; exceptionredaction; ilkINSERTfailişbaşlamıyor; finalUPDATEfailRUNNING/UNKNOWN; unlock/recovery; sahteSMTPtekclaim; mevcutchampionhesap; owner/duplicate/nullDTO. Gerçek web ekranı ve üye rol sınırı bütün browserfixture içine eklendi. Syntheticbackuprestore ledger satırı ve ACL/RLS dahil44tabloyu kontrol eder.

## Açık sınırlar

Bu teslim üretim dağıtımı veya gerçek dış scheduler aktivasyonu değildir. Session advisorylock doğrudanPG/sessionpooling ister; transactionpooling uyumsuzdur ve havuz enaz2connection olmalıdır. Üretim bağlantısı/UTC-saat eşlemesi/scheduler gözlem-alarm ve canlı migrationprovasi ayrı kabul ister. Geçmiş son100okuma retentionpolitikası değildir. Champion external/manualperiod ve missedperiodbackfill açık; eskiTERM30+31korunur. Beşgüngünlükmail/kısıtlama/yenidenaçılma/shufflecutoff Dkararları uydurulmadı. P34/P09/P37 ana işler açık, releaseReady=false. Mobil/LMSbaşlamadı; broadsecuritySprint6.

Teknik işlem sırası: server/docs/web-job-operations.md. Büyük paket sırası: [[Web-Buyuk-Paket-Oncelikleri-2026-10-07]]. Son koşu/commit kanıtı kabul tamamlandığında aşağıya kaydedilir.

## Son kabul — 7 Ekim 2026

İlk toplu koşu17-04-26-035Z:30PASS/1FAIL; payment-flow eskiupgrade10beklentisi18-versionzincirde11olmalıydı, fixture düzeltildi. Son tam koşuoutput/web-acceptance/2026-10-07T17-08-35-447Z/report.json:31PASS/0FAIL. Son runnerredactedlog/nullDTO değişimi focusedweb-job-operations-contract ile tekrarPASS. Sentetikrestore gerçekweb_job_runs satırı dahil44tablo/rowhash/catalog/ACL/RLS aynı,18repeat0.

Tek aktif fixture ile gerçek App/Vite→Express/JWT→PG17 browseroutput/web-browser/2026-10-07T17-13-17-877Z/browser-report.json:29PASS/0FAIL. Yeniadminçalıştırma→SUCCESSkalıcıgeçmiş→refreshtekçağrı ve üyeyeöncekiverinin görünmemesi, finalDBtekADMIN/SUCCESS/changed0 kaydı doğrulandı. Mevcutparticipant2/50, capacity409, shuffle409, PDFbyte ve mesajkayıtları korundu. Adminoperations screenshot görsel incelendi. İlk17-13-12fixture DBinit bağlantısı kapanarak başlamadı; browseracceptance sayılmadı. Sonfixture/browser/API/Vite/ownedcontainer kapalı.

ProductionbuildPASS; finalcheckPASS; syntax/diffcheckPASS; ownership167route/20provider/17retainedlegacy. Build mevcut büyükbundle ve eskiBrowserslistmetadata uyarıları sürüyor. TestbaseHEAD0735b9a; teslim çalışan ağaç değişiklikleriyle doğrulandı, commit/push kaydı Linear ve Devamnotunda. releaseReady=false; liveDB/write/deploy/realmail/payment yok.
