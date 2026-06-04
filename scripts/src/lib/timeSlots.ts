// Generate time slots based on service duration + manage blocked slots (localStorage)

const DAY_START = 10; // 10:00
const DAY_END = 22; // 22:00

/** Use the exact service duration as the slot interval (min 5 minutes). */
export function getSlotInterval(durationMinutes: number): number {
  const d = Math.floor(durationMinutes || 0);
  return Math.max(5, d);
}

export function generateTimeSlots(durationMinutes: number): string[] {
  const interval = getSlotInterval(durationMinutes);
  const slots: string[] = [];
  const startMin = DAY_START * 60;
  const endMin = DAY_END * 60;
  for (let m = startMin; m + interval <= endMin + 1; m += interval) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return slots;
}

// ===== Blocked slots storage =====
// Keyed by vendorId. Value: { [dateISO]: string[] } (array of blocked "HH:MM")
type BlockedMap = Record<string, string[]>;

const KEY = (vendorId: string) => `blockedSlots:${vendorId}`;

export function getBlockedMap(vendorId: string): BlockedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY(vendorId));
    return raw ? (JSON.parse(raw) as BlockedMap) : {};
  } catch {
    return {};
  }
}

export function setBlockedMap(vendorId: string, map: BlockedMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY(vendorId), JSON.stringify(map));
    window.dispatchEvent(new CustomEvent("blockedSlots:changed", { detail: { vendorId } }));
  } catch {}
}

export function getBlockedSlots(vendorId: string, dateISO: string): string[] {
  const map = getBlockedMap(vendorId);
  return map[dateISO] ?? [];
}

export function isSlotBlocked(vendorId: string, dateISO: string, time: string): boolean {
  return getBlockedSlots(vendorId, dateISO).includes(time);
}

export function toggleSlot(vendorId: string, dateISO: string, time: string) {
  const map = getBlockedMap(vendorId);
  const cur = new Set(map[dateISO] ?? []);
  if (cur.has(time)) cur.delete(time);
  else cur.add(time);
  if (cur.size === 0) delete map[dateISO];
  else map[dateISO] = Array.from(cur).sort();
  setBlockedMap(vendorId, map);
}

// ===== Blocked full days storage =====
const DAY_KEY = (vendorId: string) => `blockedDays:${vendorId}`;

export function getBlockedDays(vendorId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DAY_KEY(vendorId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function setBlockedDays(vendorId: string, days: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DAY_KEY(vendorId), JSON.stringify(days));
    window.dispatchEvent(new CustomEvent("blockedSlots:changed", { detail: { vendorId } }));
  } catch {}
}

export function isDayBlocked(vendorId: string, dateISO: string): boolean {
  return getBlockedDays(vendorId).includes(dateISO);
}

export function toggleDayBlocked(vendorId: string, dateISO: string) {
  const days = new Set(getBlockedDays(vendorId));
  if (days.has(dateISO)) days.delete(dateISO);
  else days.add(dateISO);
  setBlockedDays(vendorId, Array.from(days).sort());
}
