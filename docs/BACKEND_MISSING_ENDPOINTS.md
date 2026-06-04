# Backend ⇄ Frontend Wiring (admin v6 — May 2026)

تم تحديث `admin.php` (v6). أدناه حالة كل وحدة فرونت بعد المزامنة:

## ✅ مكتمل ومربوط
| الوحدة | الـ endpoint |
|---|---|
| Dashboard / Analytics overview / realtime | `/admin/dashboard`, `/admin/analytics/overview`, `/admin/analytics/realtime` |
| Orders (list/detail/status/payment/confirm/delete) | `/admin/orders[/{id}[/status|payment|confirm-payment]]` |
| Invoices (list/get/create/status/pdf/delete) | `/admin/invoices[/{id}[/status|pdf]]` |
| Users / Clients | `/admin/users[/{id}[/status]]` (الـ `/admin/clients` يُحوَّل لـ users) |
| Tickets (list/detail/reply/status) | `/admin/tickets[/{id}[/messages|status]]` — **priority غير مدعوم** |
| Contact messages | `/admin/contact-messages[/{id}[/read]]` |
| Reviews (list/approve/reject/delete) | `/admin/reviews[/{id}[/approve|reject]]` |
| Bookings (list/get/update/status) | `/admin/bookings[/{id}[/status]]` — refund يُمرَّر كـ status='refunded' |
| Tracking codes | `/admin/tracking-codes[/{id}]` + `/tracking` للعرض العام |
| Page visits | `/admin/page-visits[/clear]` |
| Quotes | `/admin/quotes[/{id}[/status]]` |
| Abandoned carts | `/admin/abandoned-carts[/{id}/remind]` |
| Offers (مع is_featured/featured_sort) | `/admin/offers[/{id}[/status]]` |
| Categories | `/admin/categories[/{id}[/status]]` |
| Partners | `/admin/partners[/{id}[/status|reset-password]]` |
| Payouts | `/admin/payouts[/{id}[/status]]` |
| Cities | `/admin/cities[/{id}]` — toggle = PUT بـ isActive |
| Legal pages | `/admin/legal-pages[/{slug}]` |
| Coupons | `/admin/coupons[/{id}]` |
| Sponsored ads | `/admin/sponsored-ads[/{id}]` |
| Upload | `/admin/upload` (FormData، bucket في الـ body) |
| Settings | `/admin/settings`, `/admin/settings/profile` |
| Notifications | `/admin/notifications`, `/admin/notifications/read-all` |

## 🔄 تكيُّفات في الفرونت
- **Featured Offers** — لا يوجد resource مستقل. الفرونت يستخدم `GET /admin/offers?featured=1` للقائمة، و `PUT /admin/offers/{id}` بـ `is_featured`/`featured_sort` للإضافة/الإزالة.
- **Bookings refund** — يُترجم إلى `PUT /admin/bookings/{id}/status` بـ `status='refunded'`.
- **Cities toggle** — يُترجم إلى `PUT /admin/cities/{id}` بـ `isActive`.
- **Order notes** — لا يوجد endpoint؛ ترفض العملية بأمان.
- **Invoice update** — مسموح بـ status فقط (`/admin/invoices/{id}/status`).
- **Contact message update** — يدعم `mark read` فقط.

## ❌ غير منفّذة في الباك (الفرونت معطّل برسالة واضحة)
- `/admin/reports/generate` — تقارير مخصّصة.
- `/admin/seo` — إعدادات SEO عامة (الـ SEO حاليًا داخل offers/categories فقط).
- `/admin/services`, `/admin/plans`, `/admin/portfolio` — تم إلغاء هذه الوحدات لصالح Offers/Categories.
- `/admin/tickets/{id}/priority` — تعديل أولوية التذاكر.
- `/admin/agreements` — اتفاقيات الشركاء (mock فقط في الفرونت).
- `/admin/payments/gateways` — إعدادات بوابات الدفع.

## ملاحظات مهمة على DB (راجع `BACKEND_DB_FIXES.md`)
- `partners.name` فقط (لا يوجد `vendor_name_ar/en`) — الكود الجديد بيستخدم `p.name` مباشرة. ✅
- `bookings` بتستخدم `u.name/email/phone` كـ aliases بدل `customer_*`. ✅
- `orders.payment_method/payment_status` (snake_case) هي المعتمدة. ✅
- `cities.id` UUID وليس INT.
