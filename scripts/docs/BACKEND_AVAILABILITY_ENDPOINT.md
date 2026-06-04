# Availability Endpoints — أضفهم في `public.php`

الفرونت بينادي:

- `GET /offers/{id}/availability?date=YYYY-MM-DD` → يرجّع slots اليوم مع حالة كل slot (متاح/مبلوك) + `dayOff`
- `GET /offers/{id}/availability/range?from=YYYY-MM-DD&to=YYYY-MM-DD` → يرجّع لكل يوم في المدى: `dayOff` / `fullyBooked` (للشريط بتاع الأيام القريبة)

البيانات تطلع من:

- `partners.working_hours` (JSON) — أيام/مواعيد العمل بالعربي
- `partner_schedule_blocked` — `day_off` و `slots` JSON لكل يوم محدد
- `bookings` — المحجوز فعلاً (`status IN ('pending','confirmed')`)
- `offers.duration_minutes` — خطوة الـ slot (افتراضي 30 دقيقة)

## السنيبت — انسخه في `public.php` قبل آخر `notFound()`

```php
// ────────────────────────────────────────────────
// Availability helpers
// ────────────────────────────────────────────────
if (!function_exists('arabicWeekdayName')) {
    function arabicWeekdayName(string $dateYmd): string {
        // 0=Sun ... 6=Sat (PHP)
        $w = (int)date('w', strtotime($dateYmd));
        $map = [
            0 => 'الأحد',
            1 => 'الإثنين',
            2 => 'الثلاثاء',
            3 => 'الأربعاء',
            4 => 'الخميس',
            5 => 'الجمعة',
            6 => 'السبت',
        ];
        return $map[$w] ?? '';
    }
}

if (!function_exists('generateSlotsBetween')) {
    function generateSlotsBetween(string $open, string $close, int $stepMin): array {
        // open/close: "HH:MM"
        $out = [];
        $start = strtotime($open);
        $end   = strtotime($close);
        if (!$start || !$end || $end <= $start || $stepMin < 5) return $out;
        for ($t = $start; $t + $stepMin * 60 <= $end; $t += $stepMin * 60) {
            $out[] = date('H:i', $t);
        }
        return $out;
    }
}

if (!function_exists('resolveOfferForAvailability')) {
    function resolveOfferForAvailability(string $offerId): ?array {
        $st = db()->prepare("SELECT id, partner_id, duration_minutes FROM offers WHERE id = ? LIMIT 1");
        $st->execute([$offerId]);
        $r = $st->fetch();
        return $r ?: null;
    }
}

if (!function_exists('computeDayAvailability')) {
    /**
     * Returns ['slots' => [{time, available}], 'dayOff' => bool, 'fullyBooked' => bool]
     */
    function computeDayAvailability(string $partnerId, string $date, int $durationMin): array {
        // 1) Working hours from partner
        $st = db()->prepare("SELECT working_hours FROM partners WHERE id = ? LIMIT 1");
        $st->execute([$partnerId]);
        $row = $st->fetch();
        $whRaw = $row['working_hours'] ?? null;
        $wh = is_string($whRaw) ? json_decode($whRaw, true) : (is_array($whRaw) ? $whRaw : []);
        $arName = arabicWeekdayName($date);

        $open = null; $close = null; $closed = true;
        if (is_array($wh)) {
            foreach ($wh as $d) {
                if (!is_array($d)) continue;
                if (($d['day'] ?? '') === $arName) {
                    $closed = !empty($d['closed']);
                    $open   = $d['open']  ?? null;
                    $close  = $d['close'] ?? null;
                    break;
                }
            }
        }

        // 2) Manual block override (partner_schedule_blocked)
        $blockedSlots = [];
        $manualDayOff = false;
        $bs = db()->prepare("SELECT day_off, slots FROM partner_schedule_blocked WHERE partner_id = ? AND date = ? LIMIT 1");
        $bs->execute([$partnerId, $date]);
        if ($brow = $bs->fetch()) {
            $manualDayOff = (int)($brow['day_off'] ?? 0) === 1;
            $rawSlots = $brow['slots'] ?? null;
            $arr = is_string($rawSlots) ? json_decode($rawSlots, true) : (is_array($rawSlots) ? $rawSlots : []);
            if (is_array($arr)) $blockedSlots = array_values(array_filter(array_map('strval', $arr)));
        }

        $dayOff = $closed || $manualDayOff || !$open || !$close;

        if ($dayOff) {
            return ['slots' => [], 'dayOff' => true, 'fullyBooked' => false];
        }

        // 3) Already-booked slots for this partner on this date
        $bookedSlots = [];
        $bb = db()->prepare("
            SELECT TIME_FORMAT(STR_TO_DATE(time, '%H:%i'), '%H:%i') AS t
            FROM bookings
            WHERE partner_id = ?
              AND date = ?
              AND status IN ('pending','confirmed')
              AND time IS NOT NULL AND time <> ''
        ");
        $bb->execute([$partnerId, $date]);
        foreach ($bb->fetchAll() as $r) {
            if (!empty($r['t'])) $bookedSlots[] = $r['t'];
        }

        $step = $durationMin > 0 ? $durationMin : 30;
        $all = generateSlotsBetween((string)$open, (string)$close, $step);

        $blockedSet = array_fill_keys(array_merge($blockedSlots, $bookedSlots), true);
        $slots = [];
        $available = 0;
        foreach ($all as $t) {
            $isFree = !isset($blockedSet[$t]);
            if ($isFree) $available++;
            $slots[] = ['time' => $t, 'available' => $isFree];
        }

        return [
            'slots'       => $slots,
            'dayOff'      => false,
            'fullyBooked' => count($all) > 0 && $available === 0,
        ];
    }
}

// ────────────────────────────────────────────────
// GET /offers/{id}/availability?date=YYYY-MM-DD
// ────────────────────────────────────────────────
if ($method === 'GET' && preg_match('#^/offers/([^/]+)/availability$#', $path, $m)) {
    $offer = resolveOfferForAvailability($m[1]);
    if (!$offer) notFound('العرض غير موجود');

    $date = trim((string)($_GET['date'] ?? ''));
    if (!$date || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        success(['slots' => [], 'dayOff' => false]);
        exit;
    }

    $data = computeDayAvailability(
        (string)$offer['partner_id'],
        $date,
        (int)($offer['duration_minutes'] ?? 30)
    );
    success([
        'date'   => $date,
        'slots'  => $data['slots'],
        'dayOff' => $data['dayOff'],
    ]);
    exit;
}

// ────────────────────────────────────────────────
// GET /offers/{id}/availability/range?from=YYYY-MM-DD&to=YYYY-MM-DD
// ────────────────────────────────────────────────
if ($method === 'GET' && preg_match('#^/offers/([^/]+)/availability/range$#', $path, $m)) {
    $offer = resolveOfferForAvailability($m[1]);
    if (!$offer) notFound('العرض غير موجود');

    $from = trim((string)($_GET['from'] ?? ''));
    $to   = trim((string)($_GET['to']   ?? ''));
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
        success(['items' => []]);
        exit;
    }

    $start = strtotime($from);
    $end   = strtotime($to);
    if (!$start || !$end || $end < $start) {
        success(['items' => []]);
        exit;
    }
    // Hard cap 31 days
    $maxEnd = strtotime('+30 days', $start);
    if ($end > $maxEnd) $end = $maxEnd;

    $items = [];
    for ($t = $start; $t <= $end; $t += 86400) {
        $d = date('Y-m-d', $t);
        $r = computeDayAvailability(
            (string)$offer['partner_id'],
            $d,
            (int)($offer['duration_minutes'] ?? 30)
        );
        $items[] = [
            'date'        => $d,
            'dayOff'      => (bool)$r['dayOff'],
            'fullyBooked' => (bool)$r['fullyBooked'],
        ];
    }

    success(['items' => $items]);
    exit;
}

// ────────────────────────────────────────────────
// (اختياري) GET /partners/{id}/availability?date=YYYY-MM-DD
// نفس المنطق لكن بدون مدة عرض محددة — افتراضي 30 دقيقة
// ────────────────────────────────────────────────
if ($method === 'GET' && preg_match('#^/partners/([^/]+)/availability$#', $path, $m)) {
    $pid = $m[1];
    $exists = db()->prepare("SELECT 1 FROM partners WHERE id = ? LIMIT 1");
    $exists->execute([$pid]);
    if (!$exists->fetchColumn()) notFound('المركز غير موجود');

    $date = trim((string)($_GET['date'] ?? ''));
    if (!$date || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        success(['slots' => [], 'dayOff' => false]);
        exit;
    }
    $data = computeDayAvailability($pid, $date, 30);
    success([
        'date'   => $date,
        'slots'  => $data['slots'],
        'dayOff' => $data['dayOff'],
    ]);
    exit;
}
```

## شكل الرد (للفرونت)

```jsonc
// GET /offers/{id}/availability?date=2026-06-02
{
  "success": true,
  "data": {
    "date": "2026-06-02",
    "dayOff": false,
    "slots": [
      { "time": "10:00", "available": true  },
      { "time": "10:30", "available": true  },
      { "time": "11:00", "available": false }, // مبلوك من partner_schedule_blocked
      { "time": "11:30", "available": true  },
      { "time": "13:00", "available": false }, // مبلوك
      // ...
    ]
  }
}
```

```jsonc
// GET /offers/{id}/availability/range?from=2026-06-02&to=2026-06-15
{
  "success": true,
  "data": {
    "items": [
      { "date": "2026-06-02", "dayOff": false, "fullyBooked": false },
      { "date": "2026-06-05", "dayOff": true,  "fullyBooked": false },
      ...
    ]
  }
}
```

## ملاحظات مهمة

1. **أسماء الأيام في `working_hours`** لازم تكون عربية مطابقة: `السبت / الأحد / الإثنين / الثلاثاء / الأربعاء / الخميس / الجمعة`. السنيبت بيستخدم نفس الأسماء.
2. **مدة الـ slot** = `offers.duration_minutes`. لو NULL هياخد 30 دقيقة افتراضي.
3. **الـ booked slots** بنحسبها من جدول `bookings` للـ `partner_id` ذات اليوم بحالة `pending` أو `confirmed`، فأي حد حجز الموعد هيتشطب تلقائي.
4. **الـ manual blocks** من `partner_schedule_blocked` (اللي بتظهر في لوحة الشريك) بتُحترم: لو `day_off=1` اليوم كله إجازة، ولو فيه `slots` بتتشال من المتاح.
5. الفرونت بالفعل بيستدعي الـ endpoints دي وبيشطب الأوقات اللي `available:false`. مفيش تغييرات مطلوبة في الكود — بمجرد ما تلزق السنيبت في `public.php` كل حاجة هتشتغل.
