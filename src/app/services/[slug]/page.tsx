import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CarCard } from "@/components/fleet/CarCard";
import { LinkButton } from "@/components/ui/Button";
import { Grid, Section, SectionHeader, Shell } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { getServiceBySlug, getServiceSlugs, getServices } from "@/lib/data/services";
import { getFeaturedCars } from "@/lib/data/cars";
import { bookingSteps } from "@/lib/data/content";
import { site } from "@/lib/data/site";

export function generateStaticParams() {
  return getServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "Service not found" };

  return { title: service.name, description: service.description };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const [cars, allServices] = await Promise.all([getFeaturedCars(3), getServices()]);
  const others = allServices.filter((item) => item.slug !== service.slug);

  return (
    <>
      <PageHeader
        eyebrow={service.tagline}
        title={service.name}
        description={service.description}
        crumbs={[{ label: "Services", href: "/services" }, { label: service.shortName }]}
        aside={
          <div className="rounded-(--radius-card) bg-surface p-6">
            <span className="grid size-12 place-items-center rounded-(--radius-inner) bg-brand-tint text-brand">
              <Icon name={service.icon} className="size-6" />
            </span>
            <p className="mt-5 text-sm uppercase tracking-[0.16em] text-muted">
              Starting from
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold">
              {service.startingFrom}
            </p>
            <LinkButton href="/booking" size="lg" className="mt-6 w-full">
              Request a quote
              <ArrowRight className="size-4" aria-hidden />
            </LinkButton>
            <a
              href={`tel:${site.phone.replace(/\s/g, "")}`}
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-surface-alt font-semibold transition-colors hover:bg-line"
            >
              <Phone className="size-4 text-brand" aria-hidden />
              {site.phone}
            </a>
          </div>
        }
      />

      {/* Highlights */}
      <Section band="paper">
        <Shell>
          <SectionHeader
            eyebrow="What you get"
            title="How this works"
            description="The details that matter once the booking is confirmed."
          />

          <Grid className="mt-8">
            {service.highlights.map((highlight, index) => (
              <div
                key={highlight.title}
                className="col-span-4 rounded-(--radius-card) bg-surface p-6 md:col-span-4 lg:col-span-3 lg:p-7"
              >
                <span className="font-display text-sm font-bold text-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold uppercase leading-tight">
                  {highlight.title}
                </h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                  {highlight.description}
                </p>
              </div>
            ))}
          </Grid>
        </Shell>
      </Section>

      {/* Rates + inclusions */}
      <Section band="alt">
        <Shell>
          <Grid className="items-start">
            <div className="col-span-4 md:col-span-8 lg:col-span-7">
              <h2 className="display-md">Rates</h2>
              <p className="mt-4 max-w-[48ch] text-muted">
                A guide to what this service costs. Final quotes account for the
                dates, distance and any extras you add.
              </p>

              <div className="mt-8 rounded-(--radius-card) bg-surface p-6 lg:p-8">
                <ul>
                  {service.priceTable.map((row, index) => (
                    <li key={row.label}>
                      {index > 0 ? <div className="rule" /> : null}
                      <div className="flex items-baseline justify-between gap-4 py-4">
                        <div className="min-w-0">
                          <p className="font-semibold">{row.label}</p>
                          <p className="mt-0.5 text-sm text-muted">{row.detail}</p>
                        </div>
                        <p className="shrink-0 font-display text-lg font-bold">
                          {row.price}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="col-span-4 mt-8 md:col-span-8 lg:col-span-4 lg:col-start-9 lg:mt-0">
              <div className="rounded-(--radius-card) bg-ink p-6 text-white lg:p-7">
                <h3 className="font-display text-lg font-bold uppercase">Included</h3>
                <ul className="mt-5 space-y-3">
                  {service.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5 text-[0.9375rem]">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                      <span className="text-white/75">{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 h-px bg-white/10" />

                <h3 className="mt-6 font-display text-lg font-bold uppercase">
                  Booking in four steps
                </h3>
                <ol className="mt-4 space-y-3">
                  {bookingSteps.map((step) => (
                    <li key={step.step} className="flex gap-3 text-[0.9375rem]">
                      <span className="font-display font-bold text-brand">{step.step}</span>
                      <span className="text-white/70">{step.title}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Grid>
        </Shell>
      </Section>

      {/* Vehicles */}
      <Section band="paper">
        <Shell>
          <SectionHeader
            eyebrow="The vehicles"
            title="Cars used for this"
            description="Any vehicle in the fleet can be booked for this service. These are the ones people choose most often."
            action={
              <LinkButton href="/fleet" variant="outline">
                See the full fleet
              </LinkButton>
            }
          />
          <Grid className="mt-8">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} className="col-span-4 lg:col-span-4" />
            ))}
          </Grid>
        </Shell>
      </Section>

      {/* Other services */}
      <Section band="alt">
        <Shell>
          <SectionHeader eyebrow="Also available" title="Our other services" />
          <Grid className="mt-8">
            {others.map((item) => (
              <a
                key={item.slug}
                href={`/services/${item.slug}`}
                className="group col-span-4 rounded-(--radius-card) bg-surface p-6 transition-shadow duration-300 hover:shadow-(--shadow-lift) md:col-span-4 lg:col-span-3"
              >
                <span className="grid size-11 place-items-center rounded-(--radius-inner) bg-brand-tint text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                  <Icon name={item.icon} className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold uppercase leading-tight">
                  {item.shortName}
                </h3>
                <p className="mt-2 text-sm text-muted">{item.tagline}</p>
              </a>
            ))}
          </Grid>
        </Shell>
      </Section>
    </>
  );
}
