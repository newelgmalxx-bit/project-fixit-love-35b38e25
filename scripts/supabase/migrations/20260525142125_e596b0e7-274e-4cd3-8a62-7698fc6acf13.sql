ALTER TABLE public.partner_offers
  ADD COLUMN IF NOT EXISTS overview_bullets jsonb NOT NULL DEFAULT '[]'::jsonb;