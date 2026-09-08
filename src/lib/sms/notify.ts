/**
 * Who gets told, and what the text actually says.
 *
 * SERVER ONLY.
 *
 * textlk.ts knows how to send one message to one number. This module decides
 * which numbers, writes the words, and records every attempt in the store so a
 * silent failure (expired credits, unapproved sender ID, wrong number) is
 * visible on /panel/team instead of being lost.
 */

import { newId, readData, writeData } from "@/lib/panel/store";
import type { PanelBooking, SmsKind, SmsMessage } from "@/lib/panel/types";
import { displayMsisdn, measure, sendSms, toMsisdn } from "./textlk";

/** Keep the log useful without letting the JSON file grow forever. */
const LOG_LIMIT = 200;

export interface SmsRecipient {
  staffId: string;
  name: string;
  /** Normalised, ready to send to. */
  msisdn: string;
}

/**
 * Everyone who should hear about a new booking.
 *
 * Owner and employees alike: this is the one place the owner is treated the
 * same as staff, because it is a notification and not a timesheet. See the
 * 2026-09-07 change in HANDOVER for why that distinction matters elsewhere.
 *
 * Three ways to not be on this list: the account is disabled, alerts are off
 * for that person, or the number is blank or unusable.
 */
export function bookingRecipients(): SmsRecipient[] {
  return readData()
    .staff.filter((staff) => staff.active && staff.smsAlerts !== false)
    .map((staff) => ({
      staffId: staff.id,
      name: staff.name,
      msisdn: toMsisdn(staff.phone ?? ""),
    }))
    .filter((r): r is SmsRecipient => r.msisdn !== null);
}

/* -------------------------------------------------------------------------- */
/* The words                                                                   */
/* -------------------------------------------------------------------------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-09-10" to "10 Sep".
 *
 * Parsed by splitting the string, deliberately not with `new Date()`. A bare
 * date string is parsed as UTC midnight, which in Asia/Colombo is 5.30am the
 * same day going one way and the previous evening coming back: exactly the
 * kind of off-by-one-day that only shows up in production.
 */
function shortDate(iso: string): string {
  const [year, month, day] = String(iso ?? "").split("-").map(Number);
  if (!year || !month || !day) return String(iso ?? "");
  return `${day} ${MONTHS[month - 1] ?? ""}`.trim();
}

/** Cut a value down so the whole message still fits one segment. */
function clip(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1).trimEnd()}.`;
}

/**
 * The booking alert, built to fit **one** 160 character GSM-7 segment.
 *
 * One segment is one unit of credit. Two is two, forever, on every booking, so
 * the long fields are clipped rather than left to run. Detail is not lost: the
 * panel has all of it, and the reference at the front is how to find it.
 */
export function bookingSms(booking: PanelBooking, vehicleName: string | null): string {
  const name = clip(booking.customerName || "No name given", 28);
  const phone = booking.phone ? displayMsisdn(toMsisdn(booking.phone) ?? "") : "no number";
  const vehicle = clip(vehicleName ?? "Vehicle not chosen", 34);
  const driver = booking.withDriver ? ", with driver" : "";

  const text = [
    `Extra Cabs: new booking ${booking.reference}`,
    `${name}, ${phone}`,
    `${vehicle}${driver}`,
    `${shortDate(booking.pickupDate)} to ${shortDate(booking.returnDate)}`,
  ].join("\n");

  // A guard, not a formatter. If someone adds a line here later and pushes it
  // over, this keeps the bill at one segment and the mistake stays visible in
  // the message log rather than on the invoice.
  return measure(text).segments > 1 ? text.slice(0, 160) : text;
}

/* -------------------------------------------------------------------------- */
/* Sending and recording                                                       */
/* -------------------------------------------------------------------------- */

async function deliver(
  recipients: SmsRecipient[],
  body: string,
  kind: SmsKind,
): Promise<SmsMessage[]> {
  const { segments } = measure(body);

  // Sequential on purpose. Three recipients is not worth the concurrency, and
  // a gateway that is rate limiting is better met one call at a time.
  const rows: SmsMessage[] = [];
  for (const recipient of recipients) {
    const outcome = await sendSms(recipient.msisdn, body);
    rows.push({
      id: newId("sms"),
      at: new Date().toISOString(),
      to: recipient.msisdn,
      staffId: recipient.staffId,
      kind,
      body,
      segments,
      status: outcome.skipped ? "skipped" : outcome.ok ? "sent" : "failed",
      providerId: outcome.providerId,
      error: outcome.error,
    });
  }

  if (rows.length > 0) {
    writeData((data) => {
      data.messages ??= [];
      data.messages.unshift(...rows);
      data.messages.length = Math.min(data.messages.length, LOG_LIMIT);
    });
  }

  return rows;
}

/**
 * Tell the owner and the staff that a booking came in.
 *
 * Call this from `after()`. It must never be awaited inside the request that
 * creates the booking: the customer would sit watching a spinner while we talk
 * to an SMS gateway, and a gateway timeout would look to them like the booking
 * failed when it is already saved.
 */
export async function notifyNewBooking(
  booking: PanelBooking,
  vehicleName: string | null,
): Promise<void> {
  const recipients = bookingRecipients();
  if (recipients.length === 0) {
    console.warn(
      `[sms] booking ${booking.reference} created, but nobody has an SMS number set in /panel/team`,
    );
    return;
  }
  await deliver(recipients, bookingSms(booking, vehicleName), "booking.created");
}

/** One message to one person, so a new number can be proved before a real booking needs it. */
export async function sendTestSms(recipient: SmsRecipient): Promise<SmsMessage | null> {
  const body = `Extra Cabs: test message for ${clip(recipient.name, 20)}. Booking alerts will arrive on this number.`;
  const [row] = await deliver([recipient], body, "test");
  return row ?? null;
}
