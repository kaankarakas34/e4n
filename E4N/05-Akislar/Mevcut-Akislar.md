# Mevcut iş akışları — statik harita

**Kapsam:** 1 Ekim 2026 kaynak kodu ve salt okunur canlı şema sorguları. Akışlar uçtan uca çalıştırılmadı. Amaç, mevcut davranışı tarif etmektir; master plandaki hedef kurallarla karşılaştırma sonraki aşamadır.

| Akış | Giriş → işlem → kayıt | Kod kanıtı | Doğrulama durumu |
|---|---|---|---|
| Üye kaydı | Web `Register` → `/api/auth/register` → gerekirse `professions`, sonra `users` | `src/App.tsx:142–149`, `server/src/index.js:541–600` | Statik. Normal kayıt davet token'ı ister; `COMMUNITY_MEMBER` için farklı yol var. |
| Giriş | `/api/auth/login` → `users` şifre kontrolü → aktif `group_members` sorgusu → JWT ve kullanıcı durumu | `server/src/index.js:891–929` | Statik. Üyelik bitişi login yanıtında PASSIVE hesaplanıyor; DB güncellemesi yorumda. |
| Genel ziyaretçi başvurusu | `/api/visitors/apply` → `public_visitors`; reddedilmiş başvuru ve etkinlik için tekrar kontrolü | `server/src/index.js:2734–2813` | Statik. Endpoint içinde çalışma anında `ALTER TABLE` komutları da var. |
| Üyelik/abonelik | Admin üyelik işlemleri veya ödeme callback'i → `users.account_status`, `subscription_plan`, `subscription_end_date` | `server/src/index.js:3853–4015`, `2404–2432` | Statik; ödeme ve admin izinleri ayrı doğrulanacak. |
| Ödeme | `/api/payment/pay` → sağlayıcı isteği ve `payment_transactions` PENDING; başarılı callback → SUCCESS ve eyleme göre `users`, `attendance`, `event_tickets` veya `public_visitors` | `server/src/index.js:2178–2599` | Statik; gerçek ödeme yapılmadı. |
| Grup başvurusu | `/api/groups/:id/join` → `users.account_status` kontrolü → `group_members` REQUESTED | `server/src/index.js:3340–3362` | Statik; görüşme adımı ayrı bir kayıt olarak görülmedi. |
| Grup kabul/çıkarma | `/api/groups/:id/members/:userId` PUT → `group_members.status`; DELETE → grup üye satırının silinmesi | `server/src/index.js:3376–3457` | Statik. Çıkarılma geçmişi ayrı tutulmuyor. |
| Puan güncelleme | Katılım, referans, ziyaretçi, birebir ve eğitim olayları → son 6 ay hesaplama → `users.performance_score/color`, ardından `user_score_history` yazma denemesi | `server/src/index.js:299–407`, çağrılar `1043`, `1123`, `1277`, `1409`, `1452` | Canlı `public` şemada `user_score_history` tablosu yok. Hesaplama davranışı test edilmeli. |
| Shuffle | `AdminShuffle` içinde örnek geçmiş/dağılım → `distributeMembers` → `/api/shuffle/save` → grup atamaları | `src/pages/AdminShuffle.tsx:60–175`, `src/utils/shuffleAlgorithm.ts`, `server/src/index.js:3486–3536` | Statik + canlı kısıt karşılaştırması. Kaydetme yolu `INACTIVE` yazıyor; canlı kısıt bunu kabul etmiyor. |
| Etkinliğe kayıt | `/api/events/:id/register` → `attendance`; bilet açıksa `event_tickets`; ardından e-posta/puan çağrısı | `server/src/index.js:1291–1410` | Statik; canlıda 6 etkinlik, 2 katılım, 0 bilet var. |
| Blog | Yönetim arayüzü → doğrudan Supabase `blogs` Data API; görsel → `blog-images` Storage | `src/pages/AdminBlogEditor.tsx`, `AdminBlogs.tsx` | Statik; canlıda 0 blog ve 0 kategori var. |
| E-posta/hatırlatma | API `email_configurations` veya ortam ayarı → SMTP; günlük cron `notifications` ve `users.last_reminder_trigger` | `server/src/index.js:106–166`, `3663–3723` | Statik; cron'un üretimde koşması doğrulanmadı. |

## Canlı verinin toplu görünümü

1 Ekim 2026 sorgusunda 23 `users` satırının 21'i ACTIVE, 2'si PENDING; roller 14 MEMBER, 6 COMMUNITY_MEMBER, 1 ADMIN, 1 PRESIDENT, 1 VICE_PRESIDENT. Tek grup satırında `cycle_months = 6`; 11 `group_members` satırının tamamı ACTIVE. Beş `payment_transactions` satırının 3'ü PENDING, 2'si SUCCESS. Bu sayılar kişi bazlı veri içermez ve anlık fotoğraftır.

Tam route/API listeleri: [[E4N/02-Mevcut-Sistem/Web-Route-Envanteri|Web Route Envanteri]] ve [[E4N/02-Mevcut-Sistem/API-Uc-Noktalari|API Envanteri]]. Tablolar: [[E4N/02-Mevcut-Sistem/Canli-Supabase-Tablolari|Canlı Sayım]] ve [[E4N/02-Mevcut-Sistem/Canli-Veri-Iliskileri|İlişkiler]].
