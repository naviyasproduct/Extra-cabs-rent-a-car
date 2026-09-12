import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Check,
  DoorOpen,
  Fuel,
  Gauge,
  Leaf,
  Snowflake,
  Users,
} from "lucide-react";
import { CarGallery } from "@/components/fleet/CarGallery";
import { PriceCard } from "@/components/fleet/PriceCard";
import { CarCard } from "@/components/fleet/CarCard";
import { QuickRequest } from "@/components/fleet/QuickRequest";
import { JsonLd } from "@/components/common/JsonLd";
import { breadcrumbLd, carLd } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";
import { AvailabilityDot, Badge, Rating } from "@/components/ui/Badge";
import { Grid, Section, SectionHeader, Shell } from "@/components/ui/Layout";
import { categoryLabels } from "@/lib/data/cars";
import { publicCarBySlug, publicCarSlugs, publicRelatedCars } from "@/lib/fleet";

export async function generateStaticParams() {
  return (await publicCarSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const car = await publicCarBySlug(slug);
  if (!car) return { title: "Vehicle not found" };

  const drivetrain = car.specs.hybrid ? `${car.specs.fuel} hybrid` : car.specs.fuel;

  const description = `Hire the ${car.name} (${car.year}) in Colombo from ${formatPrice(car.pricing.daily)} a day. ${car.specs.seats} seats, ${car.specs.transmission}, ${drivetrain}. Unlimited kilometres.`;

  return {
    title: `${car.name} hire`,
    description,
    alternates: { canonical: `/fleet/${car.slug}` },
    openGraph: {
      title: `${car.name} for hire`,
      description,
      url: `/fleet/${car.slug}`,
      type: "website",
      images: car.images.slice(0, 1).map((image) => ({ url: image })),
    },
  };
}

const included = [
  "Comprehensive insurance",
  "24/7 roadside assistance",
  "Free delivery inside Colombo",
  "Basic servicing and maintenance",
  "Unlimited kilometres",
  "Full tank at handover",
  "Second driver at no charge",
];

const requirements = [
  "Valid driving licence, or an international permit endorsed locally",
  "NIC or passport for identification",
  "Minimum age 23 with one year of driving experience",
  "Refundable deposit paid before handover",
];

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const car = await publicCarBySlug(slug);
  if (!car) notFound();

  const related = await publicRelatedCars(slug, 3);

  const specs = [
    { icon: Users, label: "Seats", value: `${car.specs.seats}` },
    { icon: DoorOpen, label: "Doors", value: `${car.specs.doors}` },
    {
      icon: Briefcase,
      label: "Luggage",
      value: `${car.specs.luggage} ${car.specs.luggage === 1 ? "bag" : "bags"}`,
    },
    {
      icon: Gauge,
      label: "Transmission",
      value: car.specs.transmission === "automatic" ? "Automatic" : "Manual",
    },
    {
      icon: Fuel,
      label: "Fuel",
      // The real fuel, which is what the customer needs at the pump. Hybrid is
      // the cell after this one, because a hybrid still takes petrol.
      value: car.specs.fuel.charAt(0).toUpperCase() + car.specs.fuel.slice(1),
    },
    ...(car.specs.hybrid
      ? [{ icon: Leaf, label: "Drivetrain", value: "Hybrid" }]
      : []),
    {
      icon: Snowflake,
      label: "Climate",
      value: car.specs.airConditioned ? "Air conditioned" : "Fan only",
    },
  ];

  return (
    <>
      <JsonLd data={carLd(car)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Fleet", path: "/fleet" },
          { name: car.name, path: `/fleet/${car.slug}` },
        ])}
      />

      {/* Header slab */}
      <section className="pt-[calc(4.75rem+var(--gap))] sm:pt-[calc(5.5rem+var(--gap))]">
        <Shell>
          <div className="rounded-(--radius-shell) bg-surface-alt px-6 py-10 sm:px-8 lg:px-12 lg:py-12">
            <Link
              href="/fleet"
              className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-brand-bright"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to the fleet
            </Link>

            <Grid className="items-end">
              <div className="col-span-4 md:col-span-8 lg:col-span-8">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <Badge tone="dark">{categoryLabels[car.category]}</Badge>
                  {car.badge ? <Badge tone="brand">{car.badge}</Badge> : null}
                  <span className="text-sm text-muted">{car.year} model</span>
                </div>
                <h1 className="display-lg">{car.name}</h1>
                <p className="mt-4 max-w-[48ch] text-lg text-ink-soft">{car.tagline}</p>
              </div>

              <div className="col-span-4 mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 md:col-span-8 lg:col-span-4 lg:mt-0 lg:justify-end">
                <Rating value={car.rating} count={car.reviewCount} />
                <AvailabilityDot available={car.available} />
              </div>
            </Grid>
          </div>
        </Shell>
      </section>

      {/* Gallery + booking card */}
      <Section band="paper" spacing="default">
        <Shell>
          <Grid className="items-start">
            <div className="col-span-4 md:col-span-8 lg:col-span-8">
              <CarGallery images={car.images} name={car.name} badge={car.badge} />

              {/* Specs */}
              <div className="mt-(--gap) rounded-(--radius-card) bg-surface p-6 lg:p-8">
                <h2 className="font-display text-xl font-bold uppercase">
                  Specifications
                </h2>
                <dl className="mt-6 grid grid-cols-2 gap-(--gap) sm:grid-cols-3">
                  {specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="rounded-(--radius-inner) bg-surface-alt p-4"
                    >
                      <spec.icon className="size-5 text-brand-bright" aria-hidden />
                      <dt className="mt-3 text-sm uppercase tracking-[0.12em] text-muted">
                        {spec.label}
                      </dt>
                      <dd className="mt-1 font-display text-lg font-bold">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Description + features */}
              <div className="mt-(--gap) rounded-(--radius-card) bg-surface p-6 lg:p-8">
                <h2 className="font-display text-xl font-bold uppercase">
                  About this vehicle
                </h2>
                <p className="mt-4 max-w-[64ch] leading-relaxed text-ink-soft">
                  {car.description}
                </p>

                <div className="rule my-7" />

                <h3 className="font-display text-lg font-bold uppercase">
                  Features and equipment
                </h3>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {car.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[0.9375rem]">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand-bright" aria-hidden />
                      <span className="text-ink-soft">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Included + requirements */}
              <div className="mt-(--gap) grid gap-(--gap) sm:grid-cols-2">
                <div className="rounded-(--radius-card) bg-surface p-6 lg:p-8">
                  <h3 className="font-display text-lg font-bold uppercase">
                    In the price
                  </h3>
                  <ul className="mt-5 space-y-3">
                    {included.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[0.9375rem]">
                        <Check className="mt-0.5 size-4 shrink-0 text-brand-bright" aria-hidden />
                        <span className="text-ink-soft">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-(--radius-card) bg-surface-alt p-6 lg:p-8">
                  <h3 className="font-display text-lg font-bold uppercase">
                    What you need
                  </h3>
                  <ul className="mt-5 space-y-3">
                    {requirements.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[0.9375rem]">
                        <span
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-brand"
                          aria-hidden
                        />
                        <span className="text-ink-soft">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Ask for this vehicle without leaving the page */}
              <QuickRequest car={car} />
            </div>

            {/* Booking card */}
            <div className="col-span-4 mt-(--gap) md:col-span-8 lg:col-span-4 lg:mt-0">
              <PriceCard car={car} />
            </div>
          </Grid>
        </Shell>
      </Section>

      {/* Related */}
      <Section band="alt">
        <Shell>
          <SectionHeader
            eyebrow="Also consider"
            title="Similar vehicles"
            description="Other options in the fleet that suit the same kind of trip."
          />
          <Grid className="mt-8">
            {related.map((item) => (
              <CarCard key={item.id} car={item} className="col-span-4 lg:col-span-4" />
            ))}
          </Grid>
        </Shell>
      </Section>
    </>
  );
}
