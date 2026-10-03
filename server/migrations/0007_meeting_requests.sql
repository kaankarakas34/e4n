-- Do not rewrite legacy activity history or award points for a request.
ALTER TABLE one_to_ones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
CREATE TABLE one_to_one_requests (
 id UUID PRIMARY KEY,
 requester_id UUID NOT NULL REFERENCES users(id),
 partner_id UUID NOT NULL REFERENCES users(id),
 meeting_date TIMESTAMPTZ NOT NULL,
 notes TEXT NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','REJECTED')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ,
 CHECK (requester_id <> partner_id)
);
CREATE INDEX one_to_one_requests_requester_idx ON one_to_one_requests(requester_id, meeting_date DESC);
CREATE INDEX one_to_one_requests_partner_idx ON one_to_one_requests(partner_id, meeting_date DESC);
