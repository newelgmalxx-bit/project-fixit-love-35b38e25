export type PartnerOrderItem = {
  title: string;
  plan: string | null;
  qty: number;
  price: number;
};

export type PartnerOrder = {
  id: string | number;
  reference?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  total: number;
  currency?: string | null;
  status: "new" | "in_progress" | "completed" | "cancelled" | string;
  notes?: string | null;
  items: PartnerOrderItem[];
  created_at: string;
  updated_at?: string | null;
};

export type PartnerOrdersResponse = {
  data: PartnerOrder[];
  total?: number;
  page?: number;
};

export type PartnerPingResponse = {
  ok: boolean;
  message?: string;
  version?: string;
};