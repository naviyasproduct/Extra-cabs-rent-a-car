import type { NavLink } from "@/types";

/**
 * Single source of truth for company details used across the site.
 * Everything here is read from components, never hardcoded.
 *
 * Real values, supplied by the client 2026-09-21. The name, address and phone
 * number here must match the Google Business Profile character for character:
 * search engines treat that agreement as evidence the business is where it
 * says it is. Change one, change the other.
 */
export const site = {
  name: "Extra Cabs & Rent a Cars",
  shortName: "Extra Cabs",
  legalName: "Extra Cabs & Rent a Cars (Pvt) Ltd",
  tagline: "Rent a car. Or let us drive.",
  description:
    "Self-drive rentals, cabs with a driver, airport transfers and wedding cars across Sri Lanka. Clean vehicles, honest daily rates, no hidden charges.",
  /** Founded 1 January 2019. */
  established: 2019,

  /** The business number. It is also the WhatsApp number. */
  phone: "+94 74 159 6212",
  /** A second mobile. There is no landline. */
  phoneAlt: "+94 77 720 2906",
  whatsapp: "+94 74 159 6212",
  /** One inbox for everything, bookings included. */
  email: "extracabsinfo@gmail.com",

  /**
   * The one and only location. There are no branches.
   *
   * Written as the client gave it: "No 653, Samurdhi Mawatha, Heiyanthuduwa,
   * Biyagama, Gonawala, Sri Lanka". `addressOneLine` below reproduces exactly
   * that. The postal code is not known; it stays blank rather than guessed,
   * and the renderers drop empty parts.
   */
  address: {
    line1: "No 653, Samurdhi Mawatha",
    line2: "Heiyanthuduwa, Biyagama",
    city: "Gonawala",
    country: "Sri Lanka",
    postal: "",
  },

  /**
   * Where the pin actually is, read from the Google Maps share link on
   * 2026-09-21 (the `!3d` and `!4d` values of the place, not the map's
   * viewport centre, which is a different point). Used for schema.org `geo`.
   */
  geo: { latitude: 6.9716567, longitude: 79.9774439 },

  hours: {
    office: "Mon to Sat, 8.00 am to 8.00 pm",
    support: "24 hours, every day",
  },

  /**
   * Real profiles only. These become schema.org `sameAs`, which is how search
   * engines tie the website to the business's other pages, so a placeholder
   * here would claim the business IS facebook.com. There is no Instagram.
   * The TikTok link is stored without the share-tracking query string.
   */
  socials: [
    {
      label: "Facebook",
      href: "https://www.facebook.com/p/Extra-Cabs-Rent-a-Car-61565174534040/",
      icon: "facebook",
    },
    { label: "WhatsApp", href: "https://wa.me/94741596212", icon: "whatsapp" },
    {
      label: "TikTok",
      href: "https://www.tiktok.com/@extra.cabs.rent.a",
      icon: "tiktok",
    },
  ],

  /**
   * Office hours in machine form, for schema.org openingHoursSpecification.
   * Keep in sync with `hours.office` above, which is the version people read.
   */
  openingHours: {
    days: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    opens: "08:00",
    closes: "20:00",
  },

  /**
   * The office on Google Maps. Two forms of the same place, both supplied by
   * the client on 2026-09-21, and both resolving to place id
   * 0x3ae2570041ddb17b:0x99b363437e3a3654:
   *
   *   mapEmbed  the iframe src, shown in the footer, from Share, Embed a map.
   *   mapLink   where "Open in Google Maps" goes: the place's own share link,
   *             so it opens the business listing itself, with its reviews and
   *             directions, in the handset app or the browser.
   *
   * Do not build mapLink from the numbers in the embed URL. Its `!2d`/`!3d`
   * values are the centre of the map VIEW, not the pin. The previous link was
   * built that way and landed about 1.1km south of the office.
   */
  mapEmbed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6897.3156521642795!2d79.97186764625243!3d6.9755882190968554!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2570041ddb17b%3A0x99b363437e3a3654!2sExtra%20Cabs%20%26%20Rent%20A!5e0!3m2!1sen!2slk!4v1789984896412!5m2!1sen!2slk",
  mapLink: "https://maps.app.goo.gl/w3V1udhYMzArK2BT6",
} as const;

/**
 * Canonical origin, with no trailing slash. Every absolute URL the site emits
 * (canonicals, sitemap, Open Graph, JSON-LD) is built from this one value.
 *
 * Set NEXT_PUBLIC_SITE_URL in the Vercel project to the real domain. The
 * fallback is only so local builds produce valid absolute URLs.
 */
export const siteUrl: string = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://extracabs.lk"
).replace(/\/+$/, "");

/**
 * The address as display lines, with empty parts dropped.
 *
 * Parts of the address are genuinely unknown (there is no postal code yet), and
 * a blank field must not render as an empty line or a stray comma. Everything
 * that shows the address reads one of these two, so filling a missing part in
 * later fixes every page at once.
 */
export const addressLines: string[] = [
  site.address.line1,
  site.address.line2,
  [site.address.city, site.address.postal].filter(Boolean).join(" "),
  site.address.country,
]
  .map((line) => line.trim())
  .filter((line) => line.length > 0);

/** The same address on one line, for inline copy and structured data. */
export const addressOneLine: string = addressLines.join(", ");

export const mainNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Fleet", href: "/fleet" },
  {
    label: "Services",
    href: "/services",
    children: [
      {
        label: "Self-drive rental",
        href: "/services/self-drive-rental",
        description: "Take the keys and go, by the day, week or month.",
      },
      {
        label: "Cabs with driver",
        href: "/services/cabs-with-driver",
        description: "City runs, day hires and island tours with our drivers.",
      },
      {
        label: "Airport transfers",
        href: "/services/airport-transfers",
        description: "Fixed-price BIA pickups with flight tracking.",
      },
      {
        label: "Wedding cars",
        href: "/services/wedding-cars",
        description: "Decorated luxury cars for the big day.",
      },
      {
        label: "Long-term lease",
        href: "/services/long-term-lease",
        description: "Monthly and corporate leasing with servicing included.",
      },
    ],
  },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const footerNav = [
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Our fleet", href: "/fleet" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Self-drive rental", href: "/services/self-drive-rental" },
      { label: "Cabs with driver", href: "/services/cabs-with-driver" },
      { label: "Airport transfers", href: "/services/airport-transfers" },
      { label: "Wedding cars", href: "/services/wedding-cars" },
      { label: "Long-term lease", href: "/services/long-term-lease" },
    ],
  },
  {
    title: "Browse by type",
    links: [
      { label: "Budget & micro cars", href: "/fleet?category=micro" },
      { label: "Sedans", href: "/fleet?category=sedan" },
      { label: "SUVs & 4x4", href: "/fleet?category=suv" },
      { label: "Vans & people carriers", href: "/fleet?category=van" },
      { label: "Luxury", href: "/fleet?category=luxury" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Rental terms", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Insurance & cover", href: "/faq#insurance" },
    ],
  },
];
