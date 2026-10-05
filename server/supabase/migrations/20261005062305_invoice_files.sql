CREATE TABLE invoice_files (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 member_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 visitor_id uuid REFERENCES public_visitors(id) ON DELETE RESTRICT,
 uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 request_key uuid NOT NULL, fingerprint text NOT NULL CHECK(length(fingerprint)=64),
 filename text NOT NULL CHECK(length(filename) BETWEEN 1 AND 180),
 size_bytes integer NOT NULL CHECK(size_bytes BETWEEN 1 AND 3145728),
 content bytea NOT NULL CHECK(octet_length(content)=size_bytes),
 email_state text NOT NULL CHECK(email_state IN ('ATTEMPTED','SENT','UNKNOWN','NO_ADDRESS')),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(num_nonnulls(member_id,visitor_id)=1), UNIQUE(uploaded_by,request_key)
);
CREATE INDEX invoice_files_member ON invoice_files(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX invoice_files_visitor ON invoice_files(visitor_id) WHERE visitor_id IS NOT NULL;
ALTER TABLE invoice_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON invoice_files FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON invoice_files FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON invoice_files FROM authenticated; END IF;
END $$;
