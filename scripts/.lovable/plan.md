# خطة: دعم العربي + الإنجليزي في كل الفورمات (Admin + Partner)

## القاعدة العامة لكل فورم
- كل حقل نصي (اسم/عنوان/وصف/شارة/شروط/نقاط…) يتقسم لحقلين: **`X_ar` (إجباري)** و **`X_en` (اختياري)**.
- العرض في الواجهات يتم باللغة الحالية مع fallback للعربي لو الإنجليزي فاضي.
- نتفق مع الباك (MySQL) إنه يضيف الأعمدة `_en` المقابلة لكل عمود نصي.

## ملاحظة مهمة
الـ DB المستضافة على Hostinger (MySQL) — التعديلات بتاعتها هتتعمل من قِبل الباك إند (مش Supabase migrations). أنا هحضّر:
1. كل تعديلات الفرونت (الفورمات + الـ API payloads + العرض).
2. ملف `BACKEND_SCHEMA_BILINGUAL.md` فيه كل أعمدة الـ `_en` المطلوب إضافتها لكل جدول، عشان تبعته للباك.

## المراحل

### Phase 1 — Offers (الأهم)
- `src/routes/admin.offers.tsx` (إضافة/تعديل عرض من الأدمن).
- `src/routes/partner-dashboard.tsx` و/أو فورم عروض الشريك.
- حقول: `title_ar/en`, `description_ar/en`, `terms_ar/en` (array)، `overview_bullets_ar/en` (array)، `category_label_ar/en`.
- تحديث `adminOffersApi` و partner offers API ليرسل/يستقبل الحقلين.

### Phase 2 — Partners (المراكز)
- `src/routes/admin.partner.tsx` / `admin.merchants.tsx` + صفحة بيانات الشريك في dashboard.
- حقول: `vendor_name_ar/en`, `owner_name_ar/en`, `about_ar/en`, `address_ar/en`, `working_hours_ar/en`, `category_label_ar/en`.

### Phase 3 — Categories & Cities
- `admin.categories.tsx`: `name_ar/en`.
- `admin.cities.tsx`: `name_ar/en`.

### Phase 4 — Plans
- `admin.plans.tsx`: موجود بالفعل بـ `name/nameEn` و `feats/featsEn` — أتأكد إن validation العربي فقط إجباري ونضبط الـ API.

### Phase 5 — Legal, Settings, Sponsored Ads, Featured Offers, Tracking, SEO, Notifications, Tickets/Contact replies
- `admin.legal.tsx`: `title_ar/en`, `body_ar/en`.
- `admin.settings.*`: حقول النصوص العامة (site name, footer text…) → `_ar/_en`.
- `admin.sponsored-ads.tsx`: `title_ar/en`, `subtitle_ar/en`, `cta_label_ar/en`.
- `admin.seo.tsx`: meta title/description لكل لغة.

## نمط الـ UI الموحّد
لكل فورم نستخدم نفس النمط:
```
[الاسم بالعربي *]   [Name (English) — optional]
[الوصف بالعربي *]   [Description (English) — optional]
```
- خانتين متجاورتين (grid-cols-2) أو tabs (AR/EN) لو الحقول كتيرة.
- `dir="ltr"` تلقائي على حقول الإنجليزي.
- validation: لو الـ `_ar` فاضي → toast error "الحقل العربي مطلوب".

## التسليم
- بعد موافقتك على الخطة هبدأ **Phase 1 (Offers)** فعلياً، وأبعتلك ملف `BACKEND_SCHEMA_BILINGUAL.md` لتبعته للباك إند بالتوازي.
- نعدّي مرحلة مرحلة عشان نراجع كل واحدة قبل اللي بعدها.

موافق نبدأ بـ Phase 1؟
