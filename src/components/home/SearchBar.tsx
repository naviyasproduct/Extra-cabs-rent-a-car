"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input, Select } from "@/components/ui/Field";
import { locationNames } from "@/lib/data/content";
import { cn, isoDaysFromNow, todayIso } from "@/lib/utils";

const tabs = [
  { id: "self-drive-rental", label: "Self-drive" },
  { id: "cabs-with-driver", label: "With a driver" },
  { id: "airport-transfers", label: "Airport transfer" },
] as const;

/**
 * The search card that straddles the seam between the hero slab and the
 * band below it. Submitting hands the criteria to the fleet page as query
 * params — the same shape the availability API will take later.
 */
export function SearchBar() {
  const router = useRouter();
  const [tab, setTab] = useState<string>(tabs[0].id);
  const [pickup, setPickup] = useState(locationNames[0]);
  const [from, setFrom] = useState(isoDaysFromNow(1));
  const [to, setTo] = useState(isoDaysFromNow(4));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams({ service: tab, pickup, from, to });
    router.push(`/fleet?${params.toString()}`);
  };

  return (
    <div className="rounded-(--radius-shell) bg-surface p-4 shadow-(--shadow-lift) lg:p-6">
      {/* Service tabs */}
      <div
        role="tablist"
        aria-label="Service type"
        className="mb-4 flex gap-1 overflow-x-auto rounded-full bg-surface-alt p-1 no-scrollbar sm:w-fit"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "shrink-0 rounded-full px-5 py-2.5 font-semibold transition-colors duration-200",
              tab === item.id
                ? "bg-ink text-white"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="grid gap-3 lg:grid-cols-12 lg:gap-(--gap)">
        <div className="lg:col-span-4">
          <FieldLabel htmlFor="search-pickup">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-brand" aria-hidden />
              Pickup location
            </span>
          </FieldLabel>
          <Select
            id="search-pickup"
            value={pickup}
            onChange={(event) => setPickup(event.target.value)}
          >
            {locationNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>

        <div className="lg:col-span-3">
          <FieldLabel htmlFor="search-from">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 text-brand" aria-hidden />
              Pickup date
            </span>
          </FieldLabel>
          <Input
            id="search-from"
            type="date"
            min={todayIso()}
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>

        <div className="lg:col-span-3">
          <FieldLabel htmlFor="search-to">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 text-brand" aria-hidden />
              Return date
            </span>
          </FieldLabel>
          <Input
            id="search-to"
            type="date"
            min={from || todayIso()}
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>

        <div className="flex items-end lg:col-span-2">
          <Button type="submit" size="lg" className="w-full">
            <Search className="size-4" aria-hidden />
            Search
          </Button>
        </div>
      </form>
    </div>
  );
}
