// React Query hooks for the public catalog (categories, offers, partners).
// These are the canonical accessors — never read from `src/data/offers.ts`
// arrays directly in new code.

import { useQuery, useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { publicApi } from "@/lib/api/public";
import {
  normalizeCategory,
  normalizeOffer,
  type ApiCategory,
  type ApiOffer,
  type ApiPartner,
} from "@/lib/api/catalog";
import type { Category, Offer } from "@/data/offers";

/* ─────────────── Categories ─────────────── */
export function useCategoriesQuery(enabled = true) {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const raw = await publicApi.getCategories();
      const items: ApiCategory[] = (raw as any)?.data?.items
        ?? (raw as any)?.items
        ?? [];
      return items;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories(enabled = true): {
  categories: Category[];
  apiCategories: ApiCategory[];
  categoryIdToSlug: Map<string, string>;
  isLoading: boolean;
} {
  const { data, isLoading } = useCategoriesQuery(enabled);
  const apiCategories = data ?? [];
  const categories = useMemo(() => apiCategories.map(normalizeCategory), [apiCategories]);
  const categoryIdToSlug = useMemo(() => {
    const m = new Map<string, string>();
    apiCategories.forEach((c) => m.set(c.id, c.slug));
    return m;
  }, [apiCategories]);
  return { categories, apiCategories, categoryIdToSlug, isLoading };
}

export function useCategory(slug: string | undefined): Category | undefined {
  const { categories } = useCategories();
  return useMemo(() => categories.find((c) => c.slug === slug), [categories, slug]);
}

/* ─────────────── Offers ─────────────── */
export function useOffers(params?: { page?: number; pageSize?: number }) {
  const { categoryIdToSlug, isLoading: catsLoading } = useCategories();
  const query = useQuery({
    queryKey: ["offers", params?.page ?? 1, params?.pageSize ?? 100],
    queryFn: () => publicApi.getOffers({ page: params?.page, pageSize: params?.pageSize ?? 100 }),
    staleTime: 60 * 1000,
  });
  const offers = useMemo<Offer[]>(() => {
    const raw: ApiOffer[] = (query.data as any)?.items ?? [];
    return raw.map((o) => normalizeOffer(o, categoryIdToSlug));
  }, [query.data, categoryIdToSlug]);
  return {
    offers,
    total: (query.data as any)?.total ?? offers.length,
    isLoading: query.isLoading || catsLoading,
    error: query.error,
  };
}

export function useFeaturedOffers(limit = 8) {
  const { categoryIdToSlug, isLoading: catsLoading } = useCategories();
  const query = useQuery({
    queryKey: ["offers", "featured", limit],
    queryFn: () => publicApi.getFeaturedOffers({ limit }),
    staleTime: 60 * 1000,
  });
  const offers = useMemo<Offer[]>(() => {
    const raw = (query.data ?? []) as ApiOffer[];
    // Backend may not honor ?featured=1 — enforce client-side filter.
    const onlyFeatured = raw.filter((o: any) =>
      Boolean(o?.isFeatured ?? o?.is_featured ?? o?.is_n ?? o?.featured)
    );
    const mapped = onlyFeatured.map((o) => normalizeOffer(o, categoryIdToSlug));
    return mapped
      .sort((a, b) => (a.featuredRank ?? 9999) - (b.featuredRank ?? 9999))
      .slice(0, limit);
  }, [query.data, categoryIdToSlug, limit]);
  return { offers, isLoading: query.isLoading || catsLoading };
}

export function useOffersByCategory(slug: string | undefined) {
  const { offers, isLoading } = useOffers({ pageSize: 100 });
  const filtered = useMemo(
    () => (slug ? offers.filter((o) => o.category === slug) : offers),
    [offers, slug],
  );
  return { offers: filtered, isLoading };
}

export function useOffer(offerId: string | undefined) {
  const { categoryIdToSlug, isLoading: catsLoading } = useCategories();
  const query = useQuery({
    queryKey: ["offer", offerId],
    queryFn: () => publicApi.getOffer(offerId!),
    enabled: !!offerId,
    staleTime: 60 * 1000,
  });

  const partnerId = (query.data as any)?.partnerId as string | undefined;
  const partnerQuery = useQuery({
    queryKey: ["partner", partnerId],
    queryFn: () => publicApi.getPartner(partnerId!),
    enabled: !!partnerId,
    staleTime: 5 * 60 * 1000,
  });

  const offer = useMemo<Offer | null>(() => {
    if (!query.data) return null;
    return normalizeOffer(query.data as ApiOffer, categoryIdToSlug, partnerQuery.data as ApiPartner | undefined);
  }, [query.data, categoryIdToSlug, partnerQuery.data]);

  return {
    offer,
    isLoading: query.isLoading || catsLoading,
    error: query.error,
  };
}

/* ─────────────── Partner ─────────────── */
export function usePartner(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["partner", partnerId],
    queryFn: () => publicApi.getPartner(partnerId!),
    enabled: !!partnerId,
    staleTime: 5 * 60 * 1000,
  });
}

/* ─────────────── Multiple offers (e.g. related) ─────────────── */
export function useOffersByIds(ids: string[]) {
  const { categoryIdToSlug } = useCategories();
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["offer", id],
      queryFn: () => publicApi.getOffer(id),
      staleTime: 60 * 1000,
    })),
  });
  const offers = results
    .map((r) => (r.data ? normalizeOffer(r.data as ApiOffer, categoryIdToSlug) : null))
    .filter(Boolean) as Offer[];
  return { offers, isLoading: results.some((r) => r.isLoading) };
}
