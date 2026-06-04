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
