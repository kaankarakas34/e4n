# BAŞ-02 / E4N-162 Üyelik Referansı ve Web Görünümü — 10 Ekim 2026

## 1. Teslim Kapsamı ve Yapılanlar

- **E4N-162 (BAŞ-02) Done:** Davetiye zorunluluğu kalkarken kimin kimin üyelik referansı olduğunun izlenmesi ve kalıcı ilişki yapısı kuruldu.
  1. **Referanssız Kayıt Özgürlüğü:**
     - Davetiye zorunlu değildir; kullanıcı referans kodu/ID olmadan doğrudan normal kayıt olabilir.
     - Gizli davet/token zorunluluğu yoktur; referans alanı tamamen opsiyoneldir.
  2. **Referanslı Kayıt ve Çözümleme:**
     - URL parametresi (`?ref=...`, `?referral=...`), davet linki (`token` içindeki `inviter_id`) veya doğrudan girilen referans kodu ile üyelik referansı çözümlenir (`resolveReferrer`).
     - Public doğrulama uç noktası: `GET /api/auth/referral-preview` ile kayıt öncesinde sponsorun ad ve şirket bilgisi teyit edilir.
     - `POST /api/auth/register` transaction içinde `recordMembershipReferral` çağrısıyla kalıcı olarak kaydedilir.
  3. **Güvenlik ve İnvaryant Korumaları:**
     - **Kendi Kendine Referans Engeli (`self-referral`):** Yeni üyenin kendi kimliğini veya referans verenle aynı e-postayı referans göstermesi `400` hatasıyla engellenir.
     - **Geçersiz/Sahte ID Engeli:** Sistemde bulunmayan veya silinmiş referans kodları/UUID'leri `400` ile reddedilir.
     - **Yetkisiz Değiştirme Koruması:** Referrer veya sıradan üyeler başkasının referans kaydını değiştiremez.
     - **Puan/Ücret/Ödül Muafiyeti:** Kural gereği üyelik referansına puan, ödül veya ücret mekanizması eklenmemiştir; ticari iş yönlendirmesi (`referrals`) ile ayrılmıştır.
  4. **Yetkili Admin Görünümü ve Audit Snapshot Geçmişi:**
     - `GET /api/admin/members`: Her üye satırında `referred_by: { id, name, email, source }` ve `referrals_count: number` (getirdiği üye sayısı) bilgisi sunulur.
     - `GET /api/admin/members/:id/referrals`: Seçilen üyenin referans vereni, referans olduğu üyeler (`referredMembers`) ve geçmiş düzeltme listesi (`history`) sunulur.
     - `POST /api/admin/members/:id/set-referrer`: Yalnızca ADMIN tarafından ve zorunlu gerekçe (`reason`, en az 3 karakter) ile referans düzeltilir; tüm eski/yeni sponsorlar snapshot olarak audit geçmişine kaydedilir.
  5. **Doğrulanabilir Legacy İlişki:**
     - `visitors` tablosunda `status = 'JOINED'` olan eski kayıtlar otomatik olarak `source: 'VISITOR_CONVERSION'` olarak haritalanır ve korunur. Bilinmeyen referanslar tahmin edilmez.

## 2. Web / Arayüz Güncellemeleri

- `src/pages/Register.tsx`:
  - URL'deki `?ref=` parametresi ve `token` otomatik okunur.
  - Kayıt formunda "Üyelik Referansı (Opsiyonel)" alanı ve canlı sponsor önizleme rozeti (`✓ Referans Veren: X Y (Şirket)`) eklendi.
  - Referans olmadan da doğrudan kayıt olabilme açıklaması sağlandı.
- `src/pages/AdminMembers.tsx`:
  - Üye listesine "Üyelik Referansı" sütunu eklendi (`Ref: X` rozeti ve `N üye getirdi` sayacı).
  - "İncele / Düzelt" butonu ile açılan detaylı modal eklendi:
    - Mevcut sponsor kartı,
    - Getirdiği üyelerin listesi ve kayıt tarihleri,
    - Geçmiş düzeltmeler (audit history),
    - Yeni sponsor atama / kaldırma formu ve zorunlu gerekçe alanı.
- `src/api/api.ts`:
  - `getReferralPreview`, `getMyMembershipReferral`, `getAdminMemberReferrals`, `setAdminMemberReferrer` istemci metodları eklendi.

## 3. Doğrulama Kanıtları

- `npm --prefix server run test:membership-referral`: **PASS**
  - Referral preview (public),
  - Referanssız kayıt serbestliği,
  - Referanslı kayıt ve sponsor getirdiği üyeler listesi,
  - Kendi kendine referans (self-referral) engeli,
  - Geçersiz/forged referans kimliği engeli,
  - Üyenin kendi referans görünümü (`/api/user/membership-referral`),
  - Yetkisiz erişim engeli (403),
  - Gerekçeli admin referans düzeltmesi ve audit snapshot geçmişi,
  - Verifiable legacy visitor fallback (`VISITOR_CONVERSION`),
  - Admin üye listesi `referred_by` ve `referrals_count` entegrasyonu.
- `npm --prefix server run test:routes`: **PASS** (199 rota, 31 sağlayıcı)
- `node server/test/isolated-smoke.mjs`: **PASS** (50 tablo, 28 sürüm korundu, 0 DDL)
- `npm --prefix server run test:removal-ban`: **PASS**
- `npm --prefix server run test:score-removal`: **PASS**
- `npm --prefix server run test:score-finalization`: **PASS**
- `npm --prefix server run test:score-ledger`: **PASS**
- `npm run check`: **PASS** (0 TypeScript hatası)
- `npm run build`: **PASS** (Vite derlemesi başarılı)
