-- Existing incomplete identities are reported, not guessed or merged.
DO $body$ BEGIN
 IF EXISTS(SELECT 1 FROM public.users WHERE NULLIF(btrim(tax_number),'') IS NOT NULL AND regexp_replace(tax_number,'[[:space:]-]','','g') !~ '^([0-9]{10}|[1-9][0-9]{10})$') THEN RAISE EXCEPTION 'COMPANY_PREFLIGHT_INVALID_TAX_NUMBER'; END IF;
 IF EXISTS(SELECT 1 FROM public.users WHERE NULLIF(btrim(tax_number),'') IS NOT NULL GROUP BY regexp_replace(tax_number,'[[:space:]-]','','g') HAVING count(*)>1) THEN RAISE EXCEPTION 'COMPANY_PREFLIGHT_DUPLICATE_TAX_NUMBER'; END IF;
 IF EXISTS(SELECT 1 FROM public.users GROUP BY lower(email) HAVING count(*)>1) THEN RAISE EXCEPTION 'COMPANY_PREFLIGHT_DUPLICATE_EMAIL'; END IF;
END $body$;
CREATE TABLE IF NOT EXISTS public.company_tax_registry(tax_number text PRIMARY KEY,owner_id uuid NOT NULL,recorded_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.company_tax_registry ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.company_tax_registry FROM PUBLIC;
DO $roles$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.company_tax_registry FROM anon; END IF; IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.company_tax_registry FROM authenticated; END IF; END $roles$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_registration boolean NOT NULL DEFAULT false;
UPDATE public.users SET tax_number=NULLIF(regexp_replace(tax_number,'[[:space:]-]','','g'),'');
INSERT INTO public.company_tax_registry(tax_number,owner_id) SELECT tax_number,id FROM public.users WHERE tax_number IS NOT NULL ON CONFLICT(tax_number) DO NOTHING;
CREATE UNIQUE INDEX IF NOT EXISTS users_tax_number_unique ON public.users(tax_number) WHERE tax_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON public.users(lower(email));
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_company_identity_check;
ALTER TABLE public.users ADD CONSTRAINT users_company_identity_check CHECK(NOT company_registration OR (NULLIF(btrim(company),'') IS NOT NULL AND tax_number ~ '^([0-9]{10}|[1-9][0-9]{10})$' AND tax_number IS NOT NULL));
CREATE OR REPLACE FUNCTION public.e4n_claim_company_tax() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $body$
DECLARE owner uuid;
BEGIN
 NEW.tax_number:=NULLIF(regexp_replace(NEW.tax_number,'[[:space:]-]','','g'),'');
 IF NEW.tax_number IS NOT NULL THEN
  IF NEW.tax_number !~ '^([0-9]{10}|[1-9][0-9]{10})$' THEN RAISE EXCEPTION 'INVALID_TAX_NUMBER' USING ERRCODE='23514',CONSTRAINT='users_company_identity_check'; END IF;
  INSERT INTO public.company_tax_registry(tax_number,owner_id) VALUES(NEW.tax_number,NEW.id) ON CONFLICT(tax_number) DO NOTHING;
  SELECT owner_id INTO owner FROM public.company_tax_registry WHERE tax_number=NEW.tax_number;
  IF owner<>NEW.id THEN RAISE EXCEPTION 'TAX_NUMBER_RESERVED'; END IF;
 END IF;
 RETURN NEW;
END $body$;
DROP TRIGGER IF EXISTS e4n_claim_company_tax ON public.users;
CREATE TRIGGER e4n_claim_company_tax BEFORE INSERT OR UPDATE OF id,tax_number ON public.users FOR EACH ROW EXECUTE FUNCTION public.e4n_claim_company_tax();
CREATE OR REPLACE FUNCTION public.e4n_protect_company_tax_registry() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $body$ BEGIN RAISE EXCEPTION 'COMPANY_TAX_REGISTRY_IMMUTABLE'; END $body$;
DROP TRIGGER IF EXISTS company_tax_registry_immutable ON public.company_tax_registry;
CREATE TRIGGER company_tax_registry_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON public.company_tax_registry FOR EACH STATEMENT EXECUTE FUNCTION public.e4n_protect_company_tax_registry();
REVOKE ALL ON FUNCTION public.e4n_claim_company_tax(),public.e4n_protect_company_tax_registry() FROM PUBLIC;
DO $roles$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON FUNCTION public.e4n_claim_company_tax(),public.e4n_protect_company_tax_registry() FROM anon; END IF; IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON FUNCTION public.e4n_claim_company_tax(),public.e4n_protect_company_tax_registry() FROM authenticated; END IF; END $roles$;
-- A removed account retains its registry claim; no foreign-key cascade.
CREATE TABLE IF NOT EXISTS public.normal_membership_role_transition(user_id uuid PRIMARY KEY,previous_role text NOT NULL,recorded_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.normal_membership_role_transition ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.normal_membership_role_transition FROM PUBLIC;
DO $roles$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.normal_membership_role_transition FROM anon; END IF; IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.normal_membership_role_transition FROM authenticated; END IF; END $roles$;
INSERT INTO public.normal_membership_role_transition(user_id,previous_role) SELECT id,role FROM public.users WHERE role='COMMUNITY_MEMBER' ON CONFLICT(user_id) DO NOTHING;
UPDATE public.users SET role='MEMBER' WHERE role='COMMUNITY_MEMBER';
ALTER TABLE public.users DROP CONSTRAINT users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK(role IN ('MEMBER','PRESIDENT','VICE_PRESIDENT','SECRETARY_TREASURER','ADMIN'));

UPDATE public.document_library SET allowed_roles=ARRAY(SELECT DISTINCT CASE WHEN r='COMMUNITY_MEMBER' THEN 'MEMBER' ELSE r END FROM unnest(allowed_roles) r) WHERE 'COMMUNITY_MEMBER'=ANY(allowed_roles);
ALTER TABLE public.document_library DROP CONSTRAINT document_library_allowed_roles_check;
ALTER TABLE public.document_library ADD CONSTRAINT document_library_allowed_roles_check CHECK(allowed_roles <@ ARRAY['ADMIN','PRESIDENT','VICE_PRESIDENT','MEMBER','SECRETARY_TREASURER']::text[]);
