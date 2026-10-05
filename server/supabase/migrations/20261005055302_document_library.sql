CREATE TABLE document_library (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 description text NOT NULL DEFAULT '' CHECK(length(description)<=2000),
 category text NOT NULL CHECK(category IN ('GENERAL','EDUCATION','LEGAL','MARKETING')),
 filename text NOT NULL CHECK(length(filename) BETWEEN 1 AND 180),
 mime_type text NOT NULL CHECK(mime_type IN ('application/pdf','image/png','image/jpeg')),
 size_bytes integer NOT NULL CHECK(size_bytes BETWEEN 1 AND 3145728),
 uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 allowed_roles text[] NOT NULL DEFAULT '{}' CHECK(allowed_roles <@ ARRAY['ADMIN','PRESIDENT','VICE_PRESIDENT','MEMBER','SECRETARY_TREASURER','COMMUNITY_MEMBER']::text[]),
 request_key uuid NOT NULL, fingerprint text NOT NULL CHECK(length(fingerprint)=64),
 created_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
 UNIQUE(uploaded_by,request_key)
);
CREATE INDEX document_library_active ON document_library(created_at DESC,id DESC) WHERE archived_at IS NULL;
CREATE TABLE document_files(document_id uuid PRIMARY KEY REFERENCES document_library(id) ON DELETE RESTRICT, content bytea NOT NULL CHECK(octet_length(content) BETWEEN 1 AND 3145728));
ALTER TABLE document_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON document_library,document_files FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON document_library,document_files FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON document_library,document_files FROM authenticated; END IF;
END $$;
