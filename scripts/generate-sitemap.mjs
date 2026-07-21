#!/usr/bin/env node
/**
 * Build-time sitemap generator.
 *
 * The project is deployed as an SPA (tanstackStart.spa.enabled), so the
 * dynamic TanStack server route at /sitemap.xml is only served in dev.
 * To make the sitemap available to crawlers in production, we generate a
 * static public/sitemap.xml at build time from the public API.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.SITE_BASE_URL || "https://koswmat.com";
const API_BASE = process.env.PUBLIC_API_BASE || "https://koswmat.com/api";

const STATIC_PATHS = [
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
  { path: "/forgot-password", changefreq: "yearly", priority: "0.3" },
  { path: "/reset-password", changefreq: "yearly", priority: "0.3" },
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch (e) {
    console.warn(`[sitemap] fetch failed: ${url}`, e?.message || e);
    return null;
  }
}

function extractRows(json) {
  const d = json?.data ?? json;
  if (Array.isArray(d)) return d;
  return d?.items || d?.data || [];
}

async function fetchOffers() {
  const json = await fetchJson(`${API_BASE}/offers?limit=500`);
  return extractRows(json);
}

async function fetchCategories() {
  const json = await fetchJson(`${API_BASE}/categories`);
  return extractRows(json);
}

async function main() {
  const entries = [...STATIC_PATHS];

  const [offers, categories] = await Promise.all([fetchOffers(), fetchCategories()]);

  for (const offer of offers) {
    const id = offer?.id ?? offer?.slug;
    if (id) {
      entries.push({ path: `/offers/${id}`, changefreq: "weekly", priority: "0.7" });
    }
  }

  for (const category of categories) {
    const slug = category?.slug ?? category?.id;
    if (slug) {
      entries.push({ path: `/offers/category/${slug}`, changefreq: "weekly", priority: "0.6" });
    }
  }

  const urls = entries.map((e) => {
    const loc = `${BASE_URL.replace(/\/$/, "")}${e.path}`;
    return [
      "  <url>",
      `    <loc>${escapeXml(loc)}</loc>`,
      e.lastmod ? `    <lastmod>${escapeXml(e.lastmod)}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${escapeXml(e.changefreq)}</changefreq>` : null,
      e.priority ? `    <priority>${escapeXml(e.priority)}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n");
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");

  const outPath = resolve(__dirname, "../public/sitemap.xml");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, xml, "utf-8");

  console.log(`[sitemap] generated ${outPath} with ${entries.length} URLs (${offers.length} offers, ${categories.length} categories)`);
}

main().catch((e) => {
  console.error("[sitemap] generation failed:", e);
  process.exit(1);
});
