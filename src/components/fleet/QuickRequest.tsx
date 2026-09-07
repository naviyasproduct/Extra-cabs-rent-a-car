"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createBookingAction } from "@/app/panel/actions";
import { Field, Input } from "@/components/ui/Field";
import type { Car } from "@/types";
import {
  daysBetween,
  formatPrice,
  isoDaysFromNow,
  todayIso,
} from "@/lib/utils";

/**
 * Short booking request, sitting directly under the price card on a vehicle
 * page. Five fields is the whole thing: this is the moment of highest intent,
 * and every extra step between wanting the car and asking for it loses people.
 *
 * The full four-step flow at /booking still exists for anyone who arrives
 * without a vehicle in mind. This form deep-links there for the rest.
 */
export function QuickRequest({ car }: { car: Car }) {
  const [from, setFrom] = useState(isoDaysFromNow(1));
  const [to, setTo] = useState(isoDaysFromNow(4));
  const [withDriver, setWithDriver] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  const days = daysBetween(from, to);
  const rate =
    withDriver && car.pricing.withDriverDaily !== null
      ? car.pricing.withDriverDaily
      : car.pricing.daily;
  const total = rate * days;

  const driverAvailable = car.pricing.withDriverDaily !== null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    // Lands in the panel as a pending booking. Staff confirm it there, which is
    // what takes the vehicle off the public list.
    await createBookingAction({
      carSlug: car.slug,
      customerName: name,
      phone,
      pickupDate: from,
      returnDate: to,
      withDriver,
      amount: total,
      source: "website",
    });
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mt-(--gap) rounded-(--radius-card) bg-surface p-6 text-center lg:p-8">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-tint text-brand-bright">
          <CircleCheck className="size-7" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-xl font-bold uppercase">
          Request sent
        </h2>
        <p className="mx-auto mt-3 max-w-[40ch] text-sm leading-relaxed text-muted">
          We have your request for the {car.name} from {from} to {to}. Someone
          will call {phone || "you"} to confirm the vehicle is free.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-(--gap) rounded-(--radius-card) bg-surface p-6 lg:p-8"
    >
      <h2 className="font-display text-xl font-bold uppercase">
        Request this vehicle
      </h2>
      <p className="mt-2 text-sm text-muted">
        No payment now. We confirm the vehicle is free, then hold it for you.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Pick-up date" htmlFor="qr-from">
          <Input
            id="qr-from"
            type="date"
            required
            min={todayIso()}
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </Field>
        <Field label="Return date" htmlFor="qr-to">
          <Input
            id="qr-to"
            type="date"
            required
            min={from}
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </Field>
        <Field label="Your name" htmlFor="qr-name">
          <Input
            id="qr-name"
            type="text"
            required
            autoComplete="name"
            placeholder="Full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Mobile number" htmlFor="qr-phone" hint="We call to confirm">
          <Input
            id="qr-phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="07X XXX XXXX"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>
      </div>

      {driverAvailable ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWithDriver(false)}
            aria-pressed={!withDriver}
            className={
              "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-200 " +
              (!withDriver
                ? "bg-brand text-white"
                : "bg-field text-ink-soft hover:text-ink")
            }
          >
            I will drive
          </button>
          <button
            type="button"
            onClick={() => setWithDriver(true)}
            aria-pressed={withDriver}
            className={
              "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-200 " +
              (withDriver
                ? "bg-brand text-white"
                : "bg-field text-ink-soft hover:text-ink")
            }
          >
            With a driver
          </button>
        </div>
      ) : null}

      {/* Estimate */}
      <div className="mt-6 rounded-(--radius-inner) bg-surface-alt p-4">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm text-muted">
            {days} {days === 1 ? "day" : "days"} at {formatPrice(rate)} a day
          </p>
          <p className="font-display text-2xl font-bold">{formatPrice(total)}</p>
        </div>
        <p className="mt-2 text-xs text-muted">
          Estimate only. Deposit of {formatPrice(car.pricing.deposit)} is
          refundable and held during the rental.
        </p>
      </div>

      <Button type="submit" variant="primary" size="lg" className="mt-5 w-full">
        Send request
      </Button>

      <p className="mt-4 text-center text-sm text-muted">
        Need extras, a different pick-up point or another vehicle?{" "}
        <Link
          href={`/booking?car=${car.slug}`}
          className="font-semibold text-brand-bright underline-offset-4 hover:underline"
        >
          Use the full booking form
        </Link>
      </p>
    </form>
  );
}
