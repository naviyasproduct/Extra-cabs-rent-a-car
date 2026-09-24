import "server-only";
import { SYSTEM_STAFF_ID, insertAudit, listBookings, updateBooking } from "./db";
import { deleteDocuments, listStoredDocuments } from "./uploads";
import { colomboDay, documentsExpired } from "./retention-rules";

/**
 * Carries out the retention rule in retention-rules.ts: deletes identity
 * photos whose time is up and keeps the booking record.
 *
 * SERVER ONLY. Called from the bookings screen on every load, and meant to be
 * called by a daily scheduled job too (see HANDOVER), because a rule that runs
 * only when someone opens a page stops running the week nobody does.
 */

export { SYSTEM_STAFF_ID };

/**
 * Uploads older than this with no booking pointing at them are orphans: a
 * customer uploaded ID photos and then abandoned the booking form. A day is
 * generous; the form takes minutes.
 */
export const ORPHAN_AFTER_HOURS = 24;

/** Deletes every expired set of photos. Returns how many bookings it cleared. */
export async function purgeExpiredDocuments(now: Date = new Date()): Promise<number> {
  const today = colomboDay(now.toISOString());
  const due = (await listBookings()).filter((booking) => documentsExpired(booking, today));

  for (const booking of due) {
    // Files first, record second. If this dies in between, the next run finds
    // the booking still listing documents and tries again; deleting a file
    // that is already gone is harmless. deleteDocuments throws on a storage
    // error, so a booking is never marked purged while its photos remain.
    await deleteDocuments(booking.documents.map((d) => d.id));
    const at = now.toISOString();
    await updateBooking(booking.id, { documents: [], documentsPurgedAt: at });
    await insertAudit({
      staffId: SYSTEM_STAFF_ID,
      action: "booking.documents_purged",
      entity: "booking",
      entityId: booking.id,
      summary: `Deleted ID photos for ${booking.reference} under the retention rule`,
      accessRequestId: null,
      at,
    });
  }

  return due.length;
}

/**
 * Deletes uploads that no booking points at and that are older than
 * ORPHAN_AFTER_HOURS. Returns how many it removed.
 *
 * Nothing did this before 2026-09-22, in the file store or anywhere else: an
 * abandoned booking form left a customer's NIC photographs in storage for
 * ever, with no record anywhere explaining why we held them.
 */
export async function purgeOrphanUploads(now: Date = new Date()): Promise<number> {
  const referenced = new Set(
    (await listBookings()).flatMap((booking) => booking.documents.map((d) => d.id)),
  );
  const cutoff = now.getTime() - ORPHAN_AFTER_HOURS * 60 * 60 * 1000;
  const orphans = (await listStoredDocuments())
    .filter((object) => !referenced.has(object.id) && Date.parse(object.createdAt) < cutoff)
    .map((object) => object.id);

  await deleteDocuments(orphans);
  return orphans.length;
}

/** Both sweeps, for the scheduled job. */
export async function runRetention(now: Date = new Date()): Promise<{ expired: number; orphans: number }> {
  const expired = await purgeExpiredDocuments(now);
  const orphans = await purgeOrphanUploads(now);
  return { expired, orphans };
}
