// Lightweight cross-tab feed for QR verification events.
// Uses localStorage + custom events so partner & admin dashboards
// can react in real-time (toast + beep + live list).

const STORAGE_KEY = "verifyFeed";
const EVENT_NAME = "verifyFeed:push";
const MAX_ITEMS = 100;

export type VerifyEvent = {
  id: string;                 // unique event id
  bookingId: string;          // BK-XXXXXX
  verifyCode: string;
  customerName: string;
  customerPhone: string;
  offerId?: string;
  offerTitle?: string;
  bookingDate: string;        // YYYY-MM-DD
  bookingTime: string;        // HH:MM
  redeemedAt: string;         // ISO timestamp of QR scan / verification
  source: "qr" | "manual";
};

export function loadFeed(): VerifyEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VerifyEvent[]) : [];
  } catch {
    return [];
  }
}

function saveFeed(list: VerifyEvent[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS))); } catch {}
}

export function pushVerifyEvent(ev: Omit<VerifyEvent, "id">): VerifyEvent {
  const full: VerifyEvent = { ...ev, id: `vf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` };
  const list = [full, ...loadFeed()];
  saveFeed(list);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<VerifyEvent>(EVENT_NAME, { detail: full }));
  }
  return full;
}

export function subscribeVerifyFeed(handler: (ev: VerifyEvent) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onCustom = (e: Event) => handler((e as CustomEvent<VerifyEvent>).detail);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      const list = JSON.parse(e.newValue) as VerifyEvent[];
      if (list[0]) handler(list[0]);
    } catch {}
  };
  window.addEventListener(EVENT_NAME, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

// Soft success chime using WebAudio (no asset needed).
export function playSuccessChime() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [
      { f: 880, t: 0 },
      { f: 1175, t: 0.12 },
      { f: 1568, t: 0.24 },
    ].forEach(({ f, t }) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now + t);
      g.gain.exponentialRampToValueAtTime(0.18, now + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.22);
      o.connect(g).connect(ctx.destination);
      o.start(now + t);
      o.stop(now + t + 0.25);
    });
    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch {}
}
