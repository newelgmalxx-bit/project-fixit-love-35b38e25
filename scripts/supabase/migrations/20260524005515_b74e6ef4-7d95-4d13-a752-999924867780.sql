
-- 1. partner_profiles: tighten SELECT to owner/admin only
DROP POLICY IF EXISTS "Partners view own profile" ON public.partner_profiles;
CREATE POLICY "Partners view own profile"
ON public.partner_profiles
FOR SELECT
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

-- 2. partner_bookings: add admin DELETE
CREATE POLICY "Admins delete bookings"
ON public.partner_bookings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Avatars storage: scope writes to authenticated user's own folder
DROP POLICY IF EXISTS "Anyone can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update avatars" ON storage.objects;

CREATE POLICY "Users upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Quote files: make bucket private and restrict reads to admins
UPDATE storage.buckets SET public = false WHERE id = 'quote-files';

DROP POLICY IF EXISTS "Anyone can read quote files" ON storage.objects;

CREATE POLICY "Admins read quote files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'quote-files'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins manage quote files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'quote-files'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- 5. Restrict has_role function execution (internal use via RLS only)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
