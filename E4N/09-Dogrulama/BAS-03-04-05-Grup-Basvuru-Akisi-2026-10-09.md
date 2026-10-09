# BAŞ-03/04/05 — Abonelik, grup keşfi ve başkan görüşme akışı

## Teslim edilen kapsam
- Normal kayıt ayrı; başvuru için DB'de ACTIVE hesap, abonelik planı ve gelecekte bitiş tarihi zorunlu. İstemci/JWT abonelik iddiası hak açmaz. Mevcut ödeme sağlayıcısı/callback korunur.
- `/chapter-management`: aktif grup keşfi, gerçek aktif üyeler/meslek/şirket dağılımı, başkan hariç 35 kapasite ve boş koltuk. Keşif API'sinde telefon/e-posta/vergi yok. İl kaydı korunur; coğrafi ayrım kapalı.
- Katıl: başvuru + görüşme görevi + başkan bildirimi + mail outbox aynı transactionda. Altı eşzamanlı tekrar tek kayıt oluşturur. Eski pending kayıtları yalnız tek başkan belirlenebiliyorsa yeni kuyruğa geçirilir.
- Başkan ana sayfasındaki “Grup görüşme görevlerim” bağlantısı `/group-management?tab=applications&group=<id>` üzerinden mevcut grup panelindeki kuyruğu açar. Telefon görüşmesi kaydı olmadan kabul/ret yok. Başkanın güncel DB yetkisi kontrol edilir; genel üyelik güncellemesiyle açık başvuru atlanamaz.
- Kabul kapasiteyle atomik; son koltuğa iki kabul denemesinde biri 200, diğeri 409 ve geri alınır. Ret/karar açıklaması üyede kalıcıdır. Ret sonrası yeniden açılma kuralı uydurulmaz.
- SMTP hata/QUEUED durumunda başkan tekrar deneyebilir; SENT/UNKNOWN otomatik yeniden gönderilmez. SENT yalnız SMTP kabulüdür, gelen kutusu teslim garantisi değildir. Otomatik cron retry bu teslimde yok.
- Yeni migration `0028_group_application_workflow`: uygulama/outbox tabloları ve notification action_url. RLS açık; anon/authenticated doğrudan erişimi kapalı. Hesap/grup silinmesi başvuru geçmişinin kişisel FK bağlantısını ayırır; silme işlemi engellenmez. Eski migration checksumları değiştirilmedi.

## Doğrulama
- PG17 gerçek API/DB sözleşmesi: abonelik/sona erme, altı başvuru tekrarı, yetki/mahremiyet, görüşme ön şartı, genel API bypass, fake SMTP FAILED→retry→SENT/UNKNOWN, atomik son koltuk ve eski pending geçiş provası PASS.
- Gerçek tarayıcı 3/3: keşif→Katıl→başvuru; başkan ana sayfa görevi→kuyruk→görüşme→kabul; üyenin kalıcı karar/ACTIVE üyelik görünümü. `output/group-application-browser-1791564502755/report.json`; son DB ACCEPTED/ACTIVE. Gerçek ödeme/mail ve canlı test hesabı yok.
- Bulunan gerçek hata: başvuru FK'ları hesap silmeyi engelliyordu; SET NULL ile düzeltildi, membership-history sözleşmesi PASS. Eski test beklentileri yeni 28 şema ve abonelik/görüşme şartına güncellendi; başarısız iş davranışları başarı kabul edilmedi.
- Geniş 41 API sözleşmesi: 40 PASS/1 request timeout; yalnız workflow testi bağımsız iki tekrarında PASS, son tekrar görev bağlantılı browser 3/3 içerir. İlk başarısız rapor korunur; ilk koşu 41/41 PASS değildir. Kanıt `output/web-acceptance/2026-10-09T16-41-55-144Z/report.json` + `output/application-workflow-task-release.log`. Açık bütün web/SEC kabulü `releaseReady:false` kalır. Son build PASS (`output/application-build-release.log`, 187 route/30 provider/17 legacy).

## Açık kalanlar / görev ölçümü
- E4N-161: önceki canlı normal kayıt/vergi tekilliği/il teslimi Done.
- E4N-162: isteğe bağlı üyelik referansı yöntemi kullanıcı yanıtı bekliyor; mevcut ilişkiler korunur.
- E4N-163: abonelik başvuru kapısı teslim; ücret/dönem, 5 gün gecikme başlangıcı/hakları ve shuffle kesim ayrıntıları açık. Tam paket In Progress.
- E4N-164: temel aktif keşif/gerçek sayım/meslek görünümü Done. Yeni KPI veya bekleme listesi kuralı eklenmedi.
- E4N-165: temel başvuru/görev/bildirim/outbox/görüşme/kabul-ret teslim. Çoklu grup başvurusu, başkan değişimi/SLA/ulaşılamayan kişi, ret sonrası tekrar ve admin istisnası kararları açık; önceki çoklu grup modeli değiştirilmedi. Tam istisna kapsamı In Progress.
- Eski E4N-90/102/103/92 başvuru/görüşme alt kapsamları bu teslimin kanıtını kullanır; aynı iş ikinci teslim sayılmaz. Daha geniş transfer/puan/engel kapsamı açık kalır.
- Canlı yayın öncesi: 27 şema, 28 kullanıcı, 0 aktif grup, 0 notification. İlk grup adı/başkanı kullanıcıdan bekleniyor. Veri/başkan uydurulmadı. Aktif SMTP konfigürasyonu var; gerçek e-posta teslimi bu testte yapılmadı.

## Yayın
- Ürün commit `0004f8d1c892713f18b8dab2248b0d24c18a9ccd` main ve foundation origin'e push edildi.
- Canlı migration28 uygulandı; checksum `e97cc7cc9beef54093bb4601e381ccf120ffe9595d55d133da22c1c098db97f5`. Version27/checksum ve yeni tablo yokluğu guardı + DDL/ledger aynı transaction. Son kontrol: 28 şema/28 kullanıcı/0 aktif grup/0 başvuru/0 outbox/0 notification. Önceki kullanıcı sayısı korundu; gerçek kayıt/mail/ödeme testi yapılmadı.
- Yeni iki tabloda RLS true ve anon/authenticated SELECT false. Önceki tam PG17 yedeği `output/production-backup-2026-10-09/pre-release-full.dump` yerelde; kişisel yedek Git/Obsidian'a kopyalanmadı. Yeni28 synthetic full restore ve legacy pending upgrade PASS.
- Vercel production dpl_DmdeFzUGdSoFxZfoaLRT6Lf4imyS READY; main SHA0004f8d. www.event4network.com/event4network.com/e4n.vercel.app alias doğrulandı. Canlı login200/index-BLTBQFuQ.js200 ve yeni üç workflow ekran metni assette mevcut. Anon discovery/tasks/mine401. Kanıt output/application-live-check.json. Canlı oturumlu başvuru/mail testi yapılmadı; izole browser kabulü ayrı.

## E-Posta Outbox Retry, SLA ve Eşzamanlı Başvuru Kısıtı Teslimi (E4N-165)

- **Zenginleştirilmiş HTML E-posta:** Başvuran üyenin adı, telefonu, şirketi, mesleği ve başkanın yönetim paneline doğrudan bağlantısını içeren şablon `group-applications.js` içine eklendi.
- **Outbox Batch Retry Worker:** `deliverPendingApplicationMails(pool)` fonksiyonu dışa aktarıldı. `QUEUED` ve `FAILED` durumundaki bekleyen mailleri güvenli tarayıp en fazla 3 denemeye kadar SMTP üzerinden yeniden gönderen worker tamamlandı.
- **Eşzamanlı Başvuru Engeli:** `POST /api/groups/:id/join` rotasında kullanıcının başka bir gruba açık başvurusu (`AWAITING_CALL` veya `INTERVIEWED`) varsa işlem `409 CONCURRENT_APPLICATION_DENIED` ile engellendi.
- **Başkan SLA & Bekleme Süresi:** `GET /api/group-applications/mine`, `GET /api/group-applications/tasks` ve `GET /api/groups/:id/applications` uç noktalarına 7 günlük `sla_breached: boolean` ve `days_waiting: number` alanları eklendi.
- **İzole Doğrulama:**
  - `server/test/group-application-workflow-contract.mjs`: Eşzamanlı 409 engeli, SLA aşım alanları, başkan retry-mail endpoint'i, UNKNOWN tekrar reddi ve `deliverPendingApplicationMails` batch retry mekanizması tam olarak doğrulandı; **PASS**.

