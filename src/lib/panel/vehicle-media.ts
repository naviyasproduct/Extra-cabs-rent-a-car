import "server-only";
import crypto from "node:crypto";
import { PENDING_FOLDER, VEHICLE_FOLDER, type MediaKind } from "@/lib/cloudinary";

/**
 * Vehicle photographs and walkaround videos, on Cloudinary.
 *
 * SERVER ONLY: it holds the API secret, which must never reach a browser.
 *
 * **The file does not pass through this server.** The browser uploads straight
 * to Cloudinary and this module only signs the request and then checks what
 * came back. That is not an optimisation, it is the only thing that works:
 *
 *   A Vercel function may receive a request body of **4.5MB**, and answers
 *   413 FUNCTION_PAYLOAD_TOO_LARGE above it. That is a platform limit, so
 *   `serverActions.bodySizeLimit` in next.config.ts cannot raise it. A phone
 *   photograph of a car is routinely 3 to 8MB and a 30 second video is tens
 *   of megabytes, so every upload worth making would have failed in
 *   production while working perfectly on a laptop.
 *
 * It is also simply faster: the bytes go once, to a CDN near the uploader,
 * instead of twice through Mumbai.
 *
 * **Signed, never an unsigned upload preset.** An unsigned preset lets anyone
 * who reads the page JavaScript upload into the account. A signature is issued
 * only to a signed-in staff member who holds an open photo window, it expires,
 * and it pins the folder and the formats that may be sent.
 *
 * **Customer ID documents never come here.** Those go to the private Supabase
 * bucket (lib/panel/uploads.ts). Cloudinary is a public delivery CDN: right
 * for a car photograph, wrong for a photograph of someone's NIC.
 */

const API = "https://api.cloudinary.com/v1_1";

/** Cloudinary's own cap on one upload. Ours are well under it. */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/**
 * 100MB. Long enough for a minute of phone video at high quality, which is
 * more than a walkaround of a car needs. Cloudinary re-encodes on delivery,
 * so a big original costs storage once and is never served as filmed.
 */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

/**
 * What Cloudinary itself will accept for each kind, sent as `allowed_formats`
 * and signed with the rest. A signature that escapes into the wrong hands
 * still cannot be used to put an executable or an SVG in the account.
 *
 * SVG is refused although it is an image: it can carry script, and these are
 * served back from a URL under our own name.
 */
const FORMATS: Record<MediaKind, string[]> = {
  image: ["jpg", "jpeg", "png", "webp", "heic", "heif"],
  video: ["mp4", "mov", "m4v", "webm", "3gp", "avi"],
};

/** For the file picker's `accept` attribute, so the wrong file is hard to pick. */
export const ACCEPT: Record<MediaKind, string> = {
  image: "image/jpeg,image/png,image/webp,image/heic,image/heif",
  video: "video/mp4,video/quicktime,video/webm,video/3gpp,video/x-msvideo",
};

export const MAX_BYTES: Record<MediaKind, number> = {
  image: MAX_PHOTO_BYTES,
  video: MAX_VIDEO_BYTES,
};

function config(): { cloud: string; key: string; secret: string } | null {
  const cloud = (
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME ?? ""
  ).trim();
  const key = (process.env.CLOUDINARY_API_KEY ?? "").trim();
  const secret = (process.env.CLOUDINARY_API_SECRET ?? "").trim();
  return cloud && key && secret ? { cloud, key, secret } : null;
}

export function mediaUploadsConfigured(): boolean {
  return config() !== null;
}

/**
 * Cloudinary's signature: every parameter being sent except the file itself,
 * the api_key and the resource type, sorted by name, joined as a query string,
 * with the API secret appended, then SHA-1.
 */
function sign(params: Record<string, string>, secret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(payload + secret).digest("hex");
}

/** The folder a vehicle's media goes in. Unsaved vehicles have no slug yet. */
export function folderFor(slug: string | null): string {
  return slug ? `${VEHICLE_FOLDER}/${slug}` : PENDING_FOLDER;
}

export interface UploadTicket {
  endpoint: string;
  apiKey: string;
  timestamp: string;
  signature: string;
  folder: string;
  /** Echoed back by the browser exactly, or the signature does not match. */
  allowedFormats: string;
  /** Mirrored to the browser so the picker can refuse a bad file early. */
  maxBytes: number;
  accept: string;
}

/**
 * Everything a browser needs to upload one file directly, and nothing it could
 * use to do anything else. The secret signs the ticket and stays here.
 *
 * Cloudinary treats a signature as valid for an hour, so a ticket is not a
 * lasting grant: it is scoped to one folder and one set of formats, and the
 * action that issues it has already checked the staff member's write window.
 */
export function uploadTicket(slug: string | null, kind: MediaKind): UploadTicket | null {
  const settings = config();
  if (!settings) return null;

  const timestamp = String(Math.floor(Date.now() / 1000));
  const folder = folderFor(slug);
  const allowed = FORMATS[kind].join(",");

  return {
    endpoint: `${API}/${settings.cloud}/${kind}/upload`,
    apiKey: settings.key,
    timestamp,
    folder,
    allowedFormats: allowed,
    signature: sign({ allowed_formats: allowed, folder, timestamp }, settings.secret),
    maxBytes: MAX_BYTES[kind],
    accept: ACCEPT[kind],
  };
}

export interface UploadedMedia {
  publicId: string;
  version: string;
  signature: string;
}

/**
 * Proves an upload really happened, before its id is written to a vehicle.
 *
 * The browser reports what it uploaded, and a browser can say anything. Every
 * Cloudinary upload response carries a signature over `public_id` and
 * `version`, computed with the API secret, which only Cloudinary and this
 * server can produce. Checking it is what stops a staff member attaching
 * somebody else's asset, or an id that does not exist, by editing the form.
 *
 * The folder check is the second half: a valid signature for an asset outside
 * the vehicle folders is still not a vehicle photograph.
 */
export function verifyUpload(media: UploadedMedia): boolean {
  const settings = config();
  if (!settings) return false;

  const { publicId, version, signature } = media;
  if (!publicId || !version || !signature) return false;
  if (!publicId.startsWith(`${VEHICLE_FOLDER}/`)) return false;
  if (!/^\d+$/.test(version)) return false;

  const expected = sign({ public_id: publicId, version }, settings.secret);
  // Fixed-length hex on both sides, so a length mismatch is a plain failure
  // rather than something for timingSafeEqual to throw on.
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/**
 * Reads media out of a submitted form, keeping only what verifies.
 *
 * The add form carries its uploads as hidden fields because the vehicle does
 * not exist yet, so this runs over untrusted input on the way in.
 */
export function verifiedIdsFrom(values: FormDataEntryValue[], limit: number): string[] {
  const ids: string[] = [];
  for (const value of values) {
    // Checked before taking, not after: at a limit of zero the old order
    // accepted one id before noticing there was no room for it.
    if (ids.length >= limit) break;
    if (typeof value !== "string") continue;
    let parsed: UploadedMedia;
    try {
      parsed = JSON.parse(value) as UploadedMedia;
    } catch {
      continue;
    }
    if (!verifyUpload(parsed)) continue;
    if (ids.includes(parsed.publicId)) continue;
    ids.push(parsed.publicId);
  }
  return ids;
}

/**
 * Deletes media for good, and invalidates it on the CDN.
 *
 * Returns false rather than throwing: a vehicle must still lose the photo from
 * its list even if Cloudinary is briefly unreachable, otherwise the panel
 * shows a picture staff have already tried to remove.
 */
export async function deleteVehicleMedia(publicId: string, kind: MediaKind): Promise<boolean> {
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
    const response = await fetch(`${API}/${settings.cloud}/${kind}/destroy`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(30_000),
    });
    const payload = (await response.json()) as { result?: string; error?: { message?: string } };
    // "not found" counts as gone: the end state is what matters.
    if (payload.result === "ok" || payload.result === "not found") return true;
    console.error(
      `[media] delete refused for ${publicId}: ${payload.error?.message ?? JSON.stringify(payload)}`,
    );
    return false;
  } catch (error) {
    console.error(`[media] delete error: ${(error as Error).message}`);
    return false;
  }
}

export interface StoredAsset {
  publicId: string;
  kind: MediaKind;
  createdAt: string;
}

/**
 * Lists what the account actually holds under a prefix, for the orphan sweep.
 *
 * Someone who uploads three photographs and then closes the add form without
 * saving leaves three files no vehicle points at. Nothing else would ever
 * delete them, which is the same hole the Supabase upload sweep fills.
 *
 * The Admin API is Basic auth with the key and secret, not a signed upload.
 */
export async function listStoredMedia(prefix: string, kind: MediaKind): Promise<StoredAsset[]> {
  const settings = config();
  if (!settings) return [];

  const auth = Buffer.from(`${settings.key}:${settings.secret}`).toString("base64");
  const url =
    `https://api.cloudinary.com/v1_1/${settings.cloud}/resources/${kind}/upload` +
    `?prefix=${encodeURIComponent(prefix)}&max_results=500`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      console.error(`[media] listing ${prefix} failed with HTTP ${response.status}`);
      return [];
    }
    const payload = (await response.json()) as {
      resources?: { public_id?: string; created_at?: string }[];
    };
    return (payload.resources ?? [])
      .filter((r): r is { public_id: string; created_at: string } =>
        typeof r.public_id === "string" && typeof r.created_at === "string")
      .map((r) => ({ publicId: r.public_id, kind, createdAt: r.created_at }));
  } catch (error) {
    console.error(`[media] listing error: ${(error as Error).message}`);
    return [];
  }
}

/** Exported for tests: the signature rule is the whole security of this. */
export const __testing = { sign, FORMATS };
