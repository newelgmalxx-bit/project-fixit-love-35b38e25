## تشخيص سريع

راجعت تقرير Lighthouse (koswmat.com): Performance 35، Accessibility 86، Best Practices 69، SEO 92.
**كل المشاكل تقريبًا فرونت إند** — الباك إند بيرجّع البيانات، لكن الفرونت بيحمّل صور ضخمة، JS كتير، وخط render-blocking، ومفيش `robots.txt` صحيح، وفيه مشاكل a11y صغيرة.

---

## الخطة (على مراحل، الأهم الأول)

### 1) الصور — التوفير الأكبر (~20 MB) 🔥
- كل صور العروض/المراكز/السلايدر بتتحمّل بحجمها الأصلي (JPG/PNG ثقيلة).
- إضافة `loading="lazy"` و `decoding="async"` و `width`/`height` صريحة على كل `<img>` في `OfferCard`, `CategoriesGrid`, `HomeOfferSlider`, `SponsoredAdsBanner`, `TestimonialsSection`.
- صورة الـ LCP (أول صورة في `OffersHero`) تتحط `fetchpriority="high"` وتعمل preload في `head()`.
- استخدام `<picture>` + query params للـ CDN اللي بيدعم resize (لو الباك إند بيرجّع Cloudflare/R2 URLs)، أو wrapper `<Img>` بسيط يضيف `?w=` تلقائيًا.

### 2) خط Tajawal — render-blocking (~510 ms)
- دلوقتي بيتحمّل كـ `<link rel="stylesheet">` من Google Fonts في `__root.tsx` و`index.html` (مكرّر!).
- الحل: إزالة السطر من `index.html`، وتحويل الـ `<link>` في الجذر إلى تحميل غير حاجب:
  ```
  <link rel="preload" as="style" onload="this.rel='stylesheet'">
  ```
  أو self-host بس ٢ أوزان (400/700) بدل ٦.

### 3) JS ضخم — 505 KiB غير مستخدم، TBT 1280 ms
- مراجعة `vite.config.ts` لتفعيل manual chunks للـ vendors الكبيرة (react, tanstack, radix, google-oauth).
- تأجيل تحميل `@react-oauth/google` — بيتحمّل على الصفحة الرئيسية مع إنه محتاج بس في صفحات تسجيل الدخول. نقله لـ dynamic import داخل صفحات auth بس.
- إزالة `useTrackVisit` / `usePageTracking` من الـ critical path (تأخيرهم بـ `requestIdleCallback`).
- Route-level code splitting فعّال بالفعل لكن الصفحة الرئيسية بتستدعي أكتر من hook قبل paint — تأجيل `useHomeData` fetch لبعد mount.

### 4) `robots.txt` + `sitemap.xml` (SEO)
- إنشاء `public/robots.txt` صحيح:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://koswmat.com/sitemap.xml
  ```
- إنشاء `src/routes/sitemap[.]xml.ts` كـ server route يرجّع كل الروابط العامة (home, offers, categories, about, contact, privacy, terms) + العروض المنشورة ديناميكيًا.
- إضافة `llms.txt` مبسّط في `public/`.

### 5) `index.html` — تنظيف
- تصحيح `<title>` و`description` (لسه مكتوب "beauty" / "بيوتي بوكينج") ليطابق SEO الجديد.
- التأكد إن `<meta charset>` أول tag في `<head>` (حاليًا صح لكن الترتيب في `__root.tsx` بيحطّه بعد viewport — نظّبطه).
- شيل الـ og:image القديم اللي بيشاور على preview URL قديم.

### 6) Accessibility (86 → 95+)
- تباين الألوان: زر "عرض كل العروض" ونصوص secondary في `WhyUsSection` تحت المطلوب. تعديل tokens في `styles.css`.
- Links بدون اسم: أيقونات السوشيال في `SiteFooter` بدون `aria-label` — إضافتها.
- Touch targets: بعض الأزرار الدائرية أصغر من 24×24 CSS px — رفعها إلى 44×44.
- ترتيب الـ headings: الصفحة فيها `<h1>` بعده `<h3>` مباشرة في بعض السكاشن — تصحيح لـ `<h2>`.

### 7) Best Practices (69 → 90+)
- Console errors: راجعت اللوجات، فيه warnings من `react-oauth/google` عن third-party cookies. نقل الـ Provider ليلتفّ فقط حول صفحات auth (نفس نقطة 3).
- `Charset declaration`: التأكد إنه أول ٣ tags بعد `<head>` (يتم مع الـ `__root.tsx` cleanup).
- Source maps: تفعيل `build.sourcemap: true` في `vite.config.ts` لبيئة production.

---

## نطاق التغييرات (فرونت إند فقط)

```text
index.html                             ← تنظيف
public/robots.txt                      ← جديد
public/llms.txt                        ← جديد
src/routes/sitemap[.]xml.ts            ← جديد
src/routes/__root.tsx                  ← تحميل الخط + provider positioning
src/components/sections/OfferCard.tsx  ← lazy img + dimensions
src/components/sections/CategoriesGrid.tsx
src/components/sections/HomeOfferSlider.tsx
src/components/sections/OffersHero.tsx ← LCP preload
src/components/layout/SiteFooter.tsx   ← aria-label للسوشيال
src/styles.css                         ← contrast tokens
vite.config.ts                         ← chunks + sourcemap
src/hooks/useTrackVisit.tsx            ← idle deferral
src/hooks/usePageTracking.ts           ← idle deferral
```

**الباك إند مش محتاج تغيير** — كل النقاط دي عرض/تحميل من الفرونت.

---

## سؤال قبل التنفيذ

الخطة كبيرة؛ تحب أنفذها كلها دفعة واحدة، ولا أبدأ بأعلى ROI بس (نقاط 1 + 2 + 4 — دي هترفع Performance من 35 إلى ~70 و SEO لـ 100)، وبعدين نكمّل الباقي؟