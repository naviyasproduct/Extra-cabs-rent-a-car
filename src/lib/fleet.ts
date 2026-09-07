import type { Car, CarCategory } from "@/types";
import { MAX_VEHICLE_IMAGES } from "@/types";
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
    available: override.available ?? car.available,
    featured: override.featured ?? car.featured,
    specs: {
      ...car.specs,
      seats: override.seats ?? car.specs.seats,
      doors: override.doors ?? car.specs.doors,
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
    tagline: "",
    description: vehicle.description,
    specs: {
      seats: vehicle.seats,
      doors: vehicle.doors,
      luggage: vehicle.luggage,
      transmission: vehicle.transmission,
      fuel: vehicle.fuel,
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
    features: [],
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
export async function publicCars(): Promise<Car[]> {
  const all = await listVehicles();
  return all
    .filter((v) => v.deletedAt === null && v.car.available)
    .map((v) => v.car);
}

export async function publicCarBySlug(slug: string): Promise<Car | null> {
  const cars = await publicCars();
  return cars.find((car) => car.slug === slug) ?? null;
}

export async function publicCarSlugs(): Promise<string[]> {
  return (await publicCars()).map((car) => car.slug);
}

export async function publicFeaturedCars(limit = 6): Promise<Car[]> {
  return (await publicCars()).filter((car) => car.featured).slice(0, limit);
}

/** Featured first, then the rest, so a grid of `limit` always fills. */
export async function publicShowcaseCars(limit = 8): Promise<Car[]> {
  const cars = await publicCars();
  const featured = cars.filter((car) => car.featured);
  const rest = cars.filter((car) => !car.featured);
  return [...featured, ...rest].slice(0, limit);
}

export async function publicRelatedCars(slug: string, limit = 3): Promise<Car[]> {
  const cars = await publicCars();
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
  const cars = await publicCars();
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
