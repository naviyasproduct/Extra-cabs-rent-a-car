/**
 * How many photographs a vehicle may show.
 *
 * Five is the cap: one card shot plus four gallery views. Beyond that the
 * thumbnail rail wraps to a second row and nobody clicks past the first few
 * anyway. The upload screen in the staff panel will enforce the same number.
 *
 * Lives here rather than in cars.ts so client components can import it without
 * dragging the whole fleet array into the browser bundle.
 */
export const MAX_VEHICLE_IMAGES = 5;

export type CarCategory =
  | "micro"
  | "hatchback"
  | "sedan"
  | "suv"
  | "van"
  | "luxury"
  | "electric";

export type Transmission = "automatic" | "manual";

export type FuelType = "petrol" | "diesel" | "hybrid" | "electric";

export interface CarPricing {
  /** All prices in LKR. */
  daily: number;
  weekly: number;
  monthly: number;
  /** Refundable security deposit held during the rental. */
  deposit: number;
  /** Hourly rate with a driver, null when the car is self-drive only. */
  withDriverDaily: number | null;
}

export interface CarSpecs {
  seats: number;
  doors: number;
  luggage: number;
  transmission: Transmission;
  fuel: FuelType;
  engineCc: number;
  airConditioned: boolean;
}

export interface Car {
  id: string;
  slug: string;
  name: string;
  brand: string;
  year: number;
  category: CarCategory;
  /** One-line hook shown on the fleet card. */
  tagline: string;
  description: string;
  specs: CarSpecs;
  pricing: CarPricing;
  features: string[];
  /**
   * Paths under /public/images/cars. The first is the card and hero shot.
   * At most MAX_VEHICLE_IMAGES entries; anything beyond that is ignored.
   */
  images: string[];
  rating: number;
  reviewCount: number;
  available: boolean;
  featured: boolean;
  /** Marketing flag: "Popular", "New in fleet", etc. */
  badge?: string;
}

export interface CarFilters {
  category?: CarCategory | "all";
  transmission?: Transmission | "all";
  fuel?: FuelType | "all";
  seats?: number | "all";
  maxDaily?: number;
  search?: string;
  sort?: "recommended" | "price-asc" | "price-desc" | "seats-desc";
}
