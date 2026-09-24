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

/**
 * How many walkaround videos a vehicle may show.
 *
 * Two: one outside, one inside. A video is the heaviest thing on the page by
 * an order of magnitude, and a third one is a third poster image to load
 * before anybody has pressed play.
 */
export const MAX_VEHICLE_VIDEOS = 2;

/**
 * One walkaround video.
 *
 * The date is stored, not derived: Google needs `uploadDate` on a
 * VideoObject before it will treat it as a video at all, and nothing about a
 * Cloudinary public id says when it arrived.
 */
export interface CarVideo {
  /** Cloudinary public id, delivered from the video resource type. */
  id: string;
  /** ISO 8601, stamped when the video was attached to the vehicle. */
  uploadedAt: string;
}

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

/** The long-hire durations. Their labels and day counts are in lib/pricing.ts. */
export type RateTierId = "week1" | "week2" | "week3" | "month1" | "month3" | "month6";

/** Per-day rate in LKR for each duration. Totals are derived, never stored. */
export type RateTiers = Record<RateTierId, number>;

export interface CarPricing {
  /** All prices in LKR. */
  daily: number;
  /** Per-day rates for longer hires, shown as the rate table. */
  tiers: RateTiers;
  /** Refundable security deposit held during the rental. */
  deposit: number;
  /**
   * LKR charged for each kilometre beyond the allowance (KM_PER_DAY in
   * lib/pricing.ts, times the hire days). Null means no rate has been set yet:
   * the vehicle page then says to ask, rather than inventing a figure.
   */
  extraKm: number | null;
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

  /**
   * Walkaround videos, in display order, at most MAX_VEHICLE_VIDEOS. Empty
   * for most vehicles: a video is optional and the gallery simply does not
   * offer one when there is none.
   */
  videos: CarVideo[];
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
