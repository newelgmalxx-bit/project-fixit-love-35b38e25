import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://koswmat.com";

const STATIC_PATHS: Array<{ path: string; changefreq?: string; priority?: string }> = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/offers", changefreq: "daily", priority: "0.9" },
  { path: "/categories", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/track", changefreq: "monthly", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/login", changefreq: "yearly", priority: "0.3" },
  { path: "/signup", changefreq: "yearly", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: Array<{ path: string; lastmod?: string; changefreq?: string; priority?: string }> = [...STATIC_PATHS];

        // Try to include published offers and categories from the public API.
        try {
          const apiBase = process.env.PUBLIC_API_BASE || "https://koswmat.com/api";
          const [offersRes, catsRes] = await Promise.allSettled([
            fetch(`${apiBase}/offers?limit=500`, { headers: { Accept: "application/json" } }),
            fetch(`${apiBase}/categories`, { headers: { Accept: "application/json" } }),
          ]);
          if (offersRes.status === "fulfilled" && offersRes.value.ok) {
            const j: any = await offersRes.value.json().catch(() => null);
            const rows: any[] = j?.data?.items || j?.data || j?.items || [];
            for (const r of rows) {
              const id = r?.id ?? r?.slug;
              if (id) entries.push({ path: `/offers/${id}`, changefreq: "weekly", priority: "0.7" });
            }
          }
          if (catsRes.status === "fulfilled" && catsRes.value.ok) {
            const j: any = await catsRes.value.json().catch(() => null);
            const rows: any[] = j?.data?.items || j?.data || j?.items || [];
            for (const r of rows) {
              const slug = r?.slug ?? r?.id;
              if (slug) entries.push({ path: `/offers/category/${slug}`, changefreq: "weekly", priority: "0.6" });
            }
          }
        } catch {
          // best-effort — ignore
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
