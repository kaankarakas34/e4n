# Canlı Supabase tablo ilişkileri

Kaynak: etkin e4n projesinin public şemasındaki pg_constraint, 1 Ekim 2026 salt okunur sorgu. Bu dosyada kişi veya işlem verisi bulunmaz. Toplam **43 yabancı anahtar**.

| Kaynak tablo.sütun | Hedef tablo.sütun | Silme davranışı |
|---|---|---|
| `attendance.event_id` | `events.id` | CASCADE |
| `attendance.user_id` | `users.id` | CASCADE |
| `blogs.author_id` | `users.id` | SET NULL |
| `blogs.category_id` | `blog_categories.id` | SET NULL |
| `champions.user_id` | `users.id` | NO ACTION |
| `courses.group_id` | `groups.id` | NO ACTION |
| `education.user_id` | `users.id` | CASCADE |
| `enrollments.course_id` | `courses.id` | CASCADE |
| `enrollments.user_id` | `users.id` | CASCADE |
| `event_reminders_sent.event_id` | `events.id` | CASCADE |
| `event_reminders_sent.user_id` | `users.id` | CASCADE |
| `event_tickets.event_id` | `events.id` | CASCADE |
| `event_tickets.user_id` | `users.id` | CASCADE |
| `events.created_by` | `users.id` | NO ACTION |
| `events.group_id` | `groups.id` | NO ACTION |
| `events.member_id` | `users.id` | NO ACTION |
| `exam_attempts.exam_id` | `exams.id` | CASCADE |
| `exam_attempts.user_id` | `users.id` | CASCADE |
| `exams.course_id` | `courses.id` | CASCADE |
| `friend_requests.receiver_id` | `users.id` | CASCADE |
| `friend_requests.sender_id` | `users.id` | CASCADE |
| `group_members.group_id` | `groups.id` | CASCADE |
| `group_members.user_id` | `users.id` | CASCADE |
| `lessons.course_id` | `courses.id` | CASCADE |
| `materials.lesson_id` | `lessons.id` | CASCADE |
| `notifications.user_id` | `users.id` | CASCADE |
| `one_to_ones.partner_id` | `users.id` | NO ACTION |
| `one_to_ones.requester_id` | `users.id` | NO ACTION |
| `payment_transactions.user_id` | `users.id` | NO ACTION |
| `power_team_members.power_team_id` | `power_teams.id` | CASCADE |
| `power_team_members.user_id` | `users.id` | CASCADE |
| `public_visitors.event_id` | `events.id` | SET NULL |
| `public_visitors.inviter_id` | `users.id` | NO ACTION |
| `questions.exam_id` | `exams.id` | CASCADE |
| `referrals.giver_id` | `users.id` | NO ACTION |
| `referrals.receiver_id` | `users.id` | NO ACTION |
| `ticket_messages.sender_id` | `users.id` | NO ACTION |
| `ticket_messages.ticket_id` | `tickets.id` | NO ACTION |
| `tickets.user_id` | `users.id` | NO ACTION |
| `user_achievements.achievement_id` | `achievements.id` | CASCADE |
| `user_achievements.user_id` | `users.id` | CASCADE |
| `visitors.group_id` | `groups.id` | NO ACTION |
| `visitors.inviter_id` | `users.id` | NO ACTION |

Bu ilişkiler veri tabanının mevcut yapısını gösterir; uygulama akışının gerçekten çalıştığını tek başına kanıtlamaz.
