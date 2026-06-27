// ── Canonical site URL ───────────────────────────────────────────────────────
// Single source of truth for the public base URL, used by SEO metadata, the
// sitemap and robots. Works automatically on Vercel; override with
// NEXT_PUBLIC_SITE_URL once a custom domain is connected.

function resolveSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");

  // Strip any trailing slash so callers can safely append paths.
  return raw.replace(/\/+$/, "");
}

export const SITE_URL = resolveSiteUrl();

/** Build an absolute URL for a site-relative path (e.g. "/products/foo"). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
