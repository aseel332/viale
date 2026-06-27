import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";
import { getStorefrontCollections, getStorefrontProducts } from "@/lib/catalog";

// The sitemap reads the live catalogue (cookie-backed Supabase client), so it
// renders per request. The underlying catalogue reads are Redis-cached, and
// both fall back to the static catalogue if the DB is unreachable — so the
// sitemap is always populated.

// Product images may be stored as a site-relative path ("/top_1.png") or an
// absolute Supabase Storage URL — normalise to an absolute URL either way.
function toAbsoluteImage(src: string): string {
  return /^https?:\/\//i.test(src) ? src : absoluteUrl(src);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Public, indexable static routes. Account, cart, checkout, admin, auth and
  // API routes are intentionally excluded — they are private/transactional and
  // are also disallowed in robots.ts.
  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/men"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/women"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/search"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/collections"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/shipping-policy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/refund-policy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Dynamic catalogue routes — every live product + active collection page.
  const [products, collections] = await Promise.all([
    getStorefrontProducts(),
    getStorefrontCollections(),
  ]);

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/products/${product.id}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
    images: product.imageSrc ? [toAbsoluteImage(product.imageSrc)] : undefined,
  }));

  const collectionEntries: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: absoluteUrl(`/collections/${collection.id}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...productEntries, ...collectionEntries];
}
