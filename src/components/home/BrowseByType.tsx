import Link from "next/link";
import { Grid, Section, SectionHeader, Shell } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { categoryLabels, categoryOrder } from "@/lib/data/cars";
import { publicCategoryCounts } from "@/lib/fleet";

/**
 * Compact category picker.
 *
 * Eight dense tiles - icon, label, live count - three columns each on the
 * 12-column bed so they land four to a row and stay flush with the sections
 * above and below. Counts come from the fleet data, so the numbers move on
 * their own as vehicles are added.
 */
export async function BrowseByType() {
  const counts = await publicCategoryCounts();

  const tiles = [
    { key: "all", label: "All vehicles", href: "/fleet", count: counts.all ?? 0 },
    ...categoryOrder.map((category) => ({
      key: category,
      label: categoryLabels[category],
      href: `/fleet?category=${category}`,
      count: counts[category] ?? 0,
    })),
  ];

  return (
    // spacing="top" because the next band is also paper - without it the two
    // sections would stack their padding and read as detached blocks.
    <Section band="paper" spacing="top">
      <Shell>
        <SectionHeader
          eyebrow="Browse by type"
          title="What are you driving?"
          description="Jump straight to the size of vehicle you need. Counts are live against the fleet."
        />

        <Grid className="mt-8">
          {tiles.map((tile) => (
            <Link
              key={tile.key}
              href={tile.href}
              className="group col-span-2 flex items-center gap-3 bg-field p-3 transition-colors duration-200 hover:bg-field-hover md:col-span-2 lg:col-span-3"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-bright transition-colors duration-200 group-hover:bg-brand group-hover:text-white">
                <Icon name={tile.key} className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-sm font-bold uppercase tracking-[0.04em]">
                  {tile.label}
                </span>
                <span className="mt-0.5 block text-sm text-muted transition-colors group-hover:text-ink-soft">
                  {tile.count} {tile.count === 1 ? "vehicle" : "vehicles"}
                </span>
              </span>
            </Link>
          ))}
        </Grid>
      </Shell>
    </Section>
  );
}
