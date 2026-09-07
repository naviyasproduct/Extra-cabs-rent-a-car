import type { Car, Faq, Location, Service } from "@/types";
import { site, siteUrl } from "@/lib/data/site";

/**
 * Structured data builders.
 *
 * Everything here returns a plain object that gets rendered by <JsonLd>. Search
 * engines read these to understand what the page is about, which is what earns
 * rich results: star ratings on a vehicle, an expandable FAQ, the business card
 * with opening hours.
 *
 * The @id values matter. They let separate blocks on separate pages refer to
 * the same entity, so the agency described on the home page is understood to be
 * the same agency selling the Prius on the vehicle page.
 */

/** Turns "/fleet/toyota-prius" into "https://example.com/fleet/toyota-prius". */
export function absoluteUrl(path: string = "/"): string {
  return new URL(path, `${siteUrl}/`).toString();
}

/** Stable identity for the business, referenced from every other block. */
const ORGANISATION_ID = `${siteUrl}/#organisation`;

const fuelLabels: Record<Car["specs"]["fuel"], string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  hybrid: "Hybrid",
  electric: "Electric",
};

/**
 * The agency itself. AutoRental is the schema.org type for a vehicle rental
 * business, more precise than a bare LocalBusiness and understood by Google.
 */
export function organisationLd(locations: Location[] = []) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    "@id": ORGANISATION_ID,
    name: site.name,
    legalName: site.legalName,
    description: site.description,
    url: absoluteUrl("/"),
    image: absoluteUrl("/images/home/hero-fleet.png"),
    telephone: site.phone,
    email: site.email,
    foundingDate: String(site.established),
    currenciesAccepted: "LKR",
    paymentAccepted: "Cash, Bank transfer",
    priceRange: "LKR 6,000 to LKR 30,000 per day",
    address: {
      "@type": "PostalAddress",
      streetAddress: [site.address.line1, site.address.line2].filter(Boolean).join(", "),
      addressLocality: site.address.city,
      ...(site.address.postal ? { postalCode: site.address.postal } : {}),
      addressCountry: "LK",
    },
    areaServed: { "@type": "Country", name: "Sri Lanka" },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [...site.openingHours.days],
        opens: site.openingHours.opens,
        closes: site.openingHours.closes,
      },
    ],
    sameAs: site.socials.map((social) => social.href),
    ...(locations.length > 0
      ? {
          location: locations.map((branch) => ({
            "@type": "Place",
            name: branch.name,
            address: { "@type": "PostalAddress", streetAddress: branch.address },
            telephone: branch.phone,
          })),
        }
      : {}),
  };
}

/** Names the site itself, so search engines can show a sitelinks box. */
export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: site.name,
    alternateName: site.shortName,
    url: absoluteUrl("/"),
    inLanguage: "en-LK",
    publisher: { "@id": ORGANISATION_ID },
  };
}

/**
 * A vehicle. Typed as both Product and Car: Car carries the specifications,
 * Product is what rich-result parsers look for when reading price and rating.
 */
export function carLd(car: Car) {
  return {
    "@context": "https://schema.org",
    "@type": ["Product", "Car"],
    "@id": `${siteUrl}/fleet/${car.slug}#vehicle`,
    name: car.name,
    description: car.description,
    url: absoluteUrl(`/fleet/${car.slug}`),
    image: car.images.map((image) => absoluteUrl(image)),
    sku: car.slug,
    brand: { "@type": "Brand", name: car.brand },
    model: car.name,
    vehicleModelDate: String(car.year),
    numberOfDoors: car.specs.doors,
    vehicleSeatingCapacity: car.specs.seats,
    vehicleTransmission:
      car.specs.transmission === "automatic" ? "Automatic" : "Manual",
    fuelType: fuelLabels[car.specs.fuel],
    vehicleEngine: {
      "@type": "EngineSpecification",
      engineDisplacement: {
        "@type": "QuantitativeValue",
        value: car.specs.engineCc,
        unitCode: "CMQ",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: car.rating,
      reviewCount: car.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/booking?car=${car.slug}`),
      priceCurrency: "LKR",
      price: car.pricing.daily,
      availability: car.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        priceCurrency: "LKR",
        price: car.pricing.daily,
        unitCode: "DAY",
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: 1,
          unitCode: "DAY",
        },
      },
      seller: { "@id": ORGANISATION_ID },
    },
  };
}

/** One of the five services, priced from its cheapest row. */
export function serviceLd(service: Service) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${siteUrl}/services/${service.slug}#service`,
    name: service.name,
    description: service.description,
    url: absoluteUrl(`/services/${service.slug}`),
    serviceType: service.name,
    provider: { "@id": ORGANISATION_ID },
    areaServed: { "@type": "Country", name: "Sri Lanka" },
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      description: service.startingFrom,
      seller: { "@id": ORGANISATION_ID },
    },
  };
}

/** The FAQ page. Earns the expandable question list in search results. */
export function faqLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteUrl}/faq#faq`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/** The trail shown above a search result, in place of a bare URL. */
export function breadcrumbLd(trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** A listing page, so the fleet and services indexes describe their contents. */
export function itemListLd(
  name: string,
  path: string,
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${siteUrl}${path}#list`,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}
