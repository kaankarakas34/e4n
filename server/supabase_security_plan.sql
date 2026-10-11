-- ==============================================================================
-- E4N Production Supabase RLS and Access Security Plan (SEC-01 / E4N-58)
-- Generated: 2026-10-11
-- Target Environment: Supabase PostgreSQL (Public Schema)
-- Scope: All 50 Application Tables
-- Architecture: API-Owner Architecture (Express API bypasses via DB owner)
-- ==============================================================================

-- 1. Ensure Supabase API roles exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END $$;

-- 2. Enable Row Level Security (RLS) on ALL 50 application tables
--    This guarantees that PostgREST (Data API) cannot query any table without explicit policies.

-- [Tier 1: Critical Credentials and PII]
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_tax_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.normal_membership_role_transition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_configurations ENABLE ROW LEVEL SECURITY;

-- [Tier 2: Financial and Transactional]
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_files ENABLE ROW LEVEL SECURITY;

-- [Tier 3: Sensitive Workflow and Audit Logs]
ALTER TABLE public.group_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_application_mail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_membership_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shuffle_execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- [Tier 4: Core Operational Relations]
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_to_ones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_to_one_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_reminder_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.champions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_files ENABLE ROW LEVEL SECURITY;

-- [Tier 5: LMS Module - Postponed Scope]
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- [Tier 6: Public CMS Content]
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- 3. Revoke all permissions from anon and authenticated on the 48 sensitive application tables
--    Direct PostgREST access is strictly prohibited; all requests must flow through the Express API.
DO $$
DECLARE relation_name text;
BEGIN
  FOR relation_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('schema_migrations', 'blogs', 'blog_categories')
    ORDER BY tablename
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated, PUBLIC', relation_name);
  END LOOP;
END $$;

-- 4. Granular RLS Policies for Public CMS Content (blogs & blog_categories)
--    Resolves Supabase lint error: 0013_rls_disabled_in_public
GRANT SELECT ON public.blogs TO anon, authenticated;
GRANT SELECT ON public.blog_categories TO anon, authenticated;

-- Allow public / anon / authenticated to read ONLY published blog articles
DROP POLICY IF EXISTS "Public can view published blogs" ON public.blogs;
CREATE POLICY "Public can view published blogs" ON public.blogs
  FOR SELECT USING (status = 'published');

-- Allow public / anon / authenticated to read blog categories
DROP POLICY IF EXISTS "Public can view blog categories" ON public.blog_categories;
CREATE POLICY "Public can view blog categories" ON public.blog_categories
  FOR SELECT USING (true);

-- Mutations on blogs are prohibited for anonymous clients; managed via API / admin authentication
REVOKE INSERT, UPDATE, DELETE ON public.blogs FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.blog_categories FROM anon, authenticated;

-- 5. Hardening Function search_path (Resolves Supabase lint warning: 0011_function_search_path_mutable)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_check_group_profession_unique') THEN
    ALTER FUNCTION public.fn_check_group_profession_unique() SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'e4n_preserve_membership_history') THEN
    ALTER FUNCTION public.e4n_preserve_membership_history() SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'e4n_preserve_shuffle_execution') THEN
    ALTER FUNCTION public.e4n_preserve_shuffle_execution() SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'e4n_preserve_attendance_verifications') THEN
    ALTER FUNCTION public.e4n_preserve_attendance_verifications() SET search_path = public, pg_temp;
  END IF;
END $$;
