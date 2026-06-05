# نسبة العمولة/العربون لكل مركز — تعديلات على `public.php`

المطلوب تعديلين فقط في ملف `public.php` (نفس الملف الذي أرسلته).
بعد التعديلين سيستلم الـ frontend نسبة كل مركز/عرض من الـ API ولن يحتاج لأي
قيمة افتراضية (لا 10% ولا غيرها).

الـ frontend يقرأ القيم بالترتيب:
`offer.commissionPctOverride` → `offer.commission_pct` → `partner.commission_pct`
فلازم الـ backend يرجّع واحدة منهم على الأقل.

---

## 1) `transformPublicPartnerRow` — رجّع `commission_pct` و `deposit_pct`

الملف: `public.php` — حوالي السطر **1608**.

استبدل الدالة بالكامل بالنسخة التالية (الإضافة هي آخر سطرين فقط):

```php
if (!function_exists('transformPublicPartnerRow')) {
    function transformPublicPartnerRow(array $row): array
    {
        return [
            'id' => $row['id'],
            'vendorNameAr' => $row['name'] ?? $row['vendor_name_ar'] ?? '',
            'vendorNameEn' => $row['vendor_name_en'] ?? null,
            'city' => $row['city'] ?? null,
            'category' => $row['category'] ?? null,
            'logo' => $row['logo'] ?? null,
            'cover' => $row['cover_url'] ?? $row['cover'] ?? null,
            'aboutAr' => $row['about'] ?? $row['about_ar'] ?? null,
            'aboutEn' => $row['about_en'] ?? null,
            'phone' => $row['phone'] ?? null,
            'whatsapp' => $row['phone'] ?? null,
            'mapsUrl' => $row['maps_url'] ?? null,
            'addressAr' => $row['address'] ?? $row['address_ar'] ?? null,
            'workingHours' => isset($row['working_hours'])
                ? (is_string($row['working_hours']) ? json_decode($row['working_hours'], true) : $row['working_hours'])
                : null,
            'rating' => isset($row['rating']) ? (float)$row['rating'] : null,
            'reviewsCount' => isset($row['reviewsCount']) ? (int)$row['reviewsCount'] : null,
            'offersCount' => isset($row['offersCount']) ? (int)$row['offersCount'] : null,

            // ⬇️ السطران الجديدان — اقرأ النسبة الخاصة بالمركز من جدول partners
            'commission_pct' => isset($row['commission_pct']) ? (float)$row['commission_pct'] : null,
            'deposit_pct'    => isset($row['deposit_pct'])    ? (float)$row['deposit_pct']    : null,
        ];
    }
}
```

> الاستعلام في `GET /partners/{id}` بيستخدم `SELECT p.*` فالأعمدة موجودة جاهزة،
> مفيش حاجة تتعدل في الاستعلام. لو الأعمدة دي مش موجودة في جدول `partners`
> أضفها (نوعهما `DECIMAL(5,2) NULL`).

---

## 2) `offerTransformer` — رجّع `commission_pct` المحسوبة

الملف: `public.php` — حوالي السطر **1069**.

حالياً الدالة بترجّع `commissionPctOverride` فقط (وهو غالباً `null`)، فالـ frontend
بيشوف العرض بدون نسبة. عدّل الدالة لتجلب نسبة المركز كـ fallback:

```php
if (!function_exists('offerTransformer')) {
    function offerTransformer(array $row, array $gallery = []): array
    {
        $out = [];
        foreach ($row as $key => $value) {
            $out[snakeToCamel($key)] = $value;
        }

        $priceBefore = isset($row['price_before']) ? (float)$row['price_before'] : 0.0;
        $priceAfter  = isset($row['price_after'])  ? (float)$row['price_after']  : 0.0;

        $discountPercent = 0;
        if ($priceBefore > 0 && $priceAfter >= 0 && $priceAfter <= $priceBefore) {
            $discountPercent = (int) round((($priceBefore - $priceAfter) / $priceBefore) * 100);
        }
        $out['discountPercent'] = $discountPercent;

        $out['gallery'] = array_map(function ($img) {
            $imgOut = [];
            foreach ($img as $k => $v) {
                $imgOut[snakeToCamel($k)] = $v;
            }
            return $imgOut;
        }, $gallery);

        // ⬇️ الإضافة: ارجع commission_pct النهائية (override للعرض أو نسبة المركز)
        $override = $row['commission_pct_override'] ?? null;
        $partnerPct = null;
        if (!empty($row['partner_id'])) {
            static $cache = [];
            $pid = $row['partner_id'];
            if (!array_key_exists($pid, $cache)) {
                $ps = db()->prepare("SELECT commission_pct, deposit_pct FROM partners WHERE id = ? LIMIT 1");
                $ps->execute([$pid]);
                $cache[$pid] = $ps->fetch() ?: null;
            }
            if ($cache[$pid]) {
                $partnerPct = $cache[$pid]['commission_pct'] ?? $cache[$pid]['deposit_pct'] ?? null;
            }
        }

        $effective = $override !== null ? (float)$override
                   : ($partnerPct !== null ? (float)$partnerPct : null);

        $out['commissionPctOverride'] = $override !== null ? (float)$override : null;
        $out['commission_pct']        = $effective;  // الـ frontend بيقرأ ده مباشرة

        return $out;
    }
}
```

> هذا التعديل يعمل عبر كل المسارات اللي بتستخدم `offerTransformer`:
> `GET /offers`, `GET /offers/{id}`, `GET /partners/{id}`, و featured offers.

---

## التحقق بعد التعديل

- `GET /api/partners/{id}` → لازم يرجّع `"commission_pct": <رقم>` و `"deposit_pct": <رقم>`.
- `GET /api/offers/{id}` → لازم يرجّع `"commission_pct": <رقم>` (إما override أو نسبة المركز).
- صفحة العرض في الموقع: سطر «عربون الحجز» يظهر بنسبة المركز الصحيحة، وزر الدفع يشتغل عادي.

لو لسه بتشوف "غير محددة" بعد التعديل، تأكد إن:
1. عمود `commission_pct` (أو `deposit_pct`) في جدول `partners` فيه قيمة لهذا المركز.
2. الـ response فعلاً بيرجّع الحقل (افتح Network في المتصفح وشوف الـ JSON).