# 🔌 SABA DESIGN — Frontend ↔ Backend API Map

> **Base URL:** `https://saba-design.com/api`  
> **Auth:** `Authorization: Bearer <jwt>` for protected routes  
> **Cart (guest):** `X-Session-Id: <uuid>` header  
> **VAT:** 15% computed server-side on `(subtotal − coupon discount)`

## Response Envelope
```
{ "success": true, "message": "", "data": { ... } }
{ "success": false, "message": "وصف الخطأ", "errors": { "field": ["..."] } }
```

## Business Rule
A cart line is **either** a Service (`serviceId` + `serviceSlug`) **or** a Plan (`servicePlanId`).  
Plans are independent products from `/plans`, NOT nested inside services.

---

## Endpoints used by the frontend

| Frontend file | Method | Path |
|---|---|---|
| `src/lib/api/auth.ts` | POST | `/auth/register` |
| | POST | `/auth/login` (body `{ email, password }`) |
| | POST | `/auth/google` (body `{ idToken }`) |
| | POST | `/auth/forgot-password` |
| | POST | `/auth/reset-password` |
| | GET  | `/auth/me` |
| | POST | `/auth/logout` |
| `src/lib/api/services.ts` | GET | `/services`, `/services/{slug}` |
| `src/lib/api/public.ts` | GET | `/plans`, `/portfolio`, `/settings`, `/tracking` |
| | GET | `/reviews/{serviceId}` |
| | POST | `/contact`, `/bookings` |
| | POST | `/upload` (multipart) |
| `src/lib/api/cart.ts` | GET/DELETE | `/cart` |
| | POST | `/cart/items` body `{ serviceId?, servicePlanId?, serviceSlug, serviceTitle, planName?, qty, price, originalPrice? }` |
| | PUT/DELETE | `/cart/items/{id}` |
| | POST/DELETE | `/cart/coupon` |
| `src/lib/api/checkout.ts` | POST | `/checkout` body `{ paymentMethod, contactName, contactEmail, contactPhone, contactCity?, contactAddress?, notes? }` |
| | POST | `/checkout/myfatoorah` body `{ orderId }` → `{ paymentUrl }` |
| | GET  | `/checkout/callback?paymentId=…` |
| `src/lib/api/account.ts` | GET | `/account/orders`, `/account/orders/{id}` |
| | GET | `/account/invoices`, `/account/invoices/{id}` |
| | GET/POST | `/account/tickets` body `{ subject, message, priority?, orderId? }` |
| | GET/POST | `/account/tickets/{id}`, `/account/tickets/{id}/messages` |
| | GET | `/account/favorites` |
| | POST/DELETE | `/account/favorites/{serviceId}` |
| | POST | `/account/reviews` body `{ serviceId, rating, comment? }` |
| | PUT | `/account/profile`, `/account/password` |
| `src/lib/api/admin.ts` | GET | `/admin/dashboard` |
| | GET/POST | `/admin/services`, `/admin/plans`, `/admin/portfolio`, `/admin/coupons`, `/admin/tracking-codes`, `/admin/users` |
| | GET/PUT/DELETE | `/admin/{resource}/{id}` |
| | GET | `/admin/orders`, `/admin/invoices`, `/admin/bookings`, `/admin/contact-messages`, `/admin/reviews`, `/admin/notifications` |
| | PUT | `/admin/orders/{id}` (status, paymentStatus, note) |
| | PUT | `/admin/notifications/{id}/read` |
| | GET/PUT | `/admin/settings` |

## Notes
- Anywhere the UI says "plan", `servicePlanId` refers to a Plan row from `/plans`, never a sub-plan of a service.
- All prices in SAR. `originalPrice` is for strike-through display only.
- Re-paying an unpaid order calls `POST /checkout/myfatoorah` with the existing `orderId`; the backend MUST reuse the same order.

---

## Branch endpoints used by admin and partner frontends

> **Current base URL in code:** `https://koswmat.com/api`  
> **Auth:** `Authorization: Bearer <jwt>`

### Admin branches

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/branches` | List all branches. Supports `partnerId`, `q`, `page`, `limit` in the frontend client. |
| GET | `/admin/branches?partnerId={partnerId}` | List branches for a specific partner. |
| GET | `/admin/branches/{id}` | Get one branch. |
| POST | `/admin/branches` | Create a branch. |
| PUT | `/admin/branches/{id}` | Update branch profile, status, working hours, independence flags, and permissions. |
| PUT | `/admin/branches/{id}/credentials` | Create/update branch login credentials. Password is write-only and never returned. |
| PUT | `/admin/branches/{id}/set-default` | Mark branch as the default branch for its partner. |
| PUT | `/admin/branches/{id}/status` | Toggle `active` / `inactive`. |
| DELETE | `/admin/branches/{id}` | Delete branch if unused; otherwise soft-delete by setting `status = inactive`. |

### Partner dashboard branches

| Method | Path | Purpose |
|---|---|---|
| GET | `/partner/branches` | List branches for the logged-in partner. |
| GET | `/partner/branches/{id}` | Get one branch owned by the logged-in partner. |
| POST | `/partner/branches` | Create a branch. |
| PUT | `/partner/branches/{id}` | Update branch profile, status, working hours, independence flags, and permissions. |
| PUT | `/partner/branches/{id}/credentials` | Create/update branch login credentials. Password is write-only and never returned. |
| PUT | `/partner/branches/{id}/default` | Mark branch as the default branch. |
| PUT | `/partner/branches/{id}/status` | Toggle `active` / `inactive`. |
| DELETE | `/partner/branches/{id}` | Delete branch if unused; otherwise soft-delete by setting `status = inactive`. |

### Branch payload fields

```json
{
  "partnerId": "uuid, admin only",
  "nameAr": "Arabic branch name",
  "nameEn": "English branch name or null",
  "phone": "branch phone or null",
  "address": "address or null",
  "mapsUrl": "map URL or null",
  "isDefault": false,
  "status": "active | inactive",
  "workingHours": [
    { "day": "saturday", "open": "09:00", "close": "22:00", "closed": false }
  ],
  "isIndependent": true,
  "canManageOffers": true,
  "canManageHours": true,
  "canEditInfo": true,
  "canManageBookings": true,
  "email": "branch login email or null",
  "password": "new password or null"
}
```

### Delete response contract

Branch deletion is not always a hard delete. If the branch has linked bookings or offers, the backend must preserve history and returns a soft-delete response.

**Hard delete:**
```json
{
  "success": true,
  "message": "تم حذف الفرع بنجاح",
  "data": { "softDeleted": false }
}
```

**Soft delete / deactivate:**
```json
{
  "success": true,
  "message": "تم تعطيل الفرع لوجود بيانات مرتبطة به",
  "data": { "softDeleted": true }
}
```

Frontend rule: never show a generic “deleted” toast when `softDeleted` is true. Show the backend message and keep/update the branch as `inactive`.
