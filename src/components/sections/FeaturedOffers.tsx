import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useOffers } from "@/hooks/useCatalog";
import { OfferCard } from "./OfferCard";

export function FeaturedOffers() {
  const { offers: featured, isLoading } = useOffers({ pageSize: 12 });
  return (
    <section className="bg-muted/30 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">
              الأكثر خصماً
            </span>
            <h2 className="mt-1 text-2xl font-extrabold text-foreground sm:text-3xl">
              عروض مختارة لك 🔥
            </h2>
          </div>
          <Link to="/offers" className="hidden items-center gap-1 text-sm font-bold text-primary hover:underline sm:inline-flex">
            عرض الكل <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            لا توجد عروض متاحة حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
