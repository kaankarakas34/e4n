-- Database-level guard for the confirmed rule: a closed group has at most
-- 35 ACTIVE non-president members and at most one ACTIVE president.
-- The president interpretation intentionally matches the existing application
-- during the P10 transition: group_members.role, users.role or group_title.

CREATE INDEX IF NOT EXISTS group_members_active_group_idx
  ON public.group_members (group_id)
  WHERE status = 'ACTIVE';

CREATE OR REPLACE FUNCTION public.e4n_check_group_capacity_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  active_records integer;
  president_records integer;
BEGIN
  IF NEW.status <> 'ACTIVE' THEN
    RETURN NEW;
  END IF;

  -- Same transaction lock as the application mutation paths. Direct SQL and
  -- Data API writes therefore serialize with API admission/transfer/shuffle.
  PERFORM pg_advisory_xact_lock(4020, 35);

  SELECT count(*)::integer,
    count(*) FILTER (WHERE
      gm.role = 'PRESIDENT'
      OR u.role = 'PRESIDENT'
      OR u.group_title = 'PRESIDENT')::integer
  INTO active_records, president_records
  FROM public.group_members gm
  JOIN public.users u ON u.id = gm.user_id
  WHERE gm.group_id = NEW.group_id AND gm.status = 'ACTIVE';

  IF president_records > 1 THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'group_members_single_president',
      MESSAGE = 'group has more than one active president';
  END IF;
  IF active_records - president_records > 35 THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'group_members_capacity_check',
      MESSAGE = 'group has more than 35 active non-president members';
  END IF;
  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.e4n_check_user_group_capacity_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  affected_group uuid;
  active_records integer;
  president_records integer;
BEGIN
  IF NEW.role IS NOT DISTINCT FROM OLD.role
     AND NEW.group_title IS NOT DISTINCT FROM OLD.group_title THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(4020, 35);
  FOR affected_group IN
    SELECT gm.group_id FROM public.group_members gm
    WHERE gm.user_id = NEW.id AND gm.status = 'ACTIVE'
    ORDER BY gm.group_id
  LOOP
    SELECT count(*)::integer,
      count(*) FILTER (WHERE
        gm.role = 'PRESIDENT'
        OR u.role = 'PRESIDENT'
        OR u.group_title = 'PRESIDENT')::integer
    INTO active_records, president_records
    FROM public.group_members gm
    JOIN public.users u ON u.id = gm.user_id
    WHERE gm.group_id = affected_group AND gm.status = 'ACTIVE';

    IF president_records > 1 THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        CONSTRAINT = 'group_members_single_president',
        MESSAGE = 'group has more than one active president';
    END IF;
    IF active_records - president_records > 35 THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        CONSTRAINT = 'group_members_capacity_check',
        MESSAGE = 'group has more than 35 active non-president members';
    END IF;
  END LOOP;
  RETURN NEW;
END
$function$;

DO $validation$
DECLARE
  violation record;
BEGIN
  PERFORM pg_advisory_xact_lock(4020, 35);
  SELECT gm.group_id,
    count(*)::integer AS active_records,
    count(*) FILTER (WHERE
      gm.role = 'PRESIDENT'
      OR u.role = 'PRESIDENT'
      OR u.group_title = 'PRESIDENT')::integer AS president_records
  INTO violation
  FROM public.group_members gm
  JOIN public.users u ON u.id = gm.user_id
  WHERE gm.status = 'ACTIVE'
  GROUP BY gm.group_id
  HAVING count(*) FILTER (WHERE
      gm.role = 'PRESIDENT'
      OR u.role = 'PRESIDENT'
      OR u.group_title = 'PRESIDENT') > 1
    OR count(*) - count(*) FILTER (WHERE
      gm.role = 'PRESIDENT'
      OR u.role = 'PRESIDENT'
      OR u.group_title = 'PRESIDENT') > 35
  ORDER BY gm.group_id
  LIMIT 1;

  IF violation.group_id IS NOT NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'group_members_capacity_existing_data',
      MESSAGE = 'existing group membership data violates the reviewed capacity rule';
  END IF;
END
$validation$;

DROP TRIGGER IF EXISTS group_members_capacity_write ON public.group_members;
CREATE TRIGGER group_members_capacity_write
AFTER INSERT OR UPDATE OF group_id, user_id, status, role
ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION public.e4n_check_group_capacity_write();

DROP TRIGGER IF EXISTS users_group_capacity_write ON public.users;
CREATE TRIGGER users_group_capacity_write
AFTER UPDATE OF role, group_title
ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.e4n_check_user_group_capacity_write();

REVOKE ALL ON FUNCTION public.e4n_check_group_capacity_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.e4n_check_user_group_capacity_write() FROM PUBLIC;
