import "server-only";
import crypto from "node:crypto";
import { VEHICLE_FOLDER } from "@/lib/cloudinary";

/**
 * Vehicle photographs, on Cloudinary.
 *
 * SERVER ONLY: it signs requests with the API secret, which must never reach a
 * browser. Signing here rather than using an unsigned upload preset is the
 * point: an unsigned preset lets anyone who reads the page JavaScript upload
 * into the account.
 *
 * **Customer ID documents never come here.** Those go to the private Supabase
 * bucket (lib/panel/uploads.ts). Cloudinary is a public delivery CDN: right
 * for a car photograph, wrong for a photograph of someone's NIC.
 *
 * No SDK. A signed upload is a POST with a SHA-1 of the parameters, so the
 * dependency would be carrying a lot of code for two requests.
 */

const API = "https://api.cloudinary.com/v1_1";

/** 10MB. A phone photograph of a car is well under this. */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** Photographs only: no PDF, and no SVG (it can carry script). */
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export const PHOTO_ACCEPT_ATTRIBUTE = [...ACCEPTED, "image/heif"].join(",");

function config(): { cloud: string; key: string; secret: string } | null {
  const cloud = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME ?? "").trim();
  const key = (process.env.CLOUDINARY_API_KEY ?? "").trim();
  const secret = (process.env.CLOUDINARY_API_SECRET ?? "").trim();
  return cloud && key && secret ? { cloud, key, secret } : null;
}

export function photoUploadsConfigured(): boolean {
  return config() !== null;
}

/**
 * Cloudinary's signature: the parameters that are being sent, except the file
 * itself and the api_key, sorted by name, joined as a query string, with the
 * API secret appended, then SHA-1.
 */
function sign(params: Record<string, string>, secret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(payload + secret).digest("hex");
}

/**
 * Magic numbers, the same approach as the ID document uploads: a file that
 * claims image/jpeg but begins "MZ" is not a photograph of anything, and
 * trusting the declared type is how an upload endpoint becomes a file drop.
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
  if (bytes.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = bytes.subarray(8, 12).toString("ascii");
    if (["heic", "heix", "hevc", "mif1", "msf1", "heim", "heis"].includes(brand)) return "image/heic";
  }
  return null;
}

export type PhotoResult =
  | { ok: true; publicId: string }
  | { ok: false; error: string };

/** Uploads one photograph and returns its public id. Never throws. */
export async function uploadVehiclePhoto(file: File, slug: string): Promise<PhotoResult> {
  const settings = config();
  if (!settings) {
    return { ok: false, error: "Photo uploads are not configured yet. Ask the developer." };
  }
  if (file.size === 0) return { ok: false, error: "That file is empty." };
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: `That photo is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 10MB.` };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > MAX_PHOTO_BYTES) {
    return { ok: false, error: "That photo is too large. The limit is 10MB." };
  }
  const contentType = sniff(bytes);
  if (!contentType || !ACCEPTED.has(contentType)) {
    return { ok: false, error: "Use a photo: JPG, PNG, WEBP or HEIC." };
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const folder = `${VEHICLE_FOLDER}/${slug}`;
  const signed = { folder, timestamp };

  const body = new FormData();
  body.set("file", new Blob([new Uint8Array(bytes)], { type: contentType }), file.name || "photo");
  body.set("api_key", settings.key);
  body.set("timestamp", timestamp);
  body.set("folder", folder);
  body.set("signature", sign(signed, settings.secret));

  try {
    const response = await fetch(`${API}/${settings.cloud}/image/upload`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(60_000),
    });
    const raw = await response.text();
    let payload: { public_id?: string; error?: { message?: string } } = {};
    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      return { ok: false, error: `Cloudinary replied with HTTP ${response.status}.` };
    }
    if (!response.ok || !payload.public_id) {
      const detail = payload.error?.message ?? raw.slice(0, 200);
      console.error(`[photos] upload failed: ${detail}`);
      // A refused key is a setup problem, not a bad photo, and "try again"
      // would have someone retrying forever. Cloudinary issues scoped API
      // keys; one without upload rights answers 401 or 403 here.
      if (response.status === 401 || response.status === 403) {
        return {
          ok: false,
          error: "Cloudinary refused the account key. It needs upload permission. Ask the developer.",
        };
      }
      return { ok: false, error: "That upload did not go through. Try again." };
    }
    return { ok: true, publicId: payload.public_id };
  } catch (error) {
    console.error(`[photos] upload error: ${(error as Error).message}`);
    return { ok: false, error: "That upload did not go through. Try again." };
  }
}

/**
 * Deletes a photograph for good, and invalidates it on the CDN.
 *
 * Returns false rather than throwing: a vehicle must still lose the photo from
 * its list even if Cloudinary is briefly unreachable, otherwise the panel
 * shows a picture staff have already tried to remove.
 */
export async function deleteVehiclePhoto(publicId: string): Promise<boolean> {
  const settings = config();
  if (!settings || !publicId) return false;

  const timestamp = String(Math.floor(Date.now() / 1000));
  const signed = { invalidate: "true", public_id: publicId, timestamp };

  const body = new FormData();
  body.set("public_id", publicId);
  body.set("invalidate", "true");
  body.set("api_key", settings.key);
  body.set("timestamp", timestamp);
  body.set("signature", sign(signed, settings.secret));

  try {
    const response = await fetch(`${API}/${settings.cloud}/image/destroy`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(30_000),
    });
    const payload = (await response.json()) as { result?: string; error?: { message?: string } };
    // "not found" counts as gone: the end state is what matters.
    if (payload.result === "ok" || payload.result === "not found") return true;
    console.error(`[photos] delete refused for ${publicId}: ${payload.error?.message ?? JSON.stringify(payload)}`);
    return false;
  } catch (error) {
    console.error(`[photos] delete error: ${(error as Error).message}`);
    return false;
  }
}

/** Exported for tests: the signature rule is the whole security of this. */
export const __testing = { sign, sniff };
