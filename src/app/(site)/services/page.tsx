import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Grid, Section, Shell } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { getServices } from "@/lib/data/services";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: { canonical: "/services" },
  openGraph: { url: "/services" },
  title: "Services",
  description:
    "Self-drive rental, cabs with a driver, airport transfers, wedding cars and long-term leasing across Sri Lanka.",
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Five ways we can help"
        description="One fleet, one standard of upkeep, and five different ways to put it to work. Every rate below includes insurance and maintenance."
        crumbs={[{ label: "Services" }]}
      />

      <Section band="paper">
        <Shell>
          <div className="grid gap-(--gap)">
            {services.map((service, index) => {
              return (
                <article
                  key={service.slug}
                  className={cn(
                    "rounded-(--radius-shell) p-6 sm:p-8 lg:p-10",
                  )}
                >
                  <Grid className="items-start">
                    {/* Left: identity */}
                    <div className="col-span-4 md:col-span-8 lg:col-span-5">
                      <span
                        className={cn(
                          "grid size-14 place-items-center rounded-(--radius-inner)",
                          "bg-brand-tint text-brand-bright",
                        )}
                      >
                        <Icon name={service.icon} className="size-7" />
                      </span>

                      <h2 className="display-md mt-6">{service.name}</h2>
                      <p
                        className={cn(
                          "mt-4 max-w-[42ch] leading-relaxed",
                          "text-muted",
                        )}
                      >
                        {service.description}
                      </p>

                      <ul className="mt-6 space-y-2.5">
                        {service.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex items-start gap-2.5 text-[0.9375rem]"
                          >
                            <Check className="mt-0.5 size-4 shrink-0 text-brand-bright" aria-hidden />
                            <span className="text-ink-soft">
                              {bullet}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={`/services/${service.slug}`}
                        className={cn(
                          "mt-8 inline-flex h-12 items-center gap-2 rounded-full px-6 font-semibold transition-colors duration-200",
                          "bg-brand text-white hover:bg-brand-hover",
                        )}
                      >
                        Read more
                        <ArrowUpRight className="size-4" aria-hidden />
                      </Link>
                    </div>

                    {/* Right: rate card */}
                    <div className="col-span-4 mt-8 md:col-span-8 lg:col-span-6 lg:col-start-7 lg:mt-0">
                      <div
                        className={cn(
                          "rounded-(--radius-card) p-6",
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <h3 className="font-display text-lg font-bold uppercase">
                            Indicative rates
                          </h3>
                          <span className="font-display text-sm font-semibold uppercase tracking-[0.08em] text-brand-bright">
                            from {service.startingFrom}
                          </span>
                        </div>

                        <ul className="mt-5">
                          {service.priceTable.map((row, rowIndex) => (
                            <li key={row.label}>
                              {rowIndex > 0 ? (
                                <div
                                  className={cn(
                                    "h-px",
                                    "bg-line",
                                  )}
                                />
                              ) : null}
                              <div className="flex items-baseline justify-between gap-4 py-3.5">
                                <div className="min-w-0">
                                  <p className="font-semibold">{row.label}</p>
                                  <p
                                    className={cn(
                                      "mt-0.5 text-sm",
                                      "text-muted",
                                    )}
                                  >
                                    {row.detail}
                                  </p>
                                </div>
                                <p className="shrink-0 font-display font-semibold">
                                  {row.price}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>

                        <p
                          className={cn(
                            "mt-4 text-sm leading-relaxed",
                            "text-muted",
                          )}
                        >
                          Rates are a guide. Send us the dates and we will come back
                          with an exact quote, including any delivery charge.
                        </p>
                      </div>
                    </div>
                  </Grid>
                </article>
              );
            })}
          </div>
        </Shell>
      </Section>
    </>
  );
}
