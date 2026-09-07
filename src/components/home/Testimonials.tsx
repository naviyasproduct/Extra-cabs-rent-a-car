import { Quote, Star } from "lucide-react";
import { Grid, Section, SectionHeader, Shell } from "@/components/ui/Layout";
import { getTestimonials } from "@/lib/data/content";

/**
 * Reviews on a three-column masonry-free grid. Cards are plain surfaces -
 * separation comes from the band tone behind them, not from borders.
 */
export async function Testimonials() {
  const testimonials = await getTestimonials();

  return (
    <Section band="alt">
      <Shell>
        <SectionHeader
          eyebrow="Customers"
          title="What people say after"
          description="Collected from customers who rented in the last twelve months. We publish the ones that keep us honest too."
        />

        <Grid className="mt-8">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.id}
              className="col-span-4 flex flex-col rounded-(--radius-card) bg-surface p-6 md:col-span-4 lg:col-span-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex gap-0.5" aria-label={`${testimonial.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={
                        index < testimonial.rating
                          ? "size-4 fill-brand-bright text-brand-bright"
                          : "size-4 text-line-strong"
                      }
                      aria-hidden
                    />
                  ))}
                </span>
                <Quote className="size-6 text-line-strong" aria-hidden />
              </div>

              <blockquote className="mt-5 flex-1 text-[0.9375rem] leading-relaxed text-ink-soft">
                {testimonial.quote}
              </blockquote>

              <figcaption className="mt-6">
                <div className="rule" />
                <div className="flex items-center gap-3 pt-4">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-tint font-display text-sm font-bold uppercase text-brand-bright"
                    aria-hidden
                  >
                    {testimonial.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{testimonial.name}</p>
                    <p className="truncate text-sm text-muted">{testimonial.vehicle}</p>
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </Grid>
      </Shell>
    </Section>
  );
}
