import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { site, siteUrl } from "@/lib/data/site";
import "./globals.css";

const body = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  /**
   * Every relative URL in metadata anywhere in the app resolves against this.
   * Without it, Open Graph and canonical tags emit relative paths, which
   * crawlers and WhatsApp previews both ignore.
   */
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.shortName}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.legalName }],
  creator: site.legalName,
  publisher: site.legalName,
  category: "travel",
  openGraph: {
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    siteName: site.name,
    type: "website",
    locale: "en_LK",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: true, address: true },
};

/**
 * The document, and nothing else.
 *
 * The customer-facing navbar and footer live in `(site)/layout.tsx`, not here,
 * so the staff panel and the sign-in page do not inherit them. A staff screen
 * carrying "Ready when you are" and a Book a vehicle button is nonsense.
 *
 * Route groups do not change URLs: `(site)/fleet/page.tsx` is still /fleet.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-LK"
      // globals.css sets scroll-behavior: smooth on this element for in-page
      // anchors. Next 16 stopped overriding that on its own during a route
      // change, so without this attribute a navigation SMOOTH-SCROLLS to the
      // top of the new page instead of landing there. The attribute is opt-in
      // to the old behaviour: Next forces scroll-behavior: auto for the jump
      // and restores it afterwards, leaving anchor links smooth.
      data-scroll-behavior="smooth"
      className={`${body.variable} ${display.variable}`}
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
