/**
 * Carries out the retention rule in retention-rules.ts: deletes identity
 * photos whose time is up and keeps the booking record.
 *
 * SERVER ONLY.
 *
 * Run from the bookings screen on every load, because there is no scheduler
 * yet. That is enough while the store is a local file. When Supabase lands
 * this becomes a pg_cron job, since a rule that only runs when someone opens a
 * page stops running the week nobody does. See HANDOVER, 2026-09-21.
 */

import { newId, readData, writeData } from "./store";
import { deleteDocument } from "./uploads";
import { colomboDay, documentsExpired } from "./retention-rules";

/** Audit rows written by the rule itself rather than by a person. */
export const SYSTEM_STAFF_ID = "system";

/** Deletes every expired set of photos. Returns how many bookings it cleared. */
export function purgeExpiredDocuments(now: Date = new Date()): number {
  const today = colomboDay(now.toISOString());
  const due = readData().bookings.filter((booking) => documentsExpired(booking, today));
  if (due.length === 0) return 0;

  // Files first, record second. If the process dies between the two, the next
  // run finds the booking still listing documents and tries again, and
  // deleting an already-deleted file is harmless.
  for (const booking of due) {
    for (const document of booking.documents) deleteDocument(document.id);
  }

  const at = now.toISOString();
  const ids = new Set(due.map((booking) => booking.id));
  writeData((data) => {
    for (const booking of data.bookings) {
      if (!ids.has(booking.id)) continue;
      booking.documents = [];
      booking.documentsPurgedAt = at;
    }
    for (const booking of due) {
      data.audit.push({
        id: newId("aud"),
        at,
        staffId: SYSTEM_STAFF_ID,
        action: "booking.documents_purged",
        entity: "booking",
        entityId: booking.id,
        summary: `Deleted ID photos for ${booking.reference} under the retention rule`,
        accessRequestId: null,
      });
    }
  });

  return due.length;
}
