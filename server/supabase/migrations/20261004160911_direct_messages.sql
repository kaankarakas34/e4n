-- Application JWT users access messages through the Express API, not Supabase Data API.
CREATE TABLE public.direct_messages (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
 receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
 content TEXT NOT NULL CHECK (length(btrim(content))>0 AND length(content)<=4000),
 request_key UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (sender_id<>receiver_id),
 UNIQUE(sender_id,request_key)
);
CREATE INDEX direct_messages_sent_idx ON public.direct_messages(sender_id,receiver_id,created_at DESC,id DESC);
CREATE INDEX direct_messages_received_idx ON public.direct_messages(receiver_id,sender_id,created_at DESC,id DESC);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.direct_messages FROM PUBLIC;
DO $$
DECLARE client_role text;
BEGIN
 FOR client_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated') LOOP
  EXECUTE format('REVOKE ALL ON public.direct_messages FROM %I',client_role);
 END LOOP;
END $$;
-- No client policies: deny direct Data API access. Existing trusted backend owner/bypass role is required.
