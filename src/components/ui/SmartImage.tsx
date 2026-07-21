import { forwardRef, ImgHTMLAttributes, useMemo } from "react";

/**
 * SmartImage — responsive, WebP-optimized image via wsrv.nl CDN proxy.
 *
 * Behavior:
 * - For absolute http(s) URLs: rewrites through https://wsrv.nl/?url=... with
 *   automatic WebP (`output=webp`), quality, width, and DPR-aware srcSet.
 * - For local / relative / data / blob URLs: passes through unchanged
 *   (bundled assets are already optimized by Vite).
 * - Sets sensible perf defaults: loading="lazy", decoding="async".
 *   Override `priority` for LCP images.
 */

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "loading"> & {
  src: string;
  alt: string;
  /** Rendered width in CSS px used to generate srcSet. Default 800. */
  widths?: number[];
  /** Sizes attribute; defaults to "100vw". */
  sizes?: string;
  /** LCP hint — disables lazy + adds fetchpriority=high. */
  priority?: boolean;
  /** WebP quality 1–100. Default 78. */
  quality?: number;
  /** Force loading strategy. */
  loading?: "lazy" | "eager";
};

const DEFAULT_WIDTHS = [320, 480, 640, 800, 1024, 1280, 1600];

function isRemote(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

function proxied(src: string, w: number, q: number): string {
  const u = new URL("https://wsrv.nl/");
  u.searchParams.set("url", src.replace(/^https?:\/\//i, ""));
  u.searchParams.set("w", String(w));
  u.searchParams.set("output", "webp");
  u.searchParams.set("q", String(q));
  u.searchParams.set("we", ""); // without-enlargement
  u.searchParams.set("il", ""); // interlace/progressive
  return u.toString();
}

export const SmartImage = forwardRef<HTMLImageElement, Props>(function SmartImage(
  {
    src,
    alt,
    widths = DEFAULT_WIDTHS,
    sizes = "100vw",
    priority = false,
    quality = 78,
    loading,
    width,
    height,
    ...rest
  },
  ref,
) {
  const { finalSrc, srcSet } = useMemo(() => {
    if (!src || !isRemote(src)) {
      return { finalSrc: src, srcSet: undefined as string | undefined };
    }
    const set = widths.map((w) => `${proxied(src, w, quality)} ${w}w`).join(", ");
    const fallbackW = widths[Math.floor(widths.length / 2)] ?? 800;
    return { finalSrc: proxied(src, fallbackW, quality), srcSet: set };
  }, [src, widths, quality]);

  return (
    <img
      ref={ref}
      src={finalSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={loading ?? (priority ? "eager" : "lazy")}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      width={width}
      height={height}
      {...rest}
    />
  );
});
