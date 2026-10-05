-- Existing API transfer/shuffle paths already write INACTIVE. Preserve their history.
-- Unknown legacy status constraints are not silently replaced.
DO $migration$
DECLARE definition text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO definition FROM pg_constraint
  WHERE conrelid='public.group_members'::regclass AND conname='group_members_status_check';
  IF definition IS NOT NULL THEN
    IF definition NOT LIKE '%ACTIVE%' OR definition NOT LIKE '%REQUESTED%'
      OR definition LIKE '%REJECTED%' THEN
      RAISE EXCEPTION 'Unreviewed group_members status constraint';
    END IF;
    ALTER TABLE public.group_members DROP CONSTRAINT group_members_status_check;
  END IF;
  ALTER TABLE public.group_members ADD CONSTRAINT group_members_status_check
    CHECK (status IN ('ACTIVE','REQUESTED','INACTIVE')) NOT VALID;
  ALTER TABLE public.group_members VALIDATE CONSTRAINT group_members_status_check;
END $migration$;

-- Already referenced by legacy role assignment/read paths; nullable, no role backfill.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS group_title varchar(50);
