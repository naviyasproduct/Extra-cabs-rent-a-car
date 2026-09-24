import type { Car, Faq, Location, Service } from "@/types";
import { site, siteUrl } from "@/lib/data/site";
import { cloudinaryPosterUrl, cloudinaryUrl, cloudinaryVideoUrl, isPublicId } from "@/lib/cloudinary";

/**
 * Structured data builders.
 *
 * Everything here returns a plain object that gets rendered by <JsonLd>. Search
 * engines read these to understand what the page is about, which is what earns
 * rich results: an expandable FAQ, the business card with opening hours.
 *
 * NEVER emit aggregateRating or Review from invented numbers. Vehicle ratings
 * used to be built from made-up figures in cars.ts; that is against Google's
 * structured data policy and risks a manual action on the whole site. They were
 * removed on 2026-09-21. Only real, verifiable reviews may come back.
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
  electric: "Electric",
};

/**
 * What goes in schema.org `fuelType`.
 *
 * A hybrid is described as "Petrol hybrid" rather than as a fuel of its own:
 * the vehicle genuinely takes petrol, and the pairing is what people search
 * for.
 */
function fuelDescription(specs: Car["specs"]): string {
  const fuel = fuelLabels[specs.fuel];
  return specs.hybrid ? `${fuel} hybrid` : fuel;
}

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
    // The current hero. Kept in step with Hero.tsx on purpose: this is the
    // picture search results and link previews show for the business, and a
    // JSON-LD pointing at a retired file is a broken card waiting to happen.
    image: absoluteUrl("/images/home/home-new-vehicles-lineup.png"),
    telephone: site.phone,
    email: site.email,
    // Founded 1 January 2019, per the client.
    foundingDate: `${site.established}-01-01`,
    currenciesAccepted: "LKR",
    paymentAccepted: "Cash, Bank transfer",
    // No priceRange. It said "LKR 6,000 to LKR 30,000 per day", worked out
    // from the sample fleet removed on 2026-09-21. Add it back from real
    // rates once the fleet is listed, or it misstates the business.
    address: {
      "@type": "PostalAddress",
      streetAddress: [site.address.line1, site.address.line2].filter(Boolean).join(", "),
      addressLocality: site.address.city,
      ...(site.address.postal ? { postalCode: site.address.postal } : {}),
      addressCountry: "LK",
    },
    // The pin itself, read from the place link, not the map view centre. See
    // site.geo. A core signal for "near me" searches.
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.geo.latitude,
      longitude: site.geo.longitude,
    },
    hasMap: site.mapLink,
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
 * Product is what rich-result parsers look for when reading price.
 */
export function carLd(car: Car) {
  return {
    "@context": "https://schema.org",
    "@type": ["Product", "Car"],
    "@id": `${siteUrl}/fleet/${car.slug}#vehicle`,
    name: car.name,
    description: car.description,
    url: absoluteUrl(`/fleet/${car.slug}`),
    // A vehicle photo is a Cloudinary public id; anything else is a local path.
    image: car.images.map((image) => (isPublicId(image) ? cloudinaryUrl(image, { width: 1200 }) : absoluteUrl(image))),
    sku: car.slug,
    brand: { "@type": "Brand", name: car.brand },
    model: car.name,
    vehicleModelDate: String(car.year),
    numberOfDoors: car.specs.doors,
    vehicleSeatingCapacity: car.specs.seats,
    vehicleTransmission:
      car.specs.transmission === "automatic" ? "Automatic" : "Manual",
    fuelType: fuelDescription(car.specs),
    vehicleEngine: {
      "@type": "EngineSpecification",
      engineDisplacement: {
        "@type": "QuantitativeValue",
        value: car.specs.engineCc,
        unitCode: "CMQ",
      },
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

/**
 * The walkaround videos on a vehicle page, as VideoObjects.
 *
 * Google will not treat a video as a video without `thumbnailUrl`, `name`,
 * `description` and `uploadDate`, which is why the upload date is stored with
 * the id rather than guessed at here. `contentUrl` points at the MP4 itself so
 * the video can be indexed and shown as a video result, which is a second
 * place on the page for a vehicle to appear.
 *
 * Returns an empty array when the vehicle has no video, and the caller emits
 * nothing rather than an empty graph.
 */
export function vehicleVideoLd(car: Car) {
  return car.videos.map((video, index) => ({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${siteUrl}/fleet/${car.slug}#video-${index + 1}`,
    name: `${car.name} walkaround`,
    description:
      car.description.trim().length > 0
        ? car.description
        : `A look around the ${car.name} available to rent from ${site.name} in ${site.address.city}.`,
    thumbnailUrl: [cloudinaryPosterUrl(video.id, { width: 1280 })],
    uploadDate: video.uploadedAt,
    contentUrl: cloudinaryVideoUrl(video.id, { width: 1280 }),
    embedUrl: absoluteUrl(`/fleet/${car.slug}`),
    // The vehicle the video is of, so the two records are one thing to a
    // search engine rather than a page that happens to have a film on it.
    about: { "@id": `${siteUrl}/fleet/${car.slug}#vehicle` },
    publisher: { "@id": ORGANISATION_ID },
  }));
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
    // Only with a real price. An Offer with no price is noise to a crawler.
    ...(service.startingFrom
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "LKR",
            description: service.startingFrom,
            seller: { "@id": ORGANISATION_ID },
          },
        }
      : {}),
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
