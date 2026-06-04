import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { publicApi } from "@/lib/api/public";
import { reviews as reviewsApi } from "@/lib/api/services";

export type ServiceReview = {
  id: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  comment: string;
  createdAt: string;
  serviceTitle: string | null;
  serviceSlug: string | null;
};


type Options = { serviceSlug?: string | null; limit?: number; auto?: boolean };

export function useServiceReviews(opts?: string | null | Options) {
  const options: Options =
    typeof opts === "string" || opts === null || opts === undefined
      ? { serviceSlug: opts ?? undefined }
      : opts;
  const { serviceSlug, limit, auto = true } = options;
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [average, setAverage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r: any = await publicApi.getReviews(serviceSlug || undefined);
      const d: any = r?.data ?? r ?? {};
      const items: any[] = Array.isArray(d) ? d : (d.items || []);
      const mapped: ServiceReview[] = items.map((it) => ({
        id: String(it.id ?? `rv_${Math.random().toString(36).slice(2)}`),
        userName: it.userName || it.user_name || it.name || "مستخدم",
        userAvatar: it.userAvatar || it.user_avatar || null,
        rating: Number(it.rating ?? 0),
        comment: it.comment || it.text || "",
        createdAt: it.createdAt || it.created_at || new Date().toISOString(),
        serviceTitle: it.serviceTitle || it.service_title || null,
        serviceSlug: it.serviceSlug || it.service_slug || null,
      }));
      const list = limit ? mapped.slice(0, limit) : mapped;
      setReviews(list);
      setAverage(Number(d.average ?? (list.length ? list.reduce((a, r) => a + r.rating, 0) / list.length : 0)) || 0);
      setTotal(Number(d.total ?? mapped.length));
    } catch {
      setReviews([]);
      setAverage(0);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [serviceSlug, limit]);

  useEffect(() => {
    if (auto) refresh();
  }, [refresh, auto]);

  const summary = {
    average: average || (reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0),
    count: total || reviews.length,
  };

  const addReview = useCallback(
    async (rating: number, comment: string) => {
      if (!isAuthenticated || !serviceSlug) return false;
      setSubmitting(true);
      try {
        await reviewsApi.create({ serviceSlug }, { rating, comment });
        await refresh();
        return true;
      } catch {
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [isAuthenticated, serviceSlug, refresh],
  );

  return { reviews, summary, average, total, addReview, loading, submitting, refresh };
}
