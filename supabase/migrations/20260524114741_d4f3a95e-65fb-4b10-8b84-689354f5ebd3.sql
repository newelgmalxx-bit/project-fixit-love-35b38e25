-- Add commission and deposit settings per partner, and store deposit info per booking
ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS commission_pct numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS deposit_pct numeric NOT NULL DEFAULT 20;

ALTER TABLE public.partner_bookings
  ADD COLUMN IF NOT EXISTS deposit_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_pct numeric,
  ADD COLUMN IF NOT EXISTS deposit_pct numeric;

-- Sanity bounds via validation trigger (avoid immutable CHECK constraints per guidelines)
CREATE OR REPLACE FUNCTION public.validate_partner_rates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.commission_pct IS NOT NULL AND (NEW.commission_pct < 0 OR NEW.commission_pct > 100) THEN
    RAISE EXCEPTION 'commission_pct must be between 0 and 100';
  END IF;
  IF NEW.deposit_pct IS NOT NULL AND (NEW.deposit_pct < 0 OR NEW.deposit_pct > 100) THEN
    RAISE EXCEPTION 'deposit_pct must be between 0 and 100';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_partner_rates ON public.partner_profiles;
CREATE TRIGGER trg_validate_partner_rates
BEFORE INSERT OR UPDATE ON public.partner_profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_partner_rates();