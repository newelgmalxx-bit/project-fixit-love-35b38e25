# Backend gaps — Partner categories + City in admin bookings/merchants

## 1) `POST /api/admin/partners` and `PUT /api/admin/partners/:id`

The admin "إضافة مركز / تعديل مركز" form now sends:

- `categoryIds: number[]` — selected category IDs from `categories` table.

Backend must:
- Accept `categoryIds` (also `category_ids`) in body of both create and update.
- Persist them in the partner↔category join table (replace-all on update).
- Validate every id exists in `categories`; reject unknown ids with 400.
- Return the partner with both `categoryIds: number[]` and
  `categories: [{ id, slug, nameAr, nameEn }]` so the frontend can render
  category names directly without an extra round-trip.

## 2) `GET /api/admin/partners` (list)

Include for every row so the merchants list can render city + maps link + category names:

- `city` (already present in some rows; ensure always populated)
- `mapsUrl` (or `maps_url`)
- `categoryIds: number[]` AND/OR `categories: [{ id, nameAr }]`

## 3) `GET /api/admin/bookings` and `GET /api/admin/bookings/:id`

The booking details dialog shows the **center's city** and a maps link.
Currently `city` and `mapsUrl` are missing on the booking payload, so the
frontend falls back to fetching `/admin/partners/:partnerId`.

Preferred (one round-trip): join the partner on read and return:

```json
{
  "id": "...",
  "partnerId": "...",
  "partnerName": "...",
  "partnerCity": "...",
  "partnerMapsUrl": "https://maps.app.goo.gl/..."
}
```

(or simply set `city` and `mapsUrl` on the booking object.)

## 4) Categories master data

Categories were inserted directly in DB. Ensure:
- `GET /api/admin/categories` returns active + inactive (with `isActive` flag).
- New categories created via `POST /api/admin/categories` are immediately
  selectable in the partner add/edit form (already wired on frontend).
