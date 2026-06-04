import { toast } from "sonner";

/**
 * Shows a richer "added to cart" toast with quick actions:
 *  - Continue shopping (dismiss)
 *  - Go to cart
 *
 * Navigation uses a hard location change to avoid coupling to the router.
 */
export function notifyAddedToCart(opts: {
  title: string;
  lang?: "ar" | "en";
  cartHref?: string;
}) {
  const lang = opts.lang ?? "ar";
  const cartHref = opts.cartHref ?? "/cart";
  const isAr = lang === "ar";

  toast.success(isAr ? "تمت الإضافة للسلة ✓" : "Added to cart ✓", {
    description: opts.title,
    duration: 4500,
    action: {
      label: isAr ? "الذهاب للسلة" : "Go to cart",
      onClick: () => {
        if (typeof window !== "undefined") window.location.assign(cartHref);
      },
    },
    cancel: {
      label: isAr ? "إكمال التسوّق" : "Continue shopping",
      onClick: () => {},
    },
  });
}
