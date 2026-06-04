
-- agreement_templates
CREATE TABLE public.agreement_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agreement_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates" ON public.agreement_templates
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage templates insert" ON public.agreement_templates
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage templates update" ON public.agreement_templates
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage templates delete" ON public.agreement_templates
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_agreement_templates_updated
  BEFORE UPDATE ON public.agreement_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- partner_agreements
CREATE TABLE public.partner_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  template_id uuid REFERENCES public.agreement_templates(id) ON DELETE SET NULL,
  template_version text,
  commission_pct numeric NOT NULL DEFAULT 10,
  deposit_pct numeric NOT NULL DEFAULT 20,
  status text NOT NULL DEFAULT 'sent', -- sent | signed | rejected
  admin_notes text,
  signed_name text,
  signed_at timestamptz,
  signed_ip text,
  pdf_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_partner_agreements_partner ON public.partner_agreements(partner_id);
ALTER TABLE public.partner_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own agreements" ON public.partner_agreements
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.partner_profiles p WHERE p.id = partner_agreements.partner_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Admins insert agreements" ON public.partner_agreements
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Partners sign own agreements" ON public.partner_agreements
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.partner_profiles p WHERE p.id = partner_agreements.partner_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Admins delete agreements" ON public.partner_agreements
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_partner_agreements_updated
  BEFORE UPDATE ON public.partner_agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- per-offer commission override
ALTER TABLE public.partner_offers
  ADD COLUMN IF NOT EXISTS commission_pct_override numeric;

-- storage bucket for signed agreements (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('agreements', 'agreements', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins read agreements bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'agreements' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins write agreements bucket" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'agreements' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Partners read own agreement files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'agreements' AND
    EXISTS (
      SELECT 1 FROM public.partner_profiles p
      WHERE p.user_id = auth.uid() AND (storage.foldername(name))[1] = p.id::text
    )
  );
CREATE POLICY "Partners write own agreement files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agreements' AND
    EXISTS (
      SELECT 1 FROM public.partner_profiles p
      WHERE p.user_id = auth.uid() AND (storage.foldername(name))[1] = p.id::text
    )
  );

-- default template seed
INSERT INTO public.agreement_templates (version, title, body, is_active) VALUES (
  'v1-2026',
  'اتفاقية الشراكة والعمولة',
  E'بموجب هذه الاتفاقية، يوافق المركز (الشريك) على الانضمام إلى منصة خصومات وفقاً للشروط التالية:\n\n1. تُحتسب عمولة المنصة بنسبة {commission_pct}% من قيمة كل حجز يتم عبر المنصة.\n2. يتم تحصيل العمولة مقدماً من العميل عند إتمام الحجز، ولا يحق للشريك المطالبة بأي طلبات سحب من المنصة، حيث أن المبلغ المستحق للشريك يصله مباشرة من العميل بعد خصم العمولة.\n3. نسبة العربون المتفق عليها: {deposit_pct}%.\n4. يلتزم الشريك بتقديم الخدمات بجودة عالية وفي المواعيد المحددة.\n5. يحق للمنصة إيقاف أو إلغاء حساب الشريك في حال مخالفة الشروط.\n6. تخضع هذه الاتفاقية لأنظمة المملكة العربية السعودية.\n\nبالتوقيع الإلكتروني أدناه فأنت تقر بقراءتك للاتفاقية وموافقتك على جميع بنودها.',
  true
) ON CONFLICT (version) DO NOTHING;
