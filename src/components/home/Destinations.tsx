import Link from "next/link";
import { ArrowUpRight, Clock, Route } from "lucide-react";
import { Grid, Section, SectionHeader, Shell } from "@/components/ui/Layout";
import { SafeImage } from "@/components/common/SafeImage";
import { getDestinations } from "@/lib/data/content";
import { formatPrice } from "@/lib/utils";

/**
 * Popular routes. Two rows of three, sharing the fleet-card radius so the two
 * sections read as the same family of tiles.
 */
export async function Destinations() {
  const destinations = await getDestinations();

  return (
    <Section band="paper">
      <Shell>
        <SectionHeader
          eyebrow="Where people go"
          title="Popular routes"
          description="Indicative return fares with a driver, including fuel and the driver allowance. Tell us the dates and we will confirm an exact quote."
        />

        <Grid className="mt-8">
          {destinations.map((destination) => (
            <Link
              key={destination.id}
              href="/booking"
              className="group relative col-span-4 overflow-hidden rounded-(--radius-card) bg-ink md:col-span-4 lg:col-span-4"
            >
              <div className="relative aspect-[5/4]">
                <SafeImage
                  src={destination.image}
                  alt={destination.name}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="transition-transform duration-500 group-hover:scale-[1.04]"
                  fallbackClassName="bg-charcoal"
                  fallback={
                    <span className="px-4 text-center font-display text-5xl font-extrabold uppercase leading-none text-white/20">
                      {destination.name}
                    </span>
                  }
                />
                {/* Flat scrim, not a glow — keeps the caption readable on any photo. */}
                <div className="absolute inset-0 bg-ink/40 transition-colors duration-300 group-hover:bg-ink/50" />

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h3 className="font-display text-2xl font-bold uppercase text-white">
                        {destination.name}
                      </h3>
                      <p className="mt-1 text-sm text-white/60">{destination.region}</p>
                    </div>
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 text-white transition-colors group-hover:bg-brand">
                      <ArrowUpRight className="size-4" aria-hidden />
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
                    <span className="inline-flex items-center gap-1.5">
                      <Route className="size-3.5" aria-hidden />
                      {destination.distanceKm} km
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" aria-hidden />
                      {destination.driveTime}
                    </span>
                    <span className="ml-auto font-display font-semibold text-white">
                      from {formatPrice(destination.fromPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </Grid>
      </Shell>
    </Section>
  );
}
