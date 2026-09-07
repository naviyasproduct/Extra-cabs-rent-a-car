import { CircleAlert, Trash2 } from "lucide-react";
import { requireStaff, canWrite } from "@/lib/panel/guard";
import { readData } from "@/lib/panel/store";
import { colomboDateTime } from "@/lib/panel/time";
import { listVehicles } from "@/lib/fleet";
import { formatPrice } from "@/lib/utils";
import {
  deleteBookingAction,
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
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 bg-brand-tint px-4 py-3 text-sm font-medium text-brand-bright">
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      {data.bookings.length === 0 ? (
        <p className="bg-tile p-6 text-sm text-muted">
          No bookings yet. One made through the website booking form or the
          quick request on a vehicle page will appear here.
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
