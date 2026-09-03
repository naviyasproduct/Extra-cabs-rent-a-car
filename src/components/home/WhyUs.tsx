import { Grid, Section, Shell } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { differentiators } from "@/lib/data/content";
import { site } from "@/lib/data/site";

/**
 * Dark band.
 *
 * The stats slab is pulled up so it sits half on the light section above and
 * half on the dark one below — the seam between the two bands runs straight
 * through it, which is what welds the two together.
 */
export function WhyUs() {
  return (
    <Section band="dark" spacing="flush">
      {/* flow-root establishes a block formatting context so the slab's
          negative margin overlaps the band above instead of collapsing
          through and dragging the whole section up with it. */}
      <Shell className="flow-root">
        {/* Stats slab straddling the seam */}
        <div className="overlap-up grid grid-cols-2 gap-px overflow-hidden rounded-(--radius-shell) bg-line lg:grid-cols-4">
          {site.stats.map((stat) => (
            // text-ink is explicit: the cells sit inside a dark band that sets
            // text-white, which would otherwise make the figures invisible.
            <div
              key={stat.label}
              className="bg-surface px-6 py-8 text-center text-ink lg:py-10"
            >
              <p className="font-display text-4xl font-extrabold leading-none lg:text-5xl">
                {stat.value}
                <span className="text-brand">{stat.suffix}</span>
              </p>
              <p className="mx-auto mt-3 max-w-[18ch] text-sm leading-snug text-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="pb-(--section-y) pt-(--section-y)">
          <Grid>
            <div className="col-span-4 md:col-span-8 lg:col-span-4">
              <p className="eyebrow mb-3">Why Extra</p>
              <h2 className="display-lg text-white">
                The boring things,
                <br />
                done properly
              </h2>
              <p className="mt-5 max-w-[38ch] leading-relaxed text-white/60">
                Anyone can list a car online. What people come back for is the
                paperwork being quick, the price not moving, and someone
                answering the phone when a tyre goes flat outside Matara.
              </p>
            </div>

            <div className="col-span-4 md:col-span-8 lg:col-span-8">
              <Grid className="gap-y-8 lg:grid-cols-8">
                {differentiators.map((item) => (
                  <div key={item.title} className="col-span-4 md:col-span-4 lg:col-span-4">
                    <span className="grid size-11 place-items-center rounded-(--radius-inner) bg-white/10 text-brand">
                      <Icon name={item.icon} className="size-5" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-bold uppercase text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-[36ch] text-[0.9375rem] leading-relaxed text-white/55">
                      {item.description}
                    </p>
                  </div>
                ))}
              </Grid>
            </div>
          </Grid>
        </div>
      </Shell>
    </Section>
  );
}
