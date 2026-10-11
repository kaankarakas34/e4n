# E4N Gizli Değer Rotasyonu ve JWT Yapılandırma Rehberi (SEC-02 / E4N-59)

## 1. Tehdit Modeli ve Çözülen Güvenlik Açığı

### 1.1 Eski Durum ve Riskler
Eski kod tabanında tespit edilen kritik güvenlik bulguları:
1. **Sabit Kodlu Geri Dönüş Parolası (Hardcoded Fallback Secret):**
   - `server/src/index.js`, `server/src/middleware/auth.js`, `server/src/routes/auth.js`, `server/src/routes/admin.js` dosyalarında `process.env.JWT_SECRET || '310acce7e62c4e9f16ce17a04d6cbdaf5a859926f896a8e85e1dcfa095378333b'` kullanılıyordu.
   - `server/src/membership-referrals.js` dosyasında `process.env.JWT_SECRET || 'web_browser_fixture_only'` kullanılıyordu.
   - `deploy/api/src/index.js` ve `.env` dosyalarında `JWT_SECRET=supersecretkey123` bulunuyordu.
   - *Tehdit:* `JWT_SECRET` ortam değişkeni tanımlanmadığında veya zayıf bırakıldığında, depoyu okuyabilen herhangi bir saldırgan `ADMIN` rolüne sahip geçerli JWT belirteçleri imzalayarak kimlik doğrulamasını bütünüyle atlatabilirdi.
2. **`.env.example` Dosyasında Hassas Veriler:**
   - `server/.env.example` içinde gerçek veya eski Sipay provizyon anahtarları (`SIPAY_APP_ID`, `SIPAY_APP_SECRET`, `SIPAY_MERCHANT_KEY`) bulunuyordu.

### 1.2 Hedef Güvenli Mimari (`server/src/config/security.js`)
- **Tek Merkezden Yönetim:** JWT imzalama, doğrulama ve ortam değişkeni denetimi `security.js` modülünde toplandı.
- **Fail-Fast Üretim Bariyeri:** `NODE_ENV === 'production'` modunda:
  - `JWT_SECRET` zorunludur; eksikse sunucu ayağa kalkmaz (`MISSING_JWT_SECRET`).
  - `JWT_SECRET` en az 32 karakter olmalıdır (`INSUFFICIENT_SECRET_LENGTH`).
  - Bilinen zayıf/depo varsayılanları kara listeye alınmıştır (`DISALLOWED_DEFAULT_SECRET`).
- **Geliştirme / Test İzolasyonu:** Yalnızca üretim dışı ortamlarda kontrollü geçici anahtarlar kullanılır; üretimde sabit değerler kesinlikle reddedilir.
- **Sıfır Kesintili Rotasyon (Zero-Downtime Rotation):** `JWT_SECRET_PREVIOUS` desteği ile oturumlar kesilmeden anahtar rotasyonu sağlanır.

---

## 2. Sıfır Kesintili JWT Anahtar Rotasyonu Prosedürü

Kullanıcıların aktif oturumlarını aniden sonlandırmadan (`401/403` almadan) JWT anahtarı değiştirmek için iki aşamalı rotasyon uygulanır:

### Aşama 1: Yeni Anahtarı Devreye Alma (Geçiş Aşaması)
1. Güçlü yeni bir 64 karakterlik rastgele anahtar üretin:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Vercel / sunucu ortam değişkenlerini güncelleyin:
   - `JWT_SECRET_PREVIOUS`: Mevcut (eski) anahtarın değerine eşitlenir.
   - `JWT_SECRET`: Yeni üretilen anahtarın değerine eşitlenir.
3. Yeni dağıtımı (deployment) gerçekleştirin.
4. **Davranış:**
   - Yeni giriş yapan kullanıcılara yeni `JWT_SECRET` ile imzalanmış belirteçler verilir.
   - Eski belirteç taşıyan mevcut kullanıcılar `verifyJwt` tarafından `JWT_SECRET_PREVIOUS` ile doğrulanmaya devam eder.

### Aşama 2: Eski Anahtarı Emekliye Ayırma (Kapanış Aşaması)
1. Belirteç yaşam süresi (24 saat) tamamlandıktan sonra:
   - `JWT_SECRET_PREVIOUS` ortam değişkenini Vercel / sunucudan kaldırın.
2. Yeniden dağıtın.
3. Artık sadece yeni `JWT_SECRET` geçerlidir; eski anahtar tamamen geçersizdir.

---

## 3. Veritabanı Parolası Rotasyonu Prosedürü

1. **Supabase / PostgreSQL Havuzunda Yeni Parola Belirleme:**
   - Supabase Dashboard -> Project Settings -> Database -> Reset Database Password.
   - Yeni güçlü parola belirlenir (min 20 karakter).
2. **Vercel Ortam Değişkenini Güncelleme:**
   - `DATABASE_URL` (veya `POSTGRES_URL`) yeni parola ile güncellenir:
     `postgresql://postgres.[ref]:[NEW_PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require`
3. **Yeniden Dağıtım ve Doğrulama:**
   - `/api/health-check` uç noktası çağrılarak `dbAttempt: "success"` doğrulanır.
   - Eski bağlantı havuzu bağlantıları otomatik olarak sonlandırılır.

---

## 4. Sipay Ödeme Anahtarları Rotasyonu Prosedürü

1. Sipay Sanal POS panelinden yeni `app_id`, `app_secret` ve `merchant_key` temin edilir.
2. Vercel ortam değişkenleri güncellenir:
   - `SIPAY_APP_ID`: Yeni App ID
   - `SIPAY_APP_SECRET`: Yeni App Secret
   - `SIPAY_MERCHANT_KEY`: Yeni Merchant Key
3. Dağıtım sonrası test ödeme başlatma sözleşmesi izole ortamda doğrulanır.

---

## 5. Vercel CRON_SECRET Rotasyonu Prosedürü

1. Yeni 64 karakterlik gizli anahtar üretilir:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Vercel Environment Variables:
   - `CRON_SECRET` yeni değere eşitlenir.
3. Vercel Cron tetikleyicileri otomatik olarak `Authorization: Bearer [CRON_SECRET]` başlığı ile istek gönderir.
4. `/api/cron/web-jobs/:job` rotası `timingSafeEqual` kullanarak yeni anahtarı doğrular.
