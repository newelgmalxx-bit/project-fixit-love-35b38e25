// Shared SEO helpers — strong, consistent metadata across all pages.

export const SITE = {
  name: "خصومات",
  nameEn: "koswmat",
  url: "https://koswmat.com",
  logo: "https://koswmat.com/logo.png",
  ogImage: "https://koswmat.com/logo.png",
  twitter: "@koswmat",
  locale: "ar_SA",
  phone: "+966501234567",
  email: "info@koswmat.com",
  region: "SA",
  city: "Riyadh",
};

type MetaTag = Record<string, string>;

export type SeoInput = {
  title: string;
  description: string;
  path?: string;        // e.g. "/about"
  keywords?: string;
  image?: string;       // absolute or path
  type?: "website" | "article" | "product";
  noindex?: boolean;
};

function abs(url: string | undefined) {
  if (!url) return SITE.ogImage;
  if (url.startsWith("http")) return url;
  return SITE.url.replace(/\/$/, "") + (url.startsWith("/") ? url : "/" + url);
}

export function buildSeo(input: SeoInput) {
  const url = SITE.url.replace(/\/$/, "") + (input.path || "/");
  const image = abs(input.image);
  const type = input.type || "website";
  const meta: MetaTag[] = [
    { title: input.title },
    { name: "description", content: input.description },
    { name: "robots", content: input.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
    { name: "language", content: "Arabic" },
    { name: "geo.region", content: SITE.region },
    { name: "geo.placename", content: SITE.city },
    { name: "author", content: SITE.name },
    { httpEquiv: "content-language", content: "ar" },

    // Open Graph
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:type", content: type },
    { property: "og:locale", content: SITE.locale },
    { property: "og:locale:alternate", content: "en_US" },
    { property: "og:site_name", content: SITE.name },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:image:secure_url", content: image },
    { property: "og:image:alt", content: input.title },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },

    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: SITE.twitter },
    { name: "twitter:creator", content: SITE.twitter },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: input.title },
  ];
  if (input.keywords) meta.push({ name: "keywords", content: input.keywords });

  const links = [
    { rel: "canonical", href: url },
    { rel: "alternate", hrefLang: "ar", href: url },
    { rel: "alternate", hrefLang: "x-default", href: url },
  ];

  return { meta, links, url, image };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    alternateName: SITE.nameEn,
    url: SITE.url,
    logo: SITE.logo,
    image: SITE.ogImage,
    email: SITE.email,
    telephone: SITE.phone,
    address: {
      "@type": "PostalAddress",
      addressCountry: "SA",
      addressLocality: "Riyadh",
    },
    sameAs: [
      "https://www.instagram.com/koswmat",
      "https://twitter.com/koswmat",
      "https://www.linkedin.com/company/koswmat",
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    inLanguage: "ar",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.url}/offers?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: SITE.url.replace(/\/$/, "") + it.path,
    })),
  };
}

export function serviceJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  image?: string;
  price?: string | number;
  rating?: { value: number; count: number };
}) {
  const node: any = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    image: abs(opts.image),
    provider: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    areaServed: { "@type": "Country", name: "Saudi Arabia" },
  };
  if (opts.price) {
    node.offers = {
      "@type": "Offer",
      price: String(opts.price).replace(/[^\d.]/g, ""),
      priceCurrency: "SAR",
      availability: "https://schema.org/InStock",
      url: opts.url,
    };
  }
  if (opts.rating) {
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: opts.rating.value,
      reviewCount: opts.rating.count,
    };
  }
  return node;
}
