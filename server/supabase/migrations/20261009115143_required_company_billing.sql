-- Preserve existing incomplete records for explicit completion review.
-- NOT VALID still enforces the constraint for every new insert/update.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_company_billing_check;
ALTER TABLE public.users ADD CONSTRAINT users_company_billing_check CHECK (
 NOT company_registration OR (NULLIF(btrim(tax_office),'') IS NOT NULL
 AND NULLIF(btrim(billing_address),'') IS NOT NULL)
) NOT VALID;
