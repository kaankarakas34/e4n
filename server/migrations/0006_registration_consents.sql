-- Match the columns written by the active registration endpoint.
-- Nullable additions do not invent historical consent for existing accounts.
ALTER TABLE users ADD COLUMN IF NOT EXISTS kvkk_consent BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS explicit_consent BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_date TIMESTAMP WITH TIME ZONE;
