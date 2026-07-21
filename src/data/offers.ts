// Catalog TYPES used across the UI.
//
// The actual catalog data (categories + offers) comes from the backend
// via React Query hooks in `src/hooks/useCatalog.ts`. This file is now
// pure types + a tiny decoration fallback used by the normalizer.
//
// IMPORTANT: Do NOT add new mock data here. Components should use the
// hooks from `useCatalog` to read real data.

import heroCarwash from "@/assets/hero-carwash.webp";

export type CategorySlug =
  | "medical-centers"
  | "women-salons"
  | "cupping"
  | "fitness"
  | "labs"
  | "spa"
  | "car-wash"
  | (string & {});

export type Category = {
  slug: CategorySlug;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
  cover: string;
};

export type Vendor = {
  id: string;
  name: string;
  city: string;
  address: string;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  commissionPct?: number;
  depositPct?: number;
  // Optional extras used by some pages
  mapsUrl?: string;
  phone?: string;
  whatsapp?: string;
  workingHoursAr?: string;
  logo?: string | null;
  cover?: string | null;
  [k: string]: any;
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  image: string;
  priceBefore: number;
  priceAfter: number;
  discountPercent: number;
  durationMinutes: number;
  category: CategorySlug;
  vendor: Vendor;
  overview?: string[];
  overviewEn?: string[];
  terms?: string[];
  termsEn?: string[];
  featured?: boolean;
  featuredRank?: number | null;
  [k: string]: any;
};

// Empty defaults — kept ONLY so any unmigrated import compiles. Real data
// is fetched via `useCatalog` / `useOffers` hooks. Do not add entries here.
export const categories: Category[] = [];
export const offers: Offer[] = [];

// Legacy sync helpers retained as no-ops for compatibility. Prefer the
// equivalent hooks (useCategory, useOffer, useOffersByCategory, useFeaturedOffers).
export function getCategory(_slug: string): Category | undefined { return undefined; }
export function getOffersByCategory(_slug: string): Offer[] { return []; }
export function getOffer(_id: string): Offer | undefined { return undefined; }
export function getFeaturedOffers(_limit = 6): Offer[] { return []; }

// Re-export the default cover so it stays referenced (keeps Vite chunking happy).
export const __defaultCover = heroCarwash;
