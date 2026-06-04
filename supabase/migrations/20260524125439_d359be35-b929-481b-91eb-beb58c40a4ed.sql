
CREATE TABLE public.partner_commission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  current_commission_pct NUMERIC,
  current_deposit_pct NUMERIC,
  requested_commission_pct NUMERIC NOT NULL,
  requested_deposit_pct NUMERIC NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_commission_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners insert own commission requests"
ON public.partner_commission_requests FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.partner_profiles p
  WHERE p.id = partner_commission_requests.partner_id AND p.user_id = auth.uid()
));

CREATE POLICY "Partners view own commission requests"
ON public.partner_commission_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partner_profiles p
    WHERE p.id = partner_commission_requests.partner_id AND p.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins update commission requests"
ON public.partner_commission_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete commission requests"
ON public.partner_commission_requests FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_partner_commission_requests_updated
BEFORE UPDATE ON public.partner_commission_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
