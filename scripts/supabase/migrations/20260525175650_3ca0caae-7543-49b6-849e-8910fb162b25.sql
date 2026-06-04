ALTER TABLE public.sponsored_ads
  ADD COLUMN IF NOT EXISTS slide_index integer,
  ADD COLUMN IF NOT EXISTS offer_id uuid;

CREATE INDEX IF NOT EXISTS sponsored_ads_slide_idx ON public.sponsored_ads(slide_index);