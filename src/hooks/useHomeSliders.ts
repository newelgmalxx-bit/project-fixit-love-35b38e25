// Fetches the two home-page offer sliders (slider_1, slider_2) as a
// standalone request, because the batched /home-data endpoint on the
// backend does not (yet) include them. Tries the public route first,
// then falls back to the admin route (works when an admin session is
// active — useful for previewing while the public route is deployed).
import { useQuery } from "@tanstack/react-query";
import { request, ApiError } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/types";

type SlidersResponse = {
  slider_1: any[];
  slider_2: any[];
};

async function fetchSliders(path: string): Promise<SlidersResponse | null> {
  try {
    const r = await request<ApiResponse<any>>(path);
    const d: any = (r as any)?.data ?? r;
    const sliders = d?.sliders ?? d ?? {};
    return {
      slider_1: Array.isArray(sliders.slider_1) ? sliders.slider_1 : [],
      slider_2: Array.isArray(sliders.slider_2) ? sliders.slider_2 : [],
    };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 405 || e.status === 401 || e.status === 403)) {
      return null;
    }
    throw e;
  }
}

function sortEntries(items: any[]): any[] {
  return [...items]
    .filter((x) => x?.isActive !== false && x?.is_active !== 0 && x?.is_active !== "0")
    .sort((a, b) => Number(a?.sortOrder ?? a?.sort_order ?? 0) - Number(b?.sortOrder ?? b?.sort_order ?? 0));
}

/** Flatten backend row → shape our HomeOfferSlider component understands.
 * Handles two shapes: (1) legacy — offer nested under `row.offer`; (2) new
 * public endpoint — all offer fields flat on the row alongside partner*. */
function flatten(items: any[]): any[] {
  return items.map((row) => {
    const nested = row?.offer ?? null;
    const src = nested ?? row; // when not nested, the row itself IS the offer
    return {
      ...src,
      id: row?.offerId ?? row?.offer_id ?? src?.id ?? row?.id,
      partnerNameAr: src?.partnerNameAr ?? row?.partnerNameAr,
      partnerNameEn: src?.partnerNameEn ?? row?.partnerNameEn,
      partnerCity: src?.partnerCity ?? row?.partnerCity,
      partnerAddress: src?.partnerAddress ?? row?.partnerAddress,
      partnerLogo: src?.partnerLogo ?? row?.partnerLogo,
      partnerId: src?.partnerId ?? row?.partnerId ?? row?.partner_id,
    };
  });
}

export function useHomeSliders() {
  return useQuery({
    queryKey: ["home-offer-sliders"],
    queryFn: async () => {
      // Public-only: never fall back to /admin (would 401 for guests).
      const raw = await fetchSliders("/home-offer-sliders");
      if (!raw) return { slider_1: [], slider_2: [] };
      return {
        slider_1: flatten(sortEntries(raw.slider_1)),
        slider_2: flatten(sortEntries(raw.slider_2)),
      };
    },
    staleTime: 30_000,
  });
}
