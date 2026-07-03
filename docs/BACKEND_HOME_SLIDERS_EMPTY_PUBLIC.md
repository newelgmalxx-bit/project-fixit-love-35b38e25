# Home Offer Sliders — empty on public `/home-data`

## Symptom
- `GET /api/home-data` returns `homeSlider1: []` and `homeSlider2: []`
  even when the admin panel shows saved entries in both sliders.
- Users who are logged out see no sliders on the homepage.
- Admin sees them because `/admin/home-offer-sliders` returns raw
  entries with no status / validity filters.

## Root cause
In `public.php` → `fetchHomeSliderOffers()` (around line 145), the query is:

```sql
FROM home_offer_sliders hs
JOIN offers o
    ON o.id = hs.offer_id
   AND o.status = 'active'
   AND (o.valid_from IS NULL OR o.valid_from <= ?)
   AND (o.valid_to   IS NULL OR o.valid_to   >= ?)
LEFT JOIN partners p
    ON p.id = o.partner_id
   AND p.status = 'active'
WHERE hs.slider_key = ?
  AND hs.is_active  = 1
```

Any entry whose offer is not `status='active'` or is outside its
`valid_from` / `valid_to` window is silently dropped. Admin saves the
slider entry successfully but the public endpoint filters it out.

## Fix options (pick one)
1. **Preferred**: keep the filters, but in the admin UI block adding
   inactive / expired offers to a slider and warn if an existing offer
   becomes inactive.
2. Relax the query to include inactive/expired offers and let the
   frontend hide them (not recommended — leaks bad data).
3. Add a debug endpoint `GET /admin/home-offer-sliders/diagnose` that
   returns for each entry: `offer.status`, `valid_from`, `valid_to`,
   `partner.status`, and a boolean `visible_public`.

## Also missing
- `GET /home-offer-sliders` (public) currently returns 404. The
  frontend already falls back to `/home-data`, so this is optional —
  but if you expose it, mirror the same filters as
  `fetchHomeSliderOffers`.
