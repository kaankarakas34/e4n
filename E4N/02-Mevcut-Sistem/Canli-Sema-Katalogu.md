# Canlı Supabase şema kataloğu

**Kaynak:** `e4n` projesi `public` şeması, 1 Ekim 2026 salt okunur metadata sorguları. Bu katalog 34 tablo ve 307 sütunun tam listesidir. İçerik kişi satırları içermez. Gizli değer olabilecek varsayılan ifadeler gösterilmez. Kısıt/indeks adları mevcut durumu gösterir; etkileri [[E4N/02-Mevcut-Sistem/Veritabani-Sema-Denetimi|denetim notunda]] değerlendirilir.

Gösterim: `!` NOT NULL, `?` nullable; varsayılan varsa `=...`. Türler PostgreSQL bilgi şemasından alınmıştır.

## achievements

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `title` | character varying | Hayır | — |
| `description` | text | Evet | — |
| `icon` | character varying | Evet | 'Award'::character varying |
| `criteria_type` | character varying | Evet | — |
| `criteria_value` | character varying | Evet | — |
| `created_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (2 yerel, 0 FK):** `achievements_criteria_type_check`, `achievements_pkey`.
**İndeksler (1):** `achievements_pkey`.

## attendance

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `event_id` | uuid | Hayır | — |
| `user_id` | uuid | Hayır | — |
| `status` | character varying | Hayır | — |
| `substitute_name` | character varying | Evet | — |
| `created_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (3 yerel, 2 FK):** `attendance_status_check`, `attendance_pkey`, `attendance_event_id_user_id_key`.
**İndeksler (3):** `attendance_event_id_user_id_key`, `attendance_pkey`, `idx_attendance_user`.

## blog_categories

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `name` | character varying | Hayır | — |
| `slug` | character varying | Hayır | — |
| `created_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (2 yerel, 0 FK):** `blog_categories_pkey`, `blog_categories_slug_key`.
**İndeksler (2):** `blog_categories_pkey`, `blog_categories_slug_key`.

## blogs

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `title` | character varying | Hayır | — |
| `slug` | character varying | Hayır | — |
| `content` | text | Evet | — |
| `excerpt` | text | Evet | — |
| `featured_image` | text | Evet | — |
| `featured_image_alt` | character varying | Evet | — |
| `category_id` | uuid | Evet | — |
| `tags` | ARRAY | Evet | — |
| `author_id` | uuid | Evet | — |
| `status` | character varying | Evet | 'draft'::character varying |
| `published_at` | timestamp with time zone | Evet | — |
| `created_at` | timestamp with time zone | Evet | now() |
| `updated_at` | timestamp with time zone | Evet | now() |
| `meta_title` | character varying | Evet | — |
| `meta_description` | character varying | Evet | — |
| `focus_keyword` | character varying | Evet | — |
| `secondary_keywords` | ARRAY | Evet | — |
| `canonical_url` | character varying | Evet | — |
| `robots` | character varying | Evet | 'index, follow'::character varying |
| `schema_type` | character varying | Evet | 'BlogPosting'::character varying |
| `include_in_sitemap` | boolean | Evet | true |
| `sitemap_priority` | numeric | Evet | 0.7 |
| `change_frequency` | character varying | Evet | 'monthly'::character varying |
| `og_title` | character varying | Evet | — |
| `og_description` | character varying | Evet | — |

**Kısıtlar (3 yerel, 2 FK):** `blogs_status_check`, `blogs_pkey`, `blogs_slug_key`.
**İndeksler (4):** `blogs_pkey`, `blogs_slug_key`, `idx_blogs_slug`, `idx_blogs_status`.

## champions

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `period_type` | character varying | Hayır | — |
| `period_date` | date | Hayır | — |
| `metric_type` | character varying | Hayır | — |
| `user_id` | uuid | Evet | — |
| `value` | numeric | Hayır | — |
| `created_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (1 yerel, 1 FK):** `champions_pkey`.
**İndeksler (1):** `champions_pkey`.

## courses

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `title` | character varying | Hayır | — |
| `description` | text | Evet | — |
| `status` | character varying | Evet | 'DRAFT'::character varying |
| `created_by` | uuid | Evet | — |
| `group_id` | uuid | Evet | — |
| `created_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (2 yerel, 1 FK):** `courses_status_check`, `courses_pkey`.
**İndeksler (1):** `courses_pkey`.

## education

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `user_id` | uuid | Hayır | — |
| `title` | character varying | Hayır | — |
| `hours` | numeric | Hayır | 1.0 |
| `completed_date` | timestamp with time zone | Hayır | — |
| `type` | character varying | Evet | — |
| `notes` | text | Evet | — |
| `created_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (2 yerel, 1 FK):** `education_type_check`, `education_pkey`.
**İndeksler (1):** `education_pkey`.

## email_configurations

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `smtp_host` | character varying | Hayır | — |
| `smtp_port` | integer | Hayır | — |
| `smtp_user` | character varying | Hayır | — |
| `smtp_pass` | character varying | Hayır | — |
| `sender_email` | character varying | Hayır | — |
| `sender_name` | character varying | Evet | — |
| `is_active` | boolean | Evet | false |
| `created_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (1 yerel, 0 FK):** `email_configurations_pkey`.
**İndeksler (1):** `email_configurations_pkey`.

## enrollments

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `course_id` | uuid | Hayır | — |
| `user_id` | uuid | Hayır | — |
| `enrolled_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (2 yerel, 2 FK):** `enrollments_pkey`, `enrollments_course_id_user_id_key`.
**İndeksler (2):** `enrollments_course_id_user_id_key`, `enrollments_pkey`.

## event_reminders_sent

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `event_id` | uuid | Evet | — |
| `user_id` | uuid | Evet | — |
| `reminder_type` | character varying | Evet | — |
| `sent_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (2 yerel, 2 FK):** `event_reminders_sent_pkey`, `event_reminders_sent_event_id_user_id_reminder_type_key`.
**İndeksler (2):** `event_reminders_sent_event_id_user_id_reminder_type_key`, `event_reminders_sent_pkey`.

## event_tickets

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `event_id` | uuid | Evet | — |
| `user_id` | uuid | Evet | — |
| `ticket_number` | character varying | Hayır | — |
| `payment_status` | character varying | Evet | 'PENDING'::character varying |
| `created_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (2 yerel, 2 FK):** `event_tickets_pkey`, `event_tickets_ticket_number_key`.
**İndeksler (2):** `event_tickets_pkey`, `event_tickets_ticket_number_key`.

## events

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `title` | character varying | Hayır | — |
| `description` | text | Evet | — |
| `location` | character varying | Evet | — |
| `start_at` | timestamp with time zone | Hayır | — |
| `end_at` | timestamp with time zone | Evet | — |
| `created_by` | uuid | Hayır | — |
| `has_equal_opportunity_badge` | boolean | Evet | false |
| `is_public` | boolean | Evet | true |
| `type` | character varying | Evet | — |
| `group_id` | uuid | Evet | — |
| `member_id` | uuid | Evet | — |
| `created_at` | timestamp with time zone | Evet | now() |
| `city` | character varying | Evet | — |
| `is_online` | boolean | Evet | false |
| `status` | character varying | Evet | 'PUBLISHED'::character varying |
| `pinned` | boolean | Evet | false |
| `price` | numeric | Evet | 0 |
| `currency` | character varying | Evet | 'TRY'::character varying |
| `max_attendees` | integer | Evet | 50 |
| `generate_tickets` | boolean | Evet | false |
| `online_link` | character varying | Evet | — |

**Kısıtlar (2 yerel, 3 FK):** `events_type_check`, `events_pkey`.
**İndeksler (2):** `events_pkey`, `idx_events_start`.

## exam_attempts

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `exam_id` | uuid | Hayır | — |
| `user_id` | uuid | Hayır | — |
| `started_at` | timestamp with time zone | Evet | now() |
| `completed_at` | timestamp with time zone | Evet | — |
| `score` | integer | Evet | 0 |
| `passed` | boolean | Evet | false |
| `answers` | jsonb | Evet | — |

**Kısıtlar (1 yerel, 2 FK):** `exam_attempts_pkey`.
**İndeksler (1):** `exam_attempts_pkey`.

## exams

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `course_id` | uuid | Hayır | — |
| `title` | character varying | Hayır | — |
| `duration_minutes` | integer | Evet | 30 |
| `pass_score` | integer | Evet | 60 |
| `created_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (1 yerel, 1 FK):** `exams_pkey`.
**İndeksler (1):** `exams_pkey`.

## friend_requests

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `sender_id` | uuid | Evet | — |
| `receiver_id` | uuid | Evet | — |
| `status` | character varying | Evet | 'PENDING'::character varying |
| `created_at` | timestamp with time zone | Evet | now() |
| `updated_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (2 yerel, 2 FK):** `friend_requests_pkey`, `friend_requests_sender_id_receiver_id_key`.
**İndeksler (2):** `friend_requests_pkey`, `friend_requests_sender_id_receiver_id_key`.

## group_members

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `user_id` | uuid | Hayır | — |
| `group_id` | uuid | Hayır | — |
| `status` | character varying | Evet | 'ACTIVE'::character varying |
| `joined_at` | timestamp with time zone | Evet | now() |
| `role` | character varying | Evet | 'MEMBER'::character varying |

**Kısıtlar (3 yerel, 2 FK):** `group_members_status_check`, `group_members_pkey`, `group_members_user_id_group_id_key`.
**İndeksler (2):** `group_members_pkey`, `group_members_user_id_group_id_key`.

## groups

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `name` | character varying | Hayır | — |
| `status` | character varying | Evet | 'DRAFT'::character varying |
| `cycle_started_at` | timestamp with time zone | Evet | now() |
| `cycle_months` | integer | Evet | 6 |
| `created_at` | timestamp with time zone | Evet | now() |
| `meeting_day` | character varying | Evet | — |
| `meeting_time` | time without time zone | Evet | — |
| `meeting_link` | text | Evet | — |
| `description` | text | Evet | — |
| `meeting_dates` | jsonb | Evet | '[]'::jsonb |
| `visitor_email_subject` | text | Evet | — |
| `visitor_email_template` | text | Evet | — |

**Kısıtlar (4 yerel, 0 FK):** `groups_cycle_months_check`, `groups_status_check`, `groups_pkey`, `groups_name_key`.
**İndeksler (2):** `groups_name_key`, `groups_pkey`.

## lessons

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `course_id` | uuid | Hayır | — |
| `title` | character varying | Hayır | — |
| `order_index` | integer | Evet | 0 |
| `created_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (1 yerel, 1 FK):** `lessons_pkey`.
**İndeksler (1):** `lessons_pkey`.

## materials

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `lesson_id` | uuid | Hayır | — |
| `type` | character varying | Evet | — |
| `title` | character varying | Hayır | — |
| `url` | text | Hayır | — |
| `created_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (2 yerel, 1 FK):** `materials_type_check`, `materials_pkey`.
**İndeksler (1):** `materials_pkey`.

## notifications

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `user_id` | uuid | Evet | — |
| `title` | text | Hayır | — |
| `message` | text | Hayır | — |
| `type` | text | Hayır | — |
| `read` | boolean | Evet | false |
| `created_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (2 yerel, 1 FK):** `notifications_type_check`, `notifications_pkey`.
**İndeksler (2):** `idx_notifications_user_id`, `notifications_pkey`.

## one_to_ones

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `requester_id` | uuid | Hayır | — |
| `partner_id` | uuid | Hayır | — |
| `meeting_date` | timestamp with time zone | Hayır | — |
| `notes` | text | Evet | — |
| `status` | character varying | Evet | 'COMPLETED'::character varying |
| `created_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (2 yerel, 2 FK):** `one_to_ones_check`, `one_to_ones_pkey`.
**İndeksler (2):** `idx_one_to_ones_requester`, `one_to_ones_pkey`.

## payment_transactions

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `merchant_oid` | character varying | Hayır | — |
| `user_id` | uuid | Evet | — |
| `plan_id` | character varying | Evet | — |
| `amount` | numeric | Evet | — |
| `status` | character varying | Evet | 'PENDING'::character varying |
| `created_at` | timestamp without time zone | Evet | now() |
| `updated_at` | timestamp without time zone | Evet | now() |
| `action_type` | character varying | Evet | — |
| `action_data` | jsonb | Evet | — |

**Kısıtlar (1 yerel, 1 FK):** `payment_transactions_pkey`.
**İndeksler (1):** `payment_transactions_pkey`.

## power_team_members

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `user_id` | uuid | Hayır | — |
| `power_team_id` | uuid | Hayır | — |
| `status` | character varying | Evet | 'ACTIVE'::character varying |
| `joined_at` | timestamp with time zone | Evet | now() |
| `role` | character varying | Evet | — |

**Kısıtlar (3 yerel, 2 FK):** `power_team_members_status_check`, `power_team_members_pkey`, `power_team_members_user_id_power_team_id_key`.
**İndeksler (2):** `power_team_members_pkey`, `power_team_members_user_id_power_team_id_key`.

## power_teams

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `name` | character varying | Hayır | — |
| `description` | text | Evet | — |
| `status` | character varying | Evet | 'DRAFT'::character varying |
| `created_at` | timestamp with time zone | Evet | now() |
| `visitor_email_subject` | text | Evet | — |
| `visitor_email_template` | text | Evet | — |

**Kısıtlar (3 yerel, 0 FK):** `power_teams_status_check`, `power_teams_pkey`, `power_teams_name_key`.
**İndeksler (2):** `power_teams_name_key`, `power_teams_pkey`.

## professions

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `name` | character varying | Hayır | — |
| `category` | character varying | Evet | — |
| `created_at` | timestamp with time zone | Evet | now() |
| `status` | character varying | Evet | 'APPROVED'::character varying |

**Kısıtlar (2 yerel, 0 FK):** `professions_pkey`, `professions_name_key`.
**İndeksler (2):** `professions_name_key`, `professions_pkey`.

## public_visitors

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `name` | text | Hayır | — |
| `email` | text | Hayır | — |
| `phone` | text | Evet | — |
| `company` | text | Evet | — |
| `profession` | text | Evet | — |
| `source` | text | Evet | 'web'::text |
| `kvkk_accepted` | boolean | Evet | false |
| `status` | text | Evet | 'PENDING'::text |
| `created_at` | timestamp with time zone | Evet | now() |
| `inviter_id` | uuid | Evet | — |
| `title` | character varying | Evet | — |
| `web_linkedin` | character varying | Evet | — |
| `activity_area` | character varying | Evet | — |
| `duration` | character varying | Evet | — |
| `target_customer` | text | Evet | — |
| `why_join` | text | Evet | — |
| `value_add` | text | Evet | — |
| `previous_groups` | text | Evet | — |
| `form_data` | jsonb | Evet | '{}'::jsonb |
| `event_id` | uuid | Evet | — |
| `invoice_url` | character varying | Evet | — |
| `invoice_issued` | boolean | Evet | false |

**Kısıtlar (1 yerel, 2 FK):** `public_visitors_pkey`.
**İndeksler (1):** `public_visitors_pkey`.

## questions

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `exam_id` | uuid | Hayır | — |
| `type` | character varying | Evet | — |
| `question_text` | text | Hayır | — |
| `options` | jsonb | Hayır | — |
| `correct_answers` | jsonb | Hayır | — |
| `score` | integer | Evet | 10 |

**Kısıtlar (2 yerel, 1 FK):** `questions_type_check`, `questions_pkey`.
**İndeksler (1):** `questions_pkey`.

## referrals

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `giver_id` | uuid | Hayır | — |
| `receiver_id` | uuid | Hayır | — |
| `type` | character varying | Evet | — |
| `status` | character varying | Evet | 'PENDING'::character varying |
| `temperature` | character varying | Evet | — |
| `description` | text | Evet | — |
| `amount` | numeric | Evet | — |
| `created_at` | timestamp with time zone | Evet | now() |
| `updated_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (4 yerel, 2 FK):** `referrals_status_check`, `referrals_temperature_check`, `referrals_type_check`, `referrals_pkey`.
**İndeksler (3):** `idx_referrals_giver`, `idx_referrals_receiver`, `referrals_pkey`.

## system_settings

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `key` | character varying | Hayır | — |
| `value` | text | Evet | — |
| `updated_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (1 yerel, 0 FK):** `system_settings_pkey`.
**İndeksler (1):** `system_settings_pkey`.

## ticket_messages

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `ticket_id` | uuid | Evet | — |
| `sender_id` | uuid | Evet | — |
| `message` | text | Hayır | — |
| `created_at` | timestamp without time zone | Evet | now() |

**Kısıtlar (1 yerel, 2 FK):** `ticket_messages_pkey`.
**İndeksler (1):** `ticket_messages_pkey`.

## tickets

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `user_id` | uuid | Evet | — |
| `subject` | character varying | Hayır | — |
| `status` | character varying | Evet | 'OPEN'::character varying |
| `created_at` | timestamp without time zone | Evet | now() |
| `updated_at` | timestamp without time zone | Evet | now() |

**Kısıtlar (1 yerel, 1 FK):** `tickets_pkey`.
**İndeksler (1):** `tickets_pkey`.

## user_achievements

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `user_id` | uuid | Hayır | — |
| `achievement_id` | uuid | Evet | — |
| `title` | character varying | Evet | — |
| `description` | text | Evet | — |
| `icon` | character varying | Evet | — |
| `earned_at` | timestamp with time zone | Evet | now() |

**Kısıtlar (2 yerel, 2 FK):** `user_achievements_pkey`, `user_achievements_user_id_title_key`.
**İndeksler (2):** `user_achievements_pkey`, `user_achievements_user_id_title_key`.

## users

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `email` | character varying | Hayır | — |
| `password_hash` | character varying | Evet | [gizlendi] |
| `name` | character varying | Hayır | — |
| `profession` | character varying | Hayır | — |
| `city` | character varying | Evet | — |
| `phone` | character varying | Evet | — |
| `performance_score` | integer | Evet | 0 |
| `performance_color` | character varying | Evet | 'GREY'::character varying |
| `role` | character varying | Evet | 'MEMBER'::character varying |
| `created_at` | timestamp with time zone | Evet | now() |
| `updated_at` | timestamp with time zone | Evet | now() |
| `account_status` | character varying | Evet | 'ACTIVE'::character varying |
| `subscription_end_date` | timestamp with time zone | Evet | — |
| `subscription_plan` | character varying | Evet | — |
| `last_reminder_trigger` | integer | Evet | — |
| `reset_password_token` | character varying | Evet | — |
| `reset_password_expires` | timestamp with time zone | Evet | — |
| `company` | text | Evet | — |
| `kvkk_consent` | boolean | Evet | false |
| `marketing_consent` | boolean | Evet | false |
| `explicit_consent` | boolean | Evet | false |
| `consent_date` | timestamp with time zone | Evet | now() |
| `tax_number` | character varying | Evet | — |
| `tax_office` | character varying | Evet | — |
| `billing_address` | text | Evet | — |
| `group_title` | character varying | Evet | — |
| `avatar` | text | Evet | — |
| `subscription_invoice_url` | character varying | Evet | — |
| `subscription_invoice_issued` | boolean | Evet | false |
| `last_membership_payment_amount` | numeric | Evet | — |
| `linkedin_profile` | character varying | Evet | — |
| `position` | character varying | Evet | — |

**Kısıtlar (5 yerel, 0 FK):** `users_performance_color_check`, `users_performance_score_check`, `users_role_check`, `users_pkey`, `users_email_key`.
**İndeksler (3):** `idx_users_city`, `users_email_key`, `users_pkey`.

## visitors

| Alan | Tür | Boş? | Varsayılan |
|---|---|:---:|---|
| `id` | uuid | Hayır | gen_random_uuid() |
| `inviter_id` | uuid | Evet | — |
| `name` | character varying | Hayır | — |
| `profession` | character varying | Evet | — |
| `phone` | character varying | Evet | — |
| `email` | character varying | Evet | — |
| `visited_at` | timestamp with time zone | Hayır | — |
| `status` | character varying | Evet | 'ATTENDED'::character varying |
| `group_id` | uuid | Evet | — |
| `created_at` | timestamp with time zone | Evet | now() |
| `company` | character varying | Evet | — |

**Kısıtlar (2 yerel, 2 FK):** `visitors_status_check`, `visitors_pkey`.
**İndeksler (2):** `idx_visitors_inviter`, `visitors_pkey`.

