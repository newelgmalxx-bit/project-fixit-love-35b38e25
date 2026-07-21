import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Star, Loader2, MessageSquareQuote, Trash2, Search, Check, X, Filter, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminLayout, PanelCard, Pill } from "@/components/admin/AdminLayout";
import { useLang } from "@/i18n/LanguageProvider";
import { adminReviewsApi } from "@/lib/api/adminReviews";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews | Admin" }] }),
  component: AdminReviewsPage,
});

type ReviewStatus = "pending" | "published" | "rejected";

type Review = {
  id: string;
  serviceTitle: string;
  serviceSlug: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
};

const statusTone: Record<ReviewStatus, { tone: "amber" | "emerald" | "rose"; ar: string; en: string }> = {
  pending: { tone: "amber", ar: "قيد المراجعة", en: "Pending" },
  published: { tone: "emerald", ar: "منشور", en: "Published" },
  rejected: { tone: "rose", ar: "مرفوض", en: "Rejected" },
};

function normalize(r: any): Review {
  const rawStatus = String(r?.status ?? "pending").toLowerCase();
  const status: ReviewStatus =
    rawStatus === "approved" ? "published" : (["pending", "published", "rejected"].includes(rawStatus) ? rawStatus : "pending") as ReviewStatus;
  return {
    id: String(r.id ?? r._id ?? ""),
    serviceTitle: r.serviceTitle || r.service_title || r.service?.title || "—",
    serviceSlug: r.serviceSlug || r.service_slug || r.service?.slug || "",
    userName: r.userName || r.user_name || r.user?.name || "—",
    userEmail: r.userEmail || r.user_email || r.user?.email || "",
    rating: Number(r.rating ?? 0),
    comment: r.comment || r.text || "",
    status,
    createdAt: r.created_at || r.createdAt || "",
  };
}

const TABS: { value: "" | ReviewStatus; ar: string; en: string }[] = [
  { value: "", ar: "الكل", en: "All" },
  { value: "pending", ar: "قيد المراجعة", en: "Pending" },
  { value: "published", ar: "منشور", en: "Published" },
  { value: "rejected", ar: "مرفوض", en: "Rejected" },
];

function AdminReviewsPage() {
  const { lang, dir } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ReviewStatus>("");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [confirmDelete, setConfirmDelete] = useState<Review | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (statusFilter) params.status = statusFilter;
      const res = await adminReviewsApi.list(params);
      const arr = (res.items || []).map(normalize);
      setReviews(arr);
      setTotal(Number(res.total ?? arr.length));
      setPages(Number(res.totalPages ?? 1));
    } catch (e: any) {
      setReviews([]);
      setTotal(0);
      setPages(1);
      toast.error(e?.message || L("تعذّر تحميل التقييمات", "Failed to load reviews"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [statusFilter]);

  const filtered = useMemo(
    () =>
      reviews.filter((r) => {
        if (ratingFilter && Math.round(r.rating) !== Number(ratingFilter)) return false;
        if (!q.trim()) return true;
        const term = q.toLowerCase();
        return (
          r.userName.toLowerCase().includes(term) ||
          r.userEmail.toLowerCase().includes(term) ||
          r.serviceTitle.toLowerCase().includes(term) ||
          r.comment.toLowerCase().includes(term)
        );
      }),
    [reviews, q, ratingFilter],
  );

  const stats = useMemo(() => {
    const all = reviews.length;
    const avg = all ? reviews.reduce((s, r) => s + r.rating, 0) / all : 0;
    const pending = reviews.filter((r) => r.status === "pending").length;
    const published = reviews.filter((r) => r.status === "published").length;
    return { all, avg, pending, published };
  }, [reviews]);

  const runAction = async (
    review: Review,
    action: "approve" | "reject" | "delete",
  ) => {
    setBusyId(review.id);
    try {
      let res: any;
      if (action === "approve") res = await adminReviewsApi.approve(review.id);
      else if (action === "reject") res = await adminReviewsApi.reject(review.id);
      else res = await adminReviewsApi.remove(review.id);

      const msg = res?.message || res?.data?.message;
      if (action === "delete") {
        setReviews((arr) => arr.filter((r) => r.id !== review.id));
        toast.success(msg || L("تم حذف التقييم", "Review deleted"));
      } else {
        const newStatus: ReviewStatus = action === "approve" ? "published" : "rejected";
        setReviews((arr) => arr.map((r) => (r.id === review.id ? { ...r, status: newStatus } : r)));
        toast.success(
          msg || (action === "approve" ? L("تم نشر التقييم", "Review published") : L("تم رفض التقييم", "Review rejected")),
        );
      }
      // Refresh in background to stay in sync
      load();
    } catch (e: any) {
      toast.error(e?.message || L("تعذّر تنفيذ العملية", "Action failed"));
    } finally {
      setBusyId(null);
    }
  };

  const onDeleteClick = (r: Review) => setConfirmDelete(r);
  const confirmDeleteNow = async () => {
    if (!confirmDelete) return;
    const r = confirmDelete;
    setConfirmDelete(null);
    await runAction(r, "delete");
  };

  return (
    <AdminLayout
      title={L("آراء العملاء", "Customer reviews")}
      subtitle={L("مراجعة وإدارة تقييمات الخدمات", "Review and manage service ratings")}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
        <StatCard label={L("الإجمالي بالصفحة", "On this page")} value={stats.all} />
        <StatCard
          label={L("متوسط التقييم", "Average")}
          value={stats.avg.toFixed(1)}
          icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
        />
        <StatCard label={L("قيد المراجعة", "Pending")} value={stats.pending} tone="amber" />
        <StatCard label={L("منشور", "Published")} value={stats.published} tone="emerald" />
      </div>

      <PanelCard>
        {/* Tabs */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-border">
          {TABS.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value || "all"}
                onClick={() => setStatusFilter(tab.value)}
                className={`relative -mb-px px-4 py-2 text-xs font-bold transition ${
                  active
                    ? "border-b-2 border-primary text-primary"
                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {L(tab.ar, tab.en)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={L("ابحث بالعميل أو الإيميل أو الخدمة أو نص التقييم...", "Search by client, email, service or comment...")}
              className="w-full rounded-lg border border-border bg-background ltr:pl-9 rtl:pr-9 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">{L("كل التقييمات", "All ratings")}</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={String(n)}>
                  {n} ★
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-secondary/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <MessageSquareQuote className="mx-auto h-10 w-10 mb-2" />
            <div className="font-bold text-foreground">{L("لا توجد تقييمات", "No reviews")}</div>
            <div className="text-xs mt-1">
              {statusFilter
                ? L("لا توجد تقييمات بهذه الحالة", "No reviews with this status")
                : L("لم يقم العملاء بكتابة تقييمات بعد", "Customers haven't submitted reviews yet")}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const s = statusTone[r.status];
              const busy = busyId === r.id;
              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {(r.userName || "?").trim().charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{r.userName}</div>
                          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                            {r.userEmail && (
                              <span className="inline-flex items-center gap-1" data-ltr-number>
                                <Mail className="h-3 w-3" /> {r.userEmail}
                              </span>
                            )}
                            <span className="truncate">· {r.serviceTitle}</span>
                            {r.createdAt && (
                              <span data-ltr-number>
                                · {new Date(r.createdAt).toLocaleDateString(dir === "rtl" ? "ar-EG" : "en-US")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ms-auto flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.round(r.rating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground/70"
                                }`}
                              />
                            ))}
                            <span className="ms-1 text-xs font-bold" data-ltr-number>
                              {r.rating.toFixed(1)}
                            </span>
                          </div>
                          <Pill tone={s.tone}>{L(s.ar, s.en)}</Pill>
                        </div>
                      </div>
                      {r.comment && (
                        <p className="mt-3 text-sm leading-7 text-foreground/80 whitespace-pre-line">
                          {r.comment}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    {r.status !== "published" && (
                      <button
                        disabled={busy}
                        onClick={() => runAction(r, "approve")}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        {L("اعتماد", "Approve")}
                      </button>
                    )}
                    {r.status !== "rejected" && (
                      <button
                        disabled={busy}
                        onClick={() => runAction(r, "reject")}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                        {L("رفض", "Reject")}
                      </button>
                    )}
                    {r.status !== "pending" && (
                      <button
                        disabled={busy}
                        onClick={() => onDeleteClick(r)}
                        className="ms-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-bold text-rose-600 hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> {L("حذف", "Delete")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
            <div className="text-xs text-muted-foreground" data-ltr-number>
              {L(`صفحة ${page} من ${pages} · ${total} تقييم`, `Page ${page} of ${pages} · ${total} reviews`)}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-bold disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5 rtl:hidden" />
                <ChevronLeft className="h-3.5 w-3.5 ltr:hidden" />
                {L("السابق", "Prev")}
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-bold disabled:opacity-40"
              >
                {L("التالي", "Next")}
                <ChevronLeft className="h-3.5 w-3.5 rtl:hidden" />
                <ChevronRight className="h-3.5 w-3.5 ltr:hidden" />
              </button>
            </div>
          </div>
        )}
      </PanelCard>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-base font-extrabold text-foreground">
                  {L("حذف التقييم؟", "Delete review?")}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {L(
                    `سيتم حذف تقييم ${confirmDelete.userName} نهائياً ولا يمكن التراجع.`,
                    `${confirmDelete.userName}'s review will be permanently deleted.`,
                  )}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-xs font-bold text-foreground hover:bg-secondary"
              >
                {L("إلغاء", "Cancel")}
              </button>
              <button
                onClick={confirmDeleteNow}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" /> {L("حذف", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  tone?: "amber" | "emerald";
  icon?: React.ReactNode;
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-600"
      : tone === "emerald"
        ? "text-emerald-600"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className={`mt-1 flex items-center gap-1.5 text-2xl font-extrabold ${toneClass}`} data-ltr-number>
        {icon}
        {value}
      </div>
    </div>
  );
}
