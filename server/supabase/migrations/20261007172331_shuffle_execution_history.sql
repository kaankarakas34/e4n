CREATE TABLE public.shuffle_execution_history (
 id uuid PRIMARY KEY,
 actor_id uuid NOT NULL,
 actor_name text NOT NULL,
 applied_at timestamptz NOT NULL DEFAULT now(),
 expected_revision text CHECK(expected_revision IS NULL OR expected_revision ~ '^[a-f0-9]{64}$'),
 before_revision text NOT NULL CHECK(before_revision ~ '^[a-f0-9]{64}$'),
 after_revision text NOT NULL CHECK(after_revision ~ '^[a-f0-9]{64}$'),
 before_snapshot jsonb NOT NULL CHECK(jsonb_typeof(before_snapshot)='object'),
 after_snapshot jsonb NOT NULL CHECK(jsonb_typeof(after_snapshot)='object'),
 member_count integer NOT NULL CHECK(member_count>=0),
 group_count integer NOT NULL CHECK(group_count>=0)
);
CREATE INDEX shuffle_execution_history_applied_idx ON public.shuffle_execution_history(applied_at DESC,id DESC);
ALTER TABLE public.shuffle_execution_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shuffle_execution_history FROM PUBLIC;
DO $roles$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.shuffle_execution_history FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.shuffle_execution_history FROM authenticated; END IF;
END $roles$;
CREATE FUNCTION public.e4n_preserve_shuffle_execution() RETURNS trigger LANGUAGE plpgsql AS $body$
BEGIN RAISE EXCEPTION 'Shuffle execution records cannot be modified' USING ERRCODE='23514'; END
$body$;
REVOKE ALL ON FUNCTION public.e4n_preserve_shuffle_execution() FROM PUBLIC;
CREATE TRIGGER shuffle_execution_preserve BEFORE UPDATE OR DELETE ON public.shuffle_execution_history FOR EACH ROW EXECUTE FUNCTION public.e4n_preserve_shuffle_execution();
CREATE TRIGGER shuffle_execution_preserve_truncate BEFORE TRUNCATE ON public.shuffle_execution_history FOR EACH STATEMENT EXECUTE FUNCTION public.e4n_preserve_shuffle_execution();
