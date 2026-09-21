import type { Car, CarCategory, CarFilters } from "@/types";
import { MAX_VEHICLE_IMAGES } from "@/types";

/**
 * Fleet data.
 *
 * EMPTY ON PURPOSE since 2026-09-21. The client's staff add every vehicle
 * through the panel after launch (/panel/fleet), and those live in the panel
 * store, merged in by lib/fleet.ts. The twelve vehicles that used to be here
 * were sample data: invented rates, invented deposits, and three stock photos
 * shared between them. They are in git history if a fixture is ever needed.
 *
 * The accessors below are kept: they are the seam a database query replaces,
 * and filterCars() and the category lists are used by the fleet browser.
 */
const fleet: Car[] = [];

export const categoryLabels: Record<CarCategory, string> = {
  micro: "Micro & budget",
  hatchback: "Hatchback",
  sedan: "Sedan",
  suv: "SUV & 4x4",
  van: "Van & people carrier",
  luxury: "Luxury",
  electric: "Electric",
};

export const categoryOrder: CarCategory[] = [
  "micro",
  "hatchback",
  "sedan",
  "suv",
  "van",
  "luxury",
  "electric",
];

/**
 * The fleet with the image cap applied once, at the source.
 *
 * Every accessor below reads this, so no consumer, page or component has to
 * remember the limit or slice for itself. When this becomes a database query,
 * apply the same cap there.
 */
const cars: Car[] = fleet.map((car) => ({
  ...car,
  images: car.images.slice(0, MAX_VEHICLE_IMAGES),
}));

/* ---------------------------------------------------------------------------
   Data accessors.
   These are the seams the backend plugs into. Keep them async and keep every
   component calling through them, never touching the array above directly.
--------------------------------------------------------------------------- */

export async function getCars(): Promise<Car[]> {
  return cars;
}

export async function getCarBySlug(slug: string): Promise<Car | null> {
  return cars.find((car) => car.slug === slug) ?? null;
}

export async function getFeaturedCars(limit = 6): Promise<Car[]> {
  return cars.filter((car) => car.featured).slice(0, limit);
}

/**
 * Featured vehicles first, then everything else, so a grid of `limit` always
 * fills evenly however many are flagged featured. The home page grid and its
 * structured data both read from here, so they never disagree.
 */
export async function getShowcaseCars(limit = 8): Promise<Car[]> {
  const featured = cars.filter((car) => car.featured);
  const rest = cars.filter((car) => !car.featured);
  return [...featured, ...rest].slice(0, limit);
}

export async function getRelatedCars(slug: string, limit = 3): Promise<Car[]> {
  const current = cars.find((car) => car.slug === slug);
  if (!current) return cars.slice(0, limit);

  const sameCategory = cars.filter(
    (car) => car.slug !== slug && car.category === current.category,
  );
  const rest = cars.filter(
    (car) => car.slug !== slug && car.category !== current.category,
  );

  return [...sameCategory, ...rest].slice(0, limit);
}

export function getCarSlugs(): string[] {
  return cars.map((car) => car.slug);
}

/** Category counts for the fleet filter chips. */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  return cars.reduce<Record<string, number>>(
    (acc, car) => {
      acc.all = (acc.all ?? 0) + 1;
      acc[car.category] = (acc[car.category] ?? 0) + 1;
      return acc;
    },
    { all: 0 },
  );
}

/** Pure client-side filtering, mirrors what the API will accept later. */
export function filterCars(list: Car[], filters: CarFilters): Car[] {
  const {
    category = "all",
    transmission = "all",
    fuel = "all",
    hybrid = false,
    seats = "all",
    maxDaily,
    search = "",
    sort = "recommended",
  } = filters;

  const term = search.trim().toLowerCase();

  const filtered = list.filter((car) => {
    if (category !== "all" && car.category !== category) return false;
    if (transmission !== "all" && car.specs.transmission !== transmission) return false;
    if (fuel !== "all" && car.specs.fuel !== fuel) return false;
    // Hybrid is a drivetrain, not a fuel, so it narrows rather than replaces:
    // "petrol" plus "hybrid only" is a meaningful pair of answers.
    if (hybrid && !car.specs.hybrid) return false;
    if (seats !== "all" && car.specs.seats < Number(seats)) return false;
    if (typeof maxDaily === "number" && car.pricing.daily > maxDaily) return false;
    if (term) {
      const haystack = `${car.name} ${car.brand} ${car.tagline} ${car.category}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (sort) {
    case "price-asc":
      sorted.sort((a, b) => a.pricing.daily - b.pricing.daily);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.pricing.daily - a.pricing.daily);
      break;
    case "seats-desc":
      sorted.sort((a, b) => b.specs.seats - a.specs.seats);
      break;
    default:
      sorted.sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1;
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        // Otherwise catalogue order. Array.sort is stable, so returning 0
        // keeps the order the fleet is written in.
        return 0;
      });
  }

  return sorted;
}
