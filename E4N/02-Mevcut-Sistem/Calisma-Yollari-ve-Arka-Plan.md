# Çalışma yolları ve arka plan işleri

**Tarih:** 1 Ekim 2026. Kaynak dosyalar ve yapılandırma incelendi. Vercel bağlantısında üretim dağıtımı ve alan adı eşleşmesi salt okunur olarak doğrulandı; alternatif VPS kullanımı doğrulanmadı.

## Uygulama girişleri

| Yol | Çalıştırma zinciri | Veri bağlantısı | Durum |
|---|---|---|---|
| Vercel yapılandırması | `vercel.json` `/api/*` → `api/index.js` → `server/src/index.js` | Repo ayarında Supabase `e4n` pooler | Vercel `e4n` projesinde üretim dağıtımı READY; commit `7ead1690ab1b7344fe2ea98d6217700e3f39e0ab` ve `event4network.com` / `www.event4network.com` alias'ları doğrulandı |
| Kök Docker Compose | `docker-compose.yml` → `server/Dockerfile`, kök `Dockerfile` → Nginx | Docker `postgres` servisi ve `pgdata` volume | Denetim anında konteyner çalışmıyor |
| Yerel başlatma | `run_locally.ps1` → `server npm run dev`, e-posta `server.js`, web `npm run dev` | `server/.env` → `localhost:5433/e4n2db` | DB bağlantısı reddedildi; web istemcisi 4005, API 4000 kullanıyor |
| VPS paketi | `deploy/setup_vps.sh`, `deploy/api`, `deploy/email`, `deploy/html` | Alternatif kopya/dağıtım yolu | Üretimde kullanımı doğrulanmadı |
| Mobil | `mobile/app` → `mobile/utils/api-client.ts` | Geliştirmede yerel ağ API'si; üretimde kodda sabit `e4n-backend.vercel.app/api` | Bu adresin `/api/health` ve `/api/events` yolları 404 döndü; mobil yayın sürümü doğrulanmadı |

`server/src/index.js` ile `deploy/api/src/index.js`; ilgili migration, başlangıç SQL, admin router ve iki e-posta sunucusu dosyası 1 Ekim 2026 itibarıyla SHA-256 düzeyinde eş. Kopyalar var; hangi paketleme yolunun güncellendiği gelecekte ayrıca izlenmeli.

Vercel üretim dağıtımı `dpl_5hTiTzk2DmqyY7MKJdQSFKpUPW24` (READY), GitHub `main` commit'i yukarıdaki HEAD ile aynı. Bu, bağlı Vercel projesinin üretim sürümünü kanıtlar; kullanıcının yerel çalışma ağacındaki commit edilmemiş değişiklikleri içermez. `https://event4network.com/api/health` GET 200 döndü. `https://event4network.com/api/events` GET 500 döndü; Vercel runtime logunda `server/src/index.js:1878` sorgusu için PostgreSQL `42702: column reference "status" is ambiguous` görüldü. Kodun `GET /api/events` işleminde SELECT öncesi geçmiş etkinlikleri UPDATE etmeye çalıştığı da saptandı (`server/src/index.js:1838`); GET isteğinin veriyi değiştirmiş olup olmadığı doğrulanamadı. Tekrar deneme yapılmadı. Bu gözlem genel API sağlığının kanıtı değildir.

## API yapısı

`server/src/index.js` içinde 135 route tanımı; `server/src/routes/admin.js` içinde `/api/admin` altında bağlı 16 route var. Diğer `server/src/routes/*` modülleri bu girişte import/mount edilmediği için varlıkları tek başına aktif uç nokta sayılmaz. Toplam ve tekrarlar [[E4N/02-Mevcut-Sistem/API-Uc-Noktalari|API Envanteri]] içinde. Admin router genel `authenticateToken` ve `ADMIN` rol middleware'iyle başlıyor. Ana dosyadaki uçların her biri kendi kontrolüne bağlı.

## Arka plan işleri

| Zamanlama | İş | Kaynak / kayıt yeri |
|---|---|---|
| Her 10 dakika | Geçmiş etkinliği `COMPLETED` yapma | `server/src/index.js` cron → `events` |
| Haftalık, aylık, dönemlik, yıllık | Champion hesaplama | Aynı dosya cron → `champions` |
| Her gün 09:00 | Abonelik bitiş hatırlatmaları | Aynı dosya cron → `users.last_reminder_trigger`, `notifications`, e-posta |

`server/src/cron/jobs.js` benzer işleri tanımlıyor; ana girişte import/çağrı izi bulunmadı. İşler `server/src/index.js` üst düzeyinde kurulduğundan Vercel çalışma modelinde ne zaman ve kaç kez çalıştıkları ayrıca doğrulanmalı. Bu not, düzenli yürütüldükleri iddiası değildir.

## Dosya ve e-posta çıkışları

- Blog görseli: web arayüzünden Supabase Storage public `blog-images` bucket'ına.
- Fatura yükleme: API `multer` ile yerelde `uploads/`, Vercel'de geçici işletim sistemi klasörüne; dosya yolu `users` veya `public_visitors` satırına yazılıyor.
- API e-postası: `email_configurations` tablosu veya ortam değişkenleriyle `nodemailer`.
- Ayrı `server.js` e-posta servisi: `email-config.json` ve 3001 portu. `src/services/emailService.ts` aynı adrese istek ve tarayıcı localStorage şablon/log kayıtları içeriyor; çağrıların aktifliği ayrıca incelenecek.
