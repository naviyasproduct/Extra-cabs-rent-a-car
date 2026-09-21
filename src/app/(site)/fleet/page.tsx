import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FleetBrowser } from "@/components/fleet/FleetBrowser";
import { Section, Shell } from "@/components/ui/Layout";
import { publicCars, publicCategoryCounts } from "@/lib/fleet";
import { JsonLd } from "@/components/common/JsonLd";
import { breadcrumbLd, itemListLd } from "@/lib/seo";
import { NoVehiclesYet } from "@/components/fleet/NoVehiclesYet";
import { KM_PER_DAY } from "@/lib/pricing";

export const metadata: Metadata = {
  alternates: { canonical: "/fleet" },
  openGraph: { url: "/fleet" },
  title: "Our fleet",
  description:
    "Browse every vehicle available to rent: micro cars, hatchbacks, sedans, SUVs, vans and luxury cars, with daily rates and full specifications.",
};

export default async function FleetPage() {
  const [cars, counts] = await Promise.all([publicCars(), publicCategoryCounts()]);

  // True facts only. This used to claim "40+ vehicles on the road", a
  // "5 yrs" average age and free Colombo delivery, none of it real. The count
  // is live, so it grows as staff add vehicles in the panel.
  const quickFacts = [
    { label: "Vehicles listed", value: String(cars.length) },
    { label: "Kilometres included", value: `${KM_PER_DAY} km / day` },
    { label: "Payment", value: "Cash or transfer" },
  ];

  return (
    <>
      {/* An empty ItemList tells search engines the page lists nothing. */}
      {cars.length > 0 ? (
        <JsonLd
          data={itemListLd(
            "Extra Cabs fleet",
            "/fleet",
            cars.map((car) => ({ name: car.name, path: `/fleet/${car.slug}` })),
          )}
        />
      ) : null}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Fleet", path: "/fleet" },
        ])}
      />

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
            {cars.length > 0 ? (
              <FleetBrowser cars={cars} counts={counts} />
            ) : (
              <NoVehiclesYet />
            )}
          </Suspense>
        </Shell>
      </Section>
    </>
  );
}
