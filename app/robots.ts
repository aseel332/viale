import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private / transactional areas out of the index.
      disallow: ["/account", "/cart", "/checkout", "/admin", "/auth/", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
