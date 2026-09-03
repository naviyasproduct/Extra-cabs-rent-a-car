import { ArrowUpRight } from "lucide-react";
import { CarCard } from "@/components/fleet/CarCard";
import { LinkButton } from "@/components/ui/Button";
import { Grid, Section, SectionHeader, Shell } from "@/components/ui/Layout";
import { getFeaturedCars } from "@/lib/data/cars";

/** Six featured vehicles, three to a row on the shared 12-column bed. */
export async function FeaturedFleet() {
  const cars = await getFeaturedCars(6);

  return (
    <Section band="alt" id="fleet">
      <Shell>
        <SectionHeader
          eyebrow="The fleet"
          title="Pick your ride"
          description="Forty vehicles on the road, from an Alto for the school run to a Prado for the hill country. Every one is serviced on schedule and cleaned before it reaches you."
          action={
            <LinkButton href="/fleet" variant="dark">
              See all 12 models
              <ArrowUpRight className="size-4" aria-hidden />
            </LinkButton>
          }
        />

        <Grid className="mt-8">
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              className="col-span-4 md:col-span-4 lg:col-span-4"
            />
          ))}
        </Grid>
      </Shell>
    </Section>
  );
}
