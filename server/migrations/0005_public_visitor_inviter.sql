-- Fresh installations need the same inviter relation used by visitor API writes.
-- The existing live schema already has this column; live adoption is a separate P09 path.
ALTER TABLE public_visitors
  ADD COLUMN IF NOT EXISTS inviter_id UUID REFERENCES users(id);
