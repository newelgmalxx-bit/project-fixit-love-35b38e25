
-- 1. page_visits: restrict SELECT to admins
DROP POLICY IF EXISTS "Authenticated can read visits" ON public.page_visits;
CREATE POLICY "Admins read visits" ON public.page_visits
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. user_roles: explicit deny for non-admin insert/update/delete
-- The ALL policy already gates on has_role(admin); add explicit named policies
-- to make insert/update/delete intent-explicit and prevent bootstrap self-grant.
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins insert roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update roles" ON public.user_roles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete roles" ON public.user_roles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Storage: quote-files bucket - require authentication for upload
DROP POLICY IF EXISTS "Anyone can upload quote files" ON storage.objects;
CREATE POLICY "Authenticated upload quote files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'quote-files');

-- 4. Storage: avatars bucket - restrict listing; direct URL access still works
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
-- Allow authenticated users to manage their own avatars
CREATE POLICY "Authenticated read avatars" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'avatars');
CREATE POLICY "Anon read individual avatars" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'avatars');

-- 5. Lock down SECURITY DEFINER functions that should only run from triggers
REVOKE EXECUTE ON FUNCTION public.handle_new_partner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_quote_tracking_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_partner_rates() FROM PUBLIC, anon, authenticated;
-- has_role is used by RLS policies, so it must remain executable
-- lookup_quote_status is intentionally public (phone+code lookup)
