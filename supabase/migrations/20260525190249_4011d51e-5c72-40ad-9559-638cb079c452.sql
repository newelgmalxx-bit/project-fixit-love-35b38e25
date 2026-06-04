-- Add signature image column to partner_agreements (data URL of hand-drawn signature)
ALTER TABLE public.partner_agreements
  ADD COLUMN IF NOT EXISTS signature_image text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin_issued';
-- source: 'admin_issued' (sent by admin) or 'self_signup' (signed at registration)

-- Ensure a default active template exists for self-signup flow
INSERT INTO public.agreement_templates (version, title, body, is_active)
SELECT
  'v2026-01',
  'عقد شراكة مركز مع منصة خصومات',
  E'يُبرم هذا العقد بين منصة خصومات ("المنصة") والمركز المُسجَّل أدناه ("الشريك") بمجرد توقيعه إلكترونياً.\n\n1. تُحتسب نسبة {commission_pct}% على كل حجز تُحصَّل كعربون من العميل عند الحجز وتُعدّ في الوقت نفسه عمولة المنصة على نفس الحجز.\n\n2. يلتزم الشريك بتقديم الخدمة المعلنة في العرض بالجودة والسعر المتفق عليه، وبتأكيد أو رفض كل حجز خلال مدة معقولة من استلامه.\n\n3. يُقرّ الشريك بصحة بياناته (اسم المركز، المسؤول، رقم الجوال، البريد الإلكتروني، المدينة، السجل التجاري إن وجد) ويتحمّل مسؤولية أي بيانات غير صحيحة.\n\n4. أي خلاف بين الشريك والعميل يُحل ودياً، ويحق للمنصة التدخل لحماية حقوق الطرفين، كما يحق لها إيقاف الحساب عند مخالفة الشروط.\n\n5. يحق للمنصة تحديث نسبة العمولة لاحقاً بإشعار مسبق للشريك عبر لوحة التحكم.\n\n6. تُحفظ هذه الاتفاقية إلكترونياً مع توقيع الشريك (اسم + توقيع يدوي) وتاريخ التوقيع، وتُعتبر سارية المفعول فور التوقيع.'
,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.agreement_templates WHERE is_active = true);