import Link from "next/link";
import { Armchair, Banknote, Fuel } from "lucide-react";
import { CarImage } from "@/components/common/CarImage";
import type { Car } from "@/types";
import { cn, formatNumber } from "@/lib/utils";

const fuelLabels: Record<Car["specs"]["fuel"], string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  hybrid: "Hybrid",
  electric: "Electric",
};

/**
 * Fleet tile. Name, three numbers, done.
 *
 * The tile paints a background because a grid of four vehicles with no
 * surfaces reads as one strip of photos and you cannot tell which name belongs
 * to which car. It is the only content surface on the site that fills, and
 * that is exactly what it is for.
 *
 * Below 768px it is a list row: thumbnail left, name and stats beside it, so a
 * phone shows six vehicles instead of one. From 768px up it is the tall tile.
 *
 * The whole tile is a single anchor, stretched by the pseudo-element on the
 * title link. There is no separate "view details" control: a tile is obviously
 * clickable, and one link per card means the vehicle name is its anchor text.
 */
export function CarCard({ car, className }: { car: Car; className?: string }) {
  const stats = [
    {
      key: "seats",
      icon: Armchair,
      value: String(car.specs.seats),
      label: car.specs.seats === 1 ? "Seat" : "Seats",
      inline: `${car.specs.seats} ${car.specs.seats === 1 ? "seat" : "seats"}`,
    },
    {
      key: "rate",
      icon: Banknote,
      value: formatNumber(car.pricing.daily),
      label: "LKR / day",
      inline: `${formatNumber(car.pricing.daily)} / day`,
    },
    {
      key: "fuel",
      icon: Fuel,
      value: fuelLabels[car.specs.fuel],
      label: "Fuel",
      inline: fuelLabels[car.specs.fuel],
    },
  ];

  return (
    <article
      className={cn(
        "group relative flex gap-3 bg-tile p-3 transition-colors duration-200 hover:bg-tile-hover",
        "md:h-full md:flex-col md:gap-0",
        className,
      )}
    >
      {/* Photo. Fixed thumbnail on phones, full width of the tile above that. */}
      <div className="relative aspect-[4/3] w-28 shrink-0 self-start overflow-hidden md:w-full md:self-auto">
        <CarImage
          src={car.images[0]}
          alt={`${car.name}, ${car.year} model`}
          label={car.name}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col md:mt-3">
        <h3 className="font-display text-base font-bold uppercase leading-tight md:text-lg">
          <Link
            href={`/fleet/${car.slug}`}
            className="before:absolute before:inset-0 before:z-10"
          >
            {car.name}
          </Link>
        </h3>

        {!car.available ? (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-brand-bright">
            On hire
          </p>
        ) : null}

        {/* Phone: the three stats inline, so the row stays short */}
        <ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 md:hidden">
          {stats.map((stat) => (
            <li
              key={stat.key}
              className="inline-flex items-center gap-1.5 text-sm text-ink-soft"
            >
              <stat.icon className="size-4 shrink-0 text-brand-bright" aria-hidden />
              {stat.inline}
            </li>
          ))}
        </ul>

        {/* Tile: the three stats as cells, pinned to the bottom so tiles in a
            row line up whatever the length of the vehicle name. The gap-px over
            a line-coloured track is what draws the hairlines between cells. */}
        <ul className="mt-auto hidden grid-cols-3 gap-px bg-line pt-px md:grid">
          {stats.map((stat) => (
            <li key={stat.key} className="bg-tile px-2 py-2.5 text-center">
              <stat.icon className="mx-auto size-4 text-brand-bright" aria-hidden />
              <p className="mt-1.5 font-display text-sm font-bold leading-none">
                {stat.value}
              </p>
              <p className="mt-1 text-[0.6875rem] leading-none text-muted">
                {stat.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
