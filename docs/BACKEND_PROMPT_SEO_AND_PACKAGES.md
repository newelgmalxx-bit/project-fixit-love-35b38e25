# Backend AI Prompt — SEO settings + Partner packages

Hand this whole file to the backend AI (the one that owns `https://koswmat.com/api`). The frontend already calls these endpoints; once they are live, the UI starts working without any frontend changes.

Base API: `https://koswmat.com/api`
Auth: `Authorization: Bearer <jwt>` (admin routes require `role=admin`)
Response envelope (already used everywhere in the project):

```json
{ "success": true, "message": "", "data": { ... } }
```

Errors must use HTTP 4xx/5xx with the same envelope and a human Arabic `message`.

---

## 1) SEO settings

The admin page at `/admin/seo` currently shows the note
`"SEO endpoint not implemented in backend; using local defaults."` because these endpoints don't exist. Implement them:

### 1.1 Storage

Add a single-row settings table (or upsert by `id=1`) — the frontend treats the whole payload as one JSON blob:

```sql
CREATE TABLE seo_settings (
  id INT PRIMARY KEY DEFAULT 1,
  payload JSON NOT NULL,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

`payload` shape (exactly what the admin sends/expects back):

```json
{
  "global": {
    "siteName": "خصومات",
    "separator": "|",
    "twitter": "@koswmat",
    "ogImage": "https://...",
    "canonicalBase": "https://koswmat.com"
  },
  "pages": [
    { "key": "home",      "label": "الرئيسية", "title": "...", "desc": "...", "keywords": "..." },
    { "key": "services",  "label": "الخدمات",  "title": "...", "desc": "...", "keywords": "..." },
    { "key": "portfolio", "label": "أعمالنا",  "title": "...", "desc": "...", "keywords": "..." },
    { "key": "about",     "label": "من نحن",   "title": "...", "desc": "...", "keywords": "..." },
    { "key": "contact",   "label": "تواصل معنا","title": "...", "desc": "...", "keywords": "..." }
  ],
  "robots": "User-agent: *\nAllow: /\nSitemap: https://koswmat.com/sitemap.xml"
}
```

### 1.2 Endpoints

**GET `/admin/seo`** (admin)
Returns the stored payload (or sensible defaults on the first call).

```json
{ "success": true, "data": { "global": {...}, "pages": [...], "robots": "..." } }
```

**PUT `/admin/seo`** (admin)
Body = the same payload. Validate: `global.canonicalBase` must be a valid URL; `pages[].title` ≤ 70 chars; `pages[].desc` ≤ 200 chars. Replace the whole row.

**GET `/seo`** (public, no auth)
Same payload, used by the public site to render `<title>` / meta tags at build/runtime.

**GET `/robots.txt`** (public, raw text)
Return `payload.robots` as `text/plain`. If the row doesn't exist, return:
```
User-agent: *
Allow: /
```

### 1.3 Notes
- The admin page just sends the whole payload back on save — no diffing needed.
- Cache headers: public `/seo` and `/robots.txt` can be `Cache-Control: public, max-age=300`.

---

## 2) Partner packages (subscription tiers shown on signup)

Background: the admin defines 2 packages (e.g. "Basic" / "Pro") with a name + price. A new partner picks one during signup. **The platform does NOT charge the partner** — the price is informational. Selecting a package is only required to complete registration and is stored on the partner profile so admin/sales can follow up off-platform.

### 2.1 Storage

```sql
CREATE TABLE partner_packages (
  id           CHAR(36) PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,           -- Arabic display name
  name_en      VARCHAR(120) NULL,
  price        DECIMAL(10,2) NOT NULL DEFAULT 0,-- informational only
  description  TEXT NULL,
  features     JSON NULL,                       -- array of strings
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE partner_profiles
  ADD COLUMN package_id CHAR(36) NULL,
  ADD CONSTRAINT fk_partner_package FOREIGN KEY (package_id) REFERENCES partner_packages(id) ON DELETE SET NULL;
```

### 2.2 Public endpoint

**GET `/partner-packages`** (no auth)
Returns only active packages sorted by `sort_order`.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "pkg_...",
        "name": "الباقة الأساسية",
        "nameAr": "الباقة الأساسية",
        "nameEn": "Basic",
        "price": 499,
        "description": "للمراكز اللي بتبدأ",
        "features": ["دعم فني", "عدد عروض غير محدود"],
        "isActive": true,
        "sortOrder": 0
      }
    ]
  }
}
```

Field naming: prefer camelCase in JSON (`isActive`, `sortOrder`, `nameAr`, `nameEn`). It is fine to also send the snake_case aliases (`is_active`, `sort_order`) for backward compatibility — the frontend reads both.

### 2.3 Admin CRUD

All under `/admin/partner-packages` (admin auth required).

**GET `/admin/partner-packages`** — returns ALL packages (active + inactive). Same shape as the public list, but no `isActive` filter.

**POST `/admin/partner-packages`** — create. Body:
```json
{ "name": "...", "nameAr": "...", "nameEn": "...", "price": 499, "description": "...", "features": ["..."], "isActive": true, "sortOrder": 0 }
```
Validation: `name` required (1–120 chars), `price >= 0`, `features` array of strings (each 1–120). Limit total active packages to 4 (the signup UI shows max 2 nicely, but allow some slack).

**PUT `/admin/partner-packages/:id`** — update. Same body, partial allowed.

**DELETE `/admin/partner-packages/:id`** — hard delete. If any partner still references it, soft-fail with `409` and message `"لا يمكن حذف الباقة لارتباطها بشركاء"`, OR null-out `partner_profiles.package_id` and proceed (your call — frontend handles either).

### 2.4 Hook into partner registration

**POST `/auth/partner/register`** — accept an extra optional field `package_id` (also accept `packageId`).
- If provided, validate it points to an existing **active** package, then store it on the new `partner_profiles.package_id`.
- If invalid or inactive: respond `400` with message `"الباقة المختارة غير متاحة"`.
- If omitted: leave `package_id` NULL (signup must still succeed for backwards compatibility).

Return the package on the partner profile in subsequent responses (`/auth/me`, `/admin/partners/:id`, `/admin/partners`) as a nested object:
```json
{ "id": "...", "vendorName": "...", "package": { "id": "...", "name": "...", "price": 499 } }
```

### 2.5 Notes
- **No payment integration.** Do not call MyFatoorah or any gateway for packages. The price is metadata.
- The admin sales team will follow up with the partner manually — consider adding an admin notification on signup when `package_id` is set (re-use the existing notifications table if you have one).
- No need for an audit log; updates overwrite.

---

## 3) Final checklist for the backend AI

- [ ] `GET /admin/seo`, `PUT /admin/seo`, `GET /seo`, `GET /robots.txt`
- [ ] `seo_settings` table created and seeded with defaults
- [ ] `partner_packages` table created
- [ ] `partner_profiles.package_id` column added
- [ ] `GET /partner-packages` (public)
- [ ] `GET|POST|PUT|DELETE /admin/partner-packages`
- [ ] `POST /auth/partner/register` accepts `package_id` / `packageId`
- [ ] All responses use the `{ success, message, data }` envelope
- [ ] Admin routes enforce `role=admin`; public routes are open
- [ ] camelCase JSON keys (snake_case aliases optional for compat)

---

## 4) BUGFIX — `features` بيتخزن منه ميزة واحدة بس

**الأعراض:** الأدمن يضيف 3 مميزات ويحفظ، يرجع يلاقي ميزة واحدة فقط (أول وحدة) محفوظة.

**السبب:** الفرونت بيبعت `features` كـ JSON array صح في الـ body:
```json
{ "features": ["ميزة 1", "ميزة 2", "ميزة 3"] }
```
لكن الباك-اند بيعامل القيمة كأنها نص واحد، أو بياخد `features[0]`، أو العمود في DB من نوع VARCHAR بدل JSON/TEXT، أو بيعمل `implode/explode` على فاصلة.

**الإصلاح المطلوب في `POST /admin/partner-packages` و `PUT /admin/partner-packages/:id`:**

1. **قراءة الـ body:** اقرأ `features` كـ array مباشرة من JSON body — لا تستخدم `$_POST['features']` (لأنها هتاخد أول قيمة بس). استخدم:
   ```php
   $body = json_decode(file_get_contents('php://input'), true);
   $features = is_array($body['features'] ?? null) ? $body['features'] : [];
   ```
2. **التحقق:** كل عنصر يكون string بطول 1–120 حرف. تجاهل الفاضي.
3. **التخزين:** العمود لازم يكون `JSON` (أو `TEXT`/`LONGTEXT`). خزّن بـ:
   ```php
   $stmt->bindValue(':features', json_encode(array_values($features), JSON_UNESCAPED_UNICODE));
   ```
4. **القراءة من DB:** `json_decode($row['features'], true) ?: []` ورجّعها للفرونت كـ array.

**تأكيد:** بعد الإصلاح، نفّذ:
```bash
curl -X PUT https://koswmat.com/api/admin/partner-packages/<id> \
  -H "Authorization: Bearer <jwt>" -H "Content-Type: application/json" \
  -d '{"features":["a","b","c"]}'
# ثم
curl https://koswmat.com/api/admin/partner-packages
# لازم يرجع features = ["a","b","c"]
```

نفس الـ checklist ينطبق على عمود `pages` في `seo_settings` لو فيه نفس المشكلة.

