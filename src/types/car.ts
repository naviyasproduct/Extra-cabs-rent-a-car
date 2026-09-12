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

/**
 * How many "Features and equipment" bullets a vehicle may list.
 *
 * Twelve fills the two-column list on the vehicle page without turning it into
 * a specification dump nobody reads. Same reasoning and same home as the image
 * cap: no data in this file, so client components can import it freely.
 */
export const MAX_VEHICLE_FEATURES = 12;

export type CarCategory =
  | "micro"
  | "hatchback"
  | "sedan"
  | "suv"
  | "van"
  | "luxury"
  | "electric";

export type Transmission = "automatic" | "manual";

/**
 * What the vehicle actually burns.
 *
 * Hybrid is deliberately NOT in here. A hybrid still runs on petrol, so
 * listing it as a fuel type made the vehicle page answer "what fuel does
 * this take" with "Hybrid", which tells a customer nothing at the pump.
 * The drivetrain is a separate fact and lives in `CarSpecs.hybrid`.
 */
export type FuelType = "petrol" | "diesel" | "electric";

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
  /** Petrol or diesel engine paired with an electric motor. */
  hybrid: boolean;
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
  /** True narrows to hybrids. Undefined or false does not filter. */
  hybrid?: boolean;
  seats?: number | "all";
  maxDaily?: number;
  search?: string;
  sort?: "recommended" | "price-asc" | "price-desc" | "seats-desc";
}
