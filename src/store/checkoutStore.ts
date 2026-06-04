import { create } from "zustand";

interface CheckoutStoreItem {
  id?: string;
  serviceSlug: string;
  serviceTitle: string;
  planId?: string | null;
  planName?: string | null;
  price: number;
  qty: number;
}

interface LastOrder {
  orderId: string | null;
  orderNumber: string | null;
  total: number;
  payment: string;
  items: CheckoutStoreItem[];
  info: {
    name: string;
    email: string;
    phone: string;
    city?: string;
    notes?: string;
  };
}

interface CheckoutStore {
  lastOrder: LastOrder | null;
  setLastOrder: (order: LastOrder) => void;
  clear: () => void;
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  lastOrder: null,
  setLastOrder: (order) => set({ lastOrder: order }),
  clear: () => set({ lastOrder: null }),
}));
