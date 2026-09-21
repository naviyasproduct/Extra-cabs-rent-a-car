import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { DocumentSlot, UploadedDocument } from "@/types/booking";

/**
 * Customer identity documents: NIC, passport and driving licence photographs.
 *
 * SERVER ONLY.
 *
 * This is the same kind of scaffold as store.ts. Bytes go to .data/uploads/,
 * which is gitignored, and the metadata goes on the booking in panel.json. On a
 * read-only filesystem (Vercel) it falls back to memory so a preview still
 * works, exactly as the JSON store does.
 *
 * WHEN SUPABASE LANDS this becomes a private Storage bucket and the ids below
 * become object keys. Nothing else has to change: callers only ever see an id.
 *
 * These are the most sensitive records the system holds. Sri Lanka's PDPA
 * No. 9 of 2022 applies to them (HANDOVER section 7d), so:
 *   - they are never written under public/ and never served by a static path,
 *   - reading one goes through /api/panel/documents/[id], which requires a
 *     signed-in staff session,
 *   - the id is 32 random hex characters, so a URL cannot be guessed or walked.
 */

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

/** 8MB. A phone photograph of a card is well under this; a video is not. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Allowlist, not a blocklist, and checked against the bytes as well as the
 * declared type. A browser will send whatever Content-Type it likes.
 */
const ACCEPTED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

/** What the file input advertises, so the picker filters on the phone. */
export const ACCEPT_ATTRIBUTE = Object.keys(ACCEPTED).join(",");

export const VALID_SLOTS: DocumentSlot[] = [
  "nic-front",
  "nic-back",
  "passport",
  "licence-front",
  "licence-back",
];

let diskWritable = true;
const memory = new Map<string, { bytes: Buffer; contentType: string }>();

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

/** Strips any path the browser sent and keeps something readable for staff. */
function safeName(raw: string): string {
  const base = raw.split(/[\/]/).pop() ?? "upload";
  const cleaned = base.replace(/[^A-Za-z0-9._ -]/g, "").trim();
  return (cleaned || "upload").slice(0, 80);
}

export type SaveResult =
  | { ok: true; document: UploadedDocument }
  | { ok: false; error: string };

export async function saveDocument(
  file: File,
  slot: DocumentSlot,
): Promise<SaveResult> {
  if (!VALID_SLOTS.includes(slot)) {
    return { ok: false, error: "Unknown document type." };
  }
  if (file.size === 0) {
    return { ok: false, error: "That file is empty." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 8MB.`,
    };
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Re-check the size against what actually arrived, not only what was declared.
  if (bytes.length > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "That file is too large. The limit is 8MB." };
  }

  const contentType = sniff(bytes);
  if (!contentType || !(contentType in ACCEPTED)) {
    return {
      ok: false,
      error: "Use a photo (JPG, PNG, WEBP or HEIC) or a PDF.",
    };
  }

  const id = crypto.randomBytes(16).toString("hex");
  const stored = `${id}.${ACCEPTED[contentType]}`;

  if (diskWritable) {
    try {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      fs.writeFileSync(path.join(UPLOAD_DIR, stored), bytes);
    } catch {
      diskWritable = false;
    }
  }
  if (!diskWritable) memory.set(id, { bytes, contentType });

  return {
    ok: true,
    document: {
      id,
      slot,
      fileName: safeName(file.name),
      contentType,
      size: bytes.length,
      uploadedAt: new Date().toISOString(),
    },
  };
}

/** Reads a stored document back. Callers MUST check the session first. */
export function readDocument(
  id: string,
): { bytes: Buffer; contentType: string } | null {
  // The id is the filename stem, so it has to be proved safe before it is
  // joined to a path. Anything but 32 hex characters is not one of ours.
  if (!/^[0-9a-f]{32}$/.test(id)) return null;

  const held = memory.get(id);
  if (held) return held;

  try {
    for (const [type, ext] of Object.entries(ACCEPTED)) {
      const candidate = path.join(UPLOAD_DIR, `${id}.${ext}`);
      if (fs.existsSync(candidate)) {
        return { bytes: fs.readFileSync(candidate), contentType: type };
      }
    }
  } catch {
    // Unreadable disk. Fall through to null rather than throwing at a route.
  }
  return null;
}

/**
 * Deletes a stored document for good. Returns true when something was
 * removed. Used by the retention rule and when a booking is deleted, so no
 * identity photo outlives the record that explains why we had it.
 */
export function deleteDocument(id: string): boolean {
  // Same guard as readDocument: prove the id safe before it touches a path.
  if (!/^[0-9a-f]{32}$/.test(id)) return false;

  let removed = memory.delete(id);
  try {
    for (const ext of Object.values(ACCEPTED)) {
      const candidate = path.join(UPLOAD_DIR, `${id}.${ext}`);
      if (fs.existsSync(candidate)) {
        fs.unlinkSync(candidate);
        removed = true;
      }
    }
  } catch {
    // Unwritable disk. Report what we managed rather than throwing.
  }
  return removed;
}

/** Human label for a slot, used in the panel and in the form. */
export const slotLabels: Record<DocumentSlot, string> = {
  "nic-front": "NIC, front",
  "nic-back": "NIC, back",
  passport: "Passport photo page",
  "licence-front": "Driving licence, front",
  "licence-back": "Driving licence, back",
};
