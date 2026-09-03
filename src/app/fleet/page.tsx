import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FleetBrowser } from "@/components/fleet/FleetBrowser";
import { Section, Shell } from "@/components/ui/Layout";
import { getCars, getCategoryCounts } from "@/lib/data/cars";

export const metadata: Metadata = {
  title: "Our fleet",
  description:
    "Browse every vehicle available to rent: micro cars, hatchbacks, sedans, SUVs, vans and luxury cars, with daily rates and full specifications.",
};

const quickFacts = [
  { label: "Vehicles on the road", value: "40+" },
  { label: "Average vehicle age", value: "5 yrs" },
  { label: "Free delivery", value: "Colombo" },
];

export default async function FleetPage() {
  const [cars, counts] = await Promise.all([getCars(), getCategoryCounts()]);

  return (
    <>
      <PageHeader
        eyebrow="The fleet"
        title="Every vehicle we rent"
        description="Filter by size, transmission, fuel and price. Rates shown are per day and already include comprehensive insurance."
        crumbs={[{ label: "Fleet" }]}
        aside={
          <div className="rounded-(--radius-card) bg-surface p-6">
            <ul className="space-y-4">
              {quickFacts.map((fact, index) => (
                <li key={fact.label}>
                  {index > 0 ? <div className="rule mb-4" /> : null}
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-muted">{fact.label}</span>
                    <span className="font-display text-lg font-bold">{fact.value}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <Section band="paper">
        <Shell>
          <Suspense
            fallback={
              <div className="rounded-(--radius-card) bg-surface p-12 text-center text-muted">
                Loading the fleet…
              </div>
            }
          >
            <FleetBrowser cars={cars} counts={counts} />
          </Suspense>
        </Shell>
      </Section>
    </>
  );
}
