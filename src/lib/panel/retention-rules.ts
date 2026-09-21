/**
 * How long customer identity photos are kept. Client decision, 2026-09-21.
 *
 *   A hire that happened      photos deleted 90 days after it ended
 *   A request that never      photos deleted 30 days after it closed
 *   became a hire
 *   Anything on hold          never deleted while the hold is on (an open
 *                             fine, damage claim or dispute)
 *
 * Only the PHOTOS go. The booking record stays: name, both numbers, email,
 * dates, vehicle, and the NIC/passport and licence numbers staff type in at
 * handover. That is what lets the owner look up a past customer without the
 * business holding images of their documents forever, which is the part of
 * this hardest to justify under Sri Lanka's PDPA No. 9 of 2022.
 *
 * PURE: no store, no filesystem, no imports but types. The deleting is done by
 * retention.ts, which calls this. Keeping the rule here means it can be tested
 * without touching a single file, and the privacy policy's clause 5 can be
 * checked against one place.
 */

import type { BookingStatus } from "./types";

export const HIRED_RETENTION_DAYS = 90;
export const UNHIRED_RETENTION_DAYS = 30;

/** The fields the rule reads. A PanelBooking satisfies this. */
export interface RetentionInput {
  status: BookingStatus;
  /** YYYY-MM-DD, Asia/Colombo. */
  returnDate: string;
  createdAt: string;
  closedAt: string | null;
  documentsHold: boolean;
  documents: readonly unknown[];
}

/**
 * The Colombo calendar day of an instant.
 *
 * Sri Lanka is a fixed UTC+05:30 with no daylight saving, so a fixed offset is
 * exact. Written out here rather than imported from time.ts, because that
 * module reaches the store and this one must stay pure.
 */
export function colomboDay(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  return new Date(ms + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** "2026-09-21" plus 90 days. Date-only arithmetic in UTC, so no DST drift. */
export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * The Colombo day on which this booking's photos may be deleted, or null when
 * they must be kept: nothing to delete, on hold, or the hire is still live.
 */
export function documentsExpireOn(booking: RetentionInput): string | null {
  if (booking.documents.length === 0) return null;
  if (booking.documentsHold) return null;

  // When the booking actually closed, if staff recorded it. Bookings closed
  // before closedAt existed fall back to their dates below.
  const closed = booking.closedAt ? colomboDay(booking.closedAt) : "";

  switch (booking.status) {
    case "returned": {
      // The later of the booked return date and the day it was marked
      // returned: a car brought back late ends its hire late.
      const ended = closed && closed > booking.returnDate ? closed : booking.returnDate;
      return addDays(ended, HIRED_RETENTION_DAYS);
    }
    case "confirmed":
      // Confirmed but never started. Once the booked return date has passed
      // without a hire, treat it as a hire that ended then, which keeps the
      // photos through any no-show dispute.
      return addDays(booking.returnDate, HIRED_RETENTION_DAYS);
    case "cancelled":
      return addDays(closed || colomboDay(booking.createdAt), UNHIRED_RETENTION_DAYS);
    case "pending":
      // Never confirmed. Counted from the date it would have ended.
      return addDays(booking.returnDate, UNHIRED_RETENTION_DAYS);
    case "on_hire":
      // The vehicle is still out, possibly overdue. Never delete.
      return null;
  }
}

/** True when the photos should go today. `today` is a Colombo YYYY-MM-DD. */
export function documentsExpired(booking: RetentionInput, today: string): boolean {
  const expires = documentsExpireOn(booking);
  return expires !== null && expires !== "" && expires <= today;
}
