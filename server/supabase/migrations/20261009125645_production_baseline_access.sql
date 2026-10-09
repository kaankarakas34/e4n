-- Reconciliation-only access boundary for tables absent from the reviewed live baseline.
-- Custom JWT API uses the database owner; these are not Supabase client endpoints.
DO $$
DECLARE relation_name text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY[
    'company_tax_registry','direct_messages','document_files','document_library',
    'event_attendance_verifications','group_membership_history','invoice_files',
    'normal_membership_role_transition','one_to_one_requests','schema_migrations',
    'shuffle_execution_history','subscription_reminder_deliveries','support_mutations',
    'user_score_history','web_job_runs'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',relation_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated',relation_name);
  END LOOP;
END $$;
