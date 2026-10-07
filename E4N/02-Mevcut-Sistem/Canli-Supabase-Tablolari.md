# Canlı Supabase tablo sayımı

**Kaynak:** `e4n` (`kaoagsuxccwgrdydxros`) `public` şemasında 1 Ekim 2026 tarihinde her tabloya uygulanan salt okunur `count(*)`. Kişisel satır içeriği okunmadı. Sayılar canlı veriye göre zamanla değişir. Tüm 34 tabloda RLS kapalı.

| Alan | Tablo | Satır |
|---|---|---:|
| Hesap | `users` | 23 |
| Grup | `groups` | 1 |
| Grup | `group_members` | 11 |
| Takım | `power_teams` | 3 |
| Takım | `power_team_members` | 2 |
| İş ağı | `referrals` | 0 |
| İş ağı | `one_to_ones` | 0 |
| İş ağı | `friend_requests` | 0 |
| Etkinlik | `events` | 6 |
| Etkinlik | `attendance` | 2 |
| Etkinlik | `event_tickets` | 0 |
| Etkinlik | `event_reminders_sent` | 0 |
| Ziyaretçi | `visitors` | 4 |
| Ziyaretçi | `public_visitors` | 402 |
| Ödeme | `payment_transactions` | 5 |
| Eğitim | `education` | 0 |
| Eğitim | `courses` | 0 |
| Eğitim | `lessons` | 0 |
| Eğitim | `materials` | 0 |
| Eğitim | `exams` | 0 |
| Eğitim | `questions` | 0 |
| Eğitim | `exam_attempts` | 0 |
| Eğitim | `enrollments` | 0 |
| Eğitim | `achievements` | 0 |
| Eğitim | `user_achievements` | 0 |
| Blog | `blogs` | 0 |
| Blog | `blog_categories` | 0 |
| Operasyon | `tickets` | 0 |
| Operasyon | `ticket_messages` | 0 |
| Operasyon | `notifications` | 0 |
| Operasyon | `champions` | 0 |
| Operasyon | `professions` | 105 |
| Operasyon | `system_settings` | 3 |
| Operasyon | `email_configurations` | 1 |

`storage.buckets` içinde public `blog-images` bucket'ı görüldü; nesne sayımı yapılmadı. `auth.users` gibi Supabase yönetim tabloları bu 34 `public` tablo sayımına dahil değildir.
