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
      // /999p7k is the staff sign-in. Keeping it out of search results is
      // tidiness, not security: the protection is Supabase Auth plus the
      // active staff row checked on every request. The page also carries
      // noindex metadata, which is the instruction a crawler actually obeys.
      disallow: ["/panel", "/panel/", "/999p7k", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
