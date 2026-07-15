This is a large multi-file feature. Presenting the plan first so you can approve or trim scope before I commit ~15+ new files.

## Scope

Wire the new backend into the frontend across 5 areas:

### 1. Branch auth (new)
- `src/lib/api/branchAuth.ts` — `login`, `verifyOtp`, `resendOtp`, `logout`, `me`; stores token in `localStorage["branch_token"]`.
- `src/routes/branch-login.tsx` — mirror `partner-login.tsx` (password → OTP flow, resend, error banner for 401/403/429).
- `src/hooks/useBranch.ts` — `useBranchAuth()` + `useBranchMe()` (React Query).

### 2. Branch dashboard (new section `/branch/*`)
Layout at `src/routes/branch.tsx` (guard + sidebar), with children:
- `branch.index.tsx` — profile summary + parent partner header ("تابع لـ...").
- `branch.info.tsx` — edit basic info (gated by `canEditInfo`).
- `branch.hours.tsx` — working hours (gated by `canManageHours`), reuses `BranchHoursEditor`.
- `branch.password.tsx` — change password.
- `branch.offers.index.tsx` / `branch.offers.$id.tsx` — offers CRUD (gated by `canManageOffers`), same fields as partner offers **minus `commissionPctOverride`**.
- `branch.bookings.index.tsx` / `branch.bookings.$id.tsx` — bookings list + detail + status/notes/date/time update + redeem (gated by `canManageBookings`), **no commission columns**.

Sidebar links render only when the matching `canManage*` flag is `true`.

New API module: `src/lib/api/branch.ts` covering `/branch/me`, `/branch/profile`, `/branch/hours`, `/branch/change-password`, `/branch/offers*`, `/branch/bookings*`, `/branch/bookings/{id}/redeem`.

### 3. Admin + Partner "add/edit branch" form updates
Extend the branch form (used in `admin.branches.tsx` and the partner branches screen) with:
- Toggle `isIndependent`.
- When on: 4 checkboxes (`canManageOffers`, `canManageHours`, `canEditInfo`, `canManageBookings`) + `email` + `password` fields.
- Include these keys in POST/PUT payloads for `/admin/branches` and `/partner/branches`.
- Show `tempPassword` (if returned) once in a "copy this password" dialog.
- Table badges: "مستقل" / "تابع للمركز فقط" + small permission icons.
- New row action "إدارة بيانات الدخول" → calls `PUT /{admin|partner}/branches/{id}/credentials`.

Update `src/lib/api/adminBranches.ts` and `src/lib/api/partner.ts` (partner-branches section) with new fields + `updateCredentials`.

### 4. Booking note (`bookingNote` / `partnerNote` / `partner_note`)
- Admin partner edit (`admin.merchants.tsx` / `admin.partner.tsx`) and partner profile screen: add textarea "ملحوظة تظهر للعميل عند الحجز" bound to `bookingNote`.
- `src/routes/offers.$offerId.tsx`: if `offer.bookingNote` or `offer.partner.bookingNote` is non-empty, render an info banner under the vendor name ("ملحوظة من المركز: …").
- `src/routes/checkout.success.tsx` / `bookings.confirmation.tsx`: render `partnerNote` per item.
- `src/routes/booking.$bookingId.tsx`: if `partner_note` present, render it.

### 5. Guards / routing
- New `BranchGuard` component analogous to `PartnerGuard` — checks `branch_token` and role `branch`; redirects to `/branch-login`.
- Ensure partner and branch auth contexts don't share state (separate storage keys, separate hook).

## Not touched
- Commission logic and any partner endpoints not in the doc.
- Request shapes of existing endpoints beyond the additive fields listed.

## Size / risk
~15 new route files + ~3 new API modules + edits to ~6 existing files. I'll execute in the order above (auth → dashboard shell → offers/bookings → admin form → booking note UI) and verify build after each phase.

Approve to proceed, or tell me which phases to drop / defer.
