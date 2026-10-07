# Veritabanı bağlantıları ve veri akışı

**1 Ekim 2026, salt okunur denetim.** Aktif Supabase projesi `e4n` (`kaoagsuxccwgrdydxros`, `ap-southeast-2`) repo yapılandırmasındaki proje kimliğiyle eşleşti. Ayrı `e4ncrm` projesi mevcut ama `INACTIVE`; bu repoyla bağlantısı kanıtlanmadı. Kullanıcı ve ödeme satırlarının içeriği okunmadı.

## Bağlantı yolları

| İstemci / çalışma biçimi | Bağlantı | Kayıt yeri / kanıt |
|---|---|---|
| Web uygulaması | `src/api/api.ts` → geliştirmede `localhost:4005/api`, üretimde `/api` | Express API → PostgreSQL. `server/src/config/db.js`: önce `DATABASE_URL`/`POSTGRES_URL`, yoksa `DB_*`. Mevcut yerel API ayarı 4000 olduğundan geliştirme adresleri uyuşmuyor. |
| Vercel API | `vercel.json` rewrite → `api/index.js` → `server/src/index.js` | Yapılandırmada Supabase `e4n` pooler bağlantısı var. Değer not edilmedi. |
| Docker | `docker-compose.yml`: backend `postgres` servisine gider | Yerel PostgreSQL 16, kalıcı `pgdata` Docker volume. Denetim anında `docker ps` boş; 5433 dinlemiyor. |
| Mobil Expo | `mobile/utils/api-client.ts` → `mobile/constants/api.ts` | API üzerinden; doğrudan Supabase DB istemcisi bulunmadı. Geliştirme adresi yerel ağ, üretim adresi kodda sabit; gerçek deploy ile uyuşması kontrol edilecek. |
| Blog yönetimi | `src/pages/AdminBlogEditor.tsx`, `AdminBlogs.tsx` → `src/api/supabase.ts` | Doğrudan Supabase `public.blogs`; görseller public `blog-images` Storage bucket. Bu yol Express API yetkisinden bağımsız. |
| Tarayıcı yerel depolama | Zustand `persist`, `localStorage` | Kimlik oturumu ve bazı istemci store'ları, tema, e-posta şablonu/logları. Sunucu DB kaydıyla eşdeğer kabul edilmez. |
| Mobil yerel depolama | `mobile/utils/secure-storage.ts` | Native cihazda SecureStore, mobil web'de localStorage: API token'ı. |
| Sunucu dosyaları | `server/src/index.js` `/uploads` ve multer | Vercel'de geçici OS dizini, yerelde `uploads/`; kalıcılık ve ilişkili URL'ler ayrıca denetlenecek. |

Kök `.env` dosyasındaki `VITE_SUPABASE_URL` etkin `e4n` projesini işaret ediyor. `server/.env` ve `deploy/api/.env` ise `localhost:5433/e4n2db` kullanacak biçimde ayarlı; bu yerel bağlantıya salt okunur deneme `ECONNREFUSED` ile başarısız oldu. Makinede 5432 dinleyen başka bir PostgreSQL süreci var, ancak bu E4N konfigürasyonunun hedefi olduğu kanıtlanmadı; ona bağlanılmadı.

## Canlı Supabase şeması

`public` şemasında **34 tablo** listelendi. Tümünün 1 Ekim 2026 tarihli `count(*)` sonucu [[E4N/02-Mevcut-Sistem/Canli-Supabase-Tablolari|Canlı Supabase Tabloları]] notunda. Aşağıdaki rakamlar bu sorgularla doğrulanmıştır; `list_tables` aracındaki `rows: 0` özeti gerçek sayım olarak alınmadı.

| Alan | Tablolar / ana ilişki | Doğrulanmış kayıt sayısı |
|---|---|---:|
| Üye ve abonelik | `users`: hesap, rol, şirket, üyelik durumu/plan/bitiş, performans | 23 |
| Kapalı gruplar | `groups`, `group_members` → `users` | 1 grup, 11 grup üyeliği |
| Açık/diğer takım | `power_teams`, `power_team_members` | 3 takım, 2 takım üyeliği |
| Etkinlik/bilet | `events`, `attendance`, `event_tickets` → etkinlik/üye | 6 etkinlik, 2 katılım, 0 bilet |
| Ödeme | `payment_transactions` → `users` | 5 |
| Ziyaretçi/başvuru | `visitors`, `public_visitors` → isteğe bağlı üye/etkinlik | 402 `public_visitors` |
| Referans/görüşme | `referrals`, `one_to_ones`, `friend_requests` | Hepsinde 0 |
| Eğitim | `education`, `courses`, `lessons`, `materials`, `exams`, `questions`, `exam_attempts`, `enrollments`, `achievements`, `user_achievements` | Hepsinde 0 |
| İçerik ve operasyon | `blogs`, `blog_categories`, `notifications`, `champions`, `tickets`, `ticket_messages`, `system_settings`, `email_configurations`, `event_reminders_sent`, `professions` | 0 blog, 1 e-posta ayarı, 105 meslek, 3 sistem ayarı |

## Hangi işlem nereye yazar?

| İşlem | Ana kayıt yeri | Kaynak kanıtı |
|---|---|---|
| Üye kayıt/profil | `users` | `server/src/index.js` `POST /api/auth/register`, `PUT /api/users/me` |
| Abonelik/yenileme | `users.subscription_*`, `account_status`; ödeme denemesi `payment_transactions` | `POST/PUT /api/memberships`, `POST /api/payment/pay`, ödeme callback'i |
| Grup başvuru/kabul/çıkarma | `group_members`, bağlantı `groups` ve `users` | `POST /api/groups/:id/join`, `PUT/DELETE /api/groups/:id/members/:userId` |
| Takım başvuru | `power_team_members`, `power_teams` | `POST /api/power-teams/:id/join` |
| Etkinlik/kayıt/bilet | `events`, `attendance`, `event_tickets` | `POST /api/events`, `POST /api/events/:id/register`, ödeme callback'i |
| Ziyaretçi/başvuru | `visitors`, `public_visitors` | `POST /api/visitors`, `POST /api/visitors/apply`, ödeme callback'i |
| Referans ve birebir görüşme | `referrals`, `one_to_ones` | `POST /api/referrals`, `POST /api/one-to-ones` |
| Puan | `users.performance_score/color`; kod `user_score_history` tablosuna da yazmayı deniyor | `server/src/index.js` puan hesaplayıcı; canlı `public` şemada `user_score_history` bulunmadı |
| Blog ve görsel | `blogs` Data API, `blog-images` Storage | `src/pages/AdminBlogEditor.tsx`, `AdminBlogs.tsx` |
| E-posta ayarı | `email_configurations`, şablonların bir kısmı `system_settings`; web tarafında ayrıca localStorage | `server/src/index.js`, `src/services/emailService.ts` |
| Fatura dosyası | Sunucu `uploads/` veya Vercel geçici dizini; URL `users.subscription_invoice_url` / `public_visitors.invoice_url` | `server/src/index.js` `upload.single('invoice')` |

Bu eşleme kodun yazma niyetini gösterir; endpointlerin tümü çalıştırılarak doğrulanmadı. Özellikle Vercel geçici dosya dizininin kalıcılığı incelenecek.

`users` içinde üyelik ve şirket alanları aynı satırda. `group_members` grup başvuru/katılım durumunu tutuyor. Ayrı çıkarılma olayı, yasak bitişi veya puan olayı tablosu 34 tablo listesinde bulunmadı. Bu, mevcut şema envanteri sonucudur; çalışma zamanı davranışı ayrıca incelenecek.

## Şema kaynakları ve uyuşmazlıklar

- `server/init.sql` Docker ilk kurulum şeması. `server/src/config/migrate.js` uygulama açılışında ek tablo/kolonlar oluşturuyor; `supabase_list_migrations` canlı projede kayıt döndürmedi. Canlı şemanın bu iki kaynaktan hangileriyle ne zaman oluştuğu bilinmiyor.
- Canlı `group_members.status` kısıtı yalnız `ACTIVE` ve `REQUESTED` kabul ediyor. Shuffle endpoint'i `INACTIVE` yazıyor; bu işlem mevcut kısıtla uyumsuz.
- Canlı `trg_group_members_unique_profession` etkin; aynı mesleği grup içinde önlemeye çalışıyor. İş kuralı hedefindeki çoklu/çakışan hizmet matrisiyle aynı değil.
- `groups.cycle_months` alanı var, başlangıç SQL'sinde varsayılan **6**; hedef **4 ay**. Canlı varsayılan ayrıca doğrulanacak.
- Storage'da public `blog-images` bucket'ı var. Blog yazılarına eklenen görseller orada; diğer yüklemelerin yerini ayrı izlemek gerekiyor.
- API kaynaklarında `generated_leads`, `messages`, `revenue_entries`, `user_score_history` tablo adlarına referanslar bulunuyor; 34 canlı `public` tablo listesinde bu adlar görünmedi. Bu yolların aktifliği ve hataya etkisi ilgili endpoint bazında doğrulanacak.

## Kritik güvenlik bulgusu

Canlı `public` tablolarının 34'ünde RLS kapalı. Örneklenen kişisel/ödeme/e-posta tablolarında `anon` rolüne SELECT, INSERT ve UPDATE yetkisi verildiği salt okunur izin sorgusuyla doğrulandı. Uygulamada `VITE_SUPABASE_ANON_KEY` ile doğrudan Supabase istemcisi de var. Bu yapı veri erişimi açısından kritik risk oluşturuyor. Ayrıntı ve **uygulanmamış** SQL taslağı: [[E4N/09-Dogrulama/RLS-Risk-ve-Onarim-Taslagi]].

`vercel.json` içindeki veritabanı bağlantı bilgisi ve kod içi JWT varsayılanı gizli değer taşıyor. Değerler bu bilgi bankasına kopyalanmadı. Düzenleme ve anahtar yenileme, aktif dağıtım bağlantısı doğrulanarak planlanmalı.
