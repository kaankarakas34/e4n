-- Additive repair for columns already used by the existing group settings UI.
-- Preserve all existing values on schemas that already contain these columns.
ALTER TABLE groups ADD COLUMN IF NOT EXISTS meeting_time TIME;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(255);
