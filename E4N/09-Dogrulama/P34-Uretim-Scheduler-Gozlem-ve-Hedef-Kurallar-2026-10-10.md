# P34 — Üretim Scheduler, Gözlem ve Hedef Kurallar (E4N-106)

**Tarih:** 10 Ekim 2026  
**Görev:** [E4N-106 (P34 / Kalan: Üretim planlayıcısı, gözlem ve hedef iş kuralları)](https://linear.app/e4n/issue/E4N-106)  
**Kapsam:** Gerçek dış scheduler kurulum/gözlem/alarm, üretim connection/pooling/UTC kabulü, hedef champion dönem/backfill ve karara bağlı gecikme/kısıtlama kuralları.

---

## 1. Uygulanan Mimari ve Teslim Bileşenleri

### A. Üretim Zamanlayıcısı ve Dış Çağrı Sözleşmesi (Vercel Cron)
- **`vercel.json` Entegrasyonu:**
  - Vercel'in resmî zamanlayıcı formatına uygun `crons` dizisi yapılandırıldı:
    - `/api/cron/web-jobs/event-completion`: Her 10 dakikada bir (`*/10 * * * *`).
    - `/api/cron/web-jobs/subscription-reminders`: Her gün 06:00 UTC (Türkiye Saati 09:00) (`0 6 * * *`).
- **Yetkili Dış Çağrı Kapısı (`GET /api/cron/web-jobs/:job`):**
  - En az 32 karakterlik `CRON_SECRET` zorunluluğu, `crypto.timingSafeEqual` ile zamanlama saldırılarına karşı güvenli Bearer token karşılaştırması.
  - Sadece GET metoduna izin verilir; HEAD, POST veya query parametreli istekler `400 Bad Request` ile reddedilir.
  - `champion-calculation` dış çağrılara kapalı tutularak yetkisiz manipülasyon engellendi (`400 Bad Request`).

### B. Operasyonel Gözlem, Alarm ve İyileştirme Altyapısı (Observability & Recovery)
- **Sağlık ve Alarm Analizi (`computeJobsHealth`):**
  - **Stale Run Tespiti:** 15 dakikadan uzun süredir `RUNNING` durumunda kalmış takılı işler tespit edilir ve `CRITICAL` düzeyinde `STALE_RUNNING_JOB` alarmı üretilir.
  - **Recent Errors:** Son 24 saat içinde `FAILED` veya `UNKNOWN` durumuna düşen işler sayılıp `DEGRADED` seviyesinde `RECENT_FAILURES` alarmı oluşturulur.
  - **Sistem Durumu:** Alarmlara göre `HEALTHY`, `DEGRADED` veya `CRITICAL` olarak hesaplanır.
- **API Uç Noktaları:**
  - `GET /api/admin/web-jobs`: Tüm iş geçmişine ek olarak `health` (durum, takılı iş sayısı, hata sayısı ve alarmlar) nesnesini döner.
  - `GET /api/admin/web-jobs/health`: Oturum doğrulamalı (yalnızca DB ADMIN) anlık operasyonel sağlık durumunu döner.
  - `POST /api/admin/web-jobs/stale-runs/recover`: Takılı kalan `RUNNING` kayıtlarını atomik olarak `UNKNOWN` ve `error_code = 'STALE_TIMEOUT'` ile kapatıp sistemi sağlıklı duruma döndürür.

### C. Hedef İş Kuralları ve UTC Zaman Güvencesi
- **`event-completion`:** Bitiş/başlangıç zamanı geçmiş `PUBLISHED` etkinlikleri atomik olarak `COMPLETED` yapar.
- **`subscription-reminders` (D07 Kuralı):**
  - Kalan gün 3 veya 1 olan üyelere hatırlatma, geçen gün -1, -3 veya -5 olan üyelere gecikme uyarısı gönderir.
  - 5. gün dolduğunda (`days_left <= -5`) kullanıcının hesap statüsü otomatik olarak `account_status = 'RESTRICTED'` yapılır.
  - -5 günden daha eski borçlu üyeler ek tarama ile `RESTRICTED` statüsüne alınır.
  - Mükerrer bildirim ve e-posta gönderimi `subscription_reminder_deliveries` defteri ile önlenir (idempotent).
- **`champion-calculation`:**
  - Parametre verilmediğinde son 7 günü (WEEK) baz alarak varsayılan dönem aralığını güvenle oluşturur.
  - Aynı dönemde mükerrer çalıştırmada `EXISTING` / `SKIPPED` dönerek mevcut şampiyon kayıtlarını korur.
- **Eşzamanlılık Koruması (Advisory Lock):**
  - Her iş için PostgreSQL oturum düzeyi kilit (`pg_try_advisory_lock(4020, 100 + jobIndex)`) kullanılır.
  - Çalışmakta olan bir iş yeniden tetiklendiğinde `SKIPPED` olarak işaretlenir; yarış durumu oluşmaz.

### D. Web Yönetici Ekranı (`AdminWebJobs.tsx`)
- **Sağlık Durumu Rozeti:** Başlık alanında anlık sistem durumu (Sağlıklı / Uyarı / Kritik) görsel olarak gösterilir.
- **Alarm Panosu:** Takılı kalan iş veya son hatalar varsa açıklayıcı uyarı listesi sunulur.
- **Kurtarma Butonu:** Takılı iş tespit edildiğinde tek tıkla "Takılı İşleri Temizle" aksiyonu yürütülür.
- **Manuel Çağrı Onayları:** İşlem öncesinde admin'e risk ve eylemi anlatan Türkçe onay diyalogları sunulur.

---

## 2. Doğrulama ve Test Kanıtları

1. **Yeni Hedef Kurallar ve Zamanlayıcı Sözleşme Testi:**
   - Dosya: `server/test/web-jobs-target-rules-and-scheduler-contract.mjs`
   - Ortam: İzole Docker PostgreSQL 17 konteyneri.
   - Sonuç: **8/8 PASS**:
     - 28 migration sıfırdan uygulandı, 50 uygulama tablosu invariyantı korundu.
     - `event-completion` geçmiş etkinliği COMPLETED yaptı.
     - `subscription-reminders` 5 günlük gecikmeli üyeyi RESTRICTED yaptı, 3 gün kalan üyeye bildirim üretti.
     - `champion-calculation` şampiyon kayıtlarını üretti, mükerrer çağrıda idempotent EXISTING/SKIPPED döndü.
     - Eşzamanlı çağrıda advisory lock ile ikinci süreç SKIPPED oldu.
     - 20 dakikalık takılı RUNNING kaydı CRITICAL alarm üretti, `recover` uç noktasıyla UNKNOWN/STALE_TIMEOUT yapılarak sistem sağlığı geri kazanıldı.
     - `CRON_SECRET` ile Bearer token, query/HEAD korumaları ve champion dış çağrı engeli doğrulandı.
     - `vercel.json` formatı ve cron yolları doğrulandı.
2. **Geriye Dönük Uyumluluk Testi:**
   - Dosya: `server/test/web-job-operations-contract.mjs`: **PASS**.
3. **Statik Rota Sahipliği:**
   - `node server/test/route-ownership-static.mjs`: **202 aktif rota, 31 sağlayıcı, 17 legacy PASS**.
4. **Tip ve Derleme:**
   - `npm run check` (`tsc -b --noEmit`): **0 hata, PASS**.
   - `npm run build` (Vite production bundle): **PASS** (25.41s).

---

## 3. Güvenceler ve İnvariantlar

- **Zero DDL:** Veritabanına yeni tablo veya migration eklenmedi (28 sürüm, 50 tablo korundu).
- **Canlı Supabase Bağımsızlığı:** Canlı ortama izinsiz yazma veya deploy yapılmadı.
- **Güvenlik:** CRON_SECRET zamanlama saldırılarına karşı `timingSafeEqual` ile korunur, hassas bilgiler loglanmaz.
