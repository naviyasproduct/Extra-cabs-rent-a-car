import Link from "next/link";
import { ArrowUpRight, Briefcase, Fuel, Gauge, Users } from "lucide-react";
import { CarImage } from "@/components/common/CarImage";
import { Badge, Rating } from "@/components/ui/Badge";
import type { Car } from "@/types";
import { cn, formatPrice } from "@/lib/utils";

const fuelLabels: Record<Car["specs"]["fuel"], string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  hybrid: "Hybrid",
  electric: "Electric",
};

/**
 * Fleet card. Same radius scale and padding as every other panel, separated
 * from its neighbours by tone rather than a border.
 */
export function CarCard({ car, className }: { car: Car; className?: string }) {
  const specs = [
    { icon: Users, label: `${car.specs.seats} seats` },
    { icon: Gauge, label: car.specs.transmission === "automatic" ? "Auto" : "Manual" },
    { icon: Fuel, label: fuelLabels[car.specs.fuel] },
    {
      icon: Briefcase,
      label: `${car.specs.luggage} ${car.specs.luggage === 1 ? "bag" : "bags"}`,
    },
  ];

  return (
    <article
      className={cn(
        "group flex h-full flex-col rounded-(--radius-card) bg-surface p-4 transition-shadow duration-300 hover:shadow-(--shadow-lift)",
        className,
      )}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-(--radius-inner) bg-surface-alt">
        <CarImage
          src={car.images[0]}
          alt={car.name}
          label={car.name}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {car.badge ? <Badge tone="brand">{car.badge}</Badge> : <span />}
          {!car.available ? <Badge tone="dark">On hire</Badge> : null}
        </div>
      </div>

      {/* Title */}
      <div className="mt-5 flex items-start justify-between gap-3 px-1">
        <div>
          <h3 className="font-display text-xl font-bold uppercase leading-tight">
            {car.name}
          </h3>
          <p className="mt-1 text-sm text-muted">{car.tagline}</p>
        </div>
        <Rating value={car.rating} className="mt-0.5 shrink-0" />
      </div>

      {/* Specs */}
      <ul className="mt-5 flex flex-wrap gap-2 px-1">
        {specs.map((spec) => (
          <li
            key={spec.label}
            className="inline-flex items-center gap-1.5 rounded-(--radius-chip) bg-surface-alt px-2.5 py-1.5 text-sm font-medium text-ink-soft"
          >
            <spec.icon className="size-3.5 text-muted" aria-hidden />
            {spec.label}
          </li>
        ))}
      </ul>

      {/* Price + action, pinned to the bottom so cards in a row line up */}
      <div className="mt-auto px-1 pt-6">
        <div className="rule" />
        <div className="flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="font-display text-2xl font-bold">
              {formatPrice(car.pricing.daily)}
              <span className="ml-1 font-sans text-sm font-medium text-muted">/ day</span>
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {car.specs.freeKmPerDay} km free per day
            </p>
          </div>
          <Link
            href={`/fleet/${car.slug}`}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-colors duration-200 group-hover:bg-brand"
            aria-label={`View details for ${car.name}`}
          >
            <ArrowUpRight className="size-5" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
