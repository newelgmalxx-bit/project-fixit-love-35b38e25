// Deduped fetcher for sponsored ads + their linked offers + partners.
// All 9 hero slides + the SponsoredAdsBanner share these queries via
// react-query keys (`['sponsored-ads']`, `['offer', id]`, `['partner', id]`)
// — so the whole bundle is at most 1 + N(ads) + N(partners) requests,
// and when useHomeData has already seeded the caches it's zero extra calls.
import { useQuery, useQueries } from "@tanstack/react-query";
import { publicApi } from "@/lib/api/public";

export type SponsoredAdShape = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  cta_label: string | null;
  slide_index: number | null;
  offer_id: string | null;
};

function mapAd(a: any): SponsoredAdShape {
  return {
    id: a.id,
    title: a.titleAr || a.titleEn || a.title || "",
    subtitle: a.subtitle ?? null,
    image_url: a.image || a.imageUrl || null,
    link_url: a.linkUrl || null,
    cta_label: a.ctaLabel ?? null,
    slide_index: a.slideIndex ?? null,
    offer_id: a.offerId ?? a.offer_id ?? null,
  };
}

export function useSponsoredAds(): SponsoredAdShape[] {
  const { data } = useQuery({
    queryKey: ["sponsored-ads"],
    queryFn: () => publicApi.getSponsoredAds(),
    staleTime: 30_000,
  });
  if (!data) return [];
  return (data as any[]).map(mapAd);
}

export function useSponsoredAdsBundle() {
  const ads = useSponsoredAds();
  const offerIds = Array.from(new Set(ads.map((a) => a.offer_id).filter(Boolean))) as string[];

  const offerQueries = useQueries({
    queries: offerIds.map((id) => ({
      queryKey: ["offer", id],
      queryFn: () => publicApi.getOffer(id),
      staleTime: 60_000,
    })),
  });

  const offers: Record<string, any> = {};
  offerIds.forEach((id, i) => {
    const o = offerQueries[i]?.data;
    if (o) offers[id] = o;
  });

  const partnerIds = Array.from(
    new Set(Object.values(offers).map((o: any) => o?.partnerId).filter(Boolean))
  ) as string[];

  const partnerQueries = useQueries({
    queries: partnerIds.map((id) => ({
      queryKey: ["partner", id],
      queryFn: () => publicApi.getPartner(id),
      staleTime: 5 * 60_000,
    })),
  });

  const partners: Record<string, any> = {};
  partnerIds.forEach((id, i) => {
    const p = partnerQueries[i]?.data;
    if (p) partners[id] = p;
  });

  return { ads, offers, partners };
}
