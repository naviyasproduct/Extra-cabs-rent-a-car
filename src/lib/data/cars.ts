import type { Car, CarCategory, CarFilters } from "@/types";
import { MAX_VEHICLE_IMAGES } from "@/types";

/**
 * Fleet data.
 *
 * This is the ONLY place vehicle data lives. When the backend lands, replace
 * the array with a database query inside the accessor functions at the bottom
 * of this file - the accessors are already async, so no component changes.
 *
 * Images: every vehicle currently shares the same three stock photographs in
 * /public/images/cars (fleet-01 to fleet-03), rotated so neighbouring tiles in
 * the grid do not show an identical shot. Replace a car's `images` array with
 * its own files as real photography arrives; nothing else needs to change.
 * A vehicle shows at most MAX_VEHICLE_IMAGES of them.
 * Missing files fall back to a styled placeholder automatically.
 */
const fleet: Car[] = [
  {
    id: "car-001",
    slug: "toyota-chr",
    name: "Toyota C-HR",
    brand: "Toyota",
    year: 2019,
    category: "suv",
    tagline: "The head-turner of the fleet",
    description:
      "Our most requested vehicle. The C-HR pairs a genuinely comfortable hybrid drivetrain with a high seating position, so it handles Colombo traffic and hill-country roads equally well. Excellent fuel economy for long trips.",
    specs: {
      seats: 5,
      doors: 5,
      luggage: 2,
      transmission: "automatic",
      fuel: "petrol",
      hybrid: true,
      engineCc: 1800,
      airConditioned: true,
    },
    pricing: {
      daily: 14500,
      weekly: 91000,
      monthly: 330000,
      deposit: 50000,
      withDriverDaily: 21000,
    },
    features: [
      "Reverse camera and sensors",
      "Apple CarPlay / Android Auto",
      "Cruise control",
      "Dual-zone climate",
      "Keyless entry and push start",
      "LED headlamps",
    ],
    images: [
      "/images/cars/fleet-01.jpg",
      "/images/cars/fleet-02.jpg",
      "/images/cars/fleet-03.jpg",
    ],
    rating: 4.9,
    reviewCount: 128,
    available: true,
    featured: true,
    badge: "Most booked",
  },
  {
    id: "car-002",
    slug: "toyota-prius",
    name: "Toyota Prius",
    brand: "Toyota",
    year: 2018,
    category: "sedan",
    tagline: "Cheapest kilometre in the fleet",
    description:
      "If you are covering distance, this is the one to take. The Prius returns the best fuel figures we have on record, seats five in comfort and has a boot that swallows two large suitcases.",
    specs: {
      seats: 5,
      doors: 5,
      luggage: 2,
      transmission: "automatic",
      fuel: "petrol",
      hybrid: true,
      engineCc: 1800,
      airConditioned: true,
    },
    pricing: {
      daily: 11500,
      weekly: 72000,
      monthly: 265000,
      deposit: 40000,
      withDriverDaily: 18000,
    },
    features: [
      "Reverse camera",
      "Bluetooth audio",
      "Cruise control",
      "Automatic climate control",
      "Push start",
      "Eco and Power drive modes",
    ],
    images: [
      "/images/cars/fleet-02.jpg",
      "/images/cars/fleet-03.jpg",
      "/images/cars/fleet-01.jpg",
    ],
    rating: 4.8,
    reviewCount: 96,
    available: true,
    featured: true,
    badge: "Best on fuel",
  },
  {
    id: "car-003",
    slug: "suzuki-wagon-r-stingray",
    name: "Suzuki Wagon R Stingray",
    brand: "Suzuki",
    year: 2018,
    category: "micro",
    tagline: "Small outside, surprisingly big inside",
    description:
      "The sensible city choice. Tall roof, effortless parking, and running costs that barely register. Popular with couples and small families staying around Colombo and the south coast.",
    specs: {
      seats: 4,
      doors: 5,
      luggage: 1,
      transmission: "automatic",
      fuel: "petrol",
      hybrid: true,
      engineCc: 660,
      airConditioned: true,
    },
    pricing: {
      daily: 7500,
      weekly: 46000,
      monthly: 165000,
      deposit: 25000,
      withDriverDaily: 14000,
    },
    features: [
      "Reverse camera",
      "Touchscreen head unit",
      "Auto start-stop",
      "Power windows all round",
      "Tall-boy cabin",
    ],
    images: [
      "/images/cars/fleet-03.jpg",
      "/images/cars/fleet-01.jpg",
      "/images/cars/fleet-02.jpg",
    ],
    rating: 4.7,
    reviewCount: 74,
    available: true,
    featured: true,
    badge: "Budget pick",
  },
  {
    id: "car-004",
    slug: "toyota-aqua",
    name: "Toyota Aqua",
    brand: "Toyota",
    year: 2019,
    category: "hatchback",
    tagline: "The easy everyday hybrid",
    description:
      "A compact hybrid hatch that is effortless in traffic and light on fuel. A good middle ground when a micro feels too small but you do not need an SUV.",
    specs: {
      seats: 5,
      doors: 5,
      luggage: 2,
      transmission: "automatic",
      fuel: "petrol",
      hybrid: true,
      engineCc: 1500,
      airConditioned: true,
    },
    pricing: {
      daily: 9500,
      weekly: 59000,
      monthly: 215000,
      deposit: 30000,
      withDriverDaily: 16000,
    },
    features: [
      "Reverse camera",
      "Bluetooth and USB",
      "Automatic climate control",
      "Push start",
      "Alloy wheels",
    ],
    images: [
      "/images/cars/fleet-01.jpg",
      "/images/cars/fleet-02.jpg",
      "/images/cars/fleet-03.jpg",
    ],
    rating: 4.7,
    reviewCount: 88,
    available: true,
    featured: false,
  },
  {
    id: "car-005",
    slug: "suzuki-alto",
    name: "Suzuki Alto",
    brand: "Suzuki",
    year: 2017,
    category: "micro",
    tagline: "Our lowest daily rate",
    description:
      "Straightforward, reliable and cheap to run. Ideal for solo travellers, students and anyone who mainly needs to get around town without thinking about it.",
    specs: {
      seats: 4,
      doors: 5,
      luggage: 1,
      transmission: "manual",
      fuel: "petrol",
      hybrid: false,
      engineCc: 800,
      airConditioned: true,
    },
    pricing: {
      daily: 5500,
      weekly: 34000,
      monthly: 120000,
      deposit: 20000,
      withDriverDaily: null,
    },
    features: [
      "Air conditioning",
      "Power steering",
      "Bluetooth audio",
      "Central locking",
    ],
    images: [
      "/images/cars/fleet-02.jpg",
      "/images/cars/fleet-03.jpg",
      "/images/cars/fleet-01.jpg",
    ],
    rating: 4.5,
    reviewCount: 61,
    available: true,
    featured: false,
    badge: "Lowest rate",
  },
  {
    id: "car-006",
    slug: "toyota-kdh-hiace",
    name: "Toyota KDH Hiace",
    brand: "Toyota",
    year: 2018,
    category: "van",
    tagline: "Built for groups and luggage",
    description:
      "The workhorse for family trips, office outings and airport runs with a full load. High-roof cabin, proper luggage space behind the last row, and a driver who knows the routes.",
    specs: {
      seats: 10,
      doors: 4,
      luggage: 6,
      transmission: "automatic",
      fuel: "diesel",
      hybrid: false,
      engineCc: 2500,
      airConditioned: true,
    },
    pricing: {
      daily: 18500,
      weekly: 115000,
      monthly: 420000,
      deposit: 60000,
      withDriverDaily: 24000,
    },
    features: [
      "Dual air conditioning",
      "Reclining captain seats",
      "Rear luggage bay",
      "USB charging points",
      "Curtains and tinted glass",
    ],
    images: [
      "/images/cars/fleet-03.jpg",
      "/images/cars/fleet-01.jpg",
      "/images/cars/fleet-02.jpg",
    ],
    rating: 4.8,
    reviewCount: 53,
    available: true,
    featured: true,
    badge: "Driver included",
  },
  {
    id: "car-007",
    slug: "honda-vezel",
    name: "Honda Vezel",
    brand: "Honda",
    year: 2019,
    category: "suv",
    tagline: "Comfort-first compact SUV",
    description:
      "A refined hybrid crossover with a notably quiet cabin and a big boot for its size. A favourite for couples touring the hill country.",
    specs: {
      seats: 5,
      doors: 5,
      luggage: 3,
      transmission: "automatic",
      fuel: "petrol",
      hybrid: true,
      engineCc: 1500,
      airConditioned: true,
    },
    pricing: {
      daily: 13500,
      weekly: 85000,
      monthly: 310000,
      deposit: 50000,
      withDriverDaily: 20000,
    },
    features: [
      "Panoramic roof",
      "Half-leather seats",
      "Reverse camera and sensors",
      "Paddle shifters",
      "Dual-zone climate",
    ],
    images: [
      "/images/cars/fleet-01.jpg",
      "/images/cars/fleet-02.jpg",
      "/images/cars/fleet-03.jpg",
    ],
    rating: 4.8,
    reviewCount: 71,
    available: true,
    featured: false,
  },
  {
    id: "car-008",
    slug: "toyota-premio",
    name: "Toyota Premio",
    brand: "Toyota",
    year: 2018,
    category: "sedan",
    tagline: "The quiet, comfortable saloon",
    description:
      "A proper sedan for airport pickups and corporate travel. Soft ride, generous rear legroom and a boot that takes three cases without argument.",
    specs: {
      seats: 5,
      doors: 4,
      luggage: 3,
      transmission: "automatic",
      fuel: "petrol",
      hybrid: false,
      engineCc: 1500,
      airConditioned: true,
    },
    pricing: {
      daily: 12000,
      weekly: 75000,
      monthly: 275000,
      deposit: 40000,
      withDriverDaily: 18500,
    },
    features: [
      "Leather-trimmed seats",
      "Reverse camera",
      "Rear AC vents",
      "Cruise control",
      "Fabric sun shades",
    ],
    images: [
      "/images/cars/fleet-02.jpg",
      "/images/cars/fleet-03.jpg",
      "/images/cars/fleet-01.jpg",
    ],
    rating: 4.6,
    reviewCount: 44,
    available: true,
    featured: false,
  },
  {
    id: "car-009",
    slug: "toyota-land-cruiser-prado",
    name: "Toyota Land Cruiser Prado",
    brand: "Toyota",
    year: 2017,
    category: "suv",
    tagline: "Seven seats, any road",
    description:
      "When the itinerary includes rough tracks, tea estates or a safari park entrance, this is the vehicle. Full-time 4WD, three rows and a commanding view of the road.",
    specs: {
      seats: 7,
      doors: 5,
      luggage: 4,
      transmission: "automatic",
      fuel: "diesel",
      hybrid: false,
      engineCc: 3000,
      airConditioned: true,
    },
    pricing: {
      daily: 26000,
      weekly: 165000,
      monthly: 600000,
      deposit: 100000,
      withDriverDaily: 33000,
    },
    features: [
      "Full-time 4WD",
      "Three rows of seating",
      "Leather interior",
      "Roof rails",
      "Rear entertainment",
      "Hill descent control",
    ],
    images: [
      "/images/cars/fleet-03.jpg",
      "/images/cars/fleet-01.jpg",
      "/images/cars/fleet-02.jpg",
    ],
    rating: 4.9,
    reviewCount: 37,
    available: true,
    featured: true,
    badge: "4x4",
  },
  {
    id: "car-010",
    slug: "nissan-leaf",
    name: "Nissan Leaf",
    brand: "Nissan",
    year: 2019,
    category: "electric",
    tagline: "Zero fuel bills in the city",
    description:
      "A fully electric hatch with roughly 200 km of real-world range. Best suited to Colombo and the western province where charging is easy. We hand it over fully charged with a portable charger in the boot.",
    specs: {
      seats: 5,
      doors: 5,
      luggage: 2,
      transmission: "automatic",
      fuel: "electric",
      hybrid: false,
      engineCc: 0,
      airConditioned: true,
    },
    pricing: {
      daily: 10500,
      weekly: 66000,
      monthly: 240000,
      deposit: 35000,
      withDriverDaily: null,
    },
    features: [
      "About 200 km real range",
      "Portable charger included",
      "Reverse camera",
      "One-pedal driving",
      "Silent cabin",
    ],
    images: [
      "/images/cars/fleet-01.jpg",
      "/images/cars/fleet-02.jpg",
      "/images/cars/fleet-03.jpg",
    ],
    rating: 4.6,
    reviewCount: 29,
    available: true,
    featured: false,
    badge: "Electric",
  },
  {
    id: "car-011",
    slug: "mercedes-benz-e-class",
    name: "Mercedes-Benz E-Class",
    brand: "Mercedes-Benz",
    year: 2019,
    category: "luxury",
    tagline: "For weddings and boardrooms",
    description:
      "Our flagship. Booked most often as a decorated wedding car or for executive airport pickups. Supplied with a uniformed chauffeur as standard.",
    specs: {
      seats: 5,
      doors: 4,
      luggage: 3,
      transmission: "automatic",
      fuel: "petrol",
      hybrid: false,
      engineCc: 2000,
      airConditioned: true,
    },
    pricing: {
      daily: 45000,
      weekly: 290000,
      monthly: 1050000,
      deposit: 150000,
      withDriverDaily: 45000,
    },
    features: [
      "Chauffeur included",
      "Nappa leather interior",
      "Ambient cabin lighting",
      "Rear window blinds",
      "Complimentary wedding decoration",
      "Bottled water and tissues",
    ],
    images: [
      "/images/cars/fleet-02.jpg",
      "/images/cars/fleet-03.jpg",
      "/images/cars/fleet-01.jpg",
    ],
    rating: 5.0,
    reviewCount: 22,
    available: true,
    featured: true,
    badge: "Wedding favourite",
  },
  {
    id: "car-012",
    slug: "mitsubishi-montero-sport",
    name: "Mitsubishi Montero Sport",
    brand: "Mitsubishi",
    year: 2018,
    category: "suv",
    tagline: "Seven up, luggage in",
    description:
      "A tough seven-seater that stays comfortable on long drives. A common choice for larger families heading to Nuwara Eliya, Yala or Trincomalee.",
    specs: {
      seats: 7,
      doors: 5,
      luggage: 4,
      transmission: "automatic",
      fuel: "diesel",
      hybrid: false,
      engineCc: 2400,
      airConditioned: true,
    },
    pricing: {
      daily: 22000,
      weekly: 138000,
      monthly: 500000,
      deposit: 80000,
      withDriverDaily: 29000,
    },
    features: [
      "Selectable 4WD",
      "Three rows of seating",
      "Rear AC vents",
      "Reverse camera and sensors",
      "Roof rails",
    ],
    images: [
      "/images/cars/fleet-03.jpg",
      "/images/cars/fleet-01.jpg",
      "/images/cars/fleet-02.jpg",
    ],
    rating: 4.7,
    reviewCount: 31,
    available: false,
    featured: false,
  },
];

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
        return b.rating - a.rating;
      });
  }

  return sorted;
}
