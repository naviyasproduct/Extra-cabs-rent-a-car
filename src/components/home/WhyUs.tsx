import { Grid, Section, Shell } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { differentiators } from "@/lib/data/content";

/**
 * Dark band.
 *
 * There used to be a stats slab here ("12k+ completed rentals", "4.8/5
 * average rating") straddling the seam with the section above. The figures
 * were invented, so it was removed on 2026-09-21. Do not bring it back
 * without numbers the client can stand behind.
 */
export function WhyUs() {
  return (
    <Section band="dark" spacing="flush">
      <Shell>
        <div className="pb-(--section-y) pt-(--section-y)">
          <Grid>
            <div className="col-span-4 md:col-span-8 lg:col-span-4">
              <p className="eyebrow mb-3">Why Extra</p>
              <h2 className="display-lg text-ink">
                The boring things,
                <br />
                done properly
              </h2>
              <p className="mt-5 max-w-[38ch] leading-relaxed text-muted">
                Anyone can list a car online. What people come back for is the
                paperwork being quick, the price not moving, and someone
                answering the phone when a tyre goes flat outside Matara.
              </p>
            </div>

            <div className="col-span-4 md:col-span-8 lg:col-span-8">
              <Grid className="gap-y-8 lg:grid-cols-8">
                {differentiators.map((item) => (
                  <div key={item.title} className="col-span-4 md:col-span-4 lg:col-span-4">
                    <span className="grid size-11 place-items-center rounded-(--radius-inner) bg-field text-brand-bright">
                      <Icon name={item.icon} className="size-5" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-bold uppercase text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-[36ch] text-[0.9375rem] leading-relaxed text-muted">
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
