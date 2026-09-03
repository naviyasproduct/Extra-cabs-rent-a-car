import Image from "next/image";
import { Check } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { Grid, Shell } from "@/components/ui/Layout";
import { Rating } from "@/components/ui/Badge";
import { SearchBar } from "./SearchBar";

const promises = [
  "Insurance included",
  "Free Colombo delivery",
  "No hidden charges",
];

/**
 * Hero.
 *
 * The copy sits on columns 1-5 and the vehicle plate on 6-12, both inside one
 * rounded slab. The plate is given the wider half deliberately — it carries
 * the brand lockup as well as the cars, so it needs the room. The search card
 * is pulled up so it straddles the bottom edge of that slab: the first of the
 * deliberate overlaps that stitch the page together.
 */
export function Hero() {
  return (
    <section className="bg-paper pt-[calc(4.75rem+var(--gap))] sm:pt-[calc(5.5rem+var(--gap))]">
      <Shell>
        <div className="overflow-hidden rounded-(--radius-shell) bg-surface-alt px-6 pt-8 pb-[calc(var(--overlap)+2rem)] sm:px-8 lg:px-12 lg:pt-10">
          <Grid className="items-center">
            {/* Copy */}
            <div className="col-span-4 md:col-span-8 lg:col-span-5">
              <h1 className="display-xl">
                Rent a car.
                <br />
                <span className="text-brand">Or let us drive.</span>
              </h1>

              <p className="mt-5 max-w-[42ch] text-lg leading-relaxed text-ink-soft">
                Self-drive rentals, cabs with a driver, airport transfers and
                wedding cars. Clean vehicles, honest daily rates, and a real
                person on the phone at any hour.
              </p>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {promises.map((promise) => (
                  <li
                    key={promise}
                    className="inline-flex items-center gap-2 font-medium text-ink-soft"
                  >
                    <Check className="size-5 text-brand" aria-hidden />
                    {promise}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-2.5">
                <LinkButton href="/fleet" size="lg" arrow>
                  Browse the fleet
                </LinkButton>
                <LinkButton href="/services" variant="light" size="lg" arrow>
                  See our services
                </LinkButton>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
                <Rating value={4.8} count={412} className="text-base" />
                <span className="h-4 w-px bg-line-strong" aria-hidden />
                <span className="text-muted">
                  40+ vehicles &middot; 12,000+ completed rentals
                </span>
              </div>
            </div>

            {/* Vehicle plate. Pushed out past the slab padding on large screens
                so the cars read at full size rather than politely boxed in. */}
            <div className="col-span-4 mt-8 md:col-span-8 lg:col-span-7 lg:mt-0 lg:-mr-6 xl:-mr-10">
              <div className="relative aspect-[5/4] w-full lg:aspect-square">
                <Image
                  src="/images/home/hero-fleet.png"
                  alt="Extra Cabs and Rent a Cars fleet: Toyota C-HR, Toyota Prius and Suzuki Wagon R Stingray"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-contain object-center"
                />
              </div>
            </div>
          </Grid>
        </div>

        {/* Overlapping search card */}
        <div className="overlap-up">
          <SearchBar />
        </div>
      </Shell>
    </section>
  );
}
