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

---

## 9) تفعيل الشريك تلقائياً بعد التوقيع + إظهار تفاصيل الاتفاقية الموقّعة

### المشكلة الحالية
- الشريك يوقّع الاتفاقية بنجاح وترجع `agreement.status = "signed"` في `GET /partner/agreement`.
- لكن `partner.status` يفضل `pending` → الشريك ميقدرش يدخل الداشبورد.
- كمان تفاصيل الاتفاقية الموقّعة (التايتل، البودي، نسبة العمولة، تاريخ التوقيع، الاسم الموقّع، صورة التوقيع) **مش بتظهر بشكل واضح** في صفحة الشريك بعد التوقيع.

### المطلوب

#### أ) في `POST /partner/agreements/:id/sign` — التفعيل التلقائي
داخل **transaction واحدة**:

1. تحديث `partner_agreements`:
   ```sql
   UPDATE partner_agreements
   SET status = 'signed',
       signed_at = NOW(),
       signed_name = :signed_name,
       signature_image = :signature_image,
       signed_ip = :ip,
       updated_at = NOW()
   WHERE id = :id AND status IN ('sent','pending');
   ```

2. تحديث `partners` (التفعيل التلقائي):
   ```sql
   UPDATE partners
   SET status = 'active',
       agreement_accepted_at = NOW(),
       agreement_version = :template_version,
       agreement_signature = :signature_image,
       updated_at = NOW()
   WHERE id = :partner_id
     AND status = 'pending'
     AND commission_pct > 0;
   ```

3. تحديث `users.status = 'active'` للمستخدم المرتبط بالمركز لو كان `pending`.

#### ب) شروط التفعيل (Validation)
- لازم الاتفاقية تكون `sent` أو `pending` قبل التوقيع — لو موقّعة بالفعل ارجع `409 Conflict`.
- لازم `partners.commission_pct > 0` — لو صفر ارجع `422` برسالة: `"لا يمكن تفعيل الحساب: نسبة العمولة غير محددة في الاتفاقية. تواصل مع الإدارة."`
- لو حصل أي خطأ في التحديثات → rollback كامل للtransaction.

#### ج) Response المتوقع من `POST /partner/agreements/:id/sign`
```json
{
  "success": true,
  "data": {
    "agreement": {
      "id": "...",
      "status": "signed",
      "signedAt": "2026-06-03 14:27:05",
      "signedName": "...",
      "signatureImage": "data:image/png;base64,...",
      "commissionPct": 13,
      "depositPct": 13,
      "title": "اتفاقية الشراكة والعمولة",
      "body": "...",
      "customTitle": "...",
      "customBody": "..."
    },
    "partner": {
      "id": "...",
      "status": "active",
      "commissionPct": 13,
      "agreementAcceptedAt": "2026-06-03 14:27:05"
    }
  }
}
```

#### د) `GET /partner/agreement` و `GET /auth/partner/me` بعد التوقيع
- `partner.status` لازم يرجع `"active"` مباشرة (مش `pending`).
- `agreement` يرجع **كل التفاصيل** المطلوبة لعرضها في صفحة الشريك:
  - `id, status, title, body, customTitle, customBody, commissionPct, depositPct`
  - `signedName, signedAt, signatureImage, signedIp`
  - `templateVersion, createdAt, updatedAt`

#### هـ) Middleware الوصول للداشبورد
- لما `partner.status === 'active'` → السماح بكل routes الـ `/partner/*`.
- لما `partner.status === 'pending'` → ارجع `403` مع `{ requiresAgreement: true, agreementId: "..." }` عشان الفرونت يحوّله لصفحة التوقيع.

#### و) إلغاء/تعليق
- لو الأدمن عمل `revoke` للاتفاقية → `partners.status = 'suspended'` تلقائياً.
- لو الأدمن أصدر اتفاقية جديدة بنسب مختلفة → الشريك لازم يوقّعها من جديد قبل ما يرجع `active`.

### اختبار سريع
1. شريك جديد يسجّل → status = `pending`.
2. الأدمن يبعتله اتفاقية بـ `commissionPct = 13`.
3. الشريك يفتح الرابط ويوقّع → response يرجع `partner.status = "active"`.
4. `GET /auth/partner/me` يرجع `partner.status = "active"` + كل تفاصيل الاتفاقية.
5. الشريك يدخل `/partner-dashboard` بدون مشاكل.

انتهى — بعد تطبيق هذه النقاط الفرونت جاهز لاستهلاكها مباشرة.

---

## 10) 🚨 باج حالي مؤكد — الشريك وقّع لكن `partner.status` لسه `pending`

### الحالة الفعلية من الـ API
- `GET /partner/agreement` يرجع:
  ```json
  {
    "agreement": {
      "id": "ac93f8d6-32d8-41cb-b1a1-f79e6b8101e8",
      "partnerId": "ba0f2b8c-1088-43d2-a974-32872dcad312",
      "status": "signed",
      "signedName": "احمد الجمال",
      "signedAt": "2026-06-03 14:27:05",
      "signatureImage": "data:image/png;base64,...",
      "commissionPct": 13,
      "depositPct": 13,
      "title": "اتفاقية الشراكة والعمولة",
      "body": "...",
      "customBody": "..."
    }
  }
  ```
- لكن `GET /auth/me` و `GET /partner/me` لسه بيرجعوا `partner.status = "pending"` → الشريك متحجوز ميقدرش يدخل الداشبورد.

### المطلوب فوراً (إصلاح Data + Logic)

#### أ) إصلاح البيانات الحالية (one-off SQL)
شغّل دلوقتي على كل الشركاء اللي عندهم اتفاقية موقّعة لكن status لسه pending:
```sql
UPDATE partners p
SET status = 'active',
    agreement_accepted_at = COALESCE(p.agreement_accepted_at, a.signed_at),
    agreement_version = COALESCE(p.agreement_version, a.template_version::text),
    agreement_signature = COALESCE(p.agreement_signature, a.signature_image),
    updated_at = NOW()
FROM partner_agreements a
WHERE a.partner_id = p.id
  AND a.status = 'signed'
  AND p.status = 'pending'
  AND p.commission_pct > 0;

UPDATE users u
SET status = 'active', updated_at = NOW()
FROM partners p
WHERE p.user_id = u.id
  AND p.status = 'active'
  AND u.status = 'pending';
```

#### ب) تأكيد سلوك endpoint التوقيع (Section 9 لازم يكون متطبّق)
- `POST /partner/agreements/:id/sign` لازم في **نفس الـ transaction** يحدّث: `partner_agreements` + `partners.status='active'` + `users.status='active'`.
- لو الـ commit نجح والـ status لسه `pending` يبقي فيه باج في حساب الـ transaction — راجع اللوج.

#### ج) Middleware/Guard على كل routes الـ `/partner/*`
المنطق المطلوب بالظبط (مهم جداً):
```
if (partner.status === 'active') → allow
else if (partner.status === 'pending'):
   if (exists signed agreement for this partner) → 
      auto-fix: set partner.status='active' ثم allow  ⚠️ self-healing
   else → 403 { requiresAgreement: true, agreementId }
else if (partner.status === 'suspended') → 403 { suspended: true }
```
ال self-healing دا حماية إضافية عشان لو حصل أي race condition الشريك ميتقفلش بره حسابه.

#### د) `GET /auth/me` و `GET /partner/me` لازم يرجعوا:
```json
{
  "partner": {
    "id": "ba0f2b8c-...",
    "status": "active",
    "commissionPct": 13,
    "depositPct": 13,
    "agreementAcceptedAt": "2026-06-03 14:27:05",
    "agreement": {
      "id": "ac93f8d6-...",
      "status": "signed",
      "title": "اتفاقية الشراكة والعمولة",
      "body": "...",
      "customTitle": "",
      "customBody": "...",
      "commissionPct": 13,
      "depositPct": 13,
      "signedName": "احمد الجمال",
      "signedAt": "2026-06-03 14:27:05",
      "signatureImage": "data:image/png;base64,..."
    }
  }
}
```
بمعنى: ضمّن **object `agreement` كامل** جوا `partner` في responses الـ me عشان الفرونت يعرض تفاصيل الاتفاقية + نسبة العمولة + نسبة العربون **من غير ما يعمل request تاني**.

#### هـ) اختبار القبول
1. شغّل SQL الإصلاح في (أ).
2. اعمل `GET /auth/me` للشريك `ba0f2b8c-1088-43d2-a974-32872dcad312` → لازم `partner.status = "active"` و `partner.agreement.signedAt` موجود.
3. الشريك يفتح `/partner-dashboard` → يدخل عادي بدون أي 403 أو redirect لصفحة التوقيع.
4. في صفحة الاتفاقية داخل الداشبورد → تظهر: التايتل، البودي، التوقيع، تاريخ التوقيع، **نسبة العمولة 13%**، **نسبة العربون 13%**.

انتهى.
