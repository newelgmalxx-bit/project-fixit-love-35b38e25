-- Sponsored ads managed by admins, shown above the hero
CREATE TABLE public.sponsored_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  cta_label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsored_ads ENABLE ROW LEVEL SECURITY;

-- Public can read active ads (anyone, including anon)
CREATE POLICY "Anyone can view active sponsored ads"
  ON public.sponsored_ads FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

-- Admins manage all
CREATE POLICY "Admins can view all sponsored ads"
  ON public.sponsored_ads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert sponsored ads"
  ON public.sponsored_ads FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sponsored ads"
  ON public.sponsored_ads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sponsored ads"
  ON public.sponsored_ads FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_sponsored_ads_updated_at
  BEFORE UPDATE ON public.sponsored_ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
