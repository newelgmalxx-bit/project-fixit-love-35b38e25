# Backend Fix — ملف المركز (Partner Profile)

> الفرونت يقرأ ويكتب على endpoint بتاع ملف المركز، لكن في بيانات بترجع فاضية بعد الـ save / refresh رغم إن الفرونت بيبعتها صح. المطلوب من الباك ايند يحقق المسارات دي ويرجّع كل الحقول كاملة.

## 1) Endpoints المعنية

- `GET  /auth/partner/me`  → بيرجّع `{ user, partner }`
- `PUT  /partner/profile`  → بيستقبل تعديلات الملف ويرجّع `{ partner }` المحدّث
- `POST /auth/partner/login` → بيرجّع `{ token, user, partner }`

كل اللي بيرجّع object اسمه **`partner`** لازم يحتوي كل الحقول التحت بنفس الأسماء (camelCase).

## 2) المشكلة المرصودة

### أ) `ownerName` بيرجع فاضي
- الفرونت بيبعت في الـ PUT body:
  ```json
  { "ownerName": "أ. محمد", ... }
  ```
- بعد الحفظ والـ refresh، الـ `GET /auth/partner/me` بيرجّع `partner` من غير حقل `ownerName` خالص (أو بقيمة فاضية). نفس الكلام لو login جديد.
- النتيجة: حقل "اسم المسؤول" في الداشبورد دايماً فاضي.

**المطلوب:** يتم persist للقيمة في عمود `partner_profiles.owner_name`، ويرجّع في الـ response كـ `ownerName`.

### ب) حقول تانية محتمل مالهاش نفس المشكلة
ممكن نفس المشكلة موجودة في الحقول دي (الفرونت بيبعتها لكن مش بترجع تاني):

| Frontend (PUT body, camelCase) | DB column (snake_case) | لازم يرجع في GET كـ |
|---|---|---|
| `vendorName` | `vendor_name` | `vendorName` |
| `ownerName` | `owner_name` | `ownerName` ← **المشكلة هنا** |
| `category` | `category` | `category` |
| `city` | `city` | `city` |
| `phone` | `phone` | `phone` |
| `email` | `email` | `email` |
| `commercialNumber` | `commercial_number` | `commercialNumber` |
| `logoUrl` | `logo_url` | `logoUrl` |
| `about` | `about` | `about` |
| `workingHours` | `working_hours` | `workingHours` |
| `address` | `address` | `address` |
| `mapsUrl` | `maps_url` | `mapsUrl` |

## 3) الـ Checklist للباك

1. تأكد إن الـ controller بتاع `PUT /partner/profile` بيقرأ من الـ body بالأسماء camelCase (`ownerName`, `workingHours`, `commercialNumber`, `mapsUrl`, `logoUrl`, `vendorName`) — مش snake_case.
2. تأكد إنه بيـ `UPDATE partner_profiles SET owner_name = :ownerName, ...` لكل الحقول، مش بس بعضها.
3. تأكد إن الـ partner transformer/serializer بيـ map كل الأعمدة دي للـ camelCase في الـ response. لو فيه `transformPartner()` لازم يشمل:
   ```
   ownerName: row.owner_name,
   workingHours: row.working_hours,
   commercialNumber: row.commercial_number,
   mapsUrl: row.maps_url,
   logoUrl: row.logo_url,
   vendorName: row.vendor_name,
   ```
4. نفس الـ transformer لازم يستخدمه `GET /auth/partner/me` و `POST /auth/partner/login` و `PUT /partner/profile`.

## 4) Payload للاختبار

```bash
# 1) update
curl -X PUT https://koswmat.com/api/partner/profile \
  -H "Authorization: Bearer <PARTNER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorName": "مركز اختبار",
    "ownerName": "أ. محمد الاختبار",
    "phone": "0500000000",
    "city": "الرياض",
    "commercialNumber": "1234567890",
    "workingHours": "السبت - الخميس 10ص-10م",
    "address": "حي النخيل",
    "mapsUrl": "https://maps.app.goo.gl/xxxx"
  }'

# 2) re-read — لازم كل الحقول دي ترجع بنفس القيم
curl https://koswmat.com/api/auth/partner/me \
  -H "Authorization: Bearer <PARTNER_JWT>"
```

النتيجة المتوقعة: `data.partner.ownerName === "أ. محمد الاختبار"` (مش `null` ولا غير موجود).

## 5) ملاحظة على الفرونت

الفرونت بقى بيقبل كلا الـ `ownerName` و `owner_name` كـ fallback في `mapApiPartner()` عشان ميـ break-ش لو الباك رجّع snake_case، لكن المصدر الرسمي المتوقع هو **camelCase** زي باقي الحقول. لو الباك بيرجّع snake_case قصداً قولولنا ونوحّد على واحد.
