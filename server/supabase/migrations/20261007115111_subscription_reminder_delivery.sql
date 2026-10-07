-- Durable claim and delivery outcome for the existing membership reminder days.
-- The table prevents duplicate notification/mail attempts across concurrent or
-- repeated scheduler invocations without defining new membership rights.
CREATE TABLE public.subscription_reminder_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_end_date timestamptz NOT NULL,
  trigger_days integer NOT NULL CHECK (trigger_days IN (3, 1, -1, -3, -5)),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  delivery_state text NOT NULL DEFAULT 'CLAIMED'
    CHECK (delivery_state IN ('CLAIMED', 'SENT', 'UNKNOWN', 'NO_EMAIL')),
  claimed_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, subscription_end_date, trigger_days)
);

CREATE INDEX subscription_reminder_deliveries_state_idx
  ON public.subscription_reminder_deliveries (delivery_state, claimed_at);

ALTER TABLE public.subscription_reminder_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.subscription_reminder_deliveries FROM PUBLIC;
DO $roles$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.subscription_reminder_deliveries FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.subscription_reminder_deliveries FROM authenticated;
  END IF;
END
$roles$;
