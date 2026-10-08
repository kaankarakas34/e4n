-- Additive profile storage. No API-time DDL, company verification or entitlement policy.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
