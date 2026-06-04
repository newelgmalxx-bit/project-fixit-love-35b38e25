ALTER TABLE public.partner_profiles
ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS agreement_version TEXT,
ADD COLUMN IF NOT EXISTS agreement_signature TEXT;