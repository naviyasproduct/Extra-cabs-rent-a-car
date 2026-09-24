import "server-only";
import crypto from "node:crypto";
import { admin } from "@/lib/supabase/admin";
import { ID_DOCUMENTS_BUCKET } from "@/lib/supabase/env";
import type { DocumentSlot, UploadedDocument } from "@/types/booking";

/**
 * Customer identity documents: NIC, passport and driving licence photographs.
 *
 * SERVER ONLY. Stored in the private `id-documents` Supabase bucket, keyed by
 * a 32 hex character id, with only the metadata on the booking.
 *
 * These are the most sensitive records the system holds. Sri Lanka's PDPA
 * No. 9 of 2022 applies to them (HANDOVER section 7d), so:
 *   - the bucket is private with no storage policies: only the service role
 *     can read or write it, proven on the live project 2026-09-22,
 *   - reading one goes through /api/panel/documents/[id], which requires a
 *     signed-in staff session,
 *   - the id is 32 random hex characters, so a URL cannot be guessed or walked,
 *   - they are deleted on the schedule in retention-rules.ts.
 */

/** 8MB. A phone photograph of a card is well under this; a video is not. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Allowlist, not a blocklist, and checked against the bytes as well as the
 * declared type. A browser will send whatever Content-Type it likes. The
 * bucket enforces the same list (and the same 8MB cap) on its own side.
 */
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"]);

/** What the file input advertises, so the picker filters on the phone. */
export const ACCEPT_ATTRIBUTE = [...ACCEPTED, "image/heif"].join(",");

export const VALID_SLOTS: DocumentSlot[] = [
  "nic-front",
  "nic-back",
  "passport",
  "licence-front",
  "licence-back",
];

const ID_PATTERN = /^[0-9a-f]{32}$/;

/**
 * Magic numbers. A file that claims image/jpeg but begins "MZ" is not a
 * photograph of anything, and trusting the declared type is how an upload
 * endpoint becomes a file drop.
 */
function sniff(bytes: Buffer): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  // HEIC/HEIF are ISO-BMFF: a 4 byte length, then "ftyp", then a brand.
  if (bytes.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = bytes.subarray(8, 12).toString("ascii");
    if (["heic", "heix", "hevc", "mif1", "msf1", "heim", "heis"].includes(brand)) {
      return "image/heic";
    }
  }
  if (bytes.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

/**
 * Strips any path the browser sent and keeps something readable for staff.
 * Splits on both kinds of separator; the previous pattern only matched "/".
 */
function safeName(raw: string): string {
  const base = raw.split(/[/\\]/).pop() ?? "upload";
  const cleaned = base.replace(/[^A-Za-z0-9._ -]/g, "").trim();
  return (cleaned || "upload").slice(0, 80);
}

export type SaveResult =
  | { ok: true; document: UploadedDocument }
  | { ok: false; error: string };

/**
 * Step one: hands the browser a URL it can upload one file to, directly.
 *
 * **The file must not pass through this server.** A Vercel function accepts a
 * request body of 4.5MB and answers 413 above it, and a phone photograph of an
 * NIC is routinely 3 to 8MB. Sending it through a server action therefore
 * failed in production for exactly the customers who did as they were asked,
 * with an error they could do nothing about.
 *
 * The id is generated HERE, never taken from the caller, so nobody can aim an
 * upload at an existing object and overwrite somebody else's document.
 */
export async function documentUploadTicket(
  slot: DocumentSlot,
): Promise<{ ok: true; id: string; url: string } | { ok: false; error: string }> {
  if (!VALID_SLOTS.includes(slot)) {
    return { ok: false, error: "Unknown document type." };
  }

  const id = crypto.randomBytes(16).toString("hex");
  const { data, error } = await admin()
    .storage.from(ID_DOCUMENTS_BUCKET)
    .createSignedUploadUrl(id);

  if (error || !data) {
    console.error(`[uploads] could not sign an upload for ${slot}: ${error?.message}`);
    return { ok: false, error: "Uploads are unavailable right now. Try again in a moment." };
  }
  return { ok: true, id, url: data.signedUrl };
}

/**
 * Step two: checks what actually landed, and destroys it if it is not what it
 * claims to be.
 *
 * This is where the magic number check moved to. It used to run before the
 * bytes were stored; it now runs seconds after, and a file that fails is
 * deleted immediately. The bucket is private with no policies, so a file that
 * exists for those seconds is readable by nobody: not the uploader, not a
 * visitor, only the service role.
 *
 * The bucket enforces its own 8MB cap and MIME allowlist on the way in, but
 * that list is checked against the type the browser DECLARED. This is the
 * check against the bytes themselves.
 */
export async function confirmDocument(
  id: string,
  slot: DocumentSlot,
  fileName: string,
): Promise<SaveResult> {
  if (!ID_PATTERN.test(id)) return { ok: false, error: "That upload did not go through. Try again." };
  if (!VALID_SLOTS.includes(slot)) return { ok: false, error: "Unknown document type." };

  const store = admin().storage.from(ID_DOCUMENTS_BUCKET);
  const { data, error } = await store.download(id);
  if (error || !data) {
    return { ok: false, error: "That upload did not arrive. Try again." };
  }

  const bytes = Buffer.from(await data.arrayBuffer());
  const destroy = async (message: string): Promise<SaveResult> => {
    await store.remove([id]);
    return { ok: false, error: message };
  };

  if (bytes.length === 0) return destroy("That file is empty.");
  if (bytes.length > MAX_UPLOAD_BYTES) {
    return destroy(`That file is ${(bytes.length / 1024 / 1024).toFixed(1)}MB. The limit is 8MB.`);
  }

  const contentType = sniff(bytes);
  if (!contentType || !ACCEPTED.has(contentType)) {
    return destroy("Use a photo (JPG, PNG, WEBP or HEIC) or a PDF.");
  }

  // Stored under the type the browser declared, which may not be the type the
  // bytes are. Rewriting it keeps what staff are served matching what the file
  // actually is. Normally this does not run at all.
  if (data.type !== contentType) {
    await store.upload(id, bytes, { contentType, upsert: true, cacheControl: "0" });
  }

  return {
    ok: true,
    document: {
      id,
      slot,
      fileName: safeName(fileName),
      contentType,
      size: bytes.length,
      uploadedAt: new Date().toISOString(),
    },
  };
}

/** Reads a stored document back. Callers MUST check the session first. */
export async function readDocument(
  id: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  // Not one of ours unless it is exactly 32 hex characters. Checked before
  // the id goes anywhere near the storage API.
  if (!ID_PATTERN.test(id)) return null;

  const { data, error } = await admin().storage.from(ID_DOCUMENTS_BUCKET).download(id);
  if (error || !data) return null;

  const contentType = ACCEPTED.has(data.type) ? data.type : "application/octet-stream";
  return { bytes: Buffer.from(await data.arrayBuffer()), contentType };
}

/**
 * Deletes stored documents for good. Used by the retention rule and when a
 * booking is deleted, so no identity photo outlives the record that explains
 * why we had it. Throws on a storage error, so a failed delete is never
 * recorded as a done one.
 */
export async function deleteDocuments(ids: string[]): Promise<void> {
  const safe = ids.filter((id) => ID_PATTERN.test(id));
  if (safe.length === 0) return;
  const { error } = await admin().storage.from(ID_DOCUMENTS_BUCKET).remove(safe);
  if (error) throw new Error(`[uploads] deleting documents failed: ${error.message}`);
}

/** Every stored document id with its upload time. For the orphan sweep. */
export async function listStoredDocuments(): Promise<{ id: string; createdAt: string }[]> {
  const out: { id: string; createdAt: string }[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await admin()
      .storage.from(ID_DOCUMENTS_BUCKET)
      .list("", { limit: pageSize, offset, sortBy: { column: "created_at", order: "asc" } });
    if (error) throw new Error(`[uploads] listing documents failed: ${error.message}`);
    for (const object of data ?? []) {
      if (ID_PATTERN.test(object.name) && object.created_at) {
        out.push({ id: object.name, createdAt: object.created_at });
      }
    }
    if (!data || data.length < pageSize) return out;
  }
}

/** Human label for a slot, used in the panel and in the form. */
export const slotLabels: Record<DocumentSlot, string> = {
  "nic-front": "NIC, front",
  "nic-back": "NIC, back",
  passport: "Passport photo page",
  "licence-front": "Driving licence, front",
  "licence-back": "Driving licence, back",
};
