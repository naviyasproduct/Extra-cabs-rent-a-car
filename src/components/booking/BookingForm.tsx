"use client";

import { Fragment, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheck,
  Users,
} from "lucide-react";
import { CarImage } from "@/components/common/CarImage";
import { createBookingAction } from "@/app/panel/actions";
import { DocumentUpload } from "@/components/booking/DocumentUpload";
import { Button, LinkButton } from "@/components/ui/Button";
import { CheckTile, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { bookingExtras as extras, locationNames } from "@/lib/data/content";
import type {
  BookingDraft,
  BookingStep,
  Car,
  DocumentSlot,
  IdDocumentType,
  ServiceSlug,
  UploadedDocument,
} from "@/types";
import { requiredSlots } from "@/types";
import { cn, daysBetween, formatPrice, isoDaysFromNow, todayIso } from "@/lib/utils";
import {
  checkEmail,
  checkPhone,
  checkWhatsApp,
  samePhone,
  sanitisePhoneInput,
} from "@/lib/contact";

/**
 * The one office, plus delivery. Delivery is not a location we have, it is a
 * service we offer, which is why it is added here rather than sitting in the
 * locations data.
 */
const pickupOptions: string[] = [...locationNames, "Delivered to my address"];

const steps: { id: BookingStep; label: string }[] = [
  { id: "trip", label: "Your trip" },
  { id: "vehicle", label: "Vehicle" },
  { id: "details", label: "Your details" },
  { id: "review", label: "Review" },
];

/**
 * Mirrors slotLabels in lib/panel/uploads.ts. Duplicated rather than imported
 * because that module reaches for node:fs, and importing it here would drag
 * the filesystem into the browser bundle. Same reason cars.ts stays pure.
 */
const slotLabels: Record<DocumentSlot, string> = {
  "nic-front": "NIC, front",
  "nic-back": "NIC, back",
  passport: "Passport photo page",
  "licence-front": "Driving licence, front",
  "licence-back": "Driving licence, back",
};

const slotHints: Record<DocumentSlot, string> = {
  "nic-front": "The side with your photograph",
  "nic-back": "The side with your address",
  passport: "The page with your photograph",
  "licence-front": "The side with your photograph",
  "licence-back": "The side listing your vehicle classes",
};

/** Kept in step with ACCEPT_ATTRIBUTE in lib/panel/uploads.ts. */
const UPLOAD_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";

const idOptions: { value: IdDocumentType; label: string }[] = [
  { value: "nic", label: "National Identity Card" },
  { value: "passport", label: "Passport" },
];

const serviceOptions: { value: ServiceSlug; label: string }[] = [
  { value: "self-drive-rental", label: "Self-drive rental" },
  { value: "cabs-with-driver", label: "Cab with a driver" },
  { value: "airport-transfers", label: "Airport transfer" },
  { value: "wedding-cars", label: "Wedding car" },
  { value: "long-term-lease", label: "Long-term lease" },
];

/**
 * The hand-drawn arrow between two steps.
 *
 * One path, flipped on the Y axis for the downward one, so the two are
 * guaranteed to be the same drawing and cannot drift apart. It is a filled
 * outline rather than a stroked line because a stroke cannot taper: the
 * cartoon look is a thin tail swelling into a big swept head, and that is a
 * shape, not a line width. The 1.6 stroke in the same colour is there to round
 * the corners off, which is what keeps it friendly rather than spiky.
 *
 * Decorative. The <ol> already tells a screen reader the order, so the wrapper
 * carries aria-hidden and this adds nothing to the accessibility tree.
 */
function StepArrow({ up, done }: { up: boolean; done: boolean }) {
  return (
    <svg
      viewBox="0 0 56 32"
      className={cn(
        "w-8 shrink-0 transition-colors duration-200 sm:w-11",
        done ? "text-brand-bright" : "text-muted/50",
      )}
      aria-hidden
    >
      <g transform={up ? undefined : "translate(0,32) scale(1,-1)"}>
        <path
          d="M4 28 C15 27 27 22 35 11 L31 3 L52 13 L34 25 L33 18 C26 25 14 30 4 28 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
/** One validation message, tied to its input for screen readers. */
function FieldError({ id, message }: { id: string; message: string | null }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-2 text-sm font-medium text-brand-bright"
    >
      {message}
    </p>
  );
}

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
  /**
   * Which fields the customer has finished with. An error under a box nobody
   * has typed in yet reads as the form telling them off for arriving, so a
   * message only appears once a field has been left, or once Continue has
   * been attempted.
   */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draft, setDraft] = useState<BookingDraft>({
    serviceType: (searchParams.get("service") as ServiceSlug) ?? "self-drive-rental",
    pickupLocation: searchParams.get("pickup") ?? locationNames[0],
    dropoffLocation: searchParams.get("pickup") ?? locationNames[0],
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
    whatsapp: "",
    idType: "nic",
    documents: {},
    notes: "",
  });

  const set = <K extends keyof BookingDraft>(key: K, value: BookingDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  /** One slot at a time. Undefined clears it, which is what Remove sends. */
  const setDocument = (slot: DocumentSlot, document: UploadedDocument | undefined) =>
    setDraft((current) => {
      const documents = { ...current.documents };
      if (document) documents[slot] = document;
      else delete documents[slot];
      return { ...current, documents };
    });

  /**
   * Switching NIC to passport leaves the unused uploads in the draft on
   * purpose: someone who taps the wrong chip and taps back has not lost the
   * files they already sent. Only the required set is ever submitted.
   */
  const setIdType = (idType: IdDocumentType) => set("idType", idType);

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

  const idSlots: DocumentSlot[] =
    draft.idType === "nic" ? ["nic-front", "nic-back"] : ["passport"];
  const licenceSlots: DocumentSlot[] = ["licence-front", "licence-back"];

  const needed = requiredSlots(draft.idType);
  const missingDocuments = needed.filter((slot) => !draft.documents[slot]).length;

  /* Validation. Every message is the reason, never just 'invalid'. */
  const phoneCheck = checkPhone(draft.phone);
  const whatsappCheck = checkWhatsApp(draft.whatsapp);
  const emailCheck = checkEmail(draft.email);

  /**
   * Two numbers means two numbers. Compared after parsing, so the same number
   * typed once local and once international still counts as one.
   */
  const numbersClash =
    Boolean(draft.phone && draft.whatsapp) && samePhone(draft.phone, draft.whatsapp);

  const nameError = draft.fullName.trim().length < 2 ? "Enter your full name." : null;
  const emailError = emailCheck.ok ? null : emailCheck.reason;
  const phoneError = phoneCheck.ok ? null : phoneCheck.reason;
  const whatsappError = whatsappCheck.ok
    ? numbersClash
      ? "Give two different numbers. The same one twice does not help us reach you."
      : null
    : whatsappCheck.reason;

  /** Shown only once the customer has finished with the field, or tried to continue. */
  const errorFor = (field: string, message: string | null) =>
    message && (showErrors || touched[field]) ? message : null;

  const detailsComplete =
    !nameError &&
    !emailError &&
    !phoneError &&
    !whatsappError &&
    missingDocuments === 0;

  const canContinue =
    step === "trip"
      ? Boolean(draft.pickupLocation && draft.pickupDate && draft.returnDate)
      : step === "vehicle"
        ? Boolean(draft.carSlug)
        : step === "details"
          ? detailsComplete
          : true;

  const goNext = () => {
    // Continue is disabled while the step is incomplete, but the button is
    // still reachable by keyboard and the check has to hold on its own.
    if (!canContinue) {
      setShowErrors(true);
      return;
    }
    const next = steps[stepIndex + 1];
    if (next) setStep(next.id);
    setShowErrors(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    const previous = steps[stepIndex - 1];
    if (previous) setStep(previous.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    // Lands in the panel as a pending booking.
    await createBookingAction({
      carSlug: draft.carSlug,
      customerName: draft.fullName,
      phone: draft.phone,
      whatsapp: draft.whatsapp,
      email: draft.email,
      idType: draft.idType,
      // Only the documents the chosen path actually needs. Files left over
      // from a switch between NIC and passport are not sent.
      documents: needed
        .map((slot) => draft.documents[slot])
        .filter((item): item is UploadedDocument => Boolean(item)),
      pickupLocation: draft.pickupLocation,
      pickupDate: draft.pickupDate,
      returnDate: draft.returnDate,
      withDriver: draft.withDriver,
      notes: draft.notes,
      amount: totals.total,
      source: "website",
    });
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="rounded-(--radius-shell) bg-surface p-8 text-center lg:p-14">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-tint text-brand-bright">
          <CircleCheck className="size-8" aria-hidden />
        </span>
        <h2 className="display-md mt-7">Request received</h2>
        <p className="mx-auto mt-4 max-w-[48ch] leading-relaxed text-muted">
          Thanks {draft.fullName.split(" ")[0] || "for that"}. We have your request
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
        {/* Step track. The arrows alternate up and down between the steps, so
            the row reads as a route rather than four separate buttons. */}
        <ol className="flex items-center gap-1 rounded-full bg-surface p-1.5 sm:gap-2">
          {steps.map((item, index) => {
            const done = index < stepIndex;
            const current = index === stepIndex;
            return (
              <Fragment key={item.id}>
                <li className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => index <= stepIndex && setStep(item.id)}
                    disabled={index > stepIndex}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-colors duration-200",
                      current && "bg-brand text-white",
                      done && "text-brand-bright hover:bg-field",
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

                {index < steps.length - 1 ? (
                  <li aria-hidden className="flex shrink-0 items-center">
                    <StepArrow up={index % 2 === 0} done={done} />
                  </li>
                ) : null}
              </Fragment>
            );
          })}
        </ol>

        <div className="mt-(--gap) rounded-(--radius-card) bg-surface p-6 lg:p-8">
          {/* Step 1 - trip */}
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

                {/* One office, so there is nothing to choose between for the
                    return. The only real question is whether the vehicle is
                    collected here or delivered. */}
                <Field label="Pickup and return" htmlFor="pickup" className="sm:col-span-2">
                  <Select
                    id="pickup"
                    value={draft.pickupLocation}
                    onChange={(event) => {
                      set("pickupLocation", event.target.value);
                      set("dropoffLocation", event.target.value);
                    }}
                  >
                    {pickupOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </Field>

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

          {/* Step 2 - vehicle */}
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
                        active ? "bg-brand text-white" : "bg-field hover:bg-field-hover",
                        !car.available && "cursor-not-allowed opacity-45",
                      )}
                    >
                      <span className="relative size-20 shrink-0 overflow-hidden rounded-(--radius-chip) bg-surface-alt">
                        <CarImage src={car.images[0]} alt={car.name} sizes="80px" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-base font-bold uppercase">
                          {car.name}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 flex items-center gap-1.5 text-sm",
                            active ? "text-muted" : "text-muted",
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
                              active ? "text-muted" : "text-muted",
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

          {/* Step 3 - details */}
          {step === "details" ? (
            <div>
              <h2 className="font-display text-xl font-bold uppercase">Your details</h2>
              <p className="mt-2 text-muted">
                We need two numbers we can reach you on, and photographs of your
                identity document and your driving licence. Everything here is
                required before we can hold a vehicle.
              </p>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <Field label="Full name" htmlFor="name" className="sm:col-span-2">
                  <Input
                    id="name"
                    value={draft.fullName}
                    onChange={(event) => set("fullName", event.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    placeholder="As printed on your licence"
                    autoComplete="name"
                    aria-invalid={Boolean(errorFor("name", nameError))}
                    aria-describedby={errorFor("name", nameError) ? "name-error" : undefined}
                  />
                  <FieldError id="name-error" message={errorFor("name", nameError)} />
                </Field>

                <Field label="Email" htmlFor="email" className="sm:col-span-2">
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    value={draft.email}
                    onChange={(event) => set("email", event.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={Boolean(errorFor("email", emailError))}
                    aria-describedby={errorFor("email", emailError) ? "email-error" : undefined}
                  />
                  <FieldError id="email-error" message={errorFor("email", emailError)} />
                </Field>

                <Field label="Mobile number" htmlFor="phone" hint="We call this one">
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    pattern="[0-9+() .-]*"
                    value={draft.phone}
                    onChange={(event) =>
                      set("phone", sanitisePhoneInput(event.target.value))
                    }
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    placeholder="077 123 4567"
                    autoComplete="tel"
                    aria-invalid={Boolean(errorFor("phone", phoneError))}
                    aria-describedby={errorFor("phone", phoneError) ? "phone-error" : undefined}
                  />
                  <FieldError id="phone-error" message={errorFor("phone", phoneError)} />
                </Field>

                <Field
                  label="WhatsApp number"
                  htmlFor="whatsapp"
                  hint="We message this one"
                >
                  <Input
                    id="whatsapp"
                    type="tel"
                    inputMode="tel"
                    pattern="[0-9+() .-]*"
                    value={draft.whatsapp}
                    onChange={(event) =>
                      set("whatsapp", sanitisePhoneInput(event.target.value))
                    }
                    onBlur={() => setTouched((t) => ({ ...t, whatsapp: true }))}
                    placeholder="071 123 4567"
                    aria-invalid={Boolean(errorFor("whatsapp", whatsappError))}
                    aria-describedby={
                      errorFor("whatsapp", whatsappError) ? "whatsapp-error" : undefined
                    }
                  />
                  <FieldError
                    id="whatsapp-error"
                    message={errorFor("whatsapp", whatsappError)}
                  />
                </Field>
              </div>

              <div className="rule my-8" />

              {/* Identity document */}
              <h3 className="font-display text-lg font-bold uppercase">
                Your identity document
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Choose what you are sending. We hold these only to verify the
                hire, and only staff can open them.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {idOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setIdType(option.value)}
                    aria-pressed={draft.idType === option.value}
                    className={cn(
                      "rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-200",
                      draft.idType === option.value
                        ? "bg-brand text-white"
                        : "bg-field text-ink-soft hover:bg-field-hover hover:text-ink",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {idSlots.map((slot) => (
                  <DocumentUpload
                    key={slot}
                    slot={slot}
                    label={slotLabels[slot]}
                    hint={slotHints[slot]}
                    accept={UPLOAD_ACCEPT}
                    value={draft.documents[slot]}
                    onChange={setDocument}
                  />
                ))}
              </div>

              <div className="rule my-8" />

              {/* Licence */}
              <h3 className="font-display text-lg font-bold uppercase">
                Your driving licence
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Both faces of the card. The back carries the vehicle classes you
                are allowed to drive, which is the part we have to check.
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {licenceSlots.map((slot) => (
                  <DocumentUpload
                    key={slot}
                    slot={slot}
                    label={slotLabels[slot]}
                    hint={slotHints[slot]}
                    accept={UPLOAD_ACCEPT}
                    value={draft.documents[slot]}
                    onChange={setDocument}
                  />
                ))}
              </div>

              <div className="rule my-8" />

              <Field label="Anything we should know?" htmlFor="notes">
                <Textarea
                  id="notes"
                  rows={4}
                  value={draft.notes}
                  onChange={(event) => set("notes", event.target.value)}
                  placeholder="Flight number, delivery address, planned route…"
                />
              </Field>

              {missingDocuments > 0 ? (
                <p className="mt-6 flex items-start gap-2 text-sm text-muted">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-brand-bright" aria-hidden />
                  {missingDocuments === 1
                    ? "One more document to upload before you can continue."
                    : `${missingDocuments} more documents to upload before you can continue.`}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Step 4 - review */}
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
                        ?.label ?? "Not given",
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
                  { label: "Name", value: draft.fullName || "Not given" },
                  { label: "Call", value: draft.phone || "Not given" },
                  { label: "WhatsApp", value: draft.whatsapp || "Not given" },
                  { label: "Email", value: draft.email || "Not given" },
                  {
                    label: "Documents",
                    value: needed.map((slot) => slotLabels[slot]).join(", "),
                  },
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
                  { label: "Notes", value: draft.notes || "Not given" },
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
                <Link href="/terms" className="font-medium text-brand-bright hover:underline">
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
          <div className="p-6 lg:p-7">
            <h2 className="font-display text-lg font-bold uppercase">Your booking</h2>

            {selectedCar ? (
              <div className="mt-5 flex items-center gap-4">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-(--radius-chip) bg-field">
                  <CarImage
                    src={selectedCar.images[0]}
                    alt={selectedCar.name}
                    sizes="64px"
                   
                  />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display font-bold uppercase">
                    {selectedCar.name}
                  </p>
                  <p className="text-sm text-muted">{selectedCar.tagline}</p>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted">
                No vehicle selected yet. Pick one in step two and the estimate
                appears here.
              </p>
            )}

            <div className="mt-6 h-px bg-line" />

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Duration</dt>
                <dd className="font-semibold">
                  {days} {days === 1 ? "day" : "days"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Vehicle</dt>
                <dd className="font-semibold">{formatPrice(totals.vehicle)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Extras</dt>
                <dd className="font-semibold">{formatPrice(totals.extras)}</dd>
              </div>
            </dl>

            <div className="mt-6 h-px bg-line" />

            <div className="mt-6 flex items-end justify-between gap-4">
              <span className="text-muted">Estimated total</span>
              <span className="font-display text-3xl font-extrabold leading-none">
                {formatPrice(totals.total)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Includes insurance and unlimited kilometres. Refundable
              deposit of {formatPrice(totals.deposit)} is separate.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
