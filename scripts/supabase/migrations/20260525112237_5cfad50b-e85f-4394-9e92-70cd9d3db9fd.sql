-- Extend partner_bookings to support cart-based group bookings
ALTER TABLE public.partner_bookings
  ALTER COLUMN partner_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS customer_user_id uuid,
  ADD COLUMN IF NOT EXISTS offer_title text,
  ADD COLUMN IF NOT EXISTS vendor_name text,
  ADD COLUMN IF NOT EXISTS order_group_id uuid,
  ADD COLUMN IF NOT EXISTS qty integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

-- Index for quick lookup of a customer's bookings & for grouping by order
CREATE INDEX IF NOT EXISTS idx_partner_bookings_customer_user_id ON public.partner_bookings(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_partner_bookings_order_group ON public.partner_bookings(order_group_id);

-- Customers can view their own bookings (was missing — only partners/admins could)
DROP POLICY IF EXISTS "Customers view own bookings" ON public.partner_bookings;
CREATE POLICY "Customers view own bookings"
ON public.partner_bookings
FOR SELECT
TO authenticated
USING (auth.uid() = customer_user_id);

-- Customers can update (e.g. cancel) their own bookings
DROP POLICY IF EXISTS "Customers update own bookings" ON public.partner_bookings;
CREATE POLICY "Customers update own bookings"
ON public.partner_bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = customer_user_id);

-- Ensure updated_at auto-bumps on row changes
DROP TRIGGER IF EXISTS trg_partner_bookings_updated_at ON public.partner_bookings;
CREATE TRIGGER trg_partner_bookings_updated_at
BEFORE UPDATE ON public.partner_bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();