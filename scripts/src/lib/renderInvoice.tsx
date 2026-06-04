import { createRoot } from "react-dom/client";
import { InvoiceDocument, type InvoiceData, type InvoiceCompany } from "@/components/invoice/InvoiceDocument";
import { downloadElementAsPdf, elementToPdfBlob } from "./invoice";
import { publicApi } from "@/lib/api";

const SETTINGS_KEY = "saba_invoice_settings_v1";

function readCachedSettings(): any {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function fetchSettings(): Promise<any> {
  try {
    const res: any = await publicApi.getSiteSettings();
    const d = res?.data ?? res;
    if (d && typeof d === "object") {
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(d)); } catch {}
      return d;
    }
  } catch {}
  return readCachedSettings();
}

async function withCompany(data: InvoiceData): Promise<InvoiceData> {
  if (data.company && (data.invoiceLogo || data.logo || data.company.logo)) return data;
  const s = await fetchSettings();
  const company: InvoiceCompany = (s?.company && typeof s.company === "object" ? s.company : {}) as InvoiceCompany;
  return {
    ...data,
    logo: data.logo ?? s?.logo ?? company.logo,
    invoiceLogo: data.invoiceLogo ?? s?.invoiceLogo ?? company.invoiceLogo,
    company: { ...company, ...(data.company || {}) },
  };
}

async function withInvoiceNode<T>(data: InvoiceData, fn: (node: HTMLElement) => Promise<T>): Promise<T | undefined> {
  const merged = await withCompany(data);
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.top = "-10000px";
  host.style.left = "-10000px";
  host.style.zIndex = "-1";
  document.body.appendChild(host);

  const root = createRoot(host);
  await new Promise<void>((resolve) => {
    root.render(<InvoiceDocument data={merged} />);
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  try { await (document as any).fonts?.ready; } catch {}
  // Wait briefly for the logo image to load before snapshot
  await new Promise((r) => setTimeout(r, 250));

  const node = host.firstElementChild as HTMLElement | null;
  if (!node) { root.unmount(); host.remove(); return; }

  try {
    return await fn(node);
  } finally {
    root.unmount();
    host.remove();
  }
}

export async function renderInvoiceToPdf(data: InvoiceData) {
  await withInvoiceNode(data, (node) => downloadElementAsPdf(node, `invoice-${data.number}.pdf`));
}

export async function renderInvoiceToPdfBlob(data: InvoiceData): Promise<Blob | undefined> {
  return withInvoiceNode(data, (node) => elementToPdfBlob(node));
}
