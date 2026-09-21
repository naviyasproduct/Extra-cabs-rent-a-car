import type { Metadata } from "next";
import { Clock, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { Grid, Section, SectionHeader, Shell } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { differentiators, getLocations } from "@/lib/data/content";
import { site } from "@/lib/data/site";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  openGraph: { url: "/about" },
  title: "About us",
  description:
    "Extra Cabs & Rent a Cars has been renting vehicles in Sri Lanka since 2019, from one office in Heiyanthuduwa, Biyagama. Self-drive hire, cabs with a driver and airport transfers.",
};

/*
 * There used to be a four-step history here (2016 to 2025, "Forty vehicles",
 * an airport counter) and a stats panel ("12k+ rentals", "4.8/5"). None of it
 * was real, and the business was founded in 2019, so both were removed on
 * 2026-09-21. Add real milestones when the client supplies them.
 */

export default async function AboutPage() {
  const locations = await getLocations();

  return (
    <>
      <PageHeader
        eyebrow="About us"
        title="A rental company that answers the phone"
        description={`We have been putting people in cars across Sri Lanka since ${site.established}. The fleet has grown; the way we hand over a vehicle has not changed.`}
        crumbs={[{ label: "About" }]}
      />

      {/* Story */}
      <Section band="paper">
        <Shell>
          <Grid className="items-start">
            <div className="col-span-4 md:col-span-8 lg:col-span-5">
              <p className="eyebrow mb-3">Our story</p>
              <h2 className="display-lg">
                Built on
                <br />
                repeat customers
              </h2>
            </div>

            <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-7">
              <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
                <p>
                  Extra Cabs started because renting a car in Colombo used to mean
                  three phone calls, an unclear price and a vehicle that arrived
                  half full. We thought that was a low bar to clear.
                </p>
                <p>
                  Since {site.established} the operation has grown but the rules are the
                  same: publish the real price, hand over a clean car with a full
                  tank, and pick up the phone whenever it rings. Most of our
                  business still comes from people who rented once and told
                  someone else.
                </p>
                <p>
                  We run the fleet ourselves rather than brokering other people&apos;s
                  vehicles, which is why we can tell you exactly when a car was
                  last serviced and who drove it before you.
                </p>
              </div>
            </div>
          </Grid>
        </Shell>
      </Section>

      {/* Values */}
      <Section band="paper">
        <Shell>
          <SectionHeader
            eyebrow="How we work"
            title="What we hold ourselves to"
            description="Six commitments that show up on every single rental, from a one-day hire to a twelve-month corporate lease."
          />

          <Grid className="mt-8">
            {differentiators.map((item) => (
              <div
                key={item.title}
                className="col-span-4 rounded-(--radius-card) bg-surface p-6 md:col-span-4 lg:col-span-4 lg:p-7"
              >
                <span className="grid size-12 place-items-center rounded-(--radius-inner) bg-brand-tint text-brand-bright">
                  <Icon name={item.icon} className="size-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold uppercase">
                  {item.title}
                </h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                  {item.description}
                </p>
              </div>
            ))}
          </Grid>
        </Shell>
      </Section>

      {/* Locations */}
      <Section band="alt">
        <Shell>
          <SectionHeader
            eyebrow="Find us"
            title="Where to find us"
            description="Collect from the office, or let us deliver the vehicle to your address."
            action={
              <LinkButton href="/contact" variant="dark">
                Contact details
              </LinkButton>
            }
          />

          <Grid className="mt-8">
            {locations.map((location) => (
              <div
                key={location.id}
                className="col-span-4 bg-tile p-6 md:col-span-8 lg:col-span-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-bold uppercase leading-tight">
                    {location.name}
                  </h3>
                  <span className="mt-1 shrink-0 rounded-full bg-brand-tint px-2.5 py-1 font-display text-xs font-semibold uppercase tracking-[0.12em] text-brand-bright">
                    {location.type}
                  </span>
                </div>

                <ul className="mt-5 space-y-3 text-[0.9375rem]">
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                    <span className="text-ink-soft">{location.address}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                    <span className="text-ink-soft">{location.hours}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                    <a
                      href={`tel:${location.phone.replace(/\s/g, "")}`}
                      className="text-ink-soft transition-colors hover:text-brand-bright"
                    >
                      {location.phone}
                    </a>
                  </li>
                </ul>
              </div>
            ))}
          </Grid>
        </Shell>
      </Section>
    </>
  );
}
