-- Roles enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'partner', 'customer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view their roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- partner_profiles
CREATE TABLE IF NOT EXISTS public.partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  commercial_number TEXT,
  logo_url TEXT,
  cover_url TEXT,
  about TEXT,
  working_hours TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | active | rejected | suspended
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own profile" ON public.partner_profiles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR status = 'active');
CREATE POLICY "Partners insert own profile" ON public.partner_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Partners update own profile" ON public.partner_profiles
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete profiles" ON public.partner_profiles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER partner_profiles_updated_at BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- partner_offers
CREATE TABLE IF NOT EXISTS public.partner_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10,2),
  image_url TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft | active | paused
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active offers" ON public.partner_offers
  FOR SELECT USING (status = 'active' OR EXISTS (SELECT 1 FROM public.partner_profiles p WHERE p.id = partner_id AND p.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Partners insert own offers" ON public.partner_offers
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.partner_profiles p WHERE p.id = partner_id AND p.user_id = auth.uid()));
CREATE POLICY "Partners update own offers" ON public.partner_offers
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.partner_profiles p WHERE p.id = partner_id AND p.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Partners delete own offers" ON public.partner_offers
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.partner_profiles p WHERE p.id = partner_id AND p.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER partner_offers_updated_at BEFORE UPDATE ON public.partner_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- partner_bookings
CREATE TABLE IF NOT EXISTS public.partner_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.partner_offers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  booking_date DATE,
  booking_time TEXT,
  amount NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | completed | cancelled
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create bookings" ON public.partner_bookings
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Partners view own bookings" ON public.partner_bookings
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.partner_profiles p WHERE p.id = partner_id AND p.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Partners update own bookings" ON public.partner_bookings
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.partner_profiles p WHERE p.id = partner_id AND p.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER partner_bookings_updated_at BEFORE UPDATE ON public.partner_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- auto-assign 'partner' role on partner_profiles insert
CREATE OR REPLACE FUNCTION public.handle_new_partner()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'partner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_partner_profile_created
AFTER INSERT ON public.partner_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_partner();