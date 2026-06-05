# GET /api/lookup-order — متابعة الحجز (Public)

تستخدمها صفحة `/track` للسماح للعميل بمتابعة حجزه بدون تسجيل دخول.

## Query params
- `orderNumber` (required) — رقم الحجز كما يظهر للعميل (مثال: `BK-284913`).
- `email` (optional) — البريد المرتبط بالحجز.
- `phone` (optional) — رقم الجوال المرتبط بالحجز.

يجب أن يُمرَّر **إما** `email` **أو** `phone` للتحقق من صاحب الحجز.
لا تُرجع بيانات إلا إذا تطابق رقم الحجز مع الإيميل/الجوال المُسجَّل عليه.

## Response 200
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "...",
      "number": "BK-284913",
      "status": "confirmed",            // pending | confirmed | in_progress | completed | cancelled
      "payment_status": "deposit_paid", // unpaid | deposit_paid | paid | refunded
      "payment_method": "mada",
      "subtotal": 599,
      "vat": 0,
      "total": 599,
      "deposit_paid": 60,
      "remaining": 539,
      "coupon_discount": 0,
      "currency": "SAR",
      "verification_code": "284913",
      "qr_data": "https://koswmat.com/verify/BK-284913",
      "notes": "...",
      "created_at": "2026-05-24 12:00:00",
      "updated_at": "2026-05-25 14:30:00",
      "confirmed_at": "2026-05-24 13:00:00"
    },
    "items": [
      {
        "offer_title": "باقة عروس متكاملة",
        "plan_name": "موعد: 2026-05-25 · 16:00",
        "qty": 1,
        "price": 599,
        "original_price": null
      }
    ],
    "timeline": [
      { "status": "pending",       "label": "تم استلام طلب الحجز", "note": null, "at": "2026-05-24 12:00:00" },
      { "status": "deposit_paid",  "label": "دفع العربون أونلاين", "note": "60 ر.س عبر مدى", "at": "2026-05-24 12:30:00" },
      { "status": "confirmed",     "label": "تم تأكيد الحجز من المركز", "note": null, "at": "2026-05-24 13:00:00" }
    ],
    "partner": {
      "name": "مركز لمسة جمال",
      "address": "طريق الملك فهد، العليا، الرياض",
      "phone": "0501234567",
      "maps_url": "https://maps.google.com/?q=24.7136,46.6753"
    }
  }
}
```

## Error responses
- **404 Not Found** — رقم الحجز غير موجود، أو الإيميل/الجوال لا يتطابق.
  ```json
  { "success": false, "message": "Order not found" }
  ```
- **400** — `orderNumber` مفقود، أو لم يُمرَّر إيميل/جوال.
- **429** — تجاوز Rate limit (موصى به: 10 طلبات/دقيقة لكل IP).

## ملاحظات
- يجب التحقق من تطابق الإيميل/الجوال مع الحجز لمنع تسريب بيانات الحجوزات.
- لا تكشف فرق الرسائل بين «رقم خطأ» و«بيانات لا تطابق» — استخدم نفس رسالة 404.
- الحقول `verification_code` و `qr_data` تُرجَع فقط عندما `payment_status` ∈ {`deposit_paid`, `paid`}.