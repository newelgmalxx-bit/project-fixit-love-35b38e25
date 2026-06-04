# Prompt قوي للـ Backend AI (انسخه وابعته)

> استخدم البرومبت ده لما تطلب من AI تاني (Claude/GPT/Cursor) إنه يبني أو يصلّح الـ backend بتاع المشروع. هو مكتوب بحيث الـ AI يفهم العقد (contract) كامل ما بين الفرونت والباك من غير ما يخرّب أي حاجة.

---

## انسخ من هنا 👇

You are working on the **backend** of a SaaS platform called **Saba Design**.
The frontend is already built (React + TanStack Start + TypeScript) and **fully consumes a REST API at `https://saba-design.com/api`**. You must NOT change the frontend. Your job is to make the backend match the contract the frontend already expects.

### Hard rules

1. **Single base URL:** all endpoints live under `/api/...`.
2. **Single response envelope** for every endpoint:
   ```json
   { "success": true, "data": { ... }, "message": "optional" }
   ```
   On error: `{ "success": false, "message": "...", "errors": { "field": "..." } }` with the correct HTTP status (400 / 401 / 403 / 404 / 422 / 500).
3. **Paginated lists** use:
   ```json
   { "success": true, "data": { "items": [...], "total": N, "page": 1, "pageSize": 20, "totalPages": M } }
   ```
4. **Auth:** `Authorization: Bearer <token>` (JWT). Token issued by `/auth/login`, `/auth/signup`, `/auth/oauth/google`. `/auth/me` returns the current user. On `401` the frontend clears the token automatically.
5. **Guest cart:** when there's no token, the frontend sends `X-Session-Id: <uuid>` on `/cart*` requests. The backend must persist a guest cart keyed by that session id and merge it into the user cart on login.
6. **Language:** every request carries `Accept-Language: ar` or `en`. Localized fields (`titleAr/titleEn`, `descAr/descEn`, ...) must always be returned in BOTH languages — the frontend picks the right one. **Never** strip the other language.
7. **Money fields** use the `Price` shape:
   ```ts
   { amount: number, originalAmount: number | null, currency: "SAR", discountPercent: number | null }
   ```
8. **Dates:** ISO 8601 strings (UTC).
9. **IDs:** strings (UUID or short-id). Never numbers.
10. **Never** add fields silently or rename existing ones. If you need a new field, add it as optional and keep the old one until the frontend is updated.

### Tech stack (إلزامي — ممنوع تغييره)

- **PHP 8.2+ Native فقط** — ممنوع تماماً Laravel / Symfony / Slim / CodeIgniter / Lumen / أي framework جاهز.
- **ممنوع** Eloquent / Doctrine / أي ORM. استخدم **PDO Prepared Statements** مباشرة.
- **MySQL 8.0** + `utf8mb4_unicode_ci`. Redis اختياري.
- المسموح بس من Composer: `firebase/php-jwt`, `phpmailer/phpmailer`, `dompdf/dompdf`, `vlucas/phpdotenv`.
- Front Controller + Router + Middleware + Controllers مكتوبين من الصفر بـ PHP خام.

### هيكل المجلدات الإلزامي (لازم يطلع بالظبط كده — مفيش زيادة أو نقصان)

استخدم هيكل **بسيط ومسطّح** عشان يكون سهل القراءة والتعديل اليدوي. ممنوع تعمل layers معقدة (Services / Repositories / Interfaces / DTOs / Containers). كل route file فيه الـ logic بتاعه مباشرة.

```
saba-api/
├── index.php              ← الـ Router الرئيسي (Front Controller — يستقبل كل الطلبات ويوزّعها على routes/)
├── .htaccess              ← إعداد Apache (rewrite كل الطلبات لـ index.php)
├── migrate.sql            ← قاعدة البيانات الكاملة (CREATE TABLE + Indexes + Seeders)
├── DEPLOY.md              ← دليل الرفع خطوة بخطوة على cPanel/VPS
├── .env.example           ← نموذج المتغيرات (DB, JWT_SECRET, Mail, Payment keys)
├── config/
│   └── database.php       ← PDO connection singleton
├── helpers/
│   ├── response.php       ← json_response() + validate() + paginate()
│   ├── jwt.php            ← encode_jwt() + decode_jwt()
│   ├── upload.php         ← handle_upload() مع validation
│   └── mail.php           ← send_mail() عبر PHPMailer + templates
├── middleware/
│   ├── cors.php           ← CORS headers + preflight
│   └── auth.php           ← require_auth() + require_admin() + require_partner()
└── routes/
    ├── auth.php           ← register / login / logout / me / forgot / reset / otp / google
    ├── public.php         ← services / plans / portfolio / contact / settings / tracking / reviews
    ├── cart.php           ← cart CRUD + coupon
    ├── checkout.php       ← checkout + payment webhooks (MyFatoorah/Tamara/Tabby/COD)
    ├── account.php        ← profile / orders / tickets / favorites / bookings
    ├── admin.php          ← كل /admin/* endpoints
    ├── partner.php        ← partner dashboard endpoints
    └── coupon.php         ← coupon validation/management
```

**قواعد الهيكل:**
- مفيش `src/`، مفيش `app/`، مفيش `vendor/Classes/`، مفيش namespaces معقدة.
- كل ملف في `routes/` فيه `switch` أو `if` على الـ method والـ path ويـ `require` الـ helpers اللي محتاجها.
- `index.php` يـ parse الـ URL ويـ `require` ملف الـ route المناسب من `routes/` بناءً على أول segment (`/auth` → `routes/auth.php`).
- الكود يكون **procedural** قدر الإمكان (functions مش classes إلا للضرورة زي PDO wrapper).
- Comments بالعربي على كل function عشان يكون سهل الفهم.
- ممنوع autoloader معقد — استخدم `require_once` مباشرة.



### Domain layout (mirror this on the backend)

Group routes by domain — same boundaries the frontend uses:

| Domain | Prefix | Public? |
|--------|--------|--------|
| Auth | `/auth/*` | mixed |
| Public site | `/services`, `/plans`, `/portfolio`, `/contact`, `/site/settings`, `/tracking` | yes |
| Cart & Checkout | `/cart*`, `/checkout` | guest or user |
| Account | `/account/*` | user |
| Admin | `/admin/*` | admin role |
| Favorites & reviews | `/me/favorites*`, `/services/:slug/reviews`, `/reviews/:id` | user |

### Full endpoint contract (frontend already calls these — do not rename)

**Auth**
- `POST /auth/signup` `{ name, email, phone?, password }` → `{ user, token }`
- `POST /auth/login`  `{ email?|phone?, password }` → `{ user, token }`
- `POST /auth/oauth/google` `{ idToken }` → `{ user, token }`
- `GET  /auth/me` → `{ user }`
- `POST /auth/logout`
- `POST /auth/forgot` `{ email }`
- `POST /auth/reset` `{ token, password }`

**Public**
- `GET  /services?category=&q=` → `{ items: ServiceListItem[] }`
- `GET  /services/:slug` → `{ service: ServiceFull }`
- `GET  /services/:slug/reviews?page=` → paginated
- `POST /services/:slug/reviews` `{ rating, text }`
- `GET  /me/favorites` / `POST /me/favorites/:slug` / `DELETE /me/favorites/:slug`
- `GET  /plans` → `{ items: Plan[] }`
- `GET  /portfolio?category=` → paginated
- `POST /contact` `{ name, email, phone?, service?, budget?, message }`
- `GET  /site/settings` (public read of admin site settings)
- `GET  /tracking` → `{ pixels, head, body }`

**Cart**
- `GET  /cart` → `Cart`
- `POST /cart/items` `{ serviceSlug, planId?, qty? }` → `Cart`
- `PATCH /cart/items/:id` `{ qty }` → `Cart`
- `DELETE /cart/items/:id` → `Cart`

**Checkout**
- `POST /checkout` body:
  ```ts
  {
    items?: { serviceSlug: string; planId?: string; qty: number }[], // optional override of saved cart
    contact: { name, email, phone, city, address },
    paymentMethod: "mayfatoorah" | "tabby" | "tamara" | "cod",
    notes?: string,
    couponCode?: string
  }
  ```
  Response: `{ orderId, orderNumber, paymentUrl: string | null }`. If `items` is provided (e.g. for plans), the backend must build the order from those items and IGNORE any saved cart.

**Account**
- `GET  /account/profile` → `{ user }`
- `PUT  /account/profile` (JSON or multipart for avatar)
- `PUT  /account/password` `{ currentPassword, newPassword }`
- `GET  /account/orders?status=&page=` → paginated `Order`
- `GET  /account/orders/:id` → `{ order: Order }`
- `POST /account/orders/:id/pay` `{ paymentMethod? }` → `{ paymentUrl }` — re-creates a payment session for an unpaid existing order. Must validate `order.user_id === auth.userId` (else 403), 404 if missing, 400 if already paid or cancelled. Webhook updates the SAME order, never creates a duplicate.
- `GET  /account/tickets?page=` → paginated
- `GET  /account/tickets/:id` → `{ ticket }`
- `POST /account/tickets` `{ subject, orderId?, priority, message }` → `{ id, number }`
- `POST /account/tickets/:id/messages` `{ text }`
- `PATCH /account/tickets/:id/close`

**Admin** (requires admin role; full list)
Services CRUD `/admin/services`, plans `/admin/plans`, orders `/admin/orders` (+ `/status`, `/payment-status`, `/note`), bookings `/admin/bookings`, invoices `/admin/invoices` (+ `/pdf`), clients `/admin/clients`, portfolio `/admin/portfolio` (+ `/visibility`), users `/admin/users` (+ `/invite`, `/role`), tickets `/admin/tickets` (+ `/messages`, `/status`, `/priority`), reviews `/admin/reviews` (+ `/status`), settings `/admin/settings/:group` and `/admin/site/settings`, tracking `/admin/tracking` (+ `/toggle`), analytics `/admin/analytics?range=`, stats `/admin/stats`, reports `/admin/reports/generate` (json or csv), notifications `/admin/notifications`, uploads `POST /admin/uploads` (multipart `file`).

### Type shapes the frontend already imports

Source of truth: `src/lib/api/types.ts`. The backend MUST return these exact field names and types (camelCase except where the field is already snake_case in the type definition — keep them as-is). Key types:

```ts
type Price = { amount: number; originalAmount: number|null; currency: "SAR"; discountPercent: number|null };

type User = { id, name, email, phone|null, city|null, avatar|null, role, language, createdAt };

type ServiceListItem = { id, slug, sku, titleAr, titleEn, subtitleAr, subtitleEn, category, price: Price, cover|null, status, rating, reviewsCount, isFavorited };
type ServiceFull = ServiceListItem & {
  bannerImage|null, breadcrumbAr, breadcrumbEn, overviewDescriptionAr, overviewDescriptionEn,
  heroHighlights: {ar,en}[], overview, benefits, steps, stats, testimonials, faqs, plans: ServicePlan[], seo
};

type CartItem = { id, service_slug, service_title, plan_id|null, plan_name|null, price, original_price|null, qty };
type Cart = { items: CartItem[], subtotal, vat, total, sessionId, discount?, code? };

type Order = {
  id, number, createdAt, status: "pending"|"confirmed"|"in_progress"|"review"|"completed"|"cancelled",
  payment_method, payment_id|null, paid,
  contact_name, contact_email, contact_phone, contact_city, contact_address,
  items: OrderItem[], subtotal, vat, total, notes|null, source,
  timeline: {status, at, note}[], invoice|null
};

type Ticket = { id, number, subject, orderId|null, status, priority, createdAt,
  messages: { id, from_type:"client"|"support", author, text, at }[] };

type Plan = { id, nameAr, nameEn, price: Price, badgeAr|null, badgeEn|null, descriptionAr, descriptionEn, featuresAr[], featuresEn[], highlighted, sortOrder, status };
```

### What you must NOT do

- Don't change endpoint paths, field names, or the response envelope.
- Don't return raw arrays at the root — always wrap in `{ success, data }`.
- Don't drop the localized counterpart of any field.
- Don't auto-create a duplicate order when the pay-again webhook fires; update the existing one.
- Don't expose admin-only fields on public endpoints.
- Don't trust the client for prices — recompute totals server-side.

### How to find issues

If something looks wrong, check in this order:
1. **Endpoint exists & path matches** the list above.
2. **Response envelope** matches `{ success, data }`.
3. **Field names** match the TypeScript types above.
4. **Auth header / role check** — admin endpoints must reject non-admins with 403, not 401.
5. **Status codes** — validation errors → 422 with `errors: {field: msg}`.
6. **CORS** — the frontend runs on `*.lovable.app`, `saba-design.com`, and previews. Allow them and `Authorization`, `X-Session-Id`, `Accept-Language` headers.

Build the backend so the frontend works without ANY change. If you must add a new field, add it optional, keep old shape, and tell me what changed.

---

## انتهى البرومبت ☝️
