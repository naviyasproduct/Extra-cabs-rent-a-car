"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import type { Car } from "@/types";
import { site } from "@/lib/data/site";
import { cn, formatPrice } from "@/lib/utils";

const periods = [
  { id: "daily", label: "Daily", suffix: "per day", divisor: 1 },
  { id: "weekly", label: "Weekly", suffix: "per week", divisor: 7 },
  { id: "monthly", label: "Monthly", suffix: "per month", divisor: 30 },
] as const;

type PeriodId = (typeof periods)[number]["id"];

/**
 * Sticky booking card on the vehicle page. Prices are read straight from the
 * fleet data so a rate change in one place updates everywhere.
 */
export function PriceCard({ car }: { car: Car }) {
  const [period, setPeriod] = useState<PeriodId>("daily");

  const amount = car.pricing[period];
  const active = periods.find((item) => item.id === period)!;
  const perDay = Math.round(amount / active.divisor);

  return (
    <div className="lg:sticky lg:top-28">
      <div className="rounded-(--radius-card) bg-ink p-6 text-white lg:p-7">
        {/* Period switch */}
        <div className="flex gap-1 rounded-full bg-white/10 p-1">
          {periods.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              aria-pressed={period === item.id}
              className={cn(
                "flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors duration-200",
                period === item.id ? "bg-brand text-white" : "text-white/60 hover:text-white",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <p className="font-display text-4xl font-extrabold leading-none">
            {formatPrice(amount)}
          </p>
          <p className="mt-2 text-sm text-white/50">
            {active.suffix}
            {period !== "daily" ? ` · works out at ${formatPrice(perDay)} a day` : ""}
          </p>
        </div>

        <div className="mt-6 h-px bg-white/10" />

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-white/50">Free kilometres</dt>
            <dd className="font-semibold">{car.specs.freeKmPerDay} km / day</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-white/50">Extra kilometres</dt>
            <dd className="font-semibold">{formatPrice(car.pricing.extraKm)} / km</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-white/50">Refundable deposit</dt>
            <dd className="font-semibold">{formatPrice(car.pricing.deposit)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-white/50">With a driver</dt>
            <dd className="font-semibold">
              {car.pricing.withDriverDaily
                ? `${formatPrice(car.pricing.withDriverDaily)} / day`
                : "Self-drive only"}
            </dd>
          </div>
        </dl>

        <Link
          href={`/booking?car=${car.slug}`}
          className={cn(
            "mt-7 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200",
            car.available
              ? "bg-brand text-white hover:bg-brand-hover"
              : "pointer-events-none bg-white/10 text-white/40",
          )}
          aria-disabled={!car.available}
        >
          {car.available ? "Book this vehicle" : "Currently on hire"}
          {car.available ? <ArrowRight className="size-4" aria-hidden /> : null}
        </Link>

        <p className="mt-3 text-center text-sm text-white/40">
          No payment taken until we confirm availability.
        </p>
      </div>

      {/* Contact strip, same radius family so it reads as part of the card */}
      <div className="mt-(--gap) grid grid-cols-2 gap-(--gap)">
        <a
          href={`tel:${site.phone.replace(/\s/g, "")}`}
          className="inline-flex h-13 items-center justify-center gap-2 rounded-(--radius-inner) bg-surface py-4 text-sm font-semibold transition-colors hover:bg-surface-alt"
        >
          <Phone className="size-4 text-brand" aria-hidden />
          Call
        </a>
        <a
          href={`https://wa.me/${site.whatsapp.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-13 items-center justify-center gap-2 rounded-(--radius-inner) bg-surface py-4 text-sm font-semibold transition-colors hover:bg-surface-alt"
        >
          <MessageCircle className="size-4 text-brand" aria-hidden />
          WhatsApp
        </a>
      </div>
    </div>
  );
}
