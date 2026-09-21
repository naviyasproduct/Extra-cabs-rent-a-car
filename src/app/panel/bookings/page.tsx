import { CircleAlert, FileText, Trash2 } from "lucide-react";
import { slotLabels } from "@/lib/panel/uploads";
import { requireStaff, canWrite } from "@/lib/panel/guard";
import { readData } from "@/lib/panel/store";
import { colomboDateTime } from "@/lib/panel/time";
import { purgeExpiredDocuments } from "@/lib/panel/retention";
import {
  HIRED_RETENTION_DAYS,
  UNHIRED_RETENTION_DAYS,
  documentsExpireOn,
} from "@/lib/panel/retention-rules";
import { listVehicles } from "@/lib/fleet";
import { formatPrice } from "@/lib/utils";
import {
  deleteBookingAction,
  setBookingIdentityAction,
  setBookingPaymentAction,
  setBookingStatusAction,
} from "../actions";
import type { BookingStatus } from "@/lib/panel/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bookings" };

const STATUSES: { id: BookingStatus; label: string; tone: string }[] = [
  { id: "pending", label: "Pending", tone: "text-warning" },
  { id: "confirmed", label: "Confirmed", tone: "text-success" },
  { id: "on_hire", label: "On hire", tone: "text-brand-bright" },
  { id: "returned", label: "Returned", tone: "text-ink-soft" },
  { id: "cancelled", label: "Cancelled", tone: "text-muted" },
];

export default async function PanelBookings({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await requireStaff();
  // The retention rule runs here because there is no scheduler yet. It must
  // run before readData() so this screen never lists a photo it just deleted.
  purgeExpiredDocuments();
  const data = readData();
  const vehicles = await listVehicles();

  const nameFor = (slug: string | null) =>
    vehicles.find((v) => v.car.slug === slug)?.car.name ?? "No vehicle chosen";

  const staffName = (id: string | null) =>
    id ? (data.staff.find((s) => s.id === id)?.name ?? "Unknown") : "Nobody yet";

  const canDelete = canWrite(user, "booking.delete");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="display-md">Bookings</h1>
        <p className="mt-2 max-w-[62ch] text-sm text-muted">
          Confirming a booking or starting a hire takes that vehicle off the
          public website automatically. Cancelling or returning puts it back.
        </p>
        <p className="mt-2 max-w-[62ch] text-sm text-muted">
          ID and licence photos are deleted {HIRED_RETENTION_DAYS} days after a
          hire ends, or {UNHIRED_RETENTION_DAYS} days after a request that never
          became a hire. The booking stays. Type the ID and licence numbers in at
          handover so the customer can still be identified afterwards, and tick
          the hold while a fine, damage claim or dispute is open.
        </p>
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 bg-brand-tint px-4 py-3 text-sm font-medium text-brand-bright">
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      {data.bookings.length === 0 ? (
        <p className="bg-tile p-6 text-sm text-muted">
          No bookings yet. One made through the website booking form, or
          taken by phone, will appear here.
        </p>
      ) : null}

      <div className="flex flex-col gap-px bg-line">
        {data.bookings.map((booking) => {
          const status = STATUSES.find((s) => s.id === booking.status);

          return (
            <article key={booking.id} className="bg-tile p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2.5">
                    <span className="font-display text-base font-bold uppercase">
                      {booking.reference}
                    </span>
                    <span
                      className={`text-xs font-semibold uppercase tracking-[0.12em] ${status?.tone ?? ""}`}
                    >
                      {status?.label}
                    </span>
                    <span className="text-xs text-muted">
                      {booking.source === "website" ? "from the website" : "taken by phone"}
                    </span>
                  </p>

                  <p className="mt-2 text-sm text-ink-soft">
                    <span className="font-semibold text-ink">{booking.customerName}</span>
                    {" · "}
                    {booking.phone}
                    {booking.email ? ` · ${booking.email}` : ""}
                  </p>

                  {booking.whatsapp ? (
                    <p className="mt-1 text-sm text-muted">
                      WhatsApp {booking.whatsapp}
                    </p>
                  ) : null}

                  <p className="mt-1 text-sm text-muted">
                    {nameFor(booking.carSlug)} · {booking.pickupDate} to{" "}
                    {booking.returnDate}
                    {booking.withDriver ? " · with a driver" : " · self drive"}
                  </p>

                  {booking.notes ? (
                    <p className="mt-2 max-w-[60ch] text-sm text-muted">
                      {booking.notes}
                    </p>
                  ) : null}

                  {/* Identity documents. Links, not thumbnails: these are NIC
                      and licence images, so they open only when a staff member
                      asks for one rather than rendering on a shared screen. */}
                  {booking.documents.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {booking.documents.map((document) => (
                        <a
                          key={document.id}
                          href={`/api/panel/documents/${document.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-field px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-field-hover hover:text-ink"
                        >
                          <FileText className="size-3.5 text-brand-bright" aria-hidden />
                          {slotLabels[document.slot]}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted">
                      {booking.documentsPurgedAt
                        ? `ID photos deleted ${colomboDateTime(booking.documentsPurgedAt)} under the retention rule.`
                        : "No identity documents on this booking."}
                    </p>
                  )}
                  <RetentionNote
                    hold={booking.documentsHold}
                    expires={documentsExpireOn(booking)}
                    hasDocuments={booking.documents.length > 0}
                  />

                  <p className="mt-2 text-xs text-muted">
                    Raised {colomboDateTime(booking.createdAt)} · handled by{" "}
                    {staffName(booking.handledBy)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-display text-xl font-bold tabular-nums">
                    {formatPrice(booking.amount)}
                  </p>
                  <p className="text-xs uppercase tracking-[0.1em] text-muted">
                    {booking.paymentMethod.replace("_", " ")}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-line pt-4">
                <form action={setBookingStatusAction} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={booking.id} />
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted">
                      Status
                    </span>
                    <select
                      name="status"
                      defaultValue={booking.status}
                      className="h-10 bg-field px-3 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="h-10 rounded-full bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                  >
                    Update
                  </button>
                </form>

                <form action={setBookingPaymentAction} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={booking.id} />
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted">
                      Paid by
                    </span>
                    <select
                      name="method"
                      defaultValue={booking.paymentMethod}
                      className="h-10 bg-field px-3 text-sm"
                    >
                      <option value="unpaid">unpaid</option>
                      <option value="cash">cash</option>
                      <option value="bank_transfer">bank transfer</option>
                      <option value="card_on_pickup">card on pickup</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted">
                      Amount
                    </span>
                    <input
                      name="amount"
                      type="number"
                      defaultValue={booking.amount}
                      className="h-10 w-32 bg-field px-3 text-sm tabular-nums"
                    />
                  </label>
                  <button
                    type="submit"
                    className="h-10 rounded-full bg-field px-4 text-sm font-semibold transition-colors hover:bg-field-hover"
                  >
                    Record
                  </button>
                </form>

                <form action={setBookingIdentityAction} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={booking.id} />
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted">
                      {booking.idType === "passport" ? "Passport no." : "NIC no."}
                    </span>
                    <input
                      name="idNumber"
                      defaultValue={booking.idNumber}
                      autoComplete="off"
                      className="h-10 w-40 bg-field px-3 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted">
                      Licence no.
                    </span>
                    <input
                      name="licenceNumber"
                      defaultValue={booking.licenceNumber}
                      autoComplete="off"
                      className="h-10 w-40 bg-field px-3 text-sm"
                    />
                  </label>
                  <label className="flex h-10 items-center gap-2 text-sm text-ink-soft">
                    <input
                      type="checkbox"
                      name="documentsHold"
                      defaultChecked={booking.documentsHold}
                      className="size-4 accent-(--color-brand)"
                    />
                    Hold photos
                  </label>
                  <button
                    type="submit"
                    className="h-10 rounded-full bg-field px-4 text-sm font-semibold transition-colors hover:bg-field-hover"
                  >
                    Save
                  </button>
                </form>

                {canDelete ? (
                  <form action={deleteBookingAction} className="ml-auto">
                    <input type="hidden" name="id" value={booking.id} />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-field px-4 text-sm font-semibold transition-colors hover:bg-field-hover"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/** When this booking's photos will go, in words. Nothing when there are none. */
function RetentionNote({
  hold,
  expires,
  hasDocuments,
}: {
  hold: boolean;
  expires: string | null;
  hasDocuments: boolean;
}) {
  if (!hasDocuments) return null;
  const text = hold
    ? "On hold: these photos are kept until the hold is released."
    : expires
      ? `Photos will be deleted on ${expires}.`
      : "Photos are kept while the hire is live.";
  return <p className="mt-1.5 text-xs text-muted">{text}</p>;
}
