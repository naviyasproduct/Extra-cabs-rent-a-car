import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * The staff platform at /panel must never be indexed. It is disallowed here as
 * a courtesy to well-behaved crawlers, and blocked properly by authentication
 * in the application itself. robots.txt is a request, not a lock.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/panel", "/panel/", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
