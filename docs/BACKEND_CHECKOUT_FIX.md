# Backend Fix — Checkout يحفظ بيانات مصفّرة في جدول `bookings`

## المشكلة المُلاحظة

استجابة `GET /admin/bookings` بترجع لكل حجز:

```json
"depositAmount": 0,
"totalAmount": 20,
"commissionPct": 0,
"commissionAmount": 0,
"partnerAmount": 0
```

يعني الحجوزات بتتسجل بدون عمولة، بدون عربون، وبدون مبلغ الشريك — رغم إن الاتفاقية موقّعة والشريك عنده `commission_pct` و `deposit_pct` صحيحين (13% / 13%).

## السبب الجذري في `routes/checkout.php`

دالة `insertBookings()` فيها 3 أخطاء منطقية:

### 1) العربون (`deposit_amount`) متخلط مع العمولة (`commission_amount`)

السطر:
```php
$total,
$commission['amount'],  // deposit_amount = العربون = عمولة المنصة  ❌
$commission['pct'],
$commission['amount'],
```

العربون **ليس** هو العمولة. العربون هو **النسبة اللي العميل بيدفعها مقدّمًا** على إجمالي الحجز (`partners.deposit_pct`). العمولة هي **نسبة المنصة من قيمة الحجز** (`partners.commission_pct`). كلاهما يُحسب بشكل مستقل.

### 2) لا يوجد قراءة لـ `deposit_pct` إطلاقًا

ابحث في الملف عن `deposit_pct` → 0 مرات. لازم يُقرأ من نفس مصدر العمولة (offer override → partner).

### 3) `partner_amount` لا يُحسب ولا يُخزَّن

العمود موجود في جدول `bookings` لكن لا يُمرَّر في `INSERT`. القيمة الصحيحة:
```
partner_amount = total_amount - commission_amount
```

### 4) (سبب ثانوي) الشريك في بعض الحجوزات القديمة عنده `commission_pct = 0`

بعد توقيع الاتفاقية، لازم القيم تتنسخ من `partner_agreements` إلى `partners` (موصوف في `BACKEND_PROMPT_PARTNERS_AGREEMENTS.md` قسم 10). لو ده اتطبّق، الشريك `2929c14b-…` المفروض يبقى عنده النسبتين > 0.

---

## التصحيح المطلوب

### A) أضِف دالة `resolveDeposit()` مماثلة لـ `resolveCommission`

```php
if (!function_exists('resolveDeposit')) {
function resolveDeposit(string $partnerId, ?string $offerId, float $subtotal): array {
    $pct = 0.0;

    // offer override (لو موجود عمود deposit_pct_override)
    if ($offerId) {
        $st = db()->prepare("SELECT deposit_pct_override FROM offers WHERE id=? LIMIT 1");
        $st->execute([$offerId]);
        $row = $st->fetch();
        if ($row && $row['deposit_pct_override'] !== null) {
            $pct = (float)$row['deposit_pct_override'];
        }
    }

    // fallback: partner default
    if ($pct <= 0) {
        $st = db()->prepare("SELECT deposit_pct FROM partners WHERE id=? LIMIT 1");
        $st->execute([$partnerId]);
        $row = $st->fetch();
        $pct = $row ? (float)($row['deposit_pct'] ?? 0) : 0.0;
    }

    $amount = round($subtotal * ($pct / 100), 2);
    return ['pct' => $pct, 'amount' => $amount];
}
}
```

> لو عمود `deposit_pct_override` غير موجود في `offers`، احذف الـ block الأول وخليها partner-only.

### B) عدِّل `insertBookings()` لتحسب الـ 3 قيم وتخزّنها

```php
$commission = ['pct' => 0.0, 'amount' => 0.0];
$deposit    = ['pct' => 0.0, 'amount' => 0.0];
if ($partnerId) {
    $commission = resolveCommission($partnerId, $offerId, $total);
    $deposit    = resolveDeposit($partnerId, $offerId, $total);
}
$partnerAmount = round($total - $commission['amount'], 2);
```

ووسّع الـ `INSERT`:

```sql
INSERT INTO bookings (
    id, user_id, offer_id, partner_id,
    name, email, phone,
    date, time, notes,
    total_amount,
    deposit_pct, deposit_amount,
    commission_pct, commission_amount,
    partner_amount,
    payment_method, payment_status,
    qr_code, verify_code,
    status, created_at, updated_at
) VALUES (
    ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    ?,
    ?, ?,
    ?, ?,
    ?,
    ?, ?,
    ?, ?,
    'pending', NOW(), NOW()
)
```

مع الـ bind بالترتيب:
```php
$total,
$deposit['pct'],     $deposit['amount'],
$commission['pct'],  $commission['amount'],
$partnerAmount,
$payMethod, $payStatus,
$bookingNo, $verifyCode,
```

> لو عمود `deposit_pct` غير موجود في جدول `bookings` ضيفه:
> ```sql
> ALTER TABLE bookings ADD COLUMN deposit_pct DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER total_amount;
> ```

### C) إصلاح البيانات السابقة (one-off SQL)

```sql
UPDATE bookings b
JOIN partners p ON p.id = b.partner_id
SET
  b.commission_pct    = COALESCE(NULLIF(b.commission_pct,0),    p.commission_pct),
  b.deposit_pct       = COALESCE(NULLIF(b.deposit_pct,0),       p.deposit_pct),
  b.commission_amount = ROUND(b.total_amount * COALESCE(NULLIF(b.commission_pct,0), p.commission_pct)/100, 2),
  b.deposit_amount    = ROUND(b.total_amount * COALESCE(NULLIF(b.deposit_pct,0),    p.deposit_pct)/100, 2),
  b.partner_amount    = ROUND(b.total_amount - (b.total_amount * COALESCE(NULLIF(b.commission_pct,0), p.commission_pct)/100), 2)
WHERE b.payment_status IN ('pending','paid','unpaid')
  AND (b.commission_amount = 0 OR b.deposit_amount = 0 OR b.partner_amount = 0);
```

---

## مخرجات `GET /admin/bookings` بعد الإصلاح

لكل حجز لازم القيم تكون متسقة:

```
totalAmount     = price × qty
depositPct      = partners.deposit_pct (أو offer override)
depositAmount   = totalAmount × depositPct / 100
commissionPct   = partners.commission_pct (أو offer override)
commissionAmount= totalAmount × commissionPct / 100
partnerAmount   = totalAmount − commissionAmount
```

## معايير القبول

1. حجز جديد لشريك `commission_pct = 13` / `deposit_pct = 13` و `totalAmount = 100` يجب أن يحفظ:
   `depositAmount = 13`, `commissionAmount = 13`, `partnerAmount = 87`, `depositPct = 13`, `commissionPct = 13`.
2. لا تُسجَّل أي قيمة 0 إلا إذا كانت نسبة الشريك نفسها = 0.
3. الحجوزات القديمة تنعكس عليها قيم صحيحة بعد تشغيل سكربت الـ one-off SQL.
