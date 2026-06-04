ALTER TABLE public.partner_agreements
ADD COLUMN IF NOT EXISTS custom_title text,
ADD COLUMN IF NOT EXISTS custom_body text;