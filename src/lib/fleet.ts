import { connection } from "next/server";
import type { Car, CarCategory } from "@/types";
import { MAX_VEHICLE_FEATURES, MAX_VEHICLE_IMAGES } from "@/types";
import { getCars as catalogueCars } from "@/lib/data/cars";
import { readData } from "@/lib/panel/store";
import type { CreatedVehicle, VehicleOverride } from "@/lib/panel/types";

/**
 * The live fleet: the shipped catalogue with the panel's edits layered on top.
 *
 * SERVER ONLY. It reads the panel store, which touches node:fs.
 * `src/lib/data/cars.ts` stays pure so client components can keep importing
 * `filterCars` and the category helpers from it.
 *
 * REQUEST TIME, NOT BUILD TIME. The store is a synchronous file read, which
 * happily completes during prerendering, so without connection() Next bakes
 * the fleet into static HTML at build and the site never sees a panel edit
 * again. Calling connection() in these readers opts every page that shows
 * fleet data out of prerendering automatically, including pages added later.
 * That is deliberately here rather than `export const dynamic` on six separate
 * routes, which is six chances to forget.
 *
 * Two audiences, and the difference matters:
 *   listVehicles()   everything a staff member should see, including vehicles
 *                    that are out on hire and (optionally) deleted ones.
 *   publicCars()     what a customer sees. A vehicle marked booked or deleted
 *                    is not in the list at all.
 */

function applyOverride(car: Car, override: VehicleOverride | undefined): Car {
  if (!override) return car;

  return {
    ...car,
    name: override.name ?? car.name,
    // Customer-facing copy. An empty string or an empty list is a real value
    // here: it means the owner cleared the box. So these use ?? rather than a
    // truthiness test, and only an absent override falls back to the catalogue.
    tagline: override.tagline ?? car.tagline,
    description: override.description ?? car.description,
    features: override.features ?? car.features,
    available: override.available ?? car.available,
    featured: override.featured ?? car.featured,
    specs: {
      ...car.specs,
      seats: override.seats ?? car.specs.seats,
      doors: override.doors ?? car.specs.doors,
      fuel: override.fuel ?? car.specs.fuel,
      hybrid: override.hybrid ?? car.specs.hybrid,
    },
    pricing: {
      daily: override.daily ?? car.pricing.daily,
      weekly: override.weekly ?? car.pricing.weekly,
      monthly: override.monthly ?? car.pricing.monthly,
      deposit: override.deposit ?? car.pricing.deposit,
      withDriverDaily:
        override.withDriverDaily !== undefined
          ? override.withDriverDaily
          : car.pricing.withDriverDaily,
    },
  };
}

function createdToCar(vehicle: CreatedVehicle): Car {
  return {
    id: vehicle.slug,
    slug: vehicle.slug,
    name: vehicle.name,
    brand: vehicle.brand,
    year: vehicle.year,
    category: vehicle.category as CarCategory,
    tagline: vehicle.tagline,
    description: vehicle.description,
    specs: {
      seats: vehicle.seats,
      doors: vehicle.doors,
      luggage: vehicle.luggage,
      transmission: vehicle.transmission,
      fuel: vehicle.fuel,
      hybrid: vehicle.hybrid,
      engineCc: vehicle.engineCc,
      airConditioned: true,
    },
    pricing: {
      daily: vehicle.daily,
      weekly: vehicle.weekly,
      monthly: vehicle.monthly,
      deposit: vehicle.deposit,
      withDriverDaily: vehicle.withDriverDaily,
    },
    features: vehicle.features.slice(0, MAX_VEHICLE_FEATURES),
    images: vehicle.images.slice(0, MAX_VEHICLE_IMAGES),
    rating: 0,
    reviewCount: 0,
    available: vehicle.available,
    featured: vehicle.featured,
  };
}

export interface LiveVehicle {
  car: Car;
  deletedAt: string | null;
  /** True when it came from the panel rather than the shipped catalogue. */
  addedInPanel: boolean;
}

/** Everything, including hidden and deleted. Panel use. */
export async function listVehicles(): Promise<LiveVehicle[]> {
  const data = readData();
  const catalogue = await catalogueCars();

  const fromCatalogue: LiveVehicle[] = catalogue.map((car) => {
    const override = data.vehicleOverrides[car.slug];
    return {
      car: applyOverride(car, override),
      deletedAt: override?.deletedAt ?? null,
      addedInPanel: false,
    };
  });

  const fromPanel: LiveVehicle[] = data.createdVehicles.map((vehicle) => {
    const override = data.vehicleOverrides[vehicle.slug];
    return {
      car: applyOverride(createdToCar(vehicle), override),
      deletedAt: override?.deletedAt ?? vehicle.deletedAt,
      addedInPanel: true,
    };
  });

  return [...fromPanel, ...fromCatalogue];
}

/** Staff view: live vehicles, deleted ones excluded unless asked for. */
export async function staffVehicles(includeDeleted = false): Promise<LiveVehicle[]> {
  const all = await listVehicles();
  return includeDeleted ? all : all.filter((v) => v.deletedAt === null);
}

/**
 * Customer view.
 *
 * A vehicle that is out on hire or deleted does not appear at all. This is what
 * "mark it booked and it drops off the site" means: not a badge, an absence.
 */
/**
 * The customer-visible list, without the request-time marker.
 *
 * Private, because build-time callers need it and page callers must not use it.
 */
async function listedCars(): Promise<Car[]> {
  const all = await listVehicles();
  return all
    .filter((v) => v.deletedAt === null && v.car.available)
    .map((v) => v.car);
}

export async function publicCars(): Promise<Car[]> {
  await connection();
  return listedCars();
}

export async function publicCarBySlug(slug: string): Promise<Car | null> {
  await connection();
  return (await listedCars()).find((car) => car.slug === slug) ?? null;
}

/**
 * Build-time only: generateStaticParams and the sitemap.
 *
 * Deliberately WITHOUT connection(). Those run during the build, where there is
 * no request to wait for, so calling it there would be wrong. Slugs are also
 * the one thing that is safe to precompute: the page body still reads live data
 * per request, and an unknown slug renders on demand anyway.
 */
export async function publicCarSlugs(): Promise<string[]> {
  return (await listedCars()).map((car) => car.slug);
}

export async function publicFeaturedCars(limit = 6): Promise<Car[]> {
  await connection();
  return (await listedCars()).filter((car) => car.featured).slice(0, limit);
}

/** Featured first, then the rest, so a grid of `limit` always fills. */
export async function publicShowcaseCars(limit = 8): Promise<Car[]> {
  await connection();
  const cars = await listedCars();
  const featured = cars.filter((car) => car.featured);
  const rest = cars.filter((car) => !car.featured);
  return [...featured, ...rest].slice(0, limit);
}

export async function publicRelatedCars(slug: string, limit = 3): Promise<Car[]> {
  await connection();
  const cars = await listedCars();
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

export async function publicCategoryCounts(): Promise<Record<string, number>> {
  await connection();
  const cars = await listedCars();
  return cars.reduce<Record<string, number>>(
    (acc, car) => {
      acc.all = (acc.all ?? 0) + 1;
      acc[car.category] = (acc[car.category] ?? 0) + 1;
      return acc;
    },
    { all: 0 },
  );
}

/** Panel lookup: finds hidden and deleted vehicles too. */
export async function vehicleBySlug(slug: string): Promise<LiveVehicle | null> {
  const all = await listVehicles();
  return all.find((v) => v.car.slug === slug) ?? null;
}
