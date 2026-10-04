-- Persist the history rows already emitted by the existing score calculator.
-- This does not introduce a new score formula or historical backfill.
CREATE TABLE user_score_history (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID NOT NULL REFERENCES users(id),
 score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
 color VARCHAR(10) NOT NULL CHECK (color IN ('GREY','RED','YELLOW','GREEN')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX user_score_history_user_created_idx ON user_score_history(user_id,created_at DESC);
ALTER TABLE user_score_history ENABLE ROW LEVEL SECURITY;
