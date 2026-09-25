import "server-only";
import {
  SYSTEM_STAFF_ID,
  insertAudit,
  listBookings,
  listVehicleRecords,
  updateBooking,
} from "./db";
import { deleteDocuments, listStoredDocuments } from "./uploads";
import {
  deleteStaged,
  deleteVehicleMedia,
  listStoredMedia,
  staleStagedKeys,
} from "./vehicle-media";
import { VEHICLE_FOLDER } from "@/lib/cloudinary";
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
/**
 * Deletes vehicle photographs and videos that no vehicle points at.
 *
 * Two ways they appear. Somebody fills in the add form, uploads four
 * photographs and closes the tab: the files are in the account and no row was
 * ever written. Or a removal updated the row and then failed to reach
 * Cloudinary, which is deliberate (staff asked for the photo off the site and
 * that must happen either way) and leaves the file behind.
 *
 * **It refuses to delete anything if the vehicle list could not be read.** An
 * empty list would otherwise look exactly like "nothing is referenced", and
 * one bad query would wipe every photograph in the fleet.
 */
export async function purgeOrphanMedia(now: Date = new Date()): Promise<number> {
  const vehicles = await listVehicleRecords();
  const referenced = new Set<string>();
  for (const vehicle of vehicles) {
    for (const id of vehicle.images) referenced.add(id);
    for (const video of vehicle.videos ?? []) referenced.add(video.id);
  }

  const cutoff = now.getTime() - ORPHAN_AFTER_HOURS * 60 * 60 * 1000;
  const [images, videos] = await Promise.all([
    listStoredMedia(VEHICLE_FOLDER, "image"),
    listStoredMedia(VEHICLE_FOLDER, "video"),
  ]);

  let deleted = 0;
  for (const asset of [...images, ...videos]) {
    if (referenced.has(asset.publicId)) continue;
    if (Date.parse(asset.createdAt) >= cutoff) continue;
    if (await deleteVehicleMedia(asset.publicId, asset.kind)) deleted += 1;
  }
  return deleted;
}

/**
 * Clears the media staging bucket of anything a relay never collected.
 *
 * An object there is deleted the moment Cloudinary has fetched it, so
 * everything older than a day is the residue of an abandoned upload or a
 * relay that failed. Nothing points at it and nothing ever will.
 */
export async function purgeStagedMedia(): Promise<number> {
  return deleteStaged(await staleStagedKeys(ORPHAN_AFTER_HOURS * 60 * 60 * 1000));
}

export async function runRetention(
  now: Date = new Date(),
): Promise<{ expired: number; orphans: number; media: number; staged: number }> {
  const expired = await purgeExpiredDocuments(now);
  const orphans = await purgeOrphanUploads(now);
  const media = await purgeOrphanMedia(now);
  const staged = await purgeStagedMedia();
  return { expired, orphans, media, staged };
}
