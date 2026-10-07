CREATE TABLE public.web_job_runs (
  id uuid PRIMARY KEY,
  job text NOT NULL CHECK (job IN ('event-completion','subscription-reminders','champion-calculation')),
  source text NOT NULL CHECK (source IN ('SCHEDULE','EXTERNAL','ADMIN')),
  state text NOT NULL CHECK (state IN ('RUNNING','SUCCESS','SKIPPED','FAILED','UNKNOWN')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(summary)='object'),
  error_code text,
  CHECK ((state='RUNNING' AND completed_at IS NULL) OR (state<>'RUNNING' AND completed_at IS NOT NULL))
);
CREATE INDEX web_job_runs_started_idx ON public.web_job_runs(started_at DESC,id DESC);
ALTER TABLE public.web_job_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.web_job_runs FROM PUBLIC;
DO $roles$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.web_job_runs FROM anon; END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.web_job_runs FROM authenticated; END IF;
END
$roles$;
