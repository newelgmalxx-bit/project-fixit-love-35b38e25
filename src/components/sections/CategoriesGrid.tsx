import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useCategories } from "@/hooks/useCatalog";
import { renderCategoryIcon } from "@/lib/categoryIcon";

export function CategoriesGrid() {
  const { categories, apiCategories, isLoading } = useCategories();

  return (
    <section id="categories" className="relative scroll-mt-24 overflow-hidden bg-background py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-[#E0254D]/10 blur-[120px]" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="h-3 w-3" /> تصفح حسب التصنيف
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            اختر التصنيف{" "}
            <span className="bg-gradient-to-r from-[#3F2A6B] to-[#E0254D] bg-clip-text text-transparent">
              اللي يناسبك
            </span>
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            لا توجد تصنيفات حالياً.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 lg:grid lg:grid-cols-12 lg:overflow-visible lg:pb-0">
            {categories.map((c, idx) => {
              const count = apiCategories.find((a) => a.slug === c.slug)?.offersCount ?? 0;
              const isFeatured = idx < 3;
              const colSpan = isFeatured
                ? idx === 0 ? "lg:col-span-5" : idx === 1 ? "lg:col-span-4" : "lg:col-span-3"
                : "lg:col-span-3";
              return (
                <Link
                  key={c.slug}
                  to="/offers/category/$slug"
                  params={{ slug: c.slug }}
                  className={`group relative flex h-56 min-w-[85vw] snap-start flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/20 lg:min-w-0 ${colSpan} ${isFeatured ? "lg:h-64 lg:p-6" : "lg:h-48 lg:p-4"}`}
                >
                  <img src={c.cover} alt={c.nameAr} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div className={`flex items-center justify-center overflow-hidden rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/30 ${isFeatured ? "h-12 w-12 text-2xl" : "h-11 w-11 text-xl"}`}>
                      {renderCategoryIcon(c.icon)}
                    </div>
                    <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold text-foreground shadow-md">
                      {count} عرض
                    </span>
                  </div>
                  <div className="relative z-10 text-white">
                    <h3 className={`font-extrabold leading-tight drop-shadow ${isFeatured ? "text-lg lg:text-xl" : "text-base"}`}>
                      {c.nameAr}
                    </h3>
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur transition group-hover:bg-white group-hover:text-foreground">
                      {isFeatured ? "تصفح العروض" : "تصفح"}
                      <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
