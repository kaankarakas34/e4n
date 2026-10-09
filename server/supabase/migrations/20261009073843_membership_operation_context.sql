-- Technical provenance of new changes only. Existing observations stay unknown.
ALTER TABLE public.group_membership_history ADD COLUMN operation_context jsonb;
ALTER TABLE public.group_membership_history ADD CONSTRAINT group_membership_history_context_check CHECK (
 operation_context IS NULL OR COALESCE((
   jsonb_typeof(operation_context)='object'
   AND operation_context ?& ARRAY['actorId','actorName','action','operationId']
   AND operation_context - ARRAY['actorId','actorName','action','operationId']='{}'::jsonb
   AND (operation_context->>'actorId') ~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
   AND (operation_context->>'operationId') ~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
   AND jsonb_typeof(operation_context->'actorName') IN ('string','null')
   AND length(COALESCE(operation_context->>'actorName',''))<=300
   AND operation_context->>'action' IN ('APPLICATION','MEMBER_STATUS','MEMBER_REMOVAL','MEMBER_TRANSFER','ROLE_ASSIGNMENT','SHUFFLE','GROUP_DELETION','USER_DELETION')
 ),false)
);
CREATE OR REPLACE FUNCTION public.e4n_capture_membership_history() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $body$
DECLARE old_user uuid; new_user uuid; subject uuid; before_value jsonb; after_value jsonb; operation_value jsonb;
BEGIN
 IF TG_OP='UPDATE' AND OLD IS NOT DISTINCT FROM NEW THEN RETURN NEW; END IF;
 -- SET LOCAL is cleared by commit/rollback, including on reused pool connections.
 operation_value:=NULLIF(current_setting('e4n.membership_context',true),'')::jsonb;
 IF TG_OP<>'INSERT' THEN old_user:=OLD.user_id; END IF;
 IF TG_OP<>'DELETE' THEN new_user:=NEW.user_id; END IF;
 FOR subject IN SELECT DISTINCT v FROM unnest(ARRAY[old_user,new_user]) v WHERE v IS NOT NULL LOOP
  before_value:=NULL; after_value:=NULL;
  IF subject=old_user THEN before_value:=public.e4n_membership_state(OLD); END IF;
  IF subject=new_user THEN after_value:=public.e4n_membership_state(NEW); END IF;
  INSERT INTO public.group_membership_history(user_id,user_name,operation,before_state,after_state,operation_context)
  VALUES(subject,(SELECT name FROM public.users WHERE id=subject),TG_OP,before_value,after_value,operation_value);
 END LOOP;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $body$;
-- CREATE OR REPLACE preserves the original invoker/fixed-search-path and private ACL.
REVOKE ALL ON FUNCTION public.e4n_capture_membership_history() FROM PUBLIC;
