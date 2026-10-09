-- Reconciliation-only access boundary. Custom JWT API uses the database owner.
-- Source inspection found direct Supabase table access only in the legacy blog editor.
-- Preserve that separate release scope; all other application tables use authorized API routes.
DO $$
DECLARE relation_name text;
BEGIN
  FOR relation_name IN SELECT tablename FROM pg_tables
    WHERE schemaname='public' AND tablename NOT IN ('blogs','blog_categories')
    ORDER BY tablename
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',relation_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated',relation_name);
  END LOOP;
END $$;
