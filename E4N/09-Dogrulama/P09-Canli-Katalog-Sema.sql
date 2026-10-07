-- P09 read-only pg_catalog reconstruction, 2026-10-01.

-- Schema objects only; no production rows, roles, grants, policies or Supabase-managed schemas.

BEGIN;

CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE public."achievements" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" character varying(255) NOT NULL,
  "description" text,
  "icon" character varying(50) DEFAULT 'Award'::character varying,
  "criteria_type" character varying(50),
  "criteria_value" character varying(255),
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."attendance" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "status" character varying(20) NOT NULL,
  "substitute_name" character varying(100),
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."blog_categories" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" character varying(255) NOT NULL,
  "slug" character varying(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."blogs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" character varying(255) NOT NULL,
  "slug" character varying(255) NOT NULL,
  "content" text,
  "excerpt" text,
  "featured_image" text,
  "featured_image_alt" character varying(255),
  "category_id" uuid,
  "tags" text[],
  "author_id" uuid,
  "status" character varying(50) DEFAULT 'draft'::character varying,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "meta_title" character varying(255),
  "meta_description" character varying(500),
  "focus_keyword" character varying(255),
  "secondary_keywords" text[],
  "canonical_url" character varying(500),
  "robots" character varying(100) DEFAULT 'index, follow'::character varying,
  "schema_type" character varying(100) DEFAULT 'BlogPosting'::character varying,
  "include_in_sitemap" boolean DEFAULT true,
  "sitemap_priority" numeric(3,2) DEFAULT 0.7,
  "change_frequency" character varying(50) DEFAULT 'monthly'::character varying,
  "og_title" character varying(255),
  "og_description" character varying(500)
);

CREATE TABLE public."champions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "period_type" character varying(20) NOT NULL,
  "period_date" date NOT NULL,
  "metric_type" character varying(20) NOT NULL,
  "user_id" uuid,
  "value" numeric NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."courses" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" character varying(255) NOT NULL,
  "description" text,
  "status" character varying(10) DEFAULT 'DRAFT'::character varying,
  "created_by" uuid,
  "group_id" uuid,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."education" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" character varying(255) NOT NULL,
  "hours" numeric(4,1) DEFAULT 1.0 NOT NULL,
  "completed_date" timestamp with time zone NOT NULL,
  "type" character varying(20),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."email_configurations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "smtp_host" character varying(255) NOT NULL,
  "smtp_port" integer NOT NULL,
  "smtp_user" character varying(255) NOT NULL,
  "smtp_pass" character varying(255) NOT NULL,
  "sender_email" character varying(255) NOT NULL,
  "sender_name" character varying(255),
  "is_active" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."enrollments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "course_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "enrolled_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."event_reminders_sent" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid,
  "user_id" uuid,
  "reminder_type" character varying(20),
  "sent_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."event_tickets" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid,
  "user_id" uuid,
  "ticket_number" character varying(50) NOT NULL,
  "payment_status" character varying(20) DEFAULT 'PENDING'::character varying,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" character varying(255) NOT NULL,
  "description" text,
  "location" character varying(255),
  "start_at" timestamp with time zone NOT NULL,
  "end_at" timestamp with time zone,
  "created_by" uuid NOT NULL,
  "has_equal_opportunity_badge" boolean DEFAULT false,
  "is_public" boolean DEFAULT true,
  "type" character varying(20),
  "group_id" uuid,
  "member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  "city" character varying(100),
  "is_online" boolean DEFAULT false,
  "status" character varying(20) DEFAULT 'PUBLISHED'::character varying,
  "pinned" boolean DEFAULT false,
  "price" numeric(10,2) DEFAULT 0,
  "currency" character varying(10) DEFAULT 'TRY'::character varying,
  "max_attendees" integer DEFAULT 50,
  "generate_tickets" boolean DEFAULT false,
  "online_link" character varying(1000)
);

CREATE TABLE public."exam_attempts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "exam_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "started_at" timestamp with time zone DEFAULT now(),
  "completed_at" timestamp with time zone,
  "score" integer DEFAULT 0,
  "passed" boolean DEFAULT false,
  "answers" jsonb
);

CREATE TABLE public."exams" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "course_id" uuid NOT NULL,
  "title" character varying(255) NOT NULL,
  "duration_minutes" integer DEFAULT 30,
  "pass_score" integer DEFAULT 60,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."friend_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "sender_id" uuid,
  "receiver_id" uuid,
  "status" character varying(20) DEFAULT 'PENDING'::character varying,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."group_members" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "group_id" uuid NOT NULL,
  "status" character varying(20) DEFAULT 'ACTIVE'::character varying,
  "joined_at" timestamp with time zone DEFAULT now(),
  "role" character varying(50) DEFAULT 'MEMBER'::character varying
);

CREATE TABLE public."groups" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" character varying(255) NOT NULL,
  "status" character varying(10) DEFAULT 'DRAFT'::character varying,
  "cycle_started_at" timestamp with time zone DEFAULT now(),
  "cycle_months" integer DEFAULT 6,
  "created_at" timestamp with time zone DEFAULT now(),
  "meeting_day" character varying(255),
  "meeting_time" time without time zone,
  "meeting_link" text,
  "description" text,
  "meeting_dates" jsonb DEFAULT '[]'::jsonb,
  "visitor_email_subject" text,
  "visitor_email_template" text
);

CREATE TABLE public."lessons" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "course_id" uuid NOT NULL,
  "title" character varying(255) NOT NULL,
  "order_index" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."materials" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "lesson_id" uuid NOT NULL,
  "type" character varying(10),
  "title" character varying(255) NOT NULL,
  "url" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."notifications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "type" text NOT NULL,
  "read" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."one_to_ones" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "requester_id" uuid NOT NULL,
  "partner_id" uuid NOT NULL,
  "meeting_date" timestamp with time zone NOT NULL,
  "notes" text,
  "status" character varying(20) DEFAULT 'COMPLETED'::character varying,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."payment_transactions" (
  "merchant_oid" character varying(255) NOT NULL,
  "user_id" uuid,
  "plan_id" character varying(50),
  "amount" numeric(10,2),
  "status" character varying(50) DEFAULT 'PENDING'::character varying,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  "action_type" character varying(50),
  "action_data" jsonb
);

CREATE TABLE public."power_team_members" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "power_team_id" uuid NOT NULL,
  "status" character varying(20) DEFAULT 'ACTIVE'::character varying,
  "joined_at" timestamp with time zone DEFAULT now(),
  "role" character varying(100)
);

CREATE TABLE public."power_teams" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" character varying(255) NOT NULL,
  "description" text,
  "status" character varying(10) DEFAULT 'DRAFT'::character varying,
  "created_at" timestamp with time zone DEFAULT now(),
  "visitor_email_subject" text,
  "visitor_email_template" text
);

CREATE TABLE public."professions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" character varying(255) NOT NULL,
  "category" character varying(100),
  "created_at" timestamp with time zone DEFAULT now(),
  "status" character varying(20) DEFAULT 'APPROVED'::character varying
);

CREATE TABLE public."public_visitors" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "company" text,
  "profession" text,
  "source" text DEFAULT 'web'::text,
  "kvkk_accepted" boolean DEFAULT false,
  "status" text DEFAULT 'PENDING'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  "inviter_id" uuid,
  "title" character varying(255),
  "web_linkedin" character varying(255),
  "activity_area" character varying(255),
  "duration" character varying(100),
  "target_customer" text,
  "why_join" text,
  "value_add" text,
  "previous_groups" text,
  "form_data" jsonb DEFAULT '{}'::jsonb,
  "event_id" uuid,
  "invoice_url" character varying(555),
  "invoice_issued" boolean DEFAULT false
);

CREATE TABLE public."questions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "exam_id" uuid NOT NULL,
  "type" character varying(10),
  "question_text" text NOT NULL,
  "options" jsonb NOT NULL,
  "correct_answers" jsonb NOT NULL,
  "score" integer DEFAULT 10
);

CREATE TABLE public."referrals" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "giver_id" uuid NOT NULL,
  "receiver_id" uuid NOT NULL,
  "type" character varying(10),
  "status" character varying(15) DEFAULT 'PENDING'::character varying,
  "temperature" character varying(10),
  "description" text,
  "amount" numeric(10,2),
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."system_settings" (
  "key" character varying(100) NOT NULL,
  "value" text,
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."ticket_messages" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "ticket_id" uuid,
  "sender_id" uuid,
  "message" text NOT NULL,
  "created_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."tickets" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "subject" character varying(255) NOT NULL,
  "status" character varying(50) DEFAULT 'OPEN'::character varying,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."user_achievements" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "achievement_id" uuid,
  "title" character varying(255),
  "description" text,
  "icon" character varying(50),
  "earned_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."users" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "email" character varying(255) NOT NULL,
  "password_hash" character varying(255) DEFAULT '$2b$10$abcdefghijklmnopqrstuvwxyz123456'::character varying,
  "name" character varying(100) NOT NULL,
  "profession" character varying(100) NOT NULL,
  "city" character varying(100),
  "phone" character varying(20),
  "performance_score" integer DEFAULT 0,
  "performance_color" character varying(10) DEFAULT 'GREY'::character varying,
  "role" character varying(20) DEFAULT 'MEMBER'::character varying,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "account_status" character varying(20) DEFAULT 'ACTIVE'::character varying,
  "subscription_end_date" timestamp with time zone,
  "subscription_plan" character varying(50),
  "last_reminder_trigger" integer,
  "reset_password_token" character varying(255),
  "reset_password_expires" timestamp with time zone,
  "company" text,
  "kvkk_consent" boolean DEFAULT false,
  "marketing_consent" boolean DEFAULT false,
  "explicit_consent" boolean DEFAULT false,
  "consent_date" timestamp with time zone DEFAULT now(),
  "tax_number" character varying(50),
  "tax_office" character varying(100),
  "billing_address" text,
  "group_title" character varying(100),
  "avatar" text,
  "subscription_invoice_url" character varying(555),
  "subscription_invoice_issued" boolean DEFAULT false,
  "last_membership_payment_amount" numeric(10,2),
  "linkedin_profile" character varying(255),
  "position" character varying(150)
);

CREATE TABLE public."visitors" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "inviter_id" uuid,
  "name" character varying(100) NOT NULL,
  "profession" character varying(100),
  "phone" character varying(20),
  "email" character varying(255),
  "visited_at" timestamp with time zone NOT NULL,
  "status" character varying(20) DEFAULT 'ATTENDED'::character varying,
  "group_id" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  "company" character varying(255)
);

CREATE OR REPLACE FUNCTION public.fn_check_group_profession_unique()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = NEW.group_id
      AND gm.status = 'ACTIVE'
      AND u.profession = (SELECT profession FROM users WHERE id = NEW.user_id)
  ) THEN
    RAISE EXCEPTION 'Aynı iş kolundan bir üye zaten bu grupta aktif';
  END IF;
  RETURN NEW;
END;
$function$;

ALTER TABLE public."achievements" ADD CONSTRAINT "achievements_pkey" PRIMARY KEY (id);

ALTER TABLE public."attendance" ADD CONSTRAINT "attendance_pkey" PRIMARY KEY (id);

ALTER TABLE public."blog_categories" ADD CONSTRAINT "blog_categories_pkey" PRIMARY KEY (id);

ALTER TABLE public."blogs" ADD CONSTRAINT "blogs_pkey" PRIMARY KEY (id);

ALTER TABLE public."champions" ADD CONSTRAINT "champions_pkey" PRIMARY KEY (id);

ALTER TABLE public."courses" ADD CONSTRAINT "courses_pkey" PRIMARY KEY (id);

ALTER TABLE public."education" ADD CONSTRAINT "education_pkey" PRIMARY KEY (id);

ALTER TABLE public."email_configurations" ADD CONSTRAINT "email_configurations_pkey" PRIMARY KEY (id);

ALTER TABLE public."enrollments" ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY (id);

ALTER TABLE public."event_reminders_sent" ADD CONSTRAINT "event_reminders_sent_pkey" PRIMARY KEY (id);

ALTER TABLE public."event_tickets" ADD CONSTRAINT "event_tickets_pkey" PRIMARY KEY (id);

ALTER TABLE public."events" ADD CONSTRAINT "events_pkey" PRIMARY KEY (id);

ALTER TABLE public."exam_attempts" ADD CONSTRAINT "exam_attempts_pkey" PRIMARY KEY (id);

ALTER TABLE public."exams" ADD CONSTRAINT "exams_pkey" PRIMARY KEY (id);

ALTER TABLE public."friend_requests" ADD CONSTRAINT "friend_requests_pkey" PRIMARY KEY (id);

ALTER TABLE public."group_members" ADD CONSTRAINT "group_members_pkey" PRIMARY KEY (id);

ALTER TABLE public."groups" ADD CONSTRAINT "groups_pkey" PRIMARY KEY (id);

ALTER TABLE public."lessons" ADD CONSTRAINT "lessons_pkey" PRIMARY KEY (id);

ALTER TABLE public."materials" ADD CONSTRAINT "materials_pkey" PRIMARY KEY (id);

ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY (id);

ALTER TABLE public."one_to_ones" ADD CONSTRAINT "one_to_ones_pkey" PRIMARY KEY (id);

ALTER TABLE public."payment_transactions" ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY (merchant_oid);

ALTER TABLE public."power_team_members" ADD CONSTRAINT "power_team_members_pkey" PRIMARY KEY (id);

ALTER TABLE public."power_teams" ADD CONSTRAINT "power_teams_pkey" PRIMARY KEY (id);

ALTER TABLE public."professions" ADD CONSTRAINT "professions_pkey" PRIMARY KEY (id);

ALTER TABLE public."public_visitors" ADD CONSTRAINT "public_visitors_pkey" PRIMARY KEY (id);

ALTER TABLE public."questions" ADD CONSTRAINT "questions_pkey" PRIMARY KEY (id);

ALTER TABLE public."referrals" ADD CONSTRAINT "referrals_pkey" PRIMARY KEY (id);

ALTER TABLE public."system_settings" ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY (key);

ALTER TABLE public."ticket_messages" ADD CONSTRAINT "ticket_messages_pkey" PRIMARY KEY (id);

ALTER TABLE public."tickets" ADD CONSTRAINT "tickets_pkey" PRIMARY KEY (id);

ALTER TABLE public."user_achievements" ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY (id);

ALTER TABLE public."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY (id);

ALTER TABLE public."visitors" ADD CONSTRAINT "visitors_pkey" PRIMARY KEY (id);

ALTER TABLE public."attendance" ADD CONSTRAINT "attendance_event_id_user_id_key" UNIQUE (event_id, user_id);

ALTER TABLE public."blog_categories" ADD CONSTRAINT "blog_categories_slug_key" UNIQUE (slug);

ALTER TABLE public."blogs" ADD CONSTRAINT "blogs_slug_key" UNIQUE (slug);

ALTER TABLE public."enrollments" ADD CONSTRAINT "enrollments_course_id_user_id_key" UNIQUE (course_id, user_id);

ALTER TABLE public."event_reminders_sent" ADD CONSTRAINT "event_reminders_sent_event_id_user_id_reminder_type_key" UNIQUE (event_id, user_id, reminder_type);

ALTER TABLE public."event_tickets" ADD CONSTRAINT "event_tickets_ticket_number_key" UNIQUE (ticket_number);

ALTER TABLE public."friend_requests" ADD CONSTRAINT "friend_requests_sender_id_receiver_id_key" UNIQUE (sender_id, receiver_id);

ALTER TABLE public."group_members" ADD CONSTRAINT "group_members_user_id_group_id_key" UNIQUE (user_id, group_id);

ALTER TABLE public."groups" ADD CONSTRAINT "groups_name_key" UNIQUE (name);

ALTER TABLE public."power_team_members" ADD CONSTRAINT "power_team_members_user_id_power_team_id_key" UNIQUE (user_id, power_team_id);

ALTER TABLE public."power_teams" ADD CONSTRAINT "power_teams_name_key" UNIQUE (name);

ALTER TABLE public."professions" ADD CONSTRAINT "professions_name_key" UNIQUE (name);

ALTER TABLE public."user_achievements" ADD CONSTRAINT "user_achievements_user_id_title_key" UNIQUE (user_id, title);

ALTER TABLE public."users" ADD CONSTRAINT "users_email_key" UNIQUE (email);

ALTER TABLE public."achievements" ADD CONSTRAINT "achievements_criteria_type_check" CHECK (criteria_type::text = ANY (ARRAY['EXAM_PASS'::character varying, 'COURSE_COMPLETE'::character varying, 'REFERRAL_MILESTONE'::character varying]::text[]));

ALTER TABLE public."attendance" ADD CONSTRAINT "attendance_status_check" CHECK (status::text = ANY (ARRAY['PRESENT'::character varying, 'ABSENT'::character varying, 'LATE'::character varying, 'SUBSTITUTE'::character varying, 'MEDICAL'::character varying]::text[]));

ALTER TABLE public."blogs" ADD CONSTRAINT "blogs_status_check" CHECK (status::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'scheduled'::character varying, 'archived'::character varying]::text[]));

ALTER TABLE public."courses" ADD CONSTRAINT "courses_status_check" CHECK (status::text = ANY (ARRAY['DRAFT'::character varying, 'ACTIVE'::character varying]::text[]));

ALTER TABLE public."education" ADD CONSTRAINT "education_type_check" CHECK (type::text = ANY (ARRAY['BOOK'::character varying, 'PODCAST'::character varying, 'WEBINAR'::character varying, 'WORKSHOP'::character varying, 'ADVANCED_TRAINING'::character varying]::text[]));

ALTER TABLE public."events" ADD CONSTRAINT "events_type_check" CHECK (type::text = ANY (ARRAY['education'::character varying, 'meeting'::character varying, 'one_to_one'::character varying, 'visitor'::character varying, 'social'::character varying]::text[]));

ALTER TABLE public."group_members" ADD CONSTRAINT "group_members_status_check" CHECK (status::text = ANY (ARRAY['ACTIVE'::character varying, 'REQUESTED'::character varying]::text[]));

ALTER TABLE public."groups" ADD CONSTRAINT "groups_cycle_months_check" CHECK (cycle_months > 0);

ALTER TABLE public."groups" ADD CONSTRAINT "groups_status_check" CHECK (status::text = ANY (ARRAY['DRAFT'::character varying, 'ACTIVE'::character varying]::text[]));

ALTER TABLE public."materials" ADD CONSTRAINT "materials_type_check" CHECK (type::text = ANY (ARRAY['doc'::character varying, 'video'::character varying]::text[]));

ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_type_check" CHECK (type = ANY (ARRAY['SYSTEM'::text, 'EVENT_REMINDER'::text, 'INVITATION'::text, 'GROUP_UPDATE'::text, 'PAYMENT'::text]));

ALTER TABLE public."one_to_ones" ADD CONSTRAINT "one_to_ones_check" CHECK (requester_id <> partner_id);

ALTER TABLE public."power_team_members" ADD CONSTRAINT "power_team_members_status_check" CHECK (status::text = ANY (ARRAY['ACTIVE'::character varying, 'REQUESTED'::character varying]::text[]));

ALTER TABLE public."power_teams" ADD CONSTRAINT "power_teams_status_check" CHECK (status::text = ANY (ARRAY['DRAFT'::character varying, 'ACTIVE'::character varying]::text[]));

ALTER TABLE public."questions" ADD CONSTRAINT "questions_type_check" CHECK (type::text = ANY (ARRAY['single'::character varying, 'multi'::character varying]::text[]));

ALTER TABLE public."referrals" ADD CONSTRAINT "referrals_status_check" CHECK (status::text = ANY (ARRAY['PENDING'::character varying, 'SUCCESSFUL'::character varying, 'UNSUCCESSFUL'::character varying]::text[]));

ALTER TABLE public."referrals" ADD CONSTRAINT "referrals_temperature_check" CHECK (temperature::text = ANY (ARRAY['HOT'::character varying, 'WARM'::character varying, 'COLD'::character varying]::text[]));

ALTER TABLE public."referrals" ADD CONSTRAINT "referrals_type_check" CHECK (type::text = ANY (ARRAY['INTERNAL'::character varying, 'EXTERNAL'::character varying]::text[]));

ALTER TABLE public."users" ADD CONSTRAINT "users_performance_color_check" CHECK (performance_color::text = ANY (ARRAY['GREEN'::character varying, 'YELLOW'::character varying, 'RED'::character varying, 'GREY'::character varying]::text[]));

ALTER TABLE public."users" ADD CONSTRAINT "users_performance_score_check" CHECK (performance_score >= 0 AND performance_score <= 100);

ALTER TABLE public."users" ADD CONSTRAINT "users_role_check" CHECK (role::text = ANY (ARRAY['MEMBER'::character varying, 'PRESIDENT'::character varying, 'VICE_PRESIDENT'::character varying, 'SECRETARY_TREASURER'::character varying, 'ADMIN'::character varying, 'COMMUNITY_MEMBER'::character varying]::text[]));

ALTER TABLE public."visitors" ADD CONSTRAINT "visitors_status_check" CHECK (status::text = ANY (ARRAY['INVITED'::character varying, 'ATTENDED'::character varying, 'JOINED'::character varying, 'NO_SHOW'::character varying]::text[]));

ALTER TABLE public."attendance" ADD CONSTRAINT "attendance_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE public."attendance" ADD CONSTRAINT "attendance_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."blogs" ADD CONSTRAINT "blogs_author_id_fkey" FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public."blogs" ADD CONSTRAINT "blogs_category_id_fkey" FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE SET NULL;

ALTER TABLE public."champions" ADD CONSTRAINT "champions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE public."courses" ADD CONSTRAINT "courses_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id);

ALTER TABLE public."education" ADD CONSTRAINT "education_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE public."enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."event_reminders_sent" ADD CONSTRAINT "event_reminders_sent_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE public."event_reminders_sent" ADD CONSTRAINT "event_reminders_sent_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."event_tickets" ADD CONSTRAINT "event_tickets_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE public."event_tickets" ADD CONSTRAINT "event_tickets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE public."events" ADD CONSTRAINT "events_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id);

ALTER TABLE public."events" ADD CONSTRAINT "events_member_id_fkey" FOREIGN KEY (member_id) REFERENCES users(id);

ALTER TABLE public."exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_fkey" FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

ALTER TABLE public."exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."exams" ADD CONSTRAINT "exams_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE public."friend_requests" ADD CONSTRAINT "friend_requests_receiver_id_fkey" FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."friend_requests" ADD CONSTRAINT "friend_requests_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE public."group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE public."materials" ADD CONSTRAINT "materials_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."one_to_ones" ADD CONSTRAINT "one_to_ones_partner_id_fkey" FOREIGN KEY (partner_id) REFERENCES users(id);

ALTER TABLE public."one_to_ones" ADD CONSTRAINT "one_to_ones_requester_id_fkey" FOREIGN KEY (requester_id) REFERENCES users(id);

ALTER TABLE public."payment_transactions" ADD CONSTRAINT "payment_transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE public."power_team_members" ADD CONSTRAINT "power_team_members_power_team_id_fkey" FOREIGN KEY (power_team_id) REFERENCES power_teams(id) ON DELETE CASCADE;

ALTER TABLE public."power_team_members" ADD CONSTRAINT "power_team_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."public_visitors" ADD CONSTRAINT "public_visitors_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

ALTER TABLE public."public_visitors" ADD CONSTRAINT "public_visitors_inviter_id_fkey" FOREIGN KEY (inviter_id) REFERENCES users(id);

ALTER TABLE public."questions" ADD CONSTRAINT "questions_exam_id_fkey" FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

ALTER TABLE public."referrals" ADD CONSTRAINT "referrals_giver_id_fkey" FOREIGN KEY (giver_id) REFERENCES users(id);

ALTER TABLE public."referrals" ADD CONSTRAINT "referrals_receiver_id_fkey" FOREIGN KEY (receiver_id) REFERENCES users(id);

ALTER TABLE public."ticket_messages" ADD CONSTRAINT "ticket_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES users(id);

ALTER TABLE public."ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES tickets(id);

ALTER TABLE public."tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE public."user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE;

ALTER TABLE public."user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."visitors" ADD CONSTRAINT "visitors_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id);

ALTER TABLE public."visitors" ADD CONSTRAINT "visitors_inviter_id_fkey" FOREIGN KEY (inviter_id) REFERENCES users(id);

CREATE INDEX idx_attendance_user ON public.attendance USING btree (user_id);

CREATE INDEX idx_blogs_slug ON public.blogs USING btree (slug);

CREATE INDEX idx_blogs_status ON public.blogs USING btree (status);

CREATE INDEX idx_events_start ON public.events USING btree (start_at);

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE INDEX idx_one_to_ones_requester ON public.one_to_ones USING btree (requester_id);

CREATE INDEX idx_referrals_giver ON public.referrals USING btree (giver_id);

CREATE INDEX idx_referrals_receiver ON public.referrals USING btree (receiver_id);

CREATE INDEX idx_users_city ON public.users USING btree (city);

CREATE INDEX idx_visitors_inviter ON public.visitors USING btree (inviter_id);

CREATE TRIGGER trg_group_members_unique_profession BEFORE INSERT OR UPDATE OF user_id, group_id ON group_members FOR EACH ROW EXECUTE FUNCTION fn_check_group_profession_unique();

COMMIT;
