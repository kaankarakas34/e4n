-- Existing tickets and messages are preserved; receipts only describe new keyed writes.
CREATE TABLE support_mutations (
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 request_key UUID NOT NULL,
 operation VARCHAR(10) NOT NULL CHECK (operation IN ('create','reply','status')),
 fingerprint CHAR(64) NOT NULL,
 ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
 response JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(user_id,request_key)
);
CREATE INDEX support_mutations_ticket_idx ON support_mutations(ticket_id);
