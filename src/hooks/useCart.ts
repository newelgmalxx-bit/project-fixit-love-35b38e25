import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import type { CartLine } from "@/lib/api";

export type CartItem = {
  id: string;
  serviceSlug: string;
  serviceTitle: string;
  planId: string;
  planName: string;
  price: number;
  qty: number;
  vendorName?: string;
  // ----- Offer booking fields (set only for offer-from-cart bookings) -----
  offerId?: string;
  partnerId?: string | null;
  bookingDate?: string; // YYYY-MM-DD
  bookingTime?: string; // HH:MM
  commissionPct?: number; // platform commission % = online deposit %
  // ----- Branch fields -----
  branchId?: string | null;
  branchName?: string | null;
};

const STORAGE_KEY = "saba_cart_v1";
// Prices on the platform are quoted VAT-inclusive — do not add VAT on top.
const VAT_RATE = 0;
export const MAX_QTY_PER_ITEM = 5;

/** True when the cart item represents a center booking (offer + date/time). */
export function isOfferBooking(it: Pick<CartItem, "offerId" | "bookingDate">): boolean {
  return Boolean(it.offerId && it.bookingDate);
}

function normalizeFromApi(line: any): CartItem {
  // Backend now returns offer lines: { id, offerId, slug, title, price, qty, originalPrice, offer }
  // Map them onto the existing CartItem shape used across the UI.
  const offerId = line.offerId ?? line.offer_id ?? line.serviceId ?? line.service_id;
  const slug = offerId ? `offer:${offerId}` : (line.serviceSlug ?? line.service_slug ?? line.slug ?? "");
  return {
    id: String(line.id),
    serviceSlug: slug,
    serviceTitle: line.title ?? line.serviceTitle ?? line.service_title ?? "",
    planId: "default",
    planName: line.planName ?? line.plan_name ?? "",
    price: Number(line.price) || 0,
    qty: Math.min(MAX_QTY_PER_ITEM, Number(line.qty) || 1),
    vendorName: line.vendorName ?? line.vendor_name ?? line.offer?.vendorName ?? undefined,
    offerId: offerId ?? undefined,
    branchId: line.branchId ?? line.branch_id ?? line.branch?.id ?? null,
    branchName: line.branchName ?? line.branch_name ?? line.branch?.nameAr ?? line.branch?.name_ar ?? null,
  };
}

type State = {
  items: CartItem[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  loading: boolean;
  error: string | null;
};

function computeTotals(
  items: CartItem[],
): Pick<State, "subtotal" | "discount" | "vat" | "total"> {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = 0;
  const taxable = Math.max(0, subtotal - discount);
  const vat = +(taxable * VAT_RATE).toFixed(2);
  const total = +(taxable + vat).toFixed(2);
  return { subtotal, discount, vat, total };
}

function loadLocal(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveLocal(items: CartItem[]) {
  // Persist ONLY offer-booking items locally. Regular cart lines live on the
  // backend; bookings carry offerId/bookingDate/bookingTime metadata that the
  // backend cart API does not understand, so they must survive client-side.
  if (typeof window === "undefined") return;
  try {
    const bookings = items.filter((i) => isOfferBooking(i));
    if (bookings.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch { /* ignore */ }
}

const initialItems: CartItem[] = [];
let cache: State = {
  items: initialItems,
  ...computeTotals(initialItems),
  loading: false,
  error: null,
};
const listeners = new Set<(s: State) => void>();
function setCache(next: State) {
  cache = next;
  saveLocal(next.items);
  listeners.forEach((fn) => fn(next));
}

let didInitialSync = false;
async function trySyncFromApi(initial = false): Promise<void> {
  if (initial) setCache({ ...cache, loading: true, error: null });
  // Keep any locally-held booking items — backend API doesn't store them.
  const localBookings = cache.items.filter((i) => isOfferBooking(i));
  try {
    const res = await api.cart.get();
    const remoteItems = (res.items || []).map(normalizeFromApi);
    const merged = [...remoteItems, ...localBookings];
    setCache({
      items: merged,
      ...computeTotals(merged),
      loading: false,
      error: null,
    });
  } catch (err: any) {
    setCache({
      ...cache,
      loading: false,
      error: initial ? (err?.message || "Couldn't load cart") : cache.error,
    });
  }
}

export function useCart() {
  // Start with empty state to match SSR; hydrate from localStorage after mount.
  const [state, setState] = useState<State>({ items: [], subtotal: 0, discount: 0, vat: 0, total: 0, loading: false, error: null });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    // Hydrate any saved booking items from localStorage on first mount.
    if (cache.items.length === 0) {
      const saved = loadLocal().filter((i) => isOfferBooking(i));
      if (saved.length > 0) {
        cache = { ...cache, items: saved, ...computeTotals(saved) };
      }
    }
    setState(cache);
    const fn = (s: State) => mounted.current && setState(s);
    listeners.add(fn);
    if (!didInitialSync) {
      didInitialSync = true;
      trySyncFromApi(true);
    }
    return () => { mounted.current = false; listeners.delete(fn); };
  }, []);

  const add = useCallback(
    async (item: {
      serviceSlug: string;
      serviceTitle?: string;
      planId?: string;
      planName?: string;
      price?: number;
      qty?: number;
      vendorName?: string;
      offerId?: string;
      partnerId?: string | null;
      bookingDate?: string;
      bookingTime?: string;
      commissionPct?: number;
      branchId?: string | null;
      branchName?: string | null;
    }) => {
      const qty = item.qty ?? 1;
      const planId = item.planId || "default";
      // Offer bookings with a date/time are NEVER merged: a customer adding the
      // same offer for a different time must get a separate line. Only merge
      // when no booking metadata is set on EITHER side.
      // Different branches for the same offer also always split into separate lines.
      const isBooking = Boolean(item.offerId && item.bookingDate);
      const existingIdx = isBooking
        ? cache.items.findIndex(
            (i) =>
              i.offerId === item.offerId &&
              i.bookingDate === item.bookingDate &&
              i.bookingTime === item.bookingTime &&
              (i.branchId ?? null) === (item.branchId ?? null),
          )
        : cache.items.findIndex(
            (i) =>
              !i.offerId &&
              i.serviceSlug === item.serviceSlug &&
              i.planId === planId &&
              (i.branchId ?? null) === (item.branchId ?? null),
          );
      let nextItems: CartItem[];
      let cappedHit = false;
      if (existingIdx >= 0) {
        nextItems = cache.items.map((i, idx) => {
          if (idx !== existingIdx) return i;
          const wanted = i.qty + qty;
          if (wanted > MAX_QTY_PER_ITEM) cappedHit = true;
          return { ...i, qty: Math.min(MAX_QTY_PER_ITEM, wanted) };
        });
      } else {
        const finalQty = Math.min(MAX_QTY_PER_ITEM, qty);
        if (finalQty < qty) cappedHit = true;
        nextItems = [
          ...cache.items,
          {
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            serviceSlug: item.serviceSlug,
            serviceTitle: item.serviceTitle || item.serviceSlug,
            planId,
            planName: item.planName || "أساسي",
            price: Number(item.price) || 0,
            qty: finalQty,
            vendorName: item.vendorName,
            offerId: item.offerId,
            partnerId: item.partnerId ?? null,
            bookingDate: item.bookingDate,
            bookingTime: item.bookingTime,
            commissionPct: item.commissionPct,
            branchId: item.branchId ?? null,
            branchName: item.branchName ?? null,
          },
        ];
      }
      setCache({ ...cache, items: nextItems, ...computeTotals(nextItems), error: null });
      // Offer-booking items are kept client-side only — the backend cart API
      // doesn't know about offerId/bookingDate, so syncing would strip metadata
      // and break dedup. Persisted via localStorage in saveLocal.
      if (isBooking) {
        return { cappedHit };
      }
      // Backend is offers-only — only sync lines that map to a real offer id.
      // Plans/products/legacy slugs stay local until the backend supports them.
      const offerId = item.offerId
        ?? (item.serviceSlug.startsWith("offer:") ? item.serviceSlug.slice(6) : undefined);
      if (offerId) {
        try {
          await api.cart.addItem({
            offerId,
            qty: Math.min(MAX_QTY_PER_ITEM, qty),
            branchId: item.branchId ?? undefined,
          });
          await trySyncFromApi();
        } catch { /* keep local fallback */ }
      }
      return { cappedHit };
    },
    [],
  );


  const remove = useCallback(async (lineId: string) => {
    const nextItems = cache.items.filter((i) => i.id !== lineId);
    setCache({ ...cache, items: nextItems, ...computeTotals(nextItems) });
    if (!lineId.startsWith("local-")) {
      try { await api.cart.removeItem(lineId); await trySyncFromApi(); } catch {}
    }
  }, []);

  const updateQty = useCallback(async (lineId: string, qty: number) => {
    if (qty < 1) return remove(lineId);
    const capped = Math.min(MAX_QTY_PER_ITEM, qty);
    const nextItems = cache.items.map((i) => i.id === lineId ? { ...i, qty: capped } : i);
    setCache({ ...cache, items: nextItems, ...computeTotals(nextItems) });
    if (!lineId.startsWith("local-")) {
      try { await api.cart.updateItem(lineId, capped); await trySyncFromApi(); } catch {}
    }
  }, [remove]);

  const updateBranch = useCallback(async (lineId: string, branchId: string, branchName?: string | null) => {
    const nextItems = cache.items.map((i) =>
      i.id === lineId ? { ...i, branchId, branchName: branchName ?? i.branchName ?? null } : i,
    );
    setCache({ ...cache, items: nextItems, ...computeTotals(nextItems) });
    if (!lineId.startsWith("local-")) {
      try {
        const line = cache.items.find((i) => i.id === lineId);
        await api.cart.updateItemBranch(lineId, branchId, line?.qty);
        await trySyncFromApi();
      } catch { /* keep local update */ }
    }
  }, []);

  const clear = useCallback(async () => {
    const ids = cache.items.map((i) => i.id);
    setCache({ items: [], subtotal: 0, discount: 0, vat: 0, total: 0, loading: false, error: null });
    for (const id of ids) {
      api.cart.removeItem(id).catch(() => {});
    }
  }, []);

  const refresh = useCallback(() => trySyncFromApi(), []);

  const count = state.items.reduce((s, i) => s + i.qty, 0);

  return {
    items: state.items,
    subtotal: state.subtotal,
    discount: state.discount,
    vat: state.vat,
    total: state.total,
    loading: state.loading,
    error: state.error,
    count,
    add,
    remove,
    updateQty,
    updateBranch,
    clear,
    refresh,
  };
}
