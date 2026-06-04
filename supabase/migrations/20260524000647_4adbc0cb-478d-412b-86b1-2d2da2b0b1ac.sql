ALTER TABLE public.partner_offers
  ADD COLUMN IF NOT EXISTS featured_rank smallint;

ALTER TABLE public.partner_offers
  DROP CONSTRAINT IF EXISTS partner_offers_featured_rank_check;
ALTER TABLE public.partner_offers
  ADD CONSTRAINT partner_offers_featured_rank_check
  CHECK (featured_rank IS NULL OR featured_rank IN (1,2));

CREATE UNIQUE INDEX IF NOT EXISTS partner_offers_featured_rank_unique
  ON public.partner_offers (featured_rank)
  WHERE featured_rank IS NOT NULL;
