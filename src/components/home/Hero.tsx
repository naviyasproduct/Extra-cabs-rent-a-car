import Image from "next/image";
import { LinkButton } from "@/components/ui/Button";
import { Shell } from "@/components/ui/Layout";

/**
 * Hero.
 *
 * Centred and boxless: the wordmark, then the fleet, then one line of copy and
 * a single button. No slab behind any of it, so the cars sit on the black page
 * rather than in a container.
 *
 * The vehicles are pulled up into the bottom of the lettering with a negative
 * margin rather than absolutely positioned over it. An overlay would sit at a
 * fixed offset and collide with the cars at some widths; an overlap always
 * lands in the same place relative to the type, at every size.
 *
 * The top padding is navbar clearance plus a deliberate drop, so the wordmark
 * starts below the fold line rather than crowding the bar. The negative margin
 * on the image below is what sets the wordmark-to-cars gap, so changing the
 * drop moves the pair together and leaves that gap alone.
 *
 * The wordmark and the vehicles sit together on `.hero-stage`, which is full
 * width until the screen is too short to hold them, then bounded by
 * `--hero-cap` in globals.css. Without it the hero is sized off viewport width
 * alone, and a wide but short screen (a tablet in landscape, a short laptop)
 * gets a vehicle band that fills the display and pushes the copy and the
 * button off the bottom. The wordmark reads the same token, so the two shrink
 * by the same factor and the overlap still lands in the letterforms.
 */
export function Hero() {
  return (
    <section className="pt-[calc(4.75rem+var(--gap)+2rem)] text-center sm:pt-[calc(5.5rem+var(--gap)+3rem)]">
      <Shell>
        {/* Wordmark, with the fleet rising into it. Bounded by screen height
            as well as width, so it never outgrows a short display. */}
        <div className="hero-stage">
          <h1 className="display-hero text-brand">Extra Cabs</h1>

          {/*
            hero-fleet.png is a 2000x2000 square, but the vehicles only occupy
            y 788 to 1514 of it. That is 39% dead transparent space above the cars
            and 24% below, so `object-contain` in any box leaves a large invisible
            gap that no margin can close, and shrinks the cars to fit padding.

            So: a 5:2 frame cropped to the artwork with object-cover. The vertical
            object-position is derived, not guessed. The content centre sits at
            1151.5/2000 = 57.6% of the source. For a box of height 0.4W holding an
            image scaled to height W, the overflow is 0.6W, and centring that band
            needs 0.3755W / 0.6W = 62.6%.

            If the image is ever replaced, re-measure and update this number.
          */}
          <div className="relative -mt-4 aspect-[5/2] w-full sm:-mt-8 lg:-mt-12">
            <Image
              src="/images/home/hero-fleet.png"
              alt="Extra Cabs and Rent a Cars fleet: Toyota C-HR, Toyota Prius and Suzuki Wagon R Stingray"
              fill
              priority
              sizes="100vw"
              className="object-cover [object-position:50%_62.6%]"
            />
          </div>
        </div>

        <p className="mx-auto mt-5 max-w-[54ch] text-lg leading-relaxed text-ink-soft lg:text-xl">
          Self-drive rentals, cabs with a driver, airport transfers and wedding
          cars. Clean vehicles, honest daily rates, and a real person on the
          phone at any hour.
        </p>

        <div className="mt-7 flex justify-center">
          <LinkButton href="/fleet" size="lg" arrow>
            Browse the fleet
          </LinkButton>
        </div>
      </Shell>
    </section>
  );
}
