# Sponsored Ads — إثراء البيانات (offer + partner) داخل الرد

## المشكلة
`GET /home-data` بيرجّع في `sponsoredAds` كل إعلان بالشكل ده:

```json
{
  "id": "...",
  "offerId": "e0c26247-4e21-4ff6-8aa8-1c2199472f9d",
  "titleAr": "3 جلسات فل بدي",
  "image": "...",
  "slideIndex": 1,
  ...
}
```

من غير أي بيانات للعرض المرتبط (السعر، الخصم، المدة، التقييم) ولا للمركز
(الاسم، المدينة، العنوان). النتيجة إن كارت "الإعلان الممول" في السلايدر
الرئيسي بيبان فيه الاسم بس ومفيش تفاصيل، وبيظهر باقي الكارت بس بعد ما
المستخدم يفتح العرض ويرجع (لأن الـ frontend وقتها بيكون خزّن العرض في الكاش).

الـ `featuredOffers` و `homeSlider1/2` بيرجّعوا فعلًا بيانات مركز وتقييم
وسعر داخل كل عنصر — المطلوب نفس الشيء للـ `sponsoredAds`.

## المطلوب
إضافة object `offer` (وداخله `partner`) لكل إعلان له `offerId`. لو `offerId`
فاضي أو العرض متمسوح، يفضّل يرجع الإعلان كما هو بدون `offer` (الفرونت
هيتعامل معاه كإعلان بدون هدف).

### الشكل النهائي المتوقع

```json
{
  "id": "0ad0f519-8e31-4a20-ae3a-d73e32f05c90",
  "offerId": "e0c26247-4e21-4ff6-8aa8-1c2199472f9d",
  "titleAr": "3 جلسات فل بدي",
  "titleEn": "3 جلسات فل بدي",
  "subtitle": "...",
  "image": "https://koswmat.com/uploads/general/....jpg",
  "linkUrl": null,
  "ctaLabel": "أعلان ممول",
  "placement": "slide_1",
  "slideIndex": 1,
  "sortOrder": 1,
  "priority": 1,
  "isActive": true,
  "createdAt": "2026-06-02 20:38:22",

  "offer": {
    "id": "e0c26247-4e21-4ff6-8aa8-1c2199472f9d",
    "partnerId": "dbab...",
    "categoryId": "72f5...",
    "titleAr": "3 جلسات فل بدي",
    "titleEn": "3 full-body sessions",
    "image": "https://koswmat.com/uploads/offers/....jpg",
    "priceBefore": "1800.00",
    "priceAfter": "640.00",
    "discountPercent": 64,
    "durationMinutes": 30,
    "status": "active",
    "validFrom": null,
    "validTo": null,

    "vendorName": "مجمع البكاري الطبي",
    "vendorAddress": "المدينة المنورة",
    "vendorLogo": null,
    "rating": 0,
    "reviewsCount": 0,

    "partnerNameAr": "مجمع البكاري الطبي",
    "partnerNameEn": "Al-Bukari Medical Complex",
    "partnerCity": "المدينة المنورة",
    "partnerAddress": "المدينة المنورة",
    "partnerLogo": null,

    "branch": null,
    "hasMultipleBranches": false,
    "branchesCount": 0,
    "displayAddress": "المدينة المنورة",
    "displayBranchName": null
  }
}
```

## القاعدة (SQL) — نفس الفلاتر المستخدمة في الصفحة العامة
- عرض `o.status = 'active'` و ضمن `valid_from`/`valid_to`.
- مركز `p.status = 'active'`.
- لو العرض مش مطابق، ارجع الإعلان بدون `offer` (متمسحش الإعلان).

مثال JOIN مقترح (بنفس أعمدة `homeSlider1`):

```sql
LEFT JOIN offers o
  ON o.id = sa.offer_id
 AND o.status = 'active'
 AND (o.valid_from IS NULL OR o.valid_from <= NOW())
 AND (o.valid_to   IS NULL OR o.valid_to   >= NOW())
LEFT JOIN partners p
  ON p.id = o.partner_id
 AND p.status = 'active'
LEFT JOIN (
  SELECT offer_id, AVG(rating) AS avg_rating, COUNT(*) AS reviews_count
  FROM offer_reviews GROUP BY offer_id
) r ON r.offer_id = o.id
```

## المسارات المتأثرة
- `GET /home-data` — الحقل `sponsoredAds[*]` يضاف له `offer`.
- `GET /sponsored-ads` (لو موجود endpoint مستقل) — نفس التعديل.

## ملاحظات
- خلي `offer.partnerId` موجود عشان الفرونت يقدر يكاش الشريك.
- لو الإعلان مربوط بعرض إنما العرض تعطّل (`status != active`)، ارجّع
  `offer: null`. ده هيسمح للأدمن إنه يعرف يشوفه إعلان بدون هدف بدل ما
  يختفي من الصفحة الرئيسية بدون تفسير.
