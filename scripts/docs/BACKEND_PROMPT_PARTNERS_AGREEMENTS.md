# برومبت للباك إند AI — إصلاحات المراكز والاتفاقيات

> انسخ هذا الملف كاملاً وأرسله لـ AI الباك إند. كل النقاط مطلوبة.

---

## 1) خطأ فادح عند إضافة مركز من الأدمن

```
Call to undefined function camelizeErrorKeys()
 in /home/u420244017/domains/koswmat.com/public_html/api/routes/admin.php:420
```

**المطلوب:**
- إما تعريف الدالة `camelizeErrorKeys()` في ملف helpers (تحوّل مفاتيح الأخطاء من snake_case إلى camelCase) أو استبدالها بـ `camelizeKeys()` الموجودة فعلاً.
- مراجعة كل استخدامات `camelizeErrorKeys` في `admin.php` وأي راوت آخر وتوحيدها.

---

## 2) إنشاء مركز من الأدمن (POST /admin/partners)

عند إنشاء مركز يجب:

1. **توليد كلمة مرور تلقائياً** (أو قبولها من body كـ `password`) وتخزينها مُجزَّأة (`password_hash`) في جدول `partners`.
2. **إرسال إيميل ترحيب** للمركز يحتوي: البريد + كلمة المرور المؤقتة + رابط `partner-login`.
3. **سحب التصنيفات (categories)** من جدول `categories` وعرضها للأدمن.
   - أضف Endpoint: `GET /admin/categories` يرجع `[{ id, name_ar, name_en, slug }]`.
   - في `POST /admin/partners` اقبل `categoryIds: string[]` واحفظها في جدول `partner_categories` (pivot).
4. **حقول الوصف والشروط لكل مركز:**
   - أضف في جدول `partners` الأعمدة:
     - `description` TEXT NULL — وصف المركز
     - `terms` TEXT NULL — شروط/ملاحظات خاصة
     - `highlights` JSON NULL — مزايا مختصرة `["متابعة مجانية", "غرفة خاصة", ...]`
   - أعدها في `GET /partners/:id` و `GET /offers/:id` (تحت `partner.description / terms / highlights`).

**Request المتوقع من الفرونت:**
```json
POST /admin/partners
{
  "vendorName": "مركز س",
  "ownerName": "...",
  "email": "x@x.com",
  "phone": "05...",
  "city": "الرياض",
  "password": "optional-or-auto",
  "categoryIds": ["cat_1","cat_2"],
  "description": "نص الوصف",
  "terms": "الشروط",
  "highlights": ["ميزة 1","ميزة 2","ميزة 3","ميزة 4"],
  "commissionPct": 10,
  "depositPct": 20
}
```

**Response:**
```json
{ "partner": { ...fields, "categories":[{id,name}], "tempPassword":"abc123" } }
```

---

## 3) العروض/المراكز ترجع IDs بدل الأسماء

في `GET /admin/bookings` و `GET /admin/bookings/:id`:
- أرجع `partnerName` (اسم المركز) و `offerTitle` (اسم العرض) بشكل مباشر، أو ضمّن:
  ```json
  "partner": { "id":"...", "name":"اسم المركز" },
  "offer":   { "id":"...", "title":"اسم العرض" }
  ```
- نفس الشيء لأي endpoint يعرض حجوزات للأدمن أو الشريك.

---

## 4) الاتفاقيات — السلوك المطلوب بعد التوقيع

حالياً: بعد التوقيع يرجّع المستخدم لصفحة إنشاء حساب جديد، ولا يستطيع فتح الاتفاقية مرة أخرى.

**المطلوب:**

### 4.1 رابط الإيميل
- رابط التوقيع المُرسل بالإيميل يجب أن يحتوي **توكن موقّع (signed token)** لا ينتهي إلا بالتوقيع: `https://.../partner/agreement/:id?token=...`
- Endpoint: `GET /agreements/:id?token=...` — يفتح الاتفاقية بدون تسجيل دخول لو التوكن صالح.
- بعد التوقيع، التوكن يصبح غير صالح ويُستبدل بمشاهدة عادية (داخل لوحة الشريك).

### 4.2 إعادة الإرسال من الأدمن
أضف Endpoint:
```
POST /admin/partners/:partnerId/agreements/:id/resend-email
```
- يُعيد إنشاء توكن جديد وإرسال نفس الإيميل.
- يُعيد `{ ok: true, sentAt }`.

### 4.3 تعديل الاتفاقية بدل إعادة الكتابة
أضف Endpoint:
```
PUT /admin/partners/:partnerId/agreements/:id
{
  "commissionPct": 12,
  "depositPct": 25,
  "customTitle": "...",
  "customBody": "...",
  "adminNotes": "..."
}
```
- يسمح بالتعديل فقط طالما `status = pending` (لم تُوقَّع بعد).
- بعد التعديل يُعيد إرسال إيميل تلقائياً (أو يرجّع flag `requireResend`).

### 4.4 حالة الإيميل
أضف في جدول `partner_agreements` الأعمدة:
- `email_sent_at` TIMESTAMP NULL
- `email_resent_count` INT DEFAULT 0
- `email_last_status` ENUM('queued','sent','failed','opened') DEFAULT 'queued'

وأرجِعها ضمن `GET /admin/partners/:id/agreements` حتى يظهر للأدمن "تم الإرسال / في الانتظار / فشل".

---

## 5) باركود الاتفاقية في لوحة المركز

- بعد التوقيع، أضف Endpoint:
  ```
  GET /partner/agreement/qr
  ```
  يرجّع `{ qrUrl: "https://.../agreement/view/:id?sig=...", qrPngBase64: "..." }`.
- الرابط داخل الـ QR يفتح **صفحة عامة read-only** للاتفاقية الموقّعة (مع التوقيع والتاريخ).
- الفرونت سيعرض الباركود في صفحة `/partner-dashboard` على اليسار.

---

## 6) ملخص الـ Endpoints الجديدة/المعدّلة

| Method | Path | الغرض |
|---|---|---|
| GET | `/admin/categories` | قائمة التصنيفات للدروب داون |
| POST | `/admin/partners` | يقبل password + categoryIds + description + terms + highlights، يُرسل إيميل ترحيب |
| GET | `/admin/partners/:id` | يرجّع categories + description + terms + highlights |
| GET | `/admin/bookings` | يرجّع partnerName + offerTitle (أو partner/offer objects) |
| GET | `/agreements/:id?token=...` | فتح اتفاقية بتوكن إيميل بدون login |
| POST | `/admin/partners/:pid/agreements/:id/resend-email` | إعادة إرسال الإيميل |
| PUT | `/admin/partners/:pid/agreements/:id` | تعديل اتفاقية pending |
| GET | `/partner/agreement/qr` | باركود الاتفاقية الموقّعة |
| GET | `/agreement/view/:id?sig=...` | عرض عام read-only للاتفاقية الموقّعة |

---

## 7) إصلاحات DB مقترحة (migrations)

```sql
ALTER TABLE partners
  ADD COLUMN password_hash VARCHAR(255) NULL,
  ADD COLUMN description TEXT NULL,
  ADD COLUMN terms TEXT NULL,
  ADD COLUMN highlights JSON NULL;

CREATE TABLE partner_categories (
  partner_id CHAR(36) NOT NULL,
  category_id CHAR(36) NOT NULL,
  PRIMARY KEY (partner_id, category_id),
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

ALTER TABLE partner_agreements
  ADD COLUMN email_sent_at TIMESTAMP NULL,
  ADD COLUMN email_resent_count INT NOT NULL DEFAULT 0,
  ADD COLUMN email_last_status ENUM('queued','sent','failed','opened') NOT NULL DEFAULT 'queued',
  ADD COLUMN access_token VARCHAR(128) NULL,
  ADD COLUMN access_token_expires_at TIMESTAMP NULL;
```

---

## 8) ملاحظة أمان
- لا تُرجع `password_hash` أبداً في أي response.
- `tempPassword` تُرجع **مرة واحدة فقط** عند الإنشاء (للأدمن يطّلع عليها قبل ما تتخفي).
- توكن الاتفاقية: استخدم 64 hex chars + expiry 30 يوم.

انتهى — بعد تطبيق هذه النقاط الفرونت جاهز لاستهلاكها مباشرة.
