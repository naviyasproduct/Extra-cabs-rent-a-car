import type { Service, ServiceSlug } from "@/types";

/**
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
          "The rate you see is the rate you pay. Insurance, basic maintenance and unlimited kilometres are all in the daily price.",
      },
      {
        title: "Delivered to your door",
        description:
          "We drop the vehicle wherever you are inside Colombo at no cost, and collect it the same way when you are done.",
      },
      {
        title: "Unlimited kilometres",
        description:
          "No distance limit and no per-kilometre charge. Drive as far as the trip needs.",
      },
      {
        title: "Cleaned before every handover",
        description:
          "Every car is washed inside and out, fuelled and safety-checked before it reaches you.",
      },
    ],
    priceTable: [
      { label: "Micro & budget", detail: "Alto, Wagon R", price: "From LKR 5,500 / day" },
      { label: "Hatchback & sedan", detail: "Aqua, Prius, Premio", price: "From LKR 9,500 / day" },
      { label: "SUV & 4x4", detail: "C-HR, Vezel, Prado", price: "From LKR 13,500 / day" },
      { label: "Van", detail: "KDH Hiace", price: "From LKR 18,500 / day" },
    ],
    startingFrom: "LKR 5,500 / day",
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
    priceTable: [
      { label: "City hire", detail: "Within Colombo, per hour", price: "LKR 1,800 / hour" },
      { label: "Full day", detail: "10 hours + 100 km", price: "From LKR 14,000 / day" },
      { label: "Outstation day", detail: "Beyond Western Province", price: "From LKR 18,000 / day" },
      { label: "Driver batta", detail: "Overnight allowance", price: "LKR 2,500 / night" },
    ],
    startingFrom: "LKR 1,800 / hour",
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
    priceTable: [
      { label: "BIA to Colombo", detail: "Sedan, up to 3 passengers", price: "LKR 9,500" },
      { label: "BIA to Negombo", detail: "Sedan, up to 3 passengers", price: "LKR 5,500" },
      { label: "BIA to Kandy", detail: "SUV, up to 4 passengers", price: "LKR 22,000" },
      { label: "BIA to Galle", detail: "SUV, up to 4 passengers", price: "LKR 26,000" },
    ],
    startingFrom: "LKR 5,500",
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
    priceTable: [
      { label: "Luxury sedan", detail: "Mercedes-Benz E-Class, decorated", price: "From LKR 45,000" },
      { label: "Premium SUV", detail: "Prado or Montero, decorated", price: "From LKR 32,000" },
      { label: "Family convoy", detail: "Two sedans + one van", price: "From LKR 65,000" },
      { label: "Photo-shoot hours", detail: "Additional, per hour", price: "LKR 4,500 / hour" },
    ],
    startingFrom: "LKR 32,000",
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
    priceTable: [
      { label: "Micro & budget", detail: "12-month term", price: "From LKR 120,000 / month" },
      { label: "Sedan", detail: "12-month term", price: "From LKR 265,000 / month" },
      { label: "SUV", detail: "12-month term", price: "From LKR 310,000 / month" },
      { label: "Van", detail: "12-month term", price: "From LKR 420,000 / month" },
    ],
    startingFrom: "LKR 120,000 / month",
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
