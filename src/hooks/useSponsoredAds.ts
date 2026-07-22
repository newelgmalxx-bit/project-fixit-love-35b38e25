// Deduped fetcher for sponsored ads + their linked offers + partners.
//
// Backend now embeds a fully-enriched `offer` (with vendor/partner mini
// fields) inside each ad. We prefer that inline data and only fall back
// to per-id fetches for ads that came without it (older payloads, or
// standalone `/sponsored-ads` responses).
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
  offer: any | null;
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
    offer: a.offer ?? null,
  };
}

export function useSponsoredAds(options: { fetch?: boolean } = {}): SponsoredAdShape[] {
  const { fetch = true } = options;
  const { data } = useQuery({
    queryKey: ["sponsored-ads"],
    queryFn: () => publicApi.getSponsoredAds(),
    enabled: fetch,
    staleTime: 30_000,
  });
  if (!data) return [];
  return (data as any[]).map(mapAd);
}

export function useSponsoredAdsBundle(options: { fetch?: boolean } = {}) {
  const { fetch = true } = options;
  const ads = useSponsoredAds({ fetch });

  // Seed offers/partners from inline `ad.offer` when the backend enriched it.
  const inlineOffers: Record<string, any> = {};
  const inlinePartners: Record<string, any> = {};
  for (const a of ads) {
    if (a.offer && (a.offer.id || a.offer_id)) {
      const oid = String(a.offer.id ?? a.offer_id);
      inlineOffers[oid] = a.offer;
      const pid = a.offer.partnerId ?? a.offer.partner_id;
      if (pid) {
        inlinePartners[String(pid)] = a.offer.partner ?? {
          id: String(pid),
          nameAr: a.offer.partnerNameAr,
          nameEn: a.offer.partnerNameEn,
          city: a.offer.partnerCity,
          address: a.offer.partnerAddress,
          logo: a.offer.partnerLogo,
          vendorName: a.offer.vendorName,
          rating: a.offer.rating,
          reviewsCount: a.offer.reviewsCount,
        };
      }
    }
  }

  // Only fetch offers we DIDN'T get inline.
  const missingOfferIds = Array.from(
    new Set(
      ads
        .map((a) => a.offer_id)
        .filter((id): id is string => !!id && !inlineOffers[id]),
    ),
  );

  const offerQueries = useQueries({
    queries: missingOfferIds.map((id) => ({
      queryKey: ["offer", id],
      queryFn: () => publicApi.getOffer(id),
      enabled: fetch,
      staleTime: 60_000,
    })),
  });

  const offers: Record<string, any> = { ...inlineOffers };
  missingOfferIds.forEach((id, i) => {
    const o = offerQueries[i]?.data;
    if (o) offers[id] = o;
  });

  const missingPartnerIds = Array.from(
    new Set(
      Object.values(offers)
        .map((o: any) => o?.partnerId ?? o?.partner_id)
        .filter((id: any): id is string => !!id && !inlinePartners[String(id)])
        .map(String),
    ),
  );

  const partnerQueries = useQueries({
    queries: missingPartnerIds.map((id) => ({
      queryKey: ["partner", id],
      queryFn: () => publicApi.getPartner(id),
      enabled: fetch,
      staleTime: 5 * 60_000,
    })),
  });

  const partners: Record<string, any> = { ...inlinePartners };
  missingPartnerIds.forEach((id, i) => {
    const p = partnerQueries[i]?.data;
    if (p) partners[id] = p;
  });

  return { ads, offers, partners };
}
