export type ServiceSlug =
  | "self-drive-rental"
  | "cabs-with-driver"
  | "airport-transfers"
  | "wedding-cars"
  | "long-term-lease";

export interface ServiceHighlight {
  title: string;
  description: string;
}

export interface ServicePriceRow {
  label: string;
  detail: string;
  price: string;
}

export interface Service {
  id: string;
  slug: ServiceSlug;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  /** Lucide-free inline icon key, resolved in components/ui/Icon.tsx */
  icon: string;
  bullets: string[];
  highlights: ServiceHighlight[];
  /** Empty until the client supplies real prices. Pages then show a quote line. */
  priceTable: ServicePriceRow[];
  /** e.g. "LKR 5,500 / day". Null until a real price exists. */
  startingFrom: string | null;
  featured: boolean;
}
