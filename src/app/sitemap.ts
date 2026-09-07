import type { MetadataRoute } from "next";
import { publicCarSlugs } from "@/lib/fleet";
import { getServices } from "@/lib/data/services";
import { absoluteUrl } from "@/lib/seo";

/**
 * Every indexable URL on the site, generated from the same data the pages
 * render from. Add a vehicle to the fleet and it appears here automatically.
 *
 * Priorities are relative, not absolute: the fleet and booking routes are where
 * rentals actually start, so they rank above the legal pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/fleet", priority: 0.9, changeFrequency: "daily" },
    { path: "/booking", priority: 0.9, changeFrequency: "monthly" },
    { path: "/services", priority: 0.8, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/about", priority: 0.6, changeFrequency: "yearly" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
    { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  ];

  const services = await getServices();

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...(await publicCarSlugs()).map((slug) => ({
      url: absoluteUrl(`/fleet/${slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...services.map((service) => ({
      url: absoluteUrl(`/services/${service.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
