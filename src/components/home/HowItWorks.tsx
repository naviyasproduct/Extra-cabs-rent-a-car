import { Grid, Section, SectionHeader, Shell } from "@/components/ui/Layout";
import { bookingSteps } from "@/lib/data/content";

/**
 * Four steps, three columns each, sharing one hairline rule across the top so
 * the row reads as a single track rather than four detached cards.
 */
export function HowItWorks() {
  return (
    <Section band="paper" id="how-it-works">
      <Shell>
        <SectionHeader
          eyebrow="How it works"
          title="Booked in four steps"
          description="No account to create and no deposit taken before we have confirmed the vehicle is yours."
        />

        <div className="mt-8 rule" />

        <Grid className="mt-0">
          {bookingSteps.map((step, index) => (
            <div
              key={step.step}
              className="col-span-4 pt-8 md:col-span-4 lg:col-span-3"
            >
              <div className="flex items-center gap-4">
                <span className="font-display text-5xl font-extrabold leading-none text-line-strong">
                  {step.step}
                </span>
                {index < bookingSteps.length - 1 ? (
                  <span className="hidden h-px flex-1 bg-line lg:block" aria-hidden />
                ) : null}
              </div>
              <h3 className="mt-6 font-display text-xl font-bold uppercase">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[34ch] text-[0.9375rem] leading-relaxed text-muted">
                {step.description}
              </p>
            </div>
          ))}
        </Grid>
      </Shell>
    </Section>
  );
}
