
-- 1. Tighten partner_bookings INSERT policy
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.partner_bookings;
CREATE POLICY "Anyone can create bookings"
ON public.partner_bookings
FOR INSERT
TO public
WITH CHECK (
  partner_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.partner_profiles p WHERE p.id = partner_id)
  AND status = 'pending'
  AND payment_status IN ('unpaid','pending')
  AND commission_pct IS NULL
  AND deposit_pct IS NULL
  AND (customer_user_id IS NULL OR customer_user_id = auth.uid())
);

-- 2. Quote requests: anon cannot attach files
DROP POLICY IF EXISTS "Anyone can submit quote requests" ON public.quote_requests;
CREATE POLICY "Anyone can submit quote requests"
ON public.quote_requests
FOR INSERT
TO public
WITH CHECK (
  status = 'new'
  AND (
    auth.uid() IS NOT NULL
    OR files IS NULL
    OR files = '[]'::jsonb
    OR jsonb_array_length(files) = 0
  )
);

-- 3. Media bucket: scope update/delete to owner or admin; remove broad listing
DROP POLICY IF EXISTS "Authenticated update media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete media" ON storage.objects;
DROP POLICY IF EXISTS "Public read media" ON storage.objects;

CREATE POLICY "Owners or admins update media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media'
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

CREATE POLICY "Owners or admins delete media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

-- (Public bucket continues to serve files via public URLs; listing is now disallowed.)

-- 4. user_roles: restrictive guard so only admins can write
CREATE POLICY "Only admins can write roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5. Revoke EXECUTE from anon/authenticated on internal SECURITY DEFINER functions.
-- These are still callable from RLS policy expressions (evaluator bypasses EXECUTE grants).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_partner() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_partner_rates() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_quote_tracking_code() FROM anon, authenticated, public;
-- lookup_quote_status is intentionally public so customers can check their quote.
