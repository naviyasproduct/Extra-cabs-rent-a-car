"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { CarCard } from "./CarCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { categoryLabels, categoryOrder, filterCars } from "@/lib/data/cars";
import type { Car, CarCategory, CarFilters } from "@/types";
import { cn, formatPrice } from "@/lib/utils";

const transmissions = [
  { value: "all", label: "Any transmission" },
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
];

const fuels = [
  { value: "all", label: "Any fuel type" },
  { value: "hybrid", label: "Hybrid" },
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Electric" },
];

const seatOptions = [
  { value: "all", label: "Any number of seats" },
  { value: "4", label: "4 or more" },
  { value: "5", label: "5 or more" },
  { value: "7", label: "7 or more" },
  { value: "10", label: "10 or more" },
];

const sorts = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "seats-desc", label: "Most seats" },
];

const priceCeiling = 50000;

const emptyFilters: CarFilters = {
  category: "all",
  transmission: "all",
  fuel: "all",
  seats: "all",
  maxDaily: priceCeiling,
  sort: "recommended",
};

/**
 * Fleet browser.
 *
 * Filtering runs client-side against the same `filterCars` helper the API
 * will use server-side later, so the filter shape does not change when the
 * backend takes over.
 */
export function FleetBrowser({
  cars,
  counts,
}: {
  cars: Car[];
  counts: Record<string, number>;
}) {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") ?? "all") as CarFilters["category"];

  const [filters, setFilters] = useState<CarFilters>({
    ...emptyFilters,
    category: initialCategory,
  });
  const [panelOpen, setPanelOpen] = useState(false);

  const results = useMemo(() => filterCars(cars, filters), [cars, filters]);

  const update = <K extends keyof CarFilters>(key: K, value: CarFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const isFiltered =
    filters.transmission !== "all" ||
    filters.fuel !== "all" ||
    filters.seats !== "all" ||
    (filters.maxDaily ?? priceCeiling) < priceCeiling;

  const controls = (
    <div className="space-y-5">
      <div>
        <p className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Transmission
        </p>
        <Select
          value={filters.transmission}
          onChange={(event) =>
            update("transmission", event.target.value as CarFilters["transmission"])
          }
        >
          {transmissions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <p className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Fuel
        </p>
        <Select
          value={filters.fuel}
          onChange={(event) => update("fuel", event.target.value as CarFilters["fuel"])}
        >
          {fuels.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <p className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Seats
        </p>
        <Select
          value={String(filters.seats)}
          onChange={(event) =>
            update(
              "seats",
              event.target.value === "all" ? "all" : Number(event.target.value),
            )
          }
        >
          {seatOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <p className="mb-2 flex items-baseline justify-between font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-soft">
          <span>Max daily rate</span>
          <span className="font-sans normal-case tracking-normal text-brand">
            {formatPrice(filters.maxDaily ?? priceCeiling)}
          </span>
        </p>
        <input
          type="range"
          min={5000}
          max={priceCeiling}
          step={500}
          value={filters.maxDaily ?? priceCeiling}
          onChange={(event) => update("maxDaily", Number(event.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-brand"
          aria-label="Maximum daily rate"
        />
      </div>

      {isFiltered ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setFilters({ ...emptyFilters, category: filters.category })}
        >
          <X className="size-4" aria-hidden />
          Clear filters
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="grid12">
      {/* Filter rail */}
      <aside className="col-span-4 md:col-span-8 lg:col-span-3">
        <div className="lg:sticky lg:top-28">
          <div className="rounded-(--radius-card) bg-surface p-6">
            <div className="flex items-center justify-between gap-3 lg:block">
              <h2 className="font-display text-lg font-bold uppercase">Filter</h2>
              <button
                type="button"
                onClick={() => setPanelOpen((open) => !open)}
                aria-expanded={panelOpen}
                className="inline-flex items-center gap-2 rounded-full bg-surface-alt px-4 py-2 text-sm font-semibold lg:hidden"
              >
                <SlidersHorizontal className="size-4" aria-hidden />
                {panelOpen ? "Hide" : "Show"}
              </button>
            </div>

            <div className={cn("mt-5", panelOpen ? "block" : "hidden lg:block")}>
              {controls}
            </div>
          </div>
        </div>
      </aside>

      {/* Results */}
      <div className="col-span-4 md:col-span-8 lg:col-span-9">
        {/* Category chips — scroll on narrow screens, wrap once there is room,
            so the last category is never clipped at the container edge. */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:flex-wrap lg:overflow-x-visible">
          {(["all", ...categoryOrder] as const).map((category) => {
            const active = filters.category === category;
            const count = counts[category] ?? 0;
            if (category !== "all" && count === 0) return null;
            return (
              <button
                key={category}
                type="button"
                onClick={() => update("category", category as CarCategory | "all")}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-200",
                  active
                    ? "bg-ink text-white"
                    : "bg-surface text-ink-soft hover:bg-surface hover:text-ink",
                )}
              >
                {category === "all" ? "All vehicles" : categoryLabels[category]}
                <span className={cn("ml-2", active ? "text-white/50" : "text-muted")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink">{results.length}</span>{" "}
            {results.length === 1 ? "vehicle" : "vehicles"} available
          </p>
          <div className="w-full sm:w-56">
            <Select
              value={filters.sort}
              onChange={(event) => update("sort", event.target.value as CarFilters["sort"])}
              aria-label="Sort vehicles"
            >
              {sorts.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {results.length > 0 ? (
          <div className="mt-6 grid gap-(--gap) sm:grid-cols-2 xl:grid-cols-3">
            {results.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-(--radius-card) bg-surface p-12 text-center">
            <h3 className="font-display text-xl font-bold uppercase">
              Nothing matches that combination
            </h3>
            <p className="mx-auto mt-3 max-w-[38ch] text-muted">
              Try widening the price range or clearing a filter. If you need
              something specific, call us and we will source it.
            </p>
            <Button
              type="button"
              className="mt-6"
              onClick={() => setFilters(emptyFilters)}
            >
              Reset everything
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
