import { ArrowUpRight } from "lucide-react";
import { CarCard } from "@/components/fleet/CarCard";
import { NoVehiclesYet } from "@/components/fleet/NoVehiclesYet";
import { LinkButton } from "@/components/ui/Button";
import { Grid, Section, SectionHeader, Shell } from "@/components/ui/Layout";
import { publicCars, publicShowcaseCars } from "@/lib/fleet";

export const SHOWCASE_COUNT = 8;

/**
 * Eight vehicles, four to a row on desktop, two on tablet, a list on phones.
 *
 * Four rather than three because this is the section people scroll to, and two
 * full rows read as a fleet where one row and a stranded pair reads as an
 * accident. Featured vehicles come first, then the rest fill the grid, so the
 * layout stays square however many are flagged featured in the database.
 */
export async function FeaturedFleet() {
  const [cars, all] = await Promise.all([
    publicShowcaseCars(SHOWCASE_COUNT),
    publicCars(),
  ]);

  return (
    <Section band="alt" id="fleet">
      <Shell>
        <SectionHeader
          eyebrow="The fleet"
          title="Pick your ride"
          description="Hatchbacks, hybrids and SUVs for every kind of trip. Every one is serviced on schedule and cleaned before it reaches you."
          action={
            // No "See all 0 models" while the fleet is still being listed.
            all.length > 0 ? (
              <LinkButton href="/fleet" variant="dark">
                See all {all.length} {all.length === 1 ? "model" : "models"}
                <ArrowUpRight className="size-4" aria-hidden />
              </LinkButton>
            ) : undefined
          }
        />

        {cars.length === 0 ? <NoVehiclesYet className="mt-8" /> : null}

        <Grid className="mt-8">
          {cars.map((car, index) => (
            <CarCard
              key={car.id}
              car={car}
              eager={index === 0}
              className="col-span-4 md:col-span-4 lg:col-span-3"
            />
          ))}
        </Grid>
      </Shell>
    </Section>
  );
}
