import type { MetadataRoute } from "next";

// Public, indexable pages only. Authenticated areas (/dashboard, /admin)
// and API routes are intentionally not listed: they redirect to sign-in
// for anonymous visitors and must never be indexed.
const PUBLIC_ROUTES = [
  "/",
  "/help",
  "/faq",
  "/knowledge-base",
  "/tutorials",
  "/privacy",
  "/terms",
  "/cookies",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PUBLIC_ROUTES.map((route) => ({
    url: `https://escrow.cmigl.org${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
