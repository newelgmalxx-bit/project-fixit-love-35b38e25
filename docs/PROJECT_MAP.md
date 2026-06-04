# خريطة المشروع — Saba Design Frontend

هذا الملف بيوضّح **كل حاجة فين** في المشروع، عشان تلاقي أي ملف بسرعة وتعرف هو مسؤول عن إيه.

---

## 1) المعمارية باختصار

المشروع طبقات مفصولة:

```
Pages (src/routes)  ──>  Hooks (src/hooks)  ──>  API services (src/lib/api)  ──>  Backend
        │                                                  │
        └──> UI (src/components, src/components/ui) <──────┘
```

- **الصفحات (routes)** = عرض فقط. مفيش fetch مباشر، بتنادي على `api.*` أو hooks.
- **API services (src/lib/api)** = كل اتصال بالـ backend متجمّع هنا، مقسوم بالـ domain.
- **Hooks** = state مشترك (auth, cart, plans, ...).
- **Components** = عناصر UI قابلة لإعادة الاستخدام.
- **src/data** = بيانات ثابتة فقط (mock fallbacks، أيقونات وسائل دفع، إلخ) — مش API.

قاعدة ذهبية: **مفيش `fetch()` ولا `axios` في أي ملف داخل `src/routes` أو `src/components`.** أي طلب backend لازم يبقى داخل `src/lib/api/*`.

---

## 2) طبقة الـ API (`src/lib/api/`)

| الملف | المسؤولية | المسارات |
|------|-----------|---------|
| `client.ts` | الـ HTTP client (`request()`)، إدارة التوكن، session id، الـ headers، رفع الأخطاء | — |
| `types.ts` | كل الـ TypeScript types (`User`, `Order`, `Cart`, `ServiceFull`, `Plan`, `Ticket`, `ApiResponse<T>`, `PaginatedResponse<T>`...) | — |
| `auth.ts` | تسجيل دخول / تسجيل / Google / forgot / reset / me / logout | `/auth/*` |
| `services.ts` | الخدمات + المراجعات + المفضلة | `/services`, `/services/:slug`, `/services/:slug/reviews`, `/me/favorites` |
| `cart.ts` | السلة (إضافة، تحديث كمية، حذف) | `/cart`, `/cart/items` |
| `checkout.ts` | إنشاء أوردر جديد ودفعه | `/checkout` |
| `account.ts` | البروفايل، الأوردرات، التذاكر، الدفع لأوردر قديم | `/account/*` |
| `admin.ts` | كل صفحات الأدمن (services, orders, plans, invoices, clients, portfolio, users, tickets, reviews, settings, tracking, analytics, reports) | `/admin/*` |
| `public.ts` | بيانات عامة بدون تسجيل (الباقات، البورتفوليو، الكونتاكت، إعدادات الموقع، الـ tracking pixels) | `/plans`, `/portfolio`, `/contact`, `/site/settings`, `/tracking` |
| `normalize.ts` | تحويل response الـ backend إلى الشكل اللي الفرونت بيستخدمه | — |
| `index.ts` | الـ barrel export — بيجمع كل الخدمات في `api.{auth,services,cart,checkout,account,admin}` ويوفر aliases قديمة | — |

**استخدام في الصفحات:**

```ts
import api from "@/lib/api";              // الكل
// أو
import { account, cart } from "@/lib/api"; // domain واحد
```

---

## 3) الصفحات (`src/routes/`)

TanStack Router file-based — اسم الملف = المسار. النقطة (`.`) في اسم الملف تساوي `/`.

### عام
| الملف | المسار | الوظيفة |
|------|--------|---------|
| `index.tsx` | `/` | الصفحة الرئيسية |
| `about.tsx` | `/about` | عن الشركة |
| `contact.tsx` | `/contact` | تواصل معنا |
| `portfolio.tsx` | `/portfolio` | معرض الأعمال |
| `plans.tsx` | `/plans` | الباقات |
| `services.index.tsx` | `/services` | كل الخدمات |
| `services.$slug.tsx` | `/services/:slug` | خدمة واحدة + خطط |
| `cart.tsx` | `/cart` | السلة |
| `checkout.tsx` | `/checkout` | إتمام الشراء |
| `checkout.success.tsx` | `/checkout/success` | نجاح الشراء |
| `payment.result.tsx` | `/payment/result` | نتيجة بوابة الدفع |
| `payment.failed.tsx` | `/payment/failed` | فشل الدفع |
| `privacy.tsx`, `terms.tsx` | — | صفحات قانونية |

### Auth
`login.tsx`, `signup.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `auth.reset.tsx`.

### حساب المستخدم (`/account/*`)
| الملف | المسار |
|------|--------|
| `account.index.tsx` | `/account` (Dashboard) |
| `account.profile.tsx` | `/account/profile` |
| `account.favorites.tsx` | `/account/favorites` |
| `account.orders.index.tsx` | `/account/orders` |
| `account.orders.$orderId.tsx` | `/account/orders/:orderId` (تفاصيل) |
| `account.orders.$orderId.pay.tsx` | `/account/orders/:orderId/pay` (دفع أوردر معلّق) |
| `account.tickets.index.tsx` | `/account/tickets` |
| `account.tickets.new.tsx` | `/account/tickets/new` |
| `account.tickets.$ticketId.tsx` | `/account/tickets/:ticketId` |

### لوحة الأدمن (`/admin/*`)
`admin.tsx` هو الـ layout. باقي الصفحات: `index`, `services`, `services.$slug`, `plans`, `bookings`, `clients`, `portfolio`, `invoices`, `payment`, `analytics`, `reports`, `users`, `seo`, `site`, `tracking`, `partner`, `settings.*` (`profile`, `team`, `appearance`, `notifications`, `integrations`), `tickets.*`.

---

## 4) Hooks (`src/hooks/`)

| الملف | الوظيفة |
|------|---------|
| `useAuth.tsx` | session حالي + login/logout + refresh `auth.me` |
| `useCart.ts` | حالة السلة + add/update/remove |
| `usePlans.ts` | جلب الباقات من `public.getPlans()` |
| `useServiceContent.ts` | محتوى صفحة خدمة (يدمج API + fallback من `src/data/services.ts`) |
| `useServiceReviews.ts` | مراجعات الخدمة |
| `useTrackVisit.tsx` | تتبّع زيارة الصفحة |
| `useInjectTracking.ts` | حقن أكواد الـ pixels في الـ DOM |
| `use-mobile.tsx` | detect mobile breakpoint |

---

## 5) المكونات (`src/components/`)

- `ui/` — shadcn primitives (Button, Card, Dialog, ...). متلمسهاش غالباً.
- `layout/` — `SiteHeader`, `SiteFooter`.
- `sections/` — أقسام الصفحة الرئيسية (Hero, Services, Portfolio, CTA, ...).
- `account/AccountLayout.tsx` — sidebar حساب المستخدم.
- `admin/AdminLayout.tsx` — sidebar الأدمن.
- `auth/AuthGuard.tsx`, `AuthHero.tsx` — حماية وصفحات الـ auth.
- `invoice/InvoiceDocument.tsx` — قالب الفاتورة (للـ PDF).
- `MaintenanceGate.tsx`, `MaintenanceScreen.tsx` — وضع الصيانة.

---

## 6) Lib مساعد (`src/lib/`)

| الملف | الوظيفة |
|------|---------|
| `utils.ts` | `cn()` (clsx + tailwind-merge) |
| `image.ts` | تحويل الصور المرفوعة لـ WebP |
| `seo.ts` | helpers لتوليد meta tags |
| `invoice.ts` + `renderInvoice.tsx` | تجهيز وتصدير الفاتورة PDF |
| `partnerAdminApi.ts` | API الشريك (`admin.partner` فقط) |

---

## 7) i18n

- `src/i18n/LanguageProvider.tsx` — Context (`useLang()`).
- `src/i18n/translations.ts` — كل النصوص (ar/en).

---

## 8) Backend integrations

- `BASE` URL للـ API الرئيسي محدد في `src/lib/api/client.ts`:
  ```ts
  const BASE = 'https://saba-design.com/api';
  ```
- التوكن متخزّن في `localStorage` تحت `saba_token`.
- لو المستخدم مش مسجل، الـ cart بيستخدم `X-Session-Id` من `localStorage.saba_sid`.

---

## 9) قواعد لازم تتبعها لما تضيف Feature جديد

1. **endpoint جديد** → ضيفه في الملف المناسب داخل `src/lib/api/` (مش في الصفحة).
2. **type جديد** → في `src/lib/api/types.ts`.
3. **state مشترك بين أكثر من صفحة** → اعمله hook في `src/hooks/`.
4. **زرار/كارت/badge جديد قابل للاستخدام في كذا مكان** → component في `src/components/`.
5. **صفحة جديدة** → ملف واحد في `src/routes/` يستورد من `@/lib/api` ومن `@/components`. الصفحة بتعرض بس.
6. **مفيش `fetch` خارج `src/lib/api`.** أي طلب HTTP خارج الطبقة دي = bug معماري.
7. **مفيش mock data جوّا الصفحة.** لو محتاج fallback، حطّه في `src/data/`.

---

## 10) ملفات مرشحة للحذف لاحقاً (لو الباك جاهز بالكامل)

- `src/data/services.ts` — fallback قديم لمحتوى الخدمات؛ ممكن يتشال لما الـ backend يبقى المصدر الوحيد.
- `src/data/admin.ts` — أرقام demo للـ analytics.
- `src/lib/partnerAdminApi.ts` + `src/routes/admin.partner.tsx` — لو ميزة الشريك مش هتستخدم.

متشلش حاجة فيهم دلوقتي من غير ما تتأكد إنها مش متربطة في صفحة شغّالة.
