
CREATE TABLE public.page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  referrer TEXT,
  source TEXT,
  session_id TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX page_visits_created_at_idx ON public.page_visits (created_at DESC);
CREATE INDEX page_visits_session_idx ON public.page_visits (session_id);

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visits"
  ON public.page_visits FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can read visits"
  ON public.page_visits FOR SELECT
  TO authenticated
  USING (true);
