## خطة رفع أداء الموبايل فوق 90

حسب تقرير PageSpeed المرفوع، الموبايل حالياً **Performance 73**، وأكبر مشاكل واضحة هي:
- **LCP 5.1s** و **FCP 3.0s**.
- **Render-blocking CSS**: ملف CSS حجمه ~26KB بيوقف الرسم ~640ms.
- **LCP image discovery**: صورة الـ LCP جاية من `wsrv.nl` لكنها مش مكتشفة مباشرة من الـ HTML، رغم إنها eager/high priority.
- **Network dependency tree**: الخط العربي بيتأخر في السلسلة الحرجة لحد ~1s.
- **Improve image delivery**: توفير محتمل ~4.46MB.
- **Unused JS**: توفير ~137KB، خصوصاً chunk كبير ~212KB + flags chunk ~28KB.
- **Forced reflow**: ~138ms.
- **Accessibility**: باقي مشكلة heading order.

## التنفيذ المقترح

1. **تثبيت صورة LCP بدل صورة dynamic من الإعلانات**
   - على الموبايل أول hero slide هي أكبر عنصر LCP.
   - هنخلي أول تحميل على الموبايل يستخدم الصورة المحلية `hero-facial.webp` كـ LCP ثابت ومسبق التحميل، بدل ما أول paint يعتمد على صورة إعلان dynamic من `koswmat.com` عبر `wsrv.nl`.
   - الإعلانات تفضل موجودة، لكن مش تتحكم في صورة الـ LCP لأول render.

2. **إضافة preload مباشر لصورة LCP النهائية**
   - بدل preload للصورة المحلية فقط، نضيف preload لصورة الـ LCP التي المتصفح فعلاً سيستخدمها على الموبايل بالمقاس المناسب.
   - الهدف: حل ملاحظة “LCP request is discoverable in initial document” وتقليل LCP.

3. **تقليل تحميل hero JS فوق الطية**
   - حالياً `OffersHero` بيرندر 9 slides كاملة وفي كل slide hooks لبيانات sponsored ads/categories، وده يزيد JS/render work.
   - هنخلي بيانات sponsored/category للـ hero تتحسب مرة واحدة في parent وتتوزع على slides، بدل تكرار hooks داخل كل slide.
   - هنخفف render أولي للموبايل: slide active فقط ياخد overlays/data الثقيلة، وباقي slides تبقى أخف لحد التفاعل.

4. **إيقاف autoplay/Embla الثقيل على أول لحظة في الموبايل**
   - الـ forced reflow غالباً من carousel initialization.
   - هنأخر تشغيل autoplay أو نستخدم carousel أبسط على الموبايل خلال أول paint لتقليل reflow وmain-thread work بدون تغيير الشكل.

5. **ضغط/تصغير الصور المحلية الكبيرة غير الضرورية**
   - في `src/assets` فيه صور كبيرة جداً 1.5–2.7MB مرتبطة بواجهات أخرى وقد تدخل chunks.
   - هنحوّل الصور الكبيرة المستخدمة فعلاً إلى WebP/AVIF أصغر أو نتأكد إنها lazy ومقسمة route-wise.
   - لن نلمس صور غير مستخدمة إلا لو ظهر إنها داخلة في bundle.

6. **تحسين `SmartImage` للموبايل**
   - تقليل widths الافتراضية للموبايل، وتخفيض quality لصورة LCP/hero إلى نطاق مناسب.
   - إضافة `fit=cover`/أبعاد صريحة عند الحاجة حتى لا يطلب CDN صور أكبر من المعروض.

7. **تقليل unused JS من homepage**
   - مراجعة imports في home/header التي تسحب chunks كبيرة.
   - فصل أجزاء غير لازمة لأول render مثل الحساب/المفضلة/القوائم الثقيلة أو lazy import لها بعد hydration.
   - الهدف تقليل chunk `index-*.js` والـ unused JS المذكور في التقرير.

8. **حل heading order المتبقي**
   - مراجعة العناصر التي ما زالت تظهر في تقرير Accessibility وتعديل التسلسل بدون تغيير التصميم.

9. **تحقق بعد التنفيذ**
   - تشغيل فحص مرئي محلي للموبايل للتأكد أن الصفحة لم تتكسر.
   - مراجعة network/DOM للـ LCP image والـ chunks.
   - بعدها ترفع وتقيس PageSpeed مرة ثانية؛ الهدف الواقعي من هذا batch هو **90+** أو الاقتراب منها جداً، مع ملاحظة أن أرقام PageSpeed تتأثر بسرعة سيرفر الصور والـ API وقت القياس.

## الملفات المتوقعة

```text
src/routes/index.tsx
src/routes/__root.tsx
src/components/sections/OffersHero.tsx
src/components/ui/SmartImage.tsx
src/components/layout/SiteHeader.tsx
src/styles.css
vite.config.ts عند الحاجة فقط
```