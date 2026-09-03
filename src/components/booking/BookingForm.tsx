"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  Users,
} from "lucide-react";
import { CarImage } from "@/components/common/CarImage";
import { Button, LinkButton } from "@/components/ui/Button";
import { CheckTile, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { bookingExtras as extras, locationNames } from "@/lib/data/content";
import type { BookingDraft, BookingStep, Car, ServiceSlug } from "@/types";
import { cn, daysBetween, formatPrice, isoDaysFromNow, todayIso } from "@/lib/utils";

const steps: { id: BookingStep; label: string }[] = [
  { id: "trip", label: "Your trip" },
  { id: "vehicle", label: "Vehicle" },
  { id: "details", label: "Your details" },
  { id: "review", label: "Review" },
];

const serviceOptions: { value: ServiceSlug; label: string }[] = [
  { value: "self-drive-rental", label: "Self-drive rental" },
  { value: "cabs-with-driver", label: "Cab with a driver" },
  { value: "airport-transfers", label: "Airport transfer" },
  { value: "wedding-cars", label: "Wedding car" },
  { value: "long-term-lease", label: "Long-term lease" },
];

/**
 * Four-step booking flow.
 *
 * Front end only: the final step shows a confirmation panel instead of
 * posting anywhere. When the backend lands, `submit` is the single place that
 * needs to POST the draft to /api/bookings.
 */
export function BookingForm({ cars }: { cars: Car[] }) {
  const searchParams = useSearchParams();

  const [step, setStep] = useState<BookingStep>("trip");
  const [submitted, setSubmitted] = useState(false);
  const [draft, setDraft] = useState<BookingDraft>({
    serviceType: (searchParams.get("service") as ServiceSlug) ?? "self-drive-rental",
    pickupLocation: searchParams.get("pickup") ?? locationNames[0],
    dropoffLocation: searchParams.get("pickup") ?? locationNames[0],
    sameReturnLocation: true,
    pickupDate: searchParams.get("from") ?? isoDaysFromNow(1),
    pickupTime: "09:00",
    returnDate: searchParams.get("to") ?? isoDaysFromNow(4),
    returnTime: "09:00",
    carSlug: searchParams.get("car"),
    withDriver: false,
    extras: [],
    fullName: "",
    email: "",
    phone: "",
    nic: "",
    licenceNumber: "",
    notes: "",
  });

  const set = <K extends keyof BookingDraft>(key: K, value: BookingDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const selectedCar = cars.find((car) => car.slug === draft.carSlug) ?? null;
  const days = daysBetween(draft.pickupDate, draft.returnDate);

  const totals = useMemo(() => {
    const vehicle = selectedCar ? selectedCar.pricing.daily * days : 0;
    const extrasTotal = draft.extras.reduce((sum, id) => {
      const extra = extras.find((item) => item.id === id);
      return sum + (extra ? extra.pricePerDay * days : 0);
    }, 0);
    return {
      vehicle,
      extras: extrasTotal,
      total: vehicle + extrasTotal,
      deposit: selectedCar?.pricing.deposit ?? 0,
    };
  }, [selectedCar, days, draft.extras]);

  const stepIndex = steps.findIndex((item) => item.id === step);

  const canContinue =
    step === "trip"
      ? Boolean(draft.pickupLocation && draft.pickupDate && draft.returnDate)
      : step === "vehicle"
        ? Boolean(draft.carSlug)
        : step === "details"
          ? Boolean(draft.fullName && draft.email && draft.phone)
          : true;

  const goNext = () => {
    const next = steps[stepIndex + 1];
    if (next) setStep(next.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    const previous = steps[stepIndex - 1];
    if (previous) setStep(previous.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = () => {
    // BACKEND SEAM: POST `draft` to /api/bookings here.
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="rounded-(--radius-shell) bg-surface p-8 text-center lg:p-14">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-tint text-brand">
          <CircleCheck className="size-8" aria-hidden />
        </span>
        <h2 className="display-md mt-7">Request received</h2>
        <p className="mx-auto mt-4 max-w-[48ch] leading-relaxed text-muted">
          Thanks {draft.fullName.split(" ")[0] || "for that"} — we have your request
          for {selectedCar?.name ?? "a vehicle"} from {draft.pickupDate}. Someone
          will call you on {draft.phone} within the hour to confirm availability.
          Nothing is charged until then.
        </p>

        <div className="mx-auto mt-8 max-w-md rounded-(--radius-card) bg-surface-alt p-6 text-left">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm text-muted">Reference</span>
            <span className="font-display font-bold">EC-{Date.now().toString().slice(-6)}</span>
          </div>
          <div className="rule my-4" />
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm text-muted">Estimated total</span>
            <span className="font-display text-xl font-bold">
              {formatPrice(totals.total)}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href="/" variant="dark" size="lg">
            Back to home
          </LinkButton>
          <LinkButton href="/fleet" variant="outline" size="lg">
            Browse the fleet
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="grid12 items-start">
      {/* Steps + form */}
      <div className="col-span-4 md:col-span-8 lg:col-span-8">
        {/* Step track */}
        <ol className="flex gap-2 rounded-full bg-surface p-1.5">
          {steps.map((item, index) => {
            const done = index < stepIndex;
            const current = index === stepIndex;
            return (
              <li key={item.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => index <= stepIndex && setStep(item.id)}
                  disabled={index > stepIndex}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-colors duration-200",
                    current && "bg-ink text-white",
                    done && "text-brand hover:bg-surface-alt",
                    !current && !done && "text-muted",
                  )}
                >
                  {done ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <span className="font-display">{index + 1}</span>
                  )}
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-(--gap) rounded-(--radius-card) bg-surface p-6 lg:p-8">
          {/* Step 1 — trip */}
          {step === "trip" ? (
            <div>
              <h2 className="font-display text-xl font-bold uppercase">Your trip</h2>
              <p className="mt-2 text-muted">
                Where and when you need the vehicle. Dates can be changed later at
                no cost.
              </p>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <Field label="Service" htmlFor="service" className="sm:col-span-2">
                  <Select
                    id="service"
                    value={draft.serviceType}
                    onChange={(event) =>
                      set("serviceType", event.target.value as ServiceSlug)
                    }
                  >
                    {serviceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Pickup location" htmlFor="pickup">
                  <Select
                    id="pickup"
                    value={draft.pickupLocation}
                    onChange={(event) => {
                      set("pickupLocation", event.target.value);
                      if (draft.sameReturnLocation) set("dropoffLocation", event.target.value);
                    }}
                  >
                    {locationNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Return location" htmlFor="dropoff">
                  <Select
                    id="dropoff"
                    value={draft.dropoffLocation}
                    disabled={draft.sameReturnLocation}
                    onChange={(event) => set("dropoffLocation", event.target.value)}
                    className={draft.sameReturnLocation ? "opacity-55" : undefined}
                  >
                    {locationNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={draft.sameReturnLocation}
                    onChange={(event) => {
                      set("sameReturnLocation", event.target.checked);
                      if (event.target.checked) set("dropoffLocation", draft.pickupLocation);
                    }}
                    className="size-4 rounded accent-brand"
                  />
                  <span className="text-ink-soft">Return to the same location</span>
                </label>

                <Field label="Pickup date" htmlFor="pickup-date">
                  <Input
                    id="pickup-date"
                    type="date"
                    min={todayIso()}
                    value={draft.pickupDate}
                    onChange={(event) => set("pickupDate", event.target.value)}
                  />
                </Field>

                <Field label="Pickup time" htmlFor="pickup-time">
                  <Input
                    id="pickup-time"
                    type="time"
                    value={draft.pickupTime}
                    onChange={(event) => set("pickupTime", event.target.value)}
                  />
                </Field>

                <Field label="Return date" htmlFor="return-date">
                  <Input
                    id="return-date"
                    type="date"
                    min={draft.pickupDate || todayIso()}
                    value={draft.returnDate}
                    onChange={(event) => set("returnDate", event.target.value)}
                  />
                </Field>

                <Field label="Return time" htmlFor="return-time">
                  <Input
                    id="return-time"
                    type="time"
                    value={draft.returnTime}
                    onChange={(event) => set("returnTime", event.target.value)}
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {/* Step 2 — vehicle */}
          {step === "vehicle" ? (
            <div>
              <h2 className="font-display text-xl font-bold uppercase">
                Choose a vehicle
              </h2>
              <p className="mt-2 text-muted">
                Availability shown for {draft.pickupDate} to {draft.returnDate}
                {" "}({days} {days === 1 ? "day" : "days"}).
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {cars.map((car) => {
                  const active = draft.carSlug === car.slug;
                  return (
                    <button
                      key={car.id}
                      type="button"
                      disabled={!car.available}
                      onClick={() => set("carSlug", car.slug)}
                      aria-pressed={active}
                      className={cn(
                        "flex items-center gap-4 rounded-(--radius-inner) p-3 text-left transition-colors duration-200",
                        active ? "bg-ink text-white" : "bg-surface-alt hover:bg-line/60",
                        !car.available && "cursor-not-allowed opacity-45",
                      )}
                    >
                      <span className="relative size-20 shrink-0 overflow-hidden rounded-(--radius-chip) bg-white/80">
                        <CarImage src={car.images[0]} alt={car.name} sizes="80px" inset={false} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-base font-bold uppercase">
                          {car.name}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 flex items-center gap-1.5 text-sm",
                            active ? "text-white/55" : "text-muted",
                          )}
                        >
                          <Users className="size-3.5" aria-hidden />
                          {car.specs.seats} seats
                          <span aria-hidden>·</span>
                          {car.specs.transmission === "automatic" ? "Auto" : "Manual"}
                        </span>
                        <span className="mt-1.5 block font-display text-sm font-bold">
                          {formatPrice(car.pricing.daily)}
                          <span
                            className={cn(
                              "ml-1 font-sans text-sm font-medium",
                              active ? "text-white/50" : "text-muted",
                            )}
                          >
                            / day
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="rule my-8" />

              <h3 className="font-display text-lg font-bold uppercase">Add extras</h3>
              <p className="mt-2 text-muted">Charged per day, added to the final quote.</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {extras.map((extra) => (
                  <CheckTile
                    key={extra.id}
                    checked={draft.extras.includes(extra.id)}
                    onToggle={() =>
                      set(
                        "extras",
                        draft.extras.includes(extra.id)
                          ? draft.extras.filter((id) => id !== extra.id)
                          : [...draft.extras, extra.id],
                      )
                    }
                    title={extra.label}
                    description={extra.description}
                    meta={
                      extra.pricePerDay === 0
                        ? "Free"
                        : `${formatPrice(extra.pricePerDay)} / day`
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Step 3 — details */}
          {step === "details" ? (
            <div>
              <h2 className="font-display text-xl font-bold uppercase">Your details</h2>
              <p className="mt-2 text-muted">
                We need these to confirm the booking. Documents are checked at
                handover, not now.
              </p>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <Field label="Full name" htmlFor="name" className="sm:col-span-2">
                  <Input
                    id="name"
                    value={draft.fullName}
                    onChange={(event) => set("fullName", event.target.value)}
                    placeholder="As printed on your licence"
                    autoComplete="name"
                  />
                </Field>

                <Field label="Email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    value={draft.email}
                    onChange={(event) => set("email", event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </Field>

                <Field label="Phone" htmlFor="phone">
                  <Input
                    id="phone"
                    type="tel"
                    value={draft.phone}
                    onChange={(event) => set("phone", event.target.value)}
                    placeholder="+94 77 000 0000"
                    autoComplete="tel"
                  />
                </Field>

                <Field label="NIC or passport" htmlFor="nic" hint="Optional now">
                  <Input
                    id="nic"
                    value={draft.nic}
                    onChange={(event) => set("nic", event.target.value)}
                  />
                </Field>

                <Field label="Licence number" htmlFor="licence" hint="Optional now">
                  <Input
                    id="licence"
                    value={draft.licenceNumber}
                    onChange={(event) => set("licenceNumber", event.target.value)}
                  />
                </Field>

                <Field
                  label="Anything we should know?"
                  htmlFor="notes"
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="notes"
                    rows={4}
                    value={draft.notes}
                    onChange={(event) => set("notes", event.target.value)}
                    placeholder="Flight number, delivery address, child seat age, planned route…"
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {/* Step 4 — review */}
          {step === "review" ? (
            <div>
              <h2 className="font-display text-xl font-bold uppercase">
                Check and confirm
              </h2>
              <p className="mt-2 text-muted">
                Nothing is charged now. We call to confirm the vehicle before any
                payment is taken.
              </p>

              <dl className="mt-7">
                {[
                  {
                    label: "Service",
                    value:
                      serviceOptions.find((item) => item.value === draft.serviceType)
                        ?.label ?? "—",
                  },
                  { label: "Vehicle", value: selectedCar?.name ?? "Not selected" },
                  {
                    label: "Pickup",
                    value: `${draft.pickupLocation} · ${draft.pickupDate} at ${draft.pickupTime}`,
                  },
                  {
                    label: "Return",
                    value: `${draft.dropoffLocation} · ${draft.returnDate} at ${draft.returnTime}`,
                  },
                  { label: "Duration", value: `${days} ${days === 1 ? "day" : "days"}` },
                  { label: "Name", value: draft.fullName || "—" },
                  { label: "Contact", value: `${draft.phone || "—"} · ${draft.email || "—"}` },
                  {
                    label: "Extras",
                    value:
                      draft.extras.length > 0
                        ? draft.extras
                            .map((id) => extras.find((item) => item.id === id)?.label)
                            .filter(Boolean)
                            .join(", ")
                        : "None",
                  },
                  { label: "Notes", value: draft.notes || "—" },
                ].map((row, index) => (
                  <div key={row.label}>
                    {index > 0 ? <div className="rule" /> : null}
                    <div className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm text-muted">{row.label}</dt>
                      <dd className="sm:col-span-2">{row.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              <p className="mt-6 text-sm leading-relaxed text-muted">
                By confirming you agree to our{" "}
                <Link href="/terms" className="font-medium text-brand hover:underline">
                  rental terms
                </Link>
                . A refundable deposit of {formatPrice(totals.deposit)} is collected
                at handover.
              </p>
            </div>
          ) : null}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              disabled={stepIndex === 0}
              className={stepIndex === 0 ? "invisible" : undefined}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </Button>

            {step === "review" ? (
              <Button type="button" size="lg" onClick={submit}>
                Confirm request
                <Check className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button type="button" size="lg" onClick={goNext} disabled={!canContinue}>
                Continue
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <aside className="col-span-4 mt-(--gap) md:col-span-8 lg:col-span-4 lg:mt-0">
        <div className="lg:sticky lg:top-28">
          <div className="rounded-(--radius-card) bg-ink p-6 text-white lg:p-7">
            <h2 className="font-display text-lg font-bold uppercase">Your booking</h2>

            {selectedCar ? (
              <div className="mt-5 flex items-center gap-4">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-(--radius-chip) bg-white/10">
                  <CarImage
                    src={selectedCar.images[0]}
                    alt={selectedCar.name}
                    sizes="64px"
                    inset={false}
                  />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display font-bold uppercase">
                    {selectedCar.name}
                  </p>
                  <p className="text-sm text-white/50">{selectedCar.tagline}</p>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-white/50">
                No vehicle selected yet. Pick one in step two and the estimate
                appears here.
              </p>
            )}

            <div className="mt-6 h-px bg-white/10" />

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-white/50">Duration</dt>
                <dd className="font-semibold">
                  {days} {days === 1 ? "day" : "days"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-white/50">Vehicle</dt>
                <dd className="font-semibold">{formatPrice(totals.vehicle)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-white/50">Extras</dt>
                <dd className="font-semibold">{formatPrice(totals.extras)}</dd>
              </div>
            </dl>

            <div className="mt-6 h-px bg-white/10" />

            <div className="mt-6 flex items-end justify-between gap-4">
              <span className="text-white/50">Estimated total</span>
              <span className="font-display text-3xl font-extrabold leading-none">
                {formatPrice(totals.total)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/40">
              Includes insurance and the free kilometre allowance. Refundable
              deposit of {formatPrice(totals.deposit)} is separate.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
