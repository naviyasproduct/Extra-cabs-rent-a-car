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
  priceTable: ServicePriceRow[];
  startingFrom: string;
  featured: boolean;
}
