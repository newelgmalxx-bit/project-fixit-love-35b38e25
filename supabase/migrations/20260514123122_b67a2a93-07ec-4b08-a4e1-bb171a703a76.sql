
-- Quote requests table
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT,
  start_date DATE,
  project_type TEXT,
  area NUMERIC,
  budget TEXT,
  notes TEXT,
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a quote request (public form, no auth required)
CREATE POLICY "Anyone can submit quote requests"
ON public.quote_requests FOR INSERT
WITH CHECK (true);

-- No public SELECT — admin will use service role via server function
CREATE POLICY "No public read"
ON public.quote_requests FOR SELECT
USING (false);

-- Storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-files', 'quote-files', true);

CREATE POLICY "Anyone can upload quote files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'quote-files');

CREATE POLICY "Anyone can read quote files"
ON storage.objects FOR SELECT
USING (bucket_id = 'quote-files');
