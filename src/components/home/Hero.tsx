import { getImageProps } from "next/image";
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
  /*
    Art direction: two different photographs, one download.

    The client supplied a wide eight-vehicle lineup for desktop and a three
    vehicle version for phones, which is a change of composition and not just
    a change of size, so `sizes` alone cannot express it. Two <Image>
    components toggled with `hidden` would not do either: a display:none
    image is still fetched, so every phone would pay for the desktop file.

    getImageProps gives the optimiser's srcSet without rendering an <img>,
    which is what lets a single <picture> hold both and let the browser pick
    one. It is the pattern in the Next 16 image docs under Art Direction.

    Not preloaded, on purpose. A preload link names one file in the <head>,
    and which file this hero wants depends on the viewport: preloading the
    desktop lineup on a phone costs more than the preload saves, which is why
    the docs say not to preload when the LCP element changes with the screen.
    The documented substitute is here instead: loading="eager" so it never
    waits for lazy loading, and fetchPriority="high" so it is requested with
    the urgency a preload would have given it. Media-scoped <link rel=preload>
    tags were tried and dropped: React left them in the body rather than
    hoisting them to the head, where they would have been parsed a few bytes
    before the <img> itself and bought nothing.
  */
  const common = {
    alt:
      "Vehicles from the Extra Cabs and Rent a Cars fleet lined up on a red " +
      "stage, led by a red Toyota C-HR with a Toyota Prius and a Suzuki " +
      "Wagon R beside it",
    // The stage is one shell wide, not one viewport wide. It stops growing at
    // --shell (1280px), so above that the old "100vw" asked the browser for an
    // image up to twice the width it renders at.
    sizes: "(min-width: 1280px) 1280px, 100vw",
  };

  const {
    props: { srcSet: desktop },
  } = getImageProps({
    ...common,
    src: "/images/home/home-new-vehicles-lineup.png",
    width: 1774,
    height: 887,
  });

  const {
    props: { srcSet: mobile, ...img },
  } = getImageProps({
    ...common,
    src: "/images/home/home-new-vehicles-lineup-mobile.png",
    width: 2000,
    height: 2000,
  });

  return (
    <section className="pt-[calc(4.75rem+var(--gap)+2rem)] text-center sm:pt-[calc(5.5rem+var(--gap)+3rem)]">
      <Shell>
        {/* Wordmark, with the fleet rising into it. Bounded by screen height
            as well as width, so it never outgrows a short display. */}
        <div className="hero-stage">
          <h1 className="display-hero text-brand">Extra Cabs</h1>

          {/*
            Both files are mostly transparent padding, so the frame is cropped
            to the artwork with object-cover and the vertical object-position
            is DERIVED, not guessed. Measured opaque boxes:

              desktop  1774x887,   cars y 301 to 652   (34% dead above, 26% below)
              mobile   2000x2000,  cars y 788 to 1515  (39% above, 24% below)

            For a frame of ratio R holding an image of source ratio S scaled to
            fill the width, with the content centred at fraction c of the source
            height, the position that centres the cars is

              p = (c/S - 1/2R) / (1/S - 1/R)

            desktop: c = 476.5/887 = 0.5372, S = 2, R = 5   ->  56.2%
            mobile:  c = 1151.5/2000 = 0.5758, S = 1, R = 2.5 ->  62.6%

            The two frames differ because the two photographs do: the desktop
            lineup is a 5:1 strip of eight vehicles, the phone one is a 2.7:1
            group of three. A single ratio would leave one of them swimming in
            empty space, which is the fault this crop exists to avoid.

            If either image is replaced, re-measure and redo this arithmetic.
          */}
          <div className="relative -mt-4 aspect-[5/2] w-full sm:-mt-8 md:aspect-[5/1] lg:-mt-12">
            <picture>
              <source media="(min-width: 768px)" srcSet={desktop} />
              <img
                {...img}
                srcSet={mobile}
                loading="eager"
                fetchPriority="high"
                className="absolute inset-0 size-full object-cover [object-position:50%_62.6%] md:[object-position:50%_56.2%]"
              />
            </picture>
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
