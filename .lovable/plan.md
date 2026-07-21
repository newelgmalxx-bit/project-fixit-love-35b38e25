## قرأت التقرير الجديد (Mobile) — النتائج الحقيقية

- **Performance 60 → 64** — لسه أقل حاجة، والسبب الرئيسي: `Enormous network payload 14,958 KiB` + `Image savings 12,964 KiB`.
- **Accessibility 86** — عيب واحد ظاهر: تباين `text-amber-600/70` على `bg-amber-50`.
- **Best Practices 92** — Charset declaration late.
- **SEO 92** — أغلبه مسائل يحلها الرفع الفعلي بعد التعديلات.

المشاكل الحقيقية في الصور — **صنفين**:
1. **صور مرفوعة `koswmat.com/uploads/...`**: `SmartImage` مطبّق بالفعل على `OfferCard/CategoriesGrid/SponsoredAds/…`، بس التقرير الحالي جاي من بناء أقدم من آخر تعديل. بعد الـ publish الجاية دي هتتحسّن لوحدها عن طريق wsrv.nl.
2. **صور مبنية مع الـ bundle في `src/assets/hero-*.jpg`** — الحجم دلوقتي **~3.9 MB** لـ 7 صور بس (hero-mock.png = 695 KB، hero-tinting.webp = 786 KB، hero-hair-curl.jpg = 594 KB، hero-hairwash.jpg = 533 KB، hero-blowdry.jpg = 462 KB، hero-facial.jpg = 393 KB، hero-hair-blonde.jpg = 338 KB). دي بتتقدم من الـ CDN بتاعنا مباشرة و**مش بتمر على wsrv.nl** لأنها relative — `SmartImage` بيسيبها زي ما هي عمداً. الحل الوحيد: ضغطها في المصدر.

---

## الخطة (5 نقاط)

### 1) ضغط صور الـ hero المبنية داخل الـ bundle 🔥 (أعلى ROI)
تحويل كل صور `src/assets/hero-*` إلى WebP بجودة 72 و max-width 1400px باستخدام `magick`، ثم تحديث كل الـ imports (`OffersHero.tsx`, `about.tsx`, `contact.tsx`, `CtaBanner.tsx`, `AboutIntroSection.tsx`) من `.jpg`/`.png` إلى `.webp`.

**التوفير المتوقع**: من ~3.9 MB لـ ~800 KB لكل الصور مجتمعة (~78% تقليل). ده يقلل الـ LCP من 7.6s لحوالي 3-4s على الموبايل.

### 2) تصحيح تباين الـ badge الأصفر
`text-amber-600/70` على `bg-amber-50` راسب في التقرير — تغييرها إلى `text-amber-700` (تباين WCAG AA).

### 3) تأكيد أن `<meta charset>` أول tag
مراجعة SSR output الفعلي والتأكد إنه فعلاً في أول 1024 بايت — يظهر إنه لسه بيحصل reorder بعد `<HeadContent />`. الحل: نقل الـ `<meta charSet>` قبل `<HeadContent />` مباشرة داخل `RootDocument` (شكله كذا حالياً، محتاج تأكيد بـ view-source بعد الرفع).

### 4) Preload لصورة الـ hero LCP
في `__root.tsx` أو route index: `<link rel="preload" as="image" href={heroFacialWebp} fetchpriority="high">` عشان الشريحة الأولى تظهر أسرع.

### 5) LazyGoogleOAuth already applied — تأكيد الفصل
مراجعة إن الـ `@react-oauth/google` مش بيتحمّل على الصفحة الرئيسية (باين في التقرير `accounts.google.com/gsi/client 95.8 KiB`). لو لسه بيتحمّل، هنعمل audit للـ imports.

---

## نطاق التغييرات

```text
src/assets/hero-*.webp                 ← جديد (بديل .jpg / .png)
src/components/sections/OffersHero.tsx ← imports webp
src/components/sections/AboutIntroSection.tsx
src/components/sections/CtaBanner.tsx
src/routes/about.tsx
src/routes/contact.tsx
src/routes/__root.tsx                  ← preload LCP + charset audit
<كل مكان بيستعمل text-amber-600/70>    ← text-amber-700
```

الباك إند مش محتاج تغيير.

---

**ملاحظة**: التقرير الحالي (60/86/92/92) جاي على الأغلب من بناء قبل ما نطبّق `SmartImage` على كل الصور اللي جاية من `koswmat.com/uploads`. حتى من غير أي تعديل جديد، مجرد Publish + قياس تاني هيرفع الرقم بشكل ملحوظ لأن صور الـ CDN هتعدّي على wsrv.nl WebP. الخطة دي فوق ده — بتاكل الـ **3.9 MB** المتبقية من الصور الـ bundled، اللي هي دلوقتي أكبر مصدر للتأخير.

هل نمشي؟ (لو موافق بروح على build mode وأنفّذها كلها).
