CREATE TABLE group_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
 user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 president_id uuid REFERENCES users(id) ON DELETE SET NULL,
 state text NOT NULL DEFAULT 'AWAITING_CALL' CHECK(state IN ('AWAITING_CALL','INTERVIEWED','ACCEPTED','REJECTED')),
 interview_at timestamptz, interview_note text, interviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
 decided_at timestamptz, decided_by uuid REFERENCES users(id) ON DELETE SET NULL, decision_note text,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(group_id,user_id)
);
CREATE INDEX group_applications_president_queue ON group_applications(president_id,state,created_at);
CREATE TABLE group_application_mail (
 application_id uuid PRIMARY KEY REFERENCES group_applications(id),
 state text NOT NULL DEFAULT 'QUEUED' CHECK(state IN ('QUEUED','SENDING','SENT','FAILED','UNKNOWN')),
 attempts integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ADD COLUMN action_url text;
-- Recover pending legacy requests only when a single current president is identifiable.
INSERT INTO group_applications(group_id,user_id,president_id)
 SELECT gm.group_id,gm.user_id,p.id FROM group_members gm JOIN groups g ON g.id=gm.group_id
 JOIN LATERAL (SELECT min(u.id::text)::uuid id FROM group_members pm JOIN users u ON u.id=pm.user_id
  WHERE pm.group_id=gm.group_id AND pm.status='ACTIVE' AND (pm.role='PRESIDENT' OR u.role='PRESIDENT' OR to_jsonb(u)->>'group_title'='PRESIDENT') HAVING count(*)=1) p ON true
 WHERE gm.status IN ('REQUESTED','PENDING') AND g.status='ACTIVE';
INSERT INTO group_application_mail(application_id) SELECT id FROM group_applications;
INSERT INTO notifications(user_id,title,message,type,action_url)
 SELECT president_id,'Bekleyen grup başvurusu','Bekleyen başvurunun telefon görüşmesini kaydedin.','SYSTEM','/group-management?tab=applications&group='||group_id FROM group_applications;
ALTER TABLE group_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_application_mail ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON group_applications,group_application_mail FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON group_applications,group_application_mail FROM authenticated; END IF;
END $$;
