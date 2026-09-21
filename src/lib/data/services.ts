import type { Service, ServiceSlug } from "@/types";

/**
 * Prices: every priceTable is empty and every startingFrom is null since
 * 2026-09-21. The figures that were here were sample data, and several named
 * vehicles the business does not have. Add the client's real prices back
 * into these two fields; every page already shows them when present and says
 * "call or WhatsApp for a quote" when not.
 *
 * The five things the business sells. Each one gets a card on the home page,
 * a row on /services and a full page at /services/[slug].
 */
const services: Service[] = [
  {
    id: "svc-01",
    slug: "self-drive-rental",
    name: "Self-drive car rental",
    shortName: "Self-drive",
    tagline: "Take the keys and go",
    description:
      "Rent any vehicle in our fleet by the day, week or month and drive it yourself. We handle insurance, servicing and roadside assistance so the only thing you plan is the route.",
    icon: "key",
    bullets: [
      "Daily, weekly and monthly rates",
      "Comprehensive insurance included",
      "Free delivery within Colombo",
      "24/7 roadside assistance",
    ],
    highlights: [
      {
        title: "No hidden charges",
        description:
          "The rate you see is the rate you pay. Insurance, basic maintenance and 100 km a day are all in the daily price, and each vehicle's extra-kilometre rate is published on its page.",
      },
      {
        title: "Delivered to your door",
        description:
          "We drop the vehicle wherever you are inside Colombo at no cost, and collect it the same way when you are done.",
      },
      {
        title: "100 km a day included",
        description:
          "Every hire day includes 100 km. Beyond that you pay a fixed rate per kilometre, shown on each vehicle's page before you book.",
      },
      {
        title: "Cleaned before every handover",
        description:
          "Every car is washed inside and out, fuelled and safety-checked before it reaches you.",
      },
    ],
    priceTable: [],
    startingFrom: null,
    featured: true,
  },
  {
    id: "svc-02",
    slug: "cabs-with-driver",
    name: "Cabs with a driver",
    shortName: "Cabs",
    tagline: "We drive, you enjoy the view",
    description:
      "City runs, full-day hires and multi-day island tours with one of our own drivers. Every driver is licensed, uniformed and knows the routes, the stops and the shortcuts.",
    icon: "steering",
    bullets: [
      "Point-to-point and full-day hires",
      "Licensed, uniformed drivers",
      "Multi-day tour packages",
      "Driver accommodation arranged",
    ],
    highlights: [
      {
        title: "Drivers who know the island",
        description:
          "Our drivers average eight years on the road and speak English alongside Sinhala or Tamil.",
      },
      {
        title: "Transparent day rates",
        description:
          "A full-day hire covers 10 hours and 100 km. Anything beyond that is billed at a published hourly and per-km rate.",
      },
      {
        title: "Tours planned for you",
        description:
          "Tell us where you want to go and we will build the itinerary, including stops, timings and overnight halts.",
      },
      {
        title: "Fixed city fares",
        description:
          "Common Colombo routes have flat fares, so a traffic jam never changes the price you were quoted.",
      },
    ],
    priceTable: [],
    startingFrom: null,
    featured: true,
  },
  {
    id: "svc-03",
    slug: "airport-transfers",
    name: "Airport transfers",
    shortName: "Airport",
    tagline: "Met at arrivals, every time",
    description:
      "Fixed-price transfers to and from Bandaranaike International Airport. We track your flight, so a delay costs you nothing and your driver is waiting when you walk out.",
    icon: "plane",
    bullets: [
      "Flat fares, no surge pricing",
      "Flight tracking included",
      "60 minutes free waiting time",
      "Name board at arrivals",
    ],
    highlights: [
      {
        title: "We watch the flight, not the clock",
        description:
          "Your driver adjusts to the actual landing time. Delays do not cost you a waiting charge.",
      },
      {
        title: "Meet and greet included",
        description:
          "The driver waits at arrivals with a name board and helps with luggage to the vehicle.",
      },
      {
        title: "Priced by destination",
        description:
          "You are quoted a flat fare to your address up front. Tolls and parking are already in it.",
      },
      {
        title: "Any hour of the night",
        description:
          "Pickups run around the clock at the same fare. There is no night surcharge.",
      },
    ],
    priceTable: [],
    startingFrom: null,
    featured: true,
  },
  {
    id: "svc-04",
    slug: "wedding-cars",
    name: "Wedding cars",
    shortName: "Weddings",
    tagline: "Arrive the way you pictured it",
    description:
      "Decorated luxury cars with a uniformed chauffeur for the ceremony, the homecoming and the photo shoot. Book the car alone or the full convoy for the family.",
    icon: "rings",
    bullets: [
      "Floral decoration included",
      "Uniformed chauffeur",
      "Convoy bookings for family",
      "Photo-shoot hours available",
    ],
    highlights: [
      {
        title: "Decoration is on us",
        description:
          "Fresh floral dressing in your colours comes with every wedding booking, arranged the morning of the event.",
      },
      {
        title: "A car held just for you",
        description:
          "Wedding vehicles are blocked out for the whole day. Nobody else is booked into your car.",
      },
      {
        title: "Convoys for the family",
        description:
          "Add sedans or a van for parents and the bridal party, all coordinated to arrive together.",
      },
      {
        title: "Rehearsal drive included",
        description:
          "The chauffeur drives the route beforehand so the timing on the day is exact.",
      },
    ],
    priceTable: [],
    startingFrom: null,
    featured: false,
  },
  {
    id: "svc-05",
    slug: "long-term-lease",
    name: "Long-term lease",
    shortName: "Leasing",
    tagline: "A company fleet without the paperwork",
    description:
      "Monthly and annual leasing for companies, expatriates and anyone who needs a vehicle for the long run. Servicing, insurance and replacement vehicles are all built into one monthly figure.",
    icon: "calendar",
    bullets: [
      "One-month minimum term",
      "Servicing and insurance included",
      "Replacement vehicle during service",
      "Corporate invoicing",
    ],
    highlights: [
      {
        title: "One predictable invoice",
        description:
          "Insurance, routine servicing, tyres and licence renewal are all inside the monthly rate.",
      },
      {
        title: "Never off the road",
        description:
          "When your vehicle goes in for service we deliver a like-for-like replacement the same day.",
      },
      {
        title: "Swap as needs change",
        description:
          "Move between vehicle classes at any renewal point without penalty.",
      },
      {
        title: "Built for company accounts",
        description:
          "Monthly invoicing, purchase order references and a named account manager for your business.",
      },
    ],
    priceTable: [],
    startingFrom: null,
    featured: false,
  },
];

export async function getServices(): Promise<Service[]> {
  return services;
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  return services.find((service) => service.slug === slug) ?? null;
}

export function getServiceSlugs(): ServiceSlug[] {
  return services.map((service) => service.slug);
}
