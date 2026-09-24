import "server-only";
import { connection } from "next/server";
import type { Car, CarCategory } from "@/types";
import { MAX_VEHICLE_FEATURES, MAX_VEHICLE_IMAGES, MAX_VEHICLE_VIDEOS } from "@/types";
import { listVehicleRecords, getVehicleRecord } from "@/lib/panel/db";
import type { VehicleRecord } from "@/lib/panel/types";

/**
 * The live fleet, from the `vehicles` table.
 *
 * SERVER ONLY. `src/lib/data/cars.ts` stays pure so client components can keep
 * importing `filterCars` and the category helpers from it. Its catalogue is
 * empty: every vehicle is added by staff in the panel, so there is no longer
 * an override layer to merge.
 *
 * REQUEST TIME, NOT BUILD TIME. connection() in the public readers opts every
 * page that shows fleet data out of prerendering, so a change in the panel
 * shows on the next request, including pages added later.
 *
 * Two audiences, and the difference matters:
 *   listVehicles()   everything a staff member should see, including vehicles
 *                    that are out on hire and deleted ones.
 *   publicCars()     what a customer sees. A vehicle marked booked or deleted
 *                    is not in the list at all.
 */

function recordToCar(vehicle: VehicleRecord): Car {
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
      tiers: vehicle.tiers,
      deposit: vehicle.deposit,
      extraKm: vehicle.extraKm,
      withDriverDaily: vehicle.withDriverDaily,
    },
    features: vehicle.features.slice(0, MAX_VEHICLE_FEATURES),
    images: vehicle.images.slice(0, MAX_VEHICLE_IMAGES),
    videos: (vehicle.videos ?? []).slice(0, MAX_VEHICLE_VIDEOS),
    available: vehicle.available,
    featured: vehicle.featured,
  };
}

export interface LiveVehicle {
  car: Car;
  deletedAt: string | null;
}

/** Everything, including hidden and deleted. Panel use. */
export async function listVehicles(): Promise<LiveVehicle[]> {
  return (await listVehicleRecords()).map((vehicle) => ({
    car: recordToCar(vehicle),
    deletedAt: vehicle.deletedAt,
  }));
}

/** Staff view: live vehicles, deleted ones excluded unless asked for. */
export async function staffVehicles(includeDeleted = false): Promise<LiveVehicle[]> {
  const all = await listVehicles();
  return includeDeleted ? all : all.filter((v) => v.deletedAt === null);
}

/** Panel lookup: finds hidden and deleted vehicles too. */
export async function vehicleBySlug(slug: string): Promise<LiveVehicle | null> {
  const vehicle = await getVehicleRecord(slug);
  return vehicle ? { car: recordToCar(vehicle), deletedAt: vehicle.deletedAt } : null;
}

/**
 * The customer-visible list, without the request-time marker.
 *
 * A vehicle that is out on hire or deleted does not appear at all. This is what
 * "mark it booked and it drops off the site" means: not a badge, an absence.
 *
 * Private, because the sitemap needs it without connection().
 */
async function listedCars(): Promise<Car[]> {
  const all = await listVehicles();
  return all.filter((v) => v.deletedAt === null && v.car.available).map((v) => v.car);
}

export async function publicCars(): Promise<Car[]> {
  await connection();
  return listedCars();
}

export async function publicCarBySlug(slug: string): Promise<Car | null> {
  await connection();
  const found = await vehicleBySlug(slug);
  if (!found || found.deletedAt !== null || !found.car.available) return null;
  return found.car;
}

/**
 * For the sitemap, which revalidates on its own schedule.
 *
 * Deliberately WITHOUT connection(): the sitemap is regenerated in the
 * background, where there is no request to wait for.
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
