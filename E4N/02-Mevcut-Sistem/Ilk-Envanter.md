# İlk sistem envanteri ve audit bulguları

**Tarih:** 1 Ekim 2026  
**İncelenen üst repo commit'i:** `7ead1690ab1b7344fe2ea98d6217700e3f39e0ab`  
**Yöntem:** Kod ve yapılandırma incelemesi; canlı Supabase için yalnız şema ve toplu sayı sorguları. API/UI akışları çalıştırılarak doğrulanmadı. Mevcut çalışma ağacındaki değişiklikler bu incelemeden önce vardı.

## Sistemin sade açıklaması

E4N; üye, grup, etkinlik, ziyaretçi, referans, toplantı, puan, abonelik/ödeme, eğitim, blog ve yönetim ekranları olan bir platform. Web istemcisi çoğunlukla Express API'ye gider. Express API PostgreSQL'e bağlanır. Blog yönetimi ayrıca tarayıcıdan doğrudan Supabase Data API ve Storage kullanır. Expo mobil uygulaması API üzerinden aynı iş verilerine erişmeyi hedefler. [[E4N/02-Mevcut-Sistem/Veri-Tabani-ve-Veri-Akisi|Veritabanı haritası]] bağlantı ve kayıt yerlerini açıklar.

| Alan | Kaynak / giriş noktası | İlk durum |
|---|---|---|
| Web route ve erişim | `src/App.tsx`, `src/shared/Navigation.tsx` | Genel, üye ve admin ekranları tanımlı; admin route'ları aynı `ProtectedLayout` içinde, tek tek yetki kontrolü incelenecek. |
| Web API istemcisi | `src/api/api.ts`, Zustand store'ları | Geliştirmede `localhost:4005/api`, üretimde `/api`; JWT tarayıcı deposundan gönderiliyor. |
| API | `api/index.js` → `server/src/index.js` | Büyük tek dosyada çok sayıda endpoint; yalnız `adminRoutes` router'ı mount edilmiş görünüyor. `server/src/routes/*` dosyalarının çoğu bağlı değil. |
| DB ve migration | `server/src/config/db.js`, `server/src/config/migrate.js`, `server/init.sql` | PostgreSQL/Supabase veya Docker Postgres. Gerçek şema, `init.sql` ile tam aynı değil. |
| Mobil | `mobile/app`, `mobile/utils/api-client.ts`, `mobile/constants/api.ts` | Expo istemcisi API'ye gider; gerçek cihaz/üretim adresleri ayrıca doğrulanacak. |
| Deploy | `vercel.json`, `docker-compose*.yml`, `deploy/` | Vercel ve Docker yolları var; hangi yolun aktif üretim olduğu henüz doğrulanmadı. |

## Öncelikli bulgular

### AUD-001 — Canlı Supabase tablolarının erişimi

- **Modül:** Veritabanı / güvenlik.
- **Mevcut davranış:** Aktif `e4n` Supabase projesinin `public` şemasındaki 34 tabloda RLS kapalı. `users`, `payment_transactions`, `public_visitors`, `email_configurations` ve diğer örneklenen tablolarda `anon` için SELECT/INSERT/UPDATE izinleri var.
- **Kanıt:** Supabase `list_tables` ve `pg_class` / `has_table_privilege` salt okunur sorguları (1 Ekim 2026). İstemci anahtarı `src/api/supabase.ts` tarafından kullanılıyor. Değerler notlara alınmadı.
- **Çalıştırılarak doğrulandı mı?:** Şema/izin sorgusu evet; anonim HTTP erişimi ayrıca test edilmedi.
- **Durum:** Doğrulandı; kritik.
- **Hedef/aksiyon:** R15. Kullanılan Data API yüzeyleri ve erişim akışları ayrıştırılıp tablo bazlı RLS politikaları hazırlanmalı. [[E4N/09-Dogrulama/RLS-Risk-ve-Onarim-Taslagi|SQL taslağı ve sınırlar]].

### AUD-002 — Gizli değerlerin yapılandırmada bulunması

- **Modül:** Dağıtım / kimlik doğrulama.
- **Mevcut davranış:** `vercel.json` içinde düz metin veritabanı bağlantı değeri; `server/src/index.js` ve `server/src/middleware/auth.js` içinde `JWT_SECRET` için kod içi varsayılan değer var.
- **Kanıt:** İlgili dosyalar, commit ve çalışma ağacı. Gizli değerler burada tekrarlanmadı.
- **Çalıştırılarak doğrulandı mı?:** Statik inceleme evet; dağıtım ortamındaki gerçek kullanımı doğrulanmadı.
- **Durum:** Doğrulandı; kritik.
- **Aksiyon:** Değerlerin geçersiz kılınması, güvenli ortam değişkenine taşınması ve geçmişte yayılımının incelenmesi için ayrı güvenlik işi. Bağlantı kesintisi yaratabileceği için sıraya konmuş işlem planı gerekir.

### AUD-003 — Grup kabul durumunda sunucu yetkisi ve kapasite

- **Modül:** Grup kabulü.
- **Mevcut davranış:** `PUT /api/groups/:id/members/:userId`, `server/src/index.js` civarı 3376, JWT ister fakat bu handler'da rol/grup başkanlığı kontrolü görünmüyor. Durum gövdeden alınıp doğrudan yazılıyor; 35 kişi sınırı ve görüşme kaydı kontrolü de görünmüyor. `server/src/routes/groups.js` içindeki benzer handler, `index.js` tarafından mount edilmiyor.
- **Çalıştırılarak doğrulandı mı?:** Hayır; statik bulgu.
- **Durum:** Kanıtlı kod riski; gerçek API testi gerekli.
- **İlgili hedef:** R04, R07, R08, D08, D09.
- **Aksiyon:** Tüm kabul yolları ve canlı DB kısıtları doğrulandıktan sonra yetki/kapasite/hizmet kontrolü tasarla.

### AUD-004 — Shuffle önizlemesi ve kaydı tutarsız

- **Modül:** Dört aylık shuffle.
- **Mevcut davranış:** `src/pages/AdminShuffle.tsx` gerçek geçmiş yerine örnek `previous_group_id` ve döngüsel ilk dağılım üretiyor; tarih kontrolü demo için açık. `src/utils/shuffleAlgorithm.ts` aynı mesleği ayırıyor ancak 35 kapasite kontrolü yok. `POST /api/shuffle/save`, `server/src/index.js` civarı 3486, gelen atamaları işlem içinde yazıyor; grup/üye doğrulaması, kapasite/hizmet kontrolü ve dönem/idempotency kaydı görünmüyor. Canlı `group_members_status_check` yalnız `ACTIVE`/`REQUESTED` kabul ederken handler `INACTIVE` yazmayı deniyor. Yeniden atama `INSERT` yapıyor; mevcut çiftlerde unique kısıtına çarpabilir.
- **Çalıştırılarak doğrulandı mı?:** Hayır; kod ve canlı şema karşılaştırması.
- **Durum:** Kısmen uygulanmış; yüksek risk.
- **İlgili hedef:** R05, R07, D06, D09.
- **Aksiyon:** Gerçek dağılım/şema, önizleme ve transaction senaryolarını test et; canlıya yazmadan önce tasarım kararı.

### AUD-005 — Abonelik ve grup katılımı ayrı kayıtlarda ama akış birleşiyor

- **Modül:** Üyelik / grup.
- **Mevcut davranış:** `users.account_status`, `subscription_plan`, `subscription_end_date` üyelik için; `group_members` katılım için kullanılıyor. `POST /api/groups/:id/join` yalnız `account_status = ACTIVE` denetliyor. `DELETE /api/groups/:id/members/:userId` üyeliğe dokunmadan grup kaydını siliyor; çıkarılma geçmişi ve ikinci çıkarma yasağı kanıtlanmadı.
- **Çalıştırılarak doğrulandı mı?:** Hayır; statik.
- **Durum:** Kısmen uygulanmış.
- **İlgili hedef:** R01, R10–R12, D01–D04, D07.
- **Aksiyon:** Üyelik, hak ve çıkarma uçtan uca izlenecek.

### AUD-006 — Puan modeli dönemli olay kaydı olarak doğrulanmadı

- **Modül:** Puan.
- **Mevcut davranış:** `users.performance_score` ve `performance_color` var; `server/src/index.js` ve `server/src/utils/scoring.js` içinde benzer hesaplama kodu bulunuyor. Aylık puan olayları, kural sürümü ve otomatik çıkarma bağı ilk taramada kanıtlanmadı.
- **Çalıştırılarak doğrulandı mı?:** Hayır; statik.
- **Durum:** Kısmen doğrulandı.
- **İlgili hedef:** R09–R11, D01–D04.
- **Aksiyon:** Cron tetikleri, history tablosu ve canlı şema ayrıntıları incelenecek.

### AUD-007 — Baseline kalite ve kaynak ayrımı

- **Modül:** Repo / doğrulama.
- **Mevcut davranış:** `npm run check` başarılı. `npm run lint` 763 hata, 21 uyarıyla başarısız; kapsamına `mobile/` da giriyor. `mobile` gitlink/.git yapısı için `.gitmodules` eşlemesi yok. `deploy/api` ve `server` benzer ama farklılaşmış kopyalar; gerçek üretim girişinin doğrulanması gerekli.
- **Çalıştırılarak doğrulandı mı?:** Evet, komutlar çalıştırıldı.
- **Durum:** Doğrulandı.
- **Aksiyon:** Baseline'ı yeni değişikliklerden ayır; aktif deploy yolunu doğrula.

### AUD-008 — Yerel bağlantı ve port uyuşmazlığı

- **Modül:** Geliştirme ortamı / veritabanı.
- **Mevcut davranış:** Web API istemcisi geliştirmede `localhost:4005` kullanıyor; `server/.env` ve `run_locally.ps1` API'yi 4000 portunda başlatıyor. Yerel DB ayarı `localhost:5433`, fakat o port dinlemiyor ve Docker konteyneri çalışmıyor. Salt okunur bağlantı denemesi `ECONNREFUSED` verdi.
- **Kanıt:** `src/api/api.ts`, `server/.env` içindeki yalnız host/port/ad alanları, `run_locally.ps1`, `docker ps`, `Get-NetTCPConnection` ve DB bağlantı denemesi. Kimlik bilgileri not edilmedi.
- **Durum:** Doğrulandı; yerel çalıştırma engeli.
- **Aksiyon:** Geliştirme portları ve DB başlangıç rehberi E4N-61 kapsamında doğrulanıp düzeltme için planlanmalı.

## Sıradaki denetim

1. Bütün route'ları ve çağırdıkları API/tabloları eşle.
2. Aktif/ölü kodu ayır; `server` ile `deploy/api` farkını incele.
3. Rol, kabul, puan, shuffle ve bilet haklarını test verisiyle uçtan uca doğrula.
4. Canlı şema/migration farkını ve veri saklama güvenliğini tamamla.

Canlı verinin içerikleri, kişi bilgileri ve gizli anahtarlar bu notta saklanmaz.
