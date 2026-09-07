import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Grid, Section, SectionHeader, Shell } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { LinkButton } from "@/components/ui/Button";
import { getServices } from "@/lib/data/services";

/**
 * Five services on the 12-column bed: the first is a wide feature tile
 * spanning six columns, the rest split the remaining six into a 3+3 pair
 * over two rows. Every tile shares the same radius and padding.
 */
export async function ServicesGrid() {
  const services = await getServices();
  const [lead, ...rest] = services;

  return (
    <Section band="paper" id="services">
      <Shell>
        <SectionHeader
          eyebrow="What we do"
          title="Four wheels, five ways"
          description="Whether you want the keys in your own hand or a driver waiting at arrivals, it is the same fleet and the same standard behind it."
          action={
            <LinkButton href="/services" variant="outline">
              All services
              <ArrowUpRight className="size-4" aria-hidden />
            </LinkButton>
          }
        />

        <Grid className="mt-8">
          {/* Lead tile */}
          <Link
            href={`/services/${lead.slug}`}
            className="group col-span-4 flex flex-col justify-between p-8 transition-colors duration-300 md:col-span-8 lg:col-span-6 lg:row-span-2 lg:p-10"
          >
            <div>
              <span className="grid size-14 place-items-center rounded-(--radius-inner) bg-brand">
                <Icon name={lead.icon} className="size-7" />
              </span>
              <h3 className="display-md mt-8">{lead.name}</h3>
              <p className="mt-4 max-w-[42ch] leading-relaxed text-ink-soft">
                {lead.description}
              </p>
              <ul className="mt-8 grid gap-2 sm:grid-cols-2">
                {lead.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-[0.9375rem] text-ink-soft">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-muted">Starting from</p>
                <p className="mt-1 font-display text-2xl font-bold">{lead.startingFrom}</p>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-field transition-colors group-hover:bg-brand">
                <ArrowUpRight className="size-5" aria-hidden />
              </span>
            </div>
          </Link>

          {/* Supporting tiles */}
          {rest.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group col-span-4 flex flex-col rounded-(--radius-card) bg-surface p-6 transition-shadow duration-300 hover:shadow-(--shadow-lift) md:col-span-4 lg:col-span-3"
            >
              <span className="grid size-12 place-items-center rounded-(--radius-inner) bg-brand-tint text-brand-bright transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
                <Icon name={service.icon} className="size-6" />
              </span>
              <h3 className="mt-6 font-display text-xl font-bold uppercase leading-tight">
                {service.name}
              </h3>
              <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted">
                {service.tagline}
              </p>
              <p className="mt-6 font-display text-sm font-semibold uppercase tracking-[0.08em] text-brand-bright">
                From {service.startingFrom}
              </p>
            </Link>
          ))}
        </Grid>
      </Shell>
    </Section>
  );
}
