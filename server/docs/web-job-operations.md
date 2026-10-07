# Web işleri: kalıcı geçmiş ve yetkili çağrı

## Uygulanan paket

Üç mevcut iş (geçmiş etkinlik tamamlama, üyelik hatırlatma, champion hesabı) aynı denetimli yürütücü üzerinden kalıcı çalışma kaydı üretir. Yönetici /admin/web-jobs ekranından son 100 kaydı okuyabilir; etkinlik ve mevcut üyelik hatırlatma işini onaylayıp başlatabilir. Champion için yeni dönem seçimi veya dış çağrı açılmaz.

Migration 0018 web_job_runs tablosunu, durum/tarih tutarlılığı kontrollerini, sıralama indeksini ve RLS/istemci erişim reddini ekler. Yetkili sunucu veritabanı bağlantısı tabloyu kullanır. Başlangıç kaydı yazılamıyorsa alan işi başlamaz. Alan işi ile geçmişin son güncellemesi tek transaction değildir; son kayıt yazılamazsa başarı bildirilmez ve RUNNING kayıt inceleme için korunur. Genel exception alan etkilerinin geri alındığını kanıtlamaz; UNKNOWN kaydedilir.

Aynı işin eşzamanlı çağrısı session advisory lock ile SKIPPED olur. Alan işlerinin önceki transaction/idempotency korumaları ayrıca devam eder. Session lock için doğrudan PostgreSQL veya session pooling bağlantısı gerekir; transaction pooling ile bu yürütücü etkinleştirilmemelidir. Dağıtımdan önce bağlantı biçimi doğrulanmalıdır. Havuz en az iki bağlantı sağlamalıdır; kontrol bağlantısı tutulurken alan runnerı ayrı bağlantı kullanır.

## API

- GET /api/admin/web-jobs: JWT + güncel veritabanı ADMIN rolü; private/no-store, ownerId ve son 100 kayıt.
- POST /api/admin/web-jobs/event-completion/run veya subscription-reminders/run: aynı rol kontrolü; boş payload; ortam anahtarı açık olmalı.
- GET /api/cron/web-jobs/event-completion veya subscription-reminders: en az 32 karakter CRON_SECRET için tam Bearer doğrulaması; query/HEAD ve bilinmeyen iş reddi. Etkinleştirme bayrağı kapalı veya anahtar yoksa 503.
- Başarılı/atlanan çağrı 200; belirsiz sonuç 503. Otomatik tekrar yok. SMTP UNKNOWN sonucu ayrıca reminder teslimat ledgerında kalır.

Özet yalnız sayımlar ve mevcut champion dönem/tarih alanlarını içerir. Hesap, e-posta, token veya exception metni kaydedilmez. Yönetici ekranı oturum değişiminde önceki kayıtları göstermez.

## Üretime geçiş hazırlığı — uygulanmadı

1. Canlı şema/yedek/geçiş provası ve bağlantı biçimini doğrula; migration 0018'i uygulama sürümünden önce uygula.
2. Üretim ortamında WEB_JOB_INVOCATION_ENABLED=true ve rastgele güçlü CRON_SECRET tanımla. Anahtarı kod/Obsidian/Linear içine yazma.
3. Dış zamanlayıcı yapılandırmasını inceleyip dağıtım onayı sonrası kur. Vercel CRON_SECRET'i Authorization: Bearer başlığıyla iletir. Mevcut process cron zamanları etkinlik için her 10 dakika, hatırlatma için ortam saatiyle 09:00'dır. Dış cron UTC zamanının ürünün saat dilimiyle eşlenmesi ve plan limitleri ayrıca doğrulanmalı; burada yeni saat kuralı belirlenmedi.
4. Dış çağrı gerçek endpointten çalışırken RUNNING/SUCCESS/SKIPPED/UNKNOWN geçmişini ve alan sayımlarını doğrula. Process timer serverless sürekli çalışma garantisi değildir. Mevcut zamanlayıcılar korunmuş ve geçmişe bağlanmıştır; dış plan kurulmuş sayılmaz.
5. Gecikmiş RUNNING veya UNKNOWN için önce alan kayıtlarını ve reminder ledgerını incele. Sonuç belirsizken körlemesine yeniden gönderim yapma. Kalıcı alert/retention politikası ve kaçırılmış champion dönemleri bu pakette yok.

vercel.json'a aktif cron eklenmedi, canlı env/migration/deploy/e-posta/ödeme yapılmadı. Mevcut hatırlatma günleri 3/1/-1/-3/-5 korunur; yeni beş günlük kısıtlama veya shuffle ödeme kesimi uygulanmaz. D kararları, champion dönem kuralları, üretim zamanlayıcı kabulü ve Sprint 6 güvenlik nedeniyle P34 açık kalır.

Kaynak: https://vercel.com/docs/cron-jobs/manage-cron-jobs ; https://supabase.com/docs/guides/database/postgres/row-level-security .
