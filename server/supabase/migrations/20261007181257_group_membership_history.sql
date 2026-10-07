-- Technical row history, not a product decision or reconstructed removal history.
CREATE TABLE public.group_membership_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 user_name text,
 operation text NOT NULL CHECK(operation IN ('BASELINE','INSERT','UPDATE','DELETE')),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 before_state jsonb CHECK(before_state IS NULL OR jsonb_typeof(before_state)='object'),
 after_state jsonb CHECK(after_state IS NULL OR jsonb_typeof(after_state)='object'),
 CHECK(before_state IS NOT NULL OR after_state IS NOT NULL)
);
CREATE INDEX group_membership_history_user_time_idx ON public.group_membership_history(user_id,recorded_at DESC,id DESC);
ALTER TABLE public.group_membership_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.group_membership_history FROM PUBLIC;
DO $roles$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.group_membership_history FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.group_membership_history FROM authenticated; END IF;
END $roles$;
CREATE FUNCTION public.e4n_membership_state(r public.group_members) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog,public AS $body$
 SELECT jsonb_build_object('group_id',r.group_id,'group_name',(SELECT name FROM public.groups WHERE id=r.group_id),'role',r.role,'status',r.status,'joined_at',r.joined_at)
$body$;
REVOKE ALL ON FUNCTION public.e4n_membership_state(public.group_members) FROM PUBLIC;
-- BASELINE is a current observation; recorded_at is NOT the historical join time.
INSERT INTO public.group_membership_history(user_id,user_name,operation,after_state)
SELECT gm.user_id,u.name,'BASELINE',public.e4n_membership_state(gm) FROM public.group_members gm LEFT JOIN public.users u ON u.id=gm.user_id;
CREATE FUNCTION public.e4n_capture_membership_history() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $body$
DECLARE old_user uuid; new_user uuid; subject uuid; before_value jsonb; after_value jsonb;
BEGIN
 IF TG_OP='UPDATE' AND OLD IS NOT DISTINCT FROM NEW THEN RETURN NEW; END IF;
 IF TG_OP<>'INSERT' THEN old_user:=OLD.user_id; END IF;
 IF TG_OP<>'DELETE' THEN new_user:=NEW.user_id; END IF;
 FOR subject IN SELECT DISTINCT v FROM unnest(ARRAY[old_user,new_user]) v WHERE v IS NOT NULL LOOP
  before_value:=NULL; after_value:=NULL;
  IF subject=old_user THEN before_value:=public.e4n_membership_state(OLD); END IF;
  IF subject=new_user THEN after_value:=public.e4n_membership_state(NEW); END IF;
  INSERT INTO public.group_membership_history(user_id,user_name,operation,before_state,after_state)
  VALUES(subject,(SELECT name FROM public.users WHERE id=subject),TG_OP,before_value,after_value);
 END LOOP;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $body$;
REVOKE ALL ON FUNCTION public.e4n_capture_membership_history() FROM PUBLIC;
CREATE TRIGGER group_members_capture_history AFTER INSERT OR UPDATE OR DELETE ON public.group_members FOR EACH ROW EXECUTE FUNCTION public.e4n_capture_membership_history();
CREATE FUNCTION public.e4n_preserve_membership_history() RETURNS trigger LANGUAGE plpgsql AS $body$
BEGIN RAISE EXCEPTION 'Membership history cannot be modified or bypassed with truncate' USING ERRCODE='23514'; END $body$;
REVOKE ALL ON FUNCTION public.e4n_preserve_membership_history() FROM PUBLIC;
CREATE TRIGGER group_membership_history_preserve BEFORE UPDATE OR DELETE ON public.group_membership_history FOR EACH ROW EXECUTE FUNCTION public.e4n_preserve_membership_history();
CREATE TRIGGER group_membership_history_preserve_truncate BEFORE TRUNCATE ON public.group_membership_history FOR EACH STATEMENT EXECUTE FUNCTION public.e4n_preserve_membership_history();
CREATE TRIGGER group_members_preserve_truncate BEFORE TRUNCATE ON public.group_members FOR EACH STATEMENT EXECUTE FUNCTION public.e4n_preserve_membership_history();
DO $function_roles$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  REVOKE ALL ON FUNCTION public.e4n_membership_state(public.group_members),public.e4n_capture_membership_history(),public.e4n_preserve_membership_history() FROM anon;
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
  REVOKE ALL ON FUNCTION public.e4n_membership_state(public.group_members),public.e4n_capture_membership_history(),public.e4n_preserve_membership_history() FROM authenticated;
 END IF;
END $function_roles$;
