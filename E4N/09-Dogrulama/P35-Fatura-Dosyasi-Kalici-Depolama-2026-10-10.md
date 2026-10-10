# P35 — Fatura Dosyası Kalıcı Depolama ve Yetkili Erişime Taşıma Doğrulaması

**10 Ekim 2026.** E4N-107 teslim doğrulaması. Fatura dosyası kalıcı depolama entegrasyonu, yetkili yükleme ve indirme erişimi tamamlandı.

## 1. Kapsam ve Kurallar

- **Kalıcı Depolama (`invoice_files` Tablosu):**
  - Fatura dosyaları Vercel geçici diskinden ve harici public URL'lerden tamamen arındırılarak PostgreSQL `bytea` formatında kalıcı depolamaya bağlanmıştır.
  - Tablo bütünlüğü: `member_id` (üye FK) veya `visitor_id` (ziyaretçi FK) alanlarından tam olarak biri dolu olmak zorundadır (`CHECK(num_nonnulls(member_id, visitor_id) = 1)`).
  - Boyut ve dosya kısıtı: Yalnızca geçerli PDF dosyaları kabul edilir (en fazla 3 MB / 3.145.728 bayt).
  - SHA-256 içerik parmak izi (`fingerprint`) ile dosya bütünlüğü güvenceye alınır.
  - Satır Düzeyi Güvenlik (RLS) devrededir; `PUBLIC`, `anon` ve `authenticated` rolleri için tüm doğrudan izinler iptal edilmiştir (`REVOKE ALL`).
- **Yetkili Yükleme (`POST /api/admin/accounting/:type/:id/upload-invoice`):**
  - Yalnızca veritabanında aktif `ADMIN` rolüne sahip yöneticiler fatura yükleyebilir (`403`).
  - Hedef doğrulama: `MEMBER` için aktif abonelik kaydı, `VISITOR` için ödemesi onaylanmış ve KVKK kabulü bulunan ziyaretçi zorunludur.
  - Tekrar ve yarış güvenliği (Idempotency): Yönetici ve `request_key` çiftine dayalı advisory lock ve tekillik kısıtı. Aynı anahtarla aynı dosya gönderildiğinde mükerrer yükleme veya mükerrer mail göndermeden mevcut makbuzu döner (`replay: true`). Farklı dosya ile aynı anahtar denendiğinde `409` hatası döner.
  - Atomik Transaction: `invoice_files` kaydı ve hedef tablonun fatura URL'i (`users.subscription_invoice_url` veya `public_visitors.invoice_url = /api/invoices/:id`) tek işlemde commit edilir; veritabanı hatasında tam geri alma (`ROLLBACK`) uygulanır.
  - E-posta bildirimi: Fatura yüklemesinde tek bildirim denemesi (`ATTEMPTED`, `SENT` veya `UNKNOWN`) kaydedilir; SMTP hatası dosya kaydını bozmaz ve mükerrer bildirim engellenir.
- **Yetkili İndirme (`GET /api/invoices/:id`):**
  - Public fatura bağlantıları kesinlikle kapatılmıştır; faturalar yalnızca imzalı oturum ile yetkili uç noktadan indirilebilir.
  - Yönetici (`ADMIN`): Tüm faturaları indirebilir.
  - Üye (`MEMBER`): Yalnızca kendi adına düzenlenen faturaları indirebilir (`d.member_id === u.id`).
  - Başka bir üyenin faturasına erişim `404` ile engellenir.
  - Ziyaretçi faturalarına yalnızca yönetici erişebilir (`404` for members).
  - Anonim erişim `401` ile engellenir.
  - Yanıt başlıkları: `application/pdf`, `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, `Cache-Control: private, no-store`.
- **Web Entegrasyonu:**
  - `src/pages/AdminAccounting.tsx`: Muhasebe listesinde onaylı faturalar için `Faturayı İndir` yetkili indirme butonu, faturası olmayanlar için `Fatura Yükle` modalı.
  - `src/pages/MembershipRecords.tsx`: Üyeler için kendi faturalarını listeleme, dosya boyutu, tarih ve `Faturayı İndir` yetkili indirme butonu.
  - `src/pages/Membership.tsx`: Üye profiline `Fatura ve Ödeme Kayıtlarım` hızlı erişim butonu.
  - `src/pages/AdminSubscriptions.tsx`: Yönetim paneline `Muhasebe ve Fatura Yönetimi` doğrudan erişim butonu.

## 2. Doğrulama Kanıtları

1. **`server/test/invoices-contract.mjs` (İzole PG17 Docker):**
   - 8 eşzamanlı aynı anahtarlı yükleme yarışında tek dosya ve tek SMTP çağrısı doğrulandı: **PASS**.
   - Admin ve üye sahibi tarafından yetkili bayt indirme doğrulandı: **PASS**.
   - Başka üyenin faturasına erişim 404, anonim erişim 401 ile engellendi: **PASS**.
   - Ziyaretçi faturasına üye erişimi 404 ile engellendi: **PASS**.
   - Hedef güncelleme hatasında atomik rollback (sıfır yetim fatura kaydı) doğrulandı: **PASS**.
   - RLS ve rol izin kısıtlamaları (anon/authenticated doğrudan SELECT/INSERT denial 42501) doğrulandı: **PASS**.
   - Typed client transport (`invoicesApi.upload` ve `invoicesApi.download`) doğrulandı: **PASS**.
2. **`server/test/membership-records-contract.mjs`:**
   - Üye ve admin fatura kayıtları listesi ve sahiplik sınırları: **PASS**.
3. **`server/test/route-ownership-static.mjs`:**
   - 200 rota, 31 sağlayıcı korundu: **PASS**.
4. **`node server/test/isolated-smoke.mjs`:**
   - 28 şema sürümü, 50 tablo korundu (Sıfır DDL): **PASS**.
5. **`npm run check` ve `npm run build`:**
   - TypeScript ve Vite derlemesi hatasız: **PASS**.
