import { Link } from "@tanstack/react-router";
import { ArrowLeft, Heart, Star, ShoppingCart, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/i18n/LanguageProvider";
import { products } from "@/data/products";
import type { Product } from "@/data/products";
import { useCart } from "@/hooks/useCart";
import { notifyAddedToCart } from "@/lib/cartToast";

function discount(p: Product) {
  if (!p.oldPrice || p.oldPrice <= p.price) return null;
  return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
}

export function ProductsSection() {
  const { dir, lang } = useLang();
  const { add } = useCart();
  const [favs, setFavs] = useState<Record<string, boolean>>({});
  const toggleFav = (id: string) => setFavs((s) => ({ ...s, [id]: !s[id] }));

  const handleAdd = async (p: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await add({
      serviceSlug: `product:${p.id}`,
      serviceTitle: p.title,
      planId: "default",
      planName: p.brand || "منتج",
      price: p.price,
      qty: 1,
      vendorName: p.brand || undefined,
    });
    notifyAddedToCart({ title: p.title, lang });
  };

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-secondary/30 via-background to-background py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(0,174,198,0.08),transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> منتجات مختارة
            </span>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
              منتجات الجمال والعناية والصحة
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              تشكيلة مختارة بعناية من أرقى المنتجات لتكمّل تجربتك من الصالون إلى المنزل.
            </p>
          </div>
          <Link
            to={"/offers" as any}
            className="group inline-flex h-11 items-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-bold text-foreground transition hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-md"
          >
            عرض الكل
            <ArrowLeft className={`h-4 w-4 transition-transform group-hover:-translate-x-1 ${dir === "ltr" ? "rotate-180" : ""}`} />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => {
            const pct = discount(p);
            return (
              <article
                key={p.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_50px_-18px_rgba(0,174,198,0.35)]"
              >
                <Link
                  to="/product/$id"
                  params={{ id: p.id }}
                  className="relative aspect-square overflow-hidden bg-secondary/40"
                  aria-label={p.title}
                >
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1.5">
                      {pct && (
                        <span className="rounded-full bg-[#E0254D] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-md">
                          -{pct}%
                        </span>
                      )}
                      {p.badge && (
                        <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold text-foreground shadow-sm backdrop-blur">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFav(p.id);
                      }}
                      aria-label="favorite"
                      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur transition hover:scale-110 ${
                        favs[p.id] ? "text-[#E0254D]" : "text-muted-foreground"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${favs[p.id] ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate font-semibold">{p.brand}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-amber-700">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="font-bold">{p.rating}</span>
                      <span className="text-[10px] text-amber-700/70">({p.reviews})</span>
                    </span>
                  </div>

                  <Link
                    to="/product/$id"
                    params={{ id: p.id }}
                    className="mt-2 line-clamp-2 min-h-[44px] text-sm font-extrabold leading-snug text-foreground transition hover:text-primary"
                  >
                    {p.title}
                  </Link>
                  <div className="mt-1 text-xs text-muted-foreground">{p.category}</div>

                  <div className="mt-3 flex items-end justify-between border-t border-border/60 pt-3">
                    <div className="flex flex-col">
                      {p.oldPrice && (
                        <span className="text-xs text-muted-foreground line-through" dir="ltr">
                          {p.oldPrice} ر.س
                        </span>
                      )}
                      <span className="text-lg font-extrabold text-primary" dir="ltr">
                        {p.price} <span className="text-xs font-bold">ر.س</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleAdd(p, e)}
                      aria-label="أضف للسلة"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-extrabold text-primary-foreground transition hover:bg-primary-dark"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      أضف للسلة
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
