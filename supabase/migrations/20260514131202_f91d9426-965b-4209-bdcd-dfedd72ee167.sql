
-- Add tracking-related columns to quote_requests
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS project_name text,
  ADD COLUMN IF NOT EXISTS expected_delivery date,
  ADD COLUMN IF NOT EXISTS tracking_code text;

-- Generate a short tracking code automatically for new rows
CREATE OR REPLACE FUNCTION public.generate_quote_tracking_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_code IS NULL OR NEW.tracking_code = '' THEN
    NEW.tracking_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quote_requests_set_tracking_code ON public.quote_requests;
CREATE TRIGGER quote_requests_set_tracking_code
  BEFORE INSERT ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_quote_tracking_code();

-- Backfill existing rows
UPDATE public.quote_requests
SET tracking_code = upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8))
WHERE tracking_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS quote_requests_tracking_code_idx
  ON public.quote_requests (tracking_code);

-- Public lookup function: returns minimal status info by phone + tracking code.
-- SECURITY DEFINER so it bypasses the "No public read" RLS policy safely,
-- and only exposes non-sensitive fields.
CREATE OR REPLACE FUNCTION public.lookup_quote_status(_phone text, _code text)
RETURNS TABLE (
  tracking_code text,
  status text,
  project_name text,
  project_type text,
  expected_delivery date,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.tracking_code,
    q.status,
    q.project_name,
    q.project_type,
    q.expected_delivery,
    q.created_at
  FROM public.quote_requests q
  WHERE upper(q.tracking_code) = upper(trim(_code))
    AND regexp_replace(q.phone, '\D', '', 'g') = regexp_replace(_phone, '\D', '', 'g')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_quote_status(text, text) TO anon, authenticated;
