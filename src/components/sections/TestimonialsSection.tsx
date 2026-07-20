import { useEffect, useRef, useState } from "react";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useServiceReviews } from "@/hooks/useServiceReviews";
import { useLang } from "@/i18n/LanguageProvider";

export function TestimonialsSection() {
  const { reviews, loading } = useServiceReviews({ limit: 12 });
  const { t, dir } = useLang();
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const avg =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length
      : 0;

  const scrollByDir = (delta: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-slide]");
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: delta * step * (dir === "rtl" ? -1 : 1), behavior: "smooth" });
  };

  // Update pagination indicator
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      const card = el.querySelector<HTMLElement>("[data-slide]");
      const step = card ? card.offsetWidth + 24 : el.clientWidth;
      const total = Math.max(1, Math.ceil(el.scrollWidth / Math.max(step, 1)) - Math.floor(el.clientWidth / Math.max(step, 1)) + 1);
      setPageCount(total);
      const current = Math.round(Math.abs(el.scrollLeft) / Math.max(step, 1));
      setPage(Math.min(current, total - 1));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reviews.length]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-secondary/40 to-background py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="text-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {t("testimonialsSection.kicker")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("testimonialsSection.title")}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {reviews.length > 0 && (
              <div className="flex items-center gap-3 rounded-full border border-border bg-white px-4 py-2 shadow-sm">
                <div className="flex items-center gap-0.5 text-primary">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.round(avg) ? "fill-primary text-primary" : "text-primary/20"}`}
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-extrabold text-foreground">{avg.toFixed(1)}</span>
                  <span className="text-muted-foreground"> / 5 · {reviews.length}</span>
                </div>
              </div>
            )}
            {reviews.length > 1 && (
              <div className="hidden items-center gap-2 sm:flex">
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={() => scrollByDir(-1)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                >
                  {dir === "rtl" ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() => scrollByDir(1)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_24px_-10px_rgba(63,42,107,0.55)] transition hover:-translate-y-0.5 hover:bg-primary-dark"
                >
                  {dir === "rtl" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-3xl border border-border bg-white/60" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="mt-14 rounded-3xl border border-dashed border-border bg-white/40 p-12 text-center text-sm text-muted-foreground">
            {t("testimonialsSection.empty")}
          </div>
        ) : (
          <>
            <div
              ref={trackRef}
              className="mt-12 -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {reviews.map((r) => (
                <article
                  key={r.id}
                  data-slide
                  className="group relative flex w-[88%] min-w-[88%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-border bg-white p-7 text-start shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:w-[46%] sm:min-w-[46%] lg:w-[31%] lg:min-w-[31%]"
                >
                  <span aria-hidden className="absolute end-4 top-2 select-none font-serif text-[110px] leading-none text-primary/10">
                    &ldquo;
                  </span>

                  <div className="flex items-center gap-0.5 text-primary">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(r.rating) ? "fill-primary text-primary" : "text-primary/15"}`}
                      />
                    ))}
                  </div>

                  <Quote className="mt-5 h-5 w-5 text-primary/60" />
                  <p className="mt-3 flex-1 text-sm leading-7 text-foreground/85 sm:text-[15px] sm:leading-8">
                    {r.comment || "—"}
                  </p>

                  {r.serviceTitle && (
                    <div className="mt-5 inline-flex w-fit rounded-full bg-primary/8 px-3 py-1 text-xs font-bold text-primary">
                      {r.serviceTitle}
                    </div>
                  )}

                  <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
                    {r.userAvatar ? (
                      <img src={r.userAvatar} alt={r.userName} loading="lazy" decoding="async" width={40} height={40} className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/15" />
                    ) : (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#E0254D] text-sm font-bold text-white">
                        {r.userName.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <div className="text-sm font-extrabold text-foreground">{r.userName}</div>
                      <div className="text-xs text-muted-foreground">Verified client</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Dots */}
            {pageCount > 1 && (
              <div className="mt-2 flex items-center justify-center gap-1.5">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === page ? "w-6 bg-primary" : "w-1.5 bg-primary/25"}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
