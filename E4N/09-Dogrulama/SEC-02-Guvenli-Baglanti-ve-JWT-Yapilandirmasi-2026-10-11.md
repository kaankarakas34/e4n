# SEC-02 — Depodaki Veritabanı Bağlantısı ve JWT Varsayılanını Güvenli Hale Getir (E4N-59)

**Tarih:** 11 Ekim 2026  
**Görev:** [E4N-59 (SEC-02 / Depodaki veritabanı bağlantısı ve JWT varsayılanını güvenli geçişe hazırla)](https://linear.app/e4n/issue/E4N-59) -> **DONE**  
**Milestone:** Sprint 6 — Operasyon ve sürüm  
**Kapsam ve Hedef:**  
Kaynak kodundaki sabit kodlu geri dönüş JWT parolalarının (`'310acce7...'`, `'supersecretkey123'`) temizlenmesi; JWT imzalama, doğrulama ve ortam denetimlerinin merkezi bir güvenlik modülünde (`server/src/config/security.js`) toplanması; üretimde (`NODE_ENV === 'production'`) eksik, kısa (<32 karakter) veya bilinen zayıf anahtarları anında reddeden fail-fast güvenlik bariyerinin kurulması; sıfır kesintili (zero-downtime) anahtar rotasyonu altyapısının (`JWT_SECRET_PREVIOUS`) entegre edilmesi; `.env.example` şablonlarındaki hassas/gerçekçi Sipay ve JWT anahtarlarının dokümante edilmiş yer tutuculara dönüştürülmesi; statik kaynak taraması ve otomatik güvenlik sözleşme testiyle doğrulanması.

---

## 1. Giderilen Güvenlik Açıkları ve Mimari İyileştirmeler

1. **Sabit Kodlu Geri Dönüş Parolaları Temizlendi:**
   - Eski Kod: `server/src/index.js`, `server/src/middleware/auth.js`, `server/src/routes/auth.js`, `server/src/routes/admin.js` ve `server/src/membership-referrals.js` içinde `process.env.JWT_SECRET || '310acce7...'` ve `process.env.JWT_SECRET || 'web_browser_fixture_only'` kullanılıyordu.
   - İyileştirme: Tüm bu noktalar `server/src/config/security.js` içindeki `getJwtSecret()` ve `verifyJwt()` fonksiyonlarına bağlandı.
2. **Merkezi Güvenlik Modülü (`server/src/config/security.js`):**
   - **Fail-Fast Üretim Koruması:** `NODE_ENV === 'production'` modunda `JWT_SECRET` eksikse (`MISSING_JWT_SECRET`), 32 karakterden kısaysa (`INSUFFICIENT_SECRET_LENGTH`) veya bilinen 11 zayıf anahtardan biriyse (`DISALLOWED_DEFAULT_SECRET`) sunucu derhal hata fırlatarak çalışmayı durdurur.
   - **Geliştirme / Test İzolasyonu:** Üretim harici ortamlarda kontrollü geçici anahtarlar kullanılır; sabit genel sırlar üretimde asla kabul edilmez.
   - **Veritabanı Yapılandırma Doğrulaması:** `validateSecurityConfig()` ile veritabanı bağlantı parametrelerinin eksikliği tespit edilir (`MISSING_DB_CONFIG`).
3. **Sıfır Kesintili JWT Rotasyonu:**
   - `JWT_SECRET_PREVIOUS` ortam değişkeni desteği eklendi.
   - Rotasyon sırasında eski belirteçler ikinci anahtarla doğrulanırken, tüm yeni belirteçler yeni anahtarla imzalanır.
4. **`.env.example` Şablonlarının Arındırılması:**
   - `server/.env.example` içindeki gerçekçi Sipay anahtarları (`SIPAY_APP_ID`, `SIPAY_APP_SECRET`, `SIPAY_MERCHANT_KEY`) ve zayıf `JWT_SECRET=supersecretkey123` güvenli dokümantasyon yer tutucularına dönüştürüldü.
   - `deploy/api/.env.example` dosyasına `JWT_SECRET` şablonu eklendi.

---

## 2. Otomatik Sözleşme Testi Kanıtı

- **Test Dosyası:** `server/test/sec-jwt-and-db-config-contract.mjs`
- **Çalıştırma:** `node server/test/sec-jwt-and-db-config-contract.mjs`
- **Sonuç:** **PASS (0 Hata)**
- **Doğrulanan Güvenlik Senaryoları:**
  1. *Üretim Eksik Anahtar Reddi:* `JWT_SECRET` boş/tanımsız iken `MISSING_JWT_SECRET` fırlatıldığı kanıtlandı.
  2. *Üretim Kısa Anahtar Reddi:* 32 karakterden kısa anahtarlarda `INSUFFICIENT_SECRET_LENGTH` fırlatıldığı kanıtlandı.
  3. *Üretim Kara Liste Reddi:* 11 bilinen zayıf/depo varsayılan anahtarın tamamında `DISALLOWED_DEFAULT_SECRET` fırlatıldığı kanıtlandı.
  4. *Geçerli Üretim Anahtarı:* 32+ karakterlik güvenli anahtarların başarıyla kabul edildiği kanıtlandı.
  5. *Token İmzalama ve Doğrulama:* Sahte veya tahrif edilmiş (tampered payload) belirteçlerin `JsonWebTokenError` ile reddedildiği kanıtlandı.
  6. *Sıfır Kesintili Rotasyon:* `JWT_SECRET_PREVIOUS` ile eski anahtarlı belirteçlerin geçiş süresince geçerli kaldığı, yeni belirteçlerin yeni anahtarla üretildiği, grace period bitiminde eski anahtarın başarıyla geçersiz kılındığı kanıtlandı.
  7. *Veritabanı Yapılandırma Doğrulaması:* Üretimde DB ayarları eksik olduğunda `MISSING_DB_CONFIG` ile uygulamanın açılışının engellendiği kanıtlandı.
  8. *Statik Kod Taraması:* `server/src/**/*.js` kaynak dosyalarında hiçbir sabit kodlu geri dönüş parolasının veya `process.env.JWT_SECRET || '...'` kalıbının kalmadığı (0 eşleşme) kanıtlandı.
  9. *Şablon Taraması:* `.env.example` dosyalarında hiçbir gerçekçi anahtar veya zayıf varsayılan kalmadığı kanıtlandı.

---

## 3. Ek Test ve Regresyon Doğrulamaları

- `npm run check`: 203 Express rotası, 31 sağlayıcı, 17 legacy modül, 0 TypeScript hatası (PASS).
- `node server/test/membership-referral-contract.mjs`: 11/11 senaryo (PASS).
- `node server/test/sec-rls-access-contract.mjs`: 50/50 tablo RLS ve erişim matrisi (PASS).

---

## 4. Dokümantasyon

- Kapsamlı rotasyon rehberi `server/docs/sec-secret-rotation-and-jwt-guide.md` dosyasına kaydedildi.
- Bu rehber veritabanı, JWT, Sipay, CRON_SECRET ve SMTP gizli değerlerinin adım adım rotasyon prosedürlerini içermektedir.
