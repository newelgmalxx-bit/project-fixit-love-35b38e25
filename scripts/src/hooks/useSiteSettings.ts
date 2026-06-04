import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api";

export type SiteSettings = {
  name?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  workHours?: string;
  logo?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  snapchat?: string;
  vatPercent?: number;
  currency?: string;
  maintenanceMode?: boolean;
  seo?: { metaTitle?: string; metaDescription?: string; ogImage?: string };
  // Allow any extra keys without typing each one
  [k: string]: any;
};

const KEY = "saba_site_settings_v2";

function read(): SiteSettings {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function normalize(d: any): SiteSettings {
  if (!d || typeof d !== "object") return {};
  const social = d.social ?? {};
  return {
    ...d,
    name: d.name ?? d.nameAr ?? d.name_ar ?? d.nameEn,
    tagline: d.tagline ?? d.taglineAr ?? d.tagline_ar ?? d.taglineEn,
    email: d.email ?? d.contactEmail ?? d.contact_email,
    phone: d.phone ?? d.contactPhone ?? d.contact_phone,
    whatsapp: d.whatsapp ?? social.whatsapp,
    address: d.address ?? d.addressAr ?? d.address_ar,
    workHours: d.workHours ?? d.work_hours,
    facebook: d.facebook ?? social.facebook,
    instagram: d.instagram ?? social.instagram,
    twitter: d.twitter ?? social.twitter ?? social.x,
    linkedin: d.linkedin ?? social.linkedin,
    youtube: d.youtube ?? social.youtube,
    tiktok: d.tiktok ?? social.tiktok,
    snapchat: d.snapchat ?? social.snapchat,
    vatPercent: d.vatPercent ?? (typeof d.vatRate === "number" ? d.vatRate * 100 : undefined),
    currency: d.currency,
    maintenanceMode: d.maintenanceMode ?? d.maintenance,
    seo: d.seo,
  };
}

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(read);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await publicApi.getSiteSettings();
        const d = res?.data ?? res;
        const next = normalize(d);
        if (Object.keys(next).length) {
          setSettings(next);
          if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
        }
      } catch {}
    })();
  }, []);

  return settings;
}

// Helpers to build tel/mailto/wa.me hrefs from raw values
export function telHref(p?: string) {
  if (!p) return undefined;
  return `tel:${String(p).replace(/[^\d+]/g, "")}`;
}
export function waHref(p?: string) {
  if (!p) return undefined;
  return `https://wa.me/${String(p).replace(/[^\d]/g, "")}`;
}
export function mailHref(e?: string) {
  if (!e) return undefined;
  return `mailto:${e}`;
}
