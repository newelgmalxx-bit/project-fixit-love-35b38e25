# Backend ⇄ Database Mismatches (نسخة DB: 28 مايو 2026)

هذا الملف يلخّص الأعمدة/الجداول اللي بيستدعيها كود `admin.php` و `public.php` و `partner.php`
ومش موجودة فعليًا في قاعدة البيانات `u420244017_koswmat`. لازم تتعامل مع كل بند —
إما بإضافة العمود/الجدول، أو بتعديل الـ SQL في الـ PHP ليطابق الـ schema الحالي.

---

## 1) جدول `partners` — الخطأ الحالي

```
SQLSTATE[42S22]: Column not found: 1054 Unknown column 'p.vendor_name_ar'
in /api/routes/admin.php:2347
```

### الأعمدة الفعلية في `partners`:
`id, user_id, name, slug, email, phone, commercial_number, city_id, address,
maps_url, logo, rating, reviews_count, commission_pct, deposit_pct, status,
created_at, updated_at`

### الأعمدة اللي بيستخدمها الكود وغير موجودة:
| المرجع في الكود | الحل المقترح |
|---|---|
| `p.vendor_name_ar` | استبدلها بـ `p.name` (أو اعمل ALIAS: `p.name AS vendor_name_ar`) |
| `p.vendor_name_en` | استبدلها بـ `p.name` (ما فيش name_en في DB) |
| `p.vendor_name` | استبدلها بـ `p.name` |
| `p.city` (نص) | الجدول بيخزن `city_id`. اعمل JOIN مع `cities` واختار `c.name_ar` |

### مقترح: إضافة الأعمدة بدل تعديل كل الاستعلامات (الأسرع)
```sql
ALTER TABLE `partners`
  ADD COLUMN `vendor_name_ar` VARCHAR(200) GENERATED ALWAYS AS (`name`) VIRTUAL,
  ADD COLUMN `vendor_name_en` VARCHAR(200) GENERATED ALWAYS AS (`name`) VIRTUAL,
  ADD COLUMN `vendor_name`    VARCHAR(200) GENERATED ALWAYS AS (`name`) VIRTUAL;
```
> لو الفرونت محتاج اسم عربي/إنجليزي مستقل، حوّلها لأعمدة حقيقية:
> ```sql
> ALTER TABLE `partners`
>   ADD COLUMN `name_ar` VARCHAR(200) NULL,
>   ADD COLUMN `name_en` VARCHAR(200) NULL;
> UPDATE `partners` SET `name_ar` = `name` WHERE `name_ar` IS NULL;
> ```

---

## 2) جداول مفقودة بالكامل في الـ DB لكن الكود بيتعامل معاها

الفرونت بيستدعي endpoints جايّة من الكود الـ PHP، لكن الجداول دي **مش موجودة** في dump الحالي:

| Endpoint | الجدول المتوقّع | الحالة |
|---|---|---|
| `/admin/services`, `/services` | `services` | ❌ غير موجود |
| `/admin/plans` | `plans` أو `service_plans` | ❌ غير موجود |
| `/admin/portfolio` | `portfolio` | ❌ غير موجود |
| `/admin/analytics/realtime` | يعتمد على page_visits ✅ موجود | OK |

**القرار المطلوب من الباك:**
- إما إنشاء الجداول دي (مع GRANTs و indexes)
- أو إزالة الـ routes دي من `admin.php` لو المنتج اتحوّل بالكامل لـ Offers فقط.

> الفرونت حاليًا بيعرض رسائل خطأ لما الـ endpoints دي ترجع 500. لو هتلغيها، رجّع `404 Not Found` JSON منظّم بدل 500.

---

## 3) جدول `bookings` — أعمدة الكود بيتوقّعها

الأعمدة الفعلية: `id, user_id, service_id, offer_id, partner_id, order_id, name, email, phone, date, time, notes, deposit_amount, total_amount, commission_pct, commission_amount, qr_code, status`

### مفقود ومُستخدم في الكود:
| المرجع | الحل |
|---|---|
| `b.scheduled_at` | استبدلها بـ `CONCAT(b.date,' ',b.time)` أو ضيف عمود `scheduled_at DATETIME` |
| `b.customer_name` | استخدم `b.name` |
| `b.customer_email` | استخدم `b.email` |
| `b.customer_phone` | استخدم `b.phone` |
| `b.city`, `b.category` | غير موجودين — يجب الـ JOIN مع `offers` + `categories` |
| `b.cancelled_at`, `b.completed_at` | غير موجودين — أضف لو محتاجهم: `ALTER TABLE bookings ADD COLUMN cancelled_at DATETIME NULL, ADD COLUMN completed_at DATETIME NULL;` |
| `b.payout_id`, `b.commission_status` | غير موجودين |

### مقترح إضافة:
```sql
ALTER TABLE `bookings`
  ADD COLUMN `scheduled_at` DATETIME NULL,
  ADD COLUMN `cancelled_at` DATETIME NULL,
  ADD COLUMN `completed_at` DATETIME NULL,
  ADD COLUMN `commission_status` ENUM('pending','due','paid') NOT NULL DEFAULT 'pending',
  ADD COLUMN `payout_id` CHAR(36) NULL,
  ADD KEY `idx_bookings_partner` (`partner_id`),
  ADD KEY `idx_bookings_status` (`status`);
```

---

## 4) جدول `orders` — تكرار/تضارب الأعمدة

الجدول فيه **4 أعمدة** للدفع، كلها بمعنى متقارب:
- `payment_method` (enum: myfatoorah, tabby, tamara, cod, bank)
- `payment_status` (enum)
- `paymentmethod` (varchar — غالبًا legacy)
- `paymentstatus` (varchar — غالبًا legacy)

**القرار:** الفرونت اتظبط على `payment_method` و `payment_status` (snake_case). يجب:
1. ضمان إن كل INSERT/UPDATE في الكود بيكتب على `payment_method` و `payment_status`.
2. إضافة TRIGGER يـ sync القيم القديمة، أو حذف الأعمدة المكرّرة:
```sql
ALTER TABLE `orders` DROP COLUMN `paymentstatus`, DROP COLUMN `paymentmethod`;
```
(لو لسه فيه code قديم بيقرأ منها، اعمل sync أولًا.)

---

## 5) جدول `users` ⇄ `partners`

الكود في `partner.php` بيستدعي أحيانًا `users.partner_id` أو `users.vendor_id`. **مش موجود.**
العلاقة الفعلية: `partners.user_id → users.id`.

استعلام الـ login الصحيح:
```sql
SELECT p.* FROM partners p
JOIN users u ON u.id = p.user_id
WHERE u.email = :email AND u.role = 'partner' AND u.status = 'active';
```

---

## 6) `offers` — التعامل مع الترجمة

الجدول فيه `title_ar/title_en/description_ar/description_en/overview_ar/overview_en/terms_ar/terms_en` — تمام.
لكن الكود في بعض الأماكن بيستخدم `o.title` أو `o.description` بدون suffix. لازم:
```sql
SELECT
  o.*,
  COALESCE(o.title_ar, o.title_en) AS title,
  COALESCE(o.description_ar, o.description_en) AS description
FROM offers o
```

---

## 7) `reviews` — مفقود `rating_breakdown` و `reply`

لو الـ admin route بيرجّع رد الإدارة (`admin_reply`) لازم:
```sql
ALTER TABLE `reviews`
  ADD COLUMN `admin_reply` TEXT NULL,
  ADD COLUMN `admin_reply_at` DATETIME NULL;
```

---

## 8) `tickets` — العمود `assigned_to` و `category`

لو في الكود `t.assigned_to` أو `t.category`:
```sql
ALTER TABLE `tickets`
  ADD COLUMN `assigned_to` CHAR(36) NULL,
  ADD COLUMN `category` VARCHAR(60) NULL;
```

---

## 9) ملخّص الـ ALTER المقترحة (نفّذها بالترتيب)

```sql
START TRANSACTION;

-- partners: aliases افتراضية
ALTER TABLE `partners`
  ADD COLUMN `vendor_name_ar` VARCHAR(200) GENERATED ALWAYS AS (`name`) VIRTUAL,
  ADD COLUMN `vendor_name_en` VARCHAR(200) GENERATED ALWAYS AS (`name`) VIRTUAL,
  ADD COLUMN `vendor_name`    VARCHAR(200) GENERATED ALWAYS AS (`name`) VIRTUAL;

-- bookings: حقول مطلوبة للوحات
ALTER TABLE `bookings`
  ADD COLUMN `scheduled_at` DATETIME NULL,
  ADD COLUMN `cancelled_at` DATETIME NULL,
  ADD COLUMN `completed_at` DATETIME NULL,
  ADD COLUMN `commission_status` ENUM('pending','due','paid') NOT NULL DEFAULT 'pending',
  ADD COLUMN `payout_id` CHAR(36) NULL,
  ADD KEY `idx_bookings_partner` (`partner_id`),
  ADD KEY `idx_bookings_status` (`status`);

-- orders: تنظيف
ALTER TABLE `orders` DROP COLUMN `paymentstatus`, DROP COLUMN `paymentmethod`;

-- reviews: رد الإدارة
ALTER TABLE `reviews`
  ADD COLUMN `admin_reply` TEXT NULL,
  ADD COLUMN `admin_reply_at` DATETIME NULL;

-- tickets: إسناد + تصنيف
ALTER TABLE `tickets`
  ADD COLUMN `assigned_to` CHAR(36) NULL,
  ADD COLUMN `category` VARCHAR(60) NULL;

COMMIT;
```

---

## 10) قائمة فحص نهائية للباك

- [ ] استبدال كل `p.vendor_name_ar/en` بـ `p.name` (أو الاعتماد على الأعمدة الافتراضية الجديدة).
- [ ] استبدال كل `b.customer_*` بـ `b.name/email/phone`، و `b.scheduled_at` بـ CONCAT أو العمود الجديد.
- [ ] حذف routes `/admin/services` و `/admin/plans` و `/admin/portfolio` أو إنشاء الجداول.
- [ ] توحيد الكتابة على `payment_method` / `payment_status` فقط في `orders`.
- [ ] في `partner.php`: قراءة الـ partner عبر `partners.user_id` وليس `users.partner_id`.
- [ ] أي `o.title` بدون suffix → `COALESCE(o.title_ar, o.title_en)`.
- [ ] التأكد من رجوع 404 JSON منظّم لما الـ endpoint غير مُنفّذ بدل 500.
