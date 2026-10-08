-- Explicit administrator observation; legacy registrations are never backfilled as evidence.
CREATE TABLE public.event_attendance_verifications (
 id uuid PRIMARY KEY, event_id uuid NOT NULL, attendance_id uuid NOT NULL, user_id uuid NOT NULL,
 actor_id uuid NOT NULL, actor_name text NOT NULL, before_status text NOT NULL,
 after_status text NOT NULL CHECK(after_status IN ('REGISTERED','PRESENT','ABSENT')),
 revision integer NOT NULL CHECK(revision>0), reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 500),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(), UNIQUE(attendance_id,revision)
);
CREATE INDEX event_attendance_verifications_event ON public.event_attendance_verifications(event_id,recorded_at DESC,id DESC);
ALTER TABLE public.event_attendance_verifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_attendance_verifications FROM PUBLIC;
DO $roles$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.event_attendance_verifications FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.event_attendance_verifications FROM authenticated; END IF;
END $roles$;
CREATE FUNCTION public.e4n_preserve_attendance_verifications() RETURNS trigger LANGUAGE plpgsql AS $body$
BEGIN RAISE EXCEPTION 'Attendance verification history is immutable' USING ERRCODE='23514'; END $body$;
REVOKE ALL ON FUNCTION public.e4n_preserve_attendance_verifications() FROM PUBLIC;
CREATE TRIGGER attendance_verifications_preserve BEFORE UPDATE OR DELETE ON public.event_attendance_verifications FOR EACH ROW EXECUTE FUNCTION public.e4n_preserve_attendance_verifications();
CREATE TRIGGER attendance_verifications_preserve_truncate BEFORE TRUNCATE ON public.event_attendance_verifications FOR EACH STATEMENT EXECUTE FUNCTION public.e4n_preserve_attendance_verifications();
DO $function_roles$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON FUNCTION public.e4n_preserve_attendance_verifications() FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON FUNCTION public.e4n_preserve_attendance_verifications() FROM authenticated; END IF;
END $function_roles$;
