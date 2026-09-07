import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/common/JsonLd";
import { organisationLd, websiteLd } from "@/lib/seo";
import { getLocations } from "@/lib/data/content";

/**
 * The customer-facing site.
 *
 * Navbar, footer and the sitewide structured data live here rather than in the
 * root layout, so the staff panel at /panel and the sign-in page at /999p7k do
 * not inherit any of it. They are a different product for a different audience.
 *
 * This is a route group, so it adds nothing to any URL: `(site)/fleet` is
 * still /fleet.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locations = await getLocations();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[60] focus:rounded-full focus:bg-brand focus:px-5 focus:py-3 focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
      <JsonLd data={organisationLd(locations)} />
      <JsonLd data={websiteLd()} />
    </>
  );
}
