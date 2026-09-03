import type { NavLink } from "@/types";

/**
 * Single source of truth for company details used across the site.
 * PLACEHOLDER VALUES — swap these for the real ones before showing the
 * site publicly. Everything here is read from components, never hardcoded.
 */
export const site = {
  name: "Extra Cabs & Rent a Cars",
  shortName: "Extra Cabs",
  legalName: "Extra Cabs & Rent a Cars (Pvt) Ltd",
  tagline: "Rent a car. Or let us drive.",
  description:
    "Self-drive rentals, cabs with a driver, airport transfers and wedding cars across Sri Lanka. Clean vehicles, honest daily rates, no hidden charges.",
  established: 2016,

  phone: "+94 77 123 4567",
  phoneAlt: "+94 11 234 5678",
  whatsapp: "+94 77 123 4567",
  email: "hello@extracabs.lk",
  bookingEmail: "bookings@extracabs.lk",

  address: {
    line1: "No. 128, Galle Road",
    line2: "Dehiwala",
    city: "Colombo",
    country: "Sri Lanka",
    postal: "10350",
  },

  hours: {
    office: "Mon – Sat, 8.00 am – 8.00 pm",
    support: "24 hours, every day",
  },

  socials: [
    { label: "Facebook", href: "https://facebook.com", icon: "facebook" },
    { label: "Instagram", href: "https://instagram.com", icon: "instagram" },
    { label: "WhatsApp", href: "https://wa.me/94771234567", icon: "whatsapp" },
    { label: "TikTok", href: "https://tiktok.com", icon: "tiktok" },
  ],

  stats: [
    { value: "9", suffix: "yrs", label: "On the road since 2016" },
    { value: "40", suffix: "+", label: "Vehicles in the fleet" },
    { value: "12k", suffix: "+", label: "Completed rentals" },
    { value: "4.8", suffix: "/5", label: "Average customer rating" },
  ],
} as const;

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
