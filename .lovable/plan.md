## قراءة التقرير الجديد (Mobile)

- **Performance 71** (كان 60) — تحسّن، بس اللي فاضل:
  - **FCP 3.9s / LCP 4.4s** — الخطوط بتاعة Tajawal بتتحمّل بعد الـ CSS في سلسلة (chain) طولها 2.3s.
  - **Render-blocking**: Google Fonts CSS 1.3KB يوقف الرسم 750ms + CSS داخلي 25.9KB يوقف 860ms.
  - **Improve image delivery — 5,907 KiB savings** — لسه صور من `koswmat.com/uploads` بتتقدم بمقاسات أكبر مما يعرض (SmartImage بيحدد width بس بدون `sizes`).
  - **Reduce unused JS — 139 KiB** — Google Fonts CSS تحت نظر Lighthouse كـ unused + شويّة كود لسه بيتحمّل من غير داعي.
  - **Enormous network payload — 7,442 KiB** (كان 14.9MB) — نص المشكلة اتحل، الباقي في الصور المرفوعة.
  - **Forced reflow — 189ms** من `index-zhykee0y.js` (بيقرأ offsetWidth بعد mutation).
  - **~40 JS chunk حجم كل واحد ~1KiB** لأيقونات lucide مقسّمة بشكل مفرط.
- **Accessibility 94** — Touch targets صغيرة على عناصر معيّنة + heading order.
- **Best Practices 96** — 3 requests 404 على `/offers/aa36a7d6-...` + missing source maps.
- **SEO 100** ✅

الديسكتوب المفروض أعلى بشكل تلقائي من نفس الإصلاحات.

---

## الخطة (7 نقاط، Frontend فقط)

### 1) تسريع الخطوط 🔥 (أكبر أثر على LCP/FCP)
حالياً `<link rel="stylesheet">` من Google Fonts بيولّد سلسلة: HTML → CSS → 8 ملفات woff2. الحل:
- إزالة الـ stylesheet link من `__root.tsx` والاعتماد على `@font-face` مباشرة في `src/styles.css` بـ 2 وزن فقط (400 + 700) subset Arabic.
- إضافة `<link rel="preload" as="font" type="font/woff2" crossorigin>` لملف Tajawal-400 Arabic في `__root.tsx` عشان يبدأ التحميل بالتوازي مع الـ HTML.
- استخدام `font-display: swap` وسحب الـ woff2 من `fonts.gstatic.com` مباشرة (URL ثابت).

**التوفير المتوقع**: -1.5s على FCP، -1s على LCP.

### 2) إضافة `sizes` لـ SmartImage
دلوقتي `SmartImage` بيمرّر `w=...` لـ wsrv.nl بس بدون `sizes` HTML attribute، فالمتصفح بيحمل نسخة أكبر من اللازم. تعديل `SmartImage.tsx` إنه ياخد prop `sizes` ويستعمله + يوفر default مناسب (`"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"`)، والـ srcSet بمقاسات متعددة (`w=320 640 960 1280`).

**التوفير المتوقع**: من الـ 5.9MB savings ياكل ~3-4MB.

### 3) دمج أيقونات lucide في chunk واحد
الـ 40 ملف JS × 1KiB بيسبب 40 HTTP request إضافية على 4G بطيء. تعديل `vite.config.ts` بـ `manualChunks` بسيط (للـ client build فقط) يجمع كل `lucide-react` في chunk واحد. لازم أتجنّب الغلطة السابقة اللي كسرت الـ SSR build — الحل: استعمال `build.rollupOptions.output.manualChunks` كـ function وتفعيله فقط للـ client environment.

### 4) إصلاح Forced Reflow (189ms)
هحدد المصدر بالضبط في build mode (`index-zhykee0y.js` هو المدخل الرئيسي). المشتبه فيه: `Reveal.tsx` أو `useIsMobile` أو `SiteHeader`. الحل الشائع: نقل قراءة `offsetWidth` جوّه `requestAnimationFrame` أو `useLayoutEffect` بعد mutations.

### 5) إصلاح 404s
3 requests فاشلة على offer id `aa36a7d6-8aac-427d-a3e0-9fd51584e78b:1:0`. ده على الأرجح `useHomeData` أو `useSponsoredAds` بيطلب endpoint مش موجود، أو Featured slot فاضي. هعمل audit للـ network requests في preview وأصلح المصدر.

### 6) رفع Touch Targets
Lighthouse بيشير لعناصر مش 44×44. راجع pagination arrows + close buttons + رقم reviews في `OffersHero`.

### 7) الـ meta preload الحالي على `heroFacial`
دلوقتي في `index.tsx` بنعمل preload لـ hero-facial.webp — ده صحيح، بس المفروض بس على mobile viewport (لو ظهر desktop hero مختلف). تأكيد إن ده فعلاً صورة الـ LCP على الموبايل عن طريق الـ screenshot في التقرير.

---

## نطاق الملفات

```text
src/routes/__root.tsx              ← إزالة Google Fonts CSS، إضافة preload
src/styles.css                     ← @font-face inline لـ Tajawal 400/700
src/components/ui/SmartImage.tsx   ← srcSet + sizes prop
src/components/sections/*.tsx      ← تمرير sizes لـ SmartImage في الأماكن الرئيسية
vite.config.ts                     ← manualChunks لأيقونات lucide (client only)
src/components/Reveal.tsx (؟)      ← فحص forced reflow
src/hooks/useHomeData.ts (؟)       ← فحص الـ 404
```

باك إند مش محتاج تغيير.

---

**النتيجة المتوقعة بعد التنفيذ**:
- Mobile Performance: **71 → 88-92**
- LCP: **4.4s → ~2.5s**
- FCP: **3.9s → ~2.0s**
- Desktop Performance: **يفضل يوصل 95-99**

أوافق أروح build mode وأنفّذ؟