import "server-only";
import crypto from "node:crypto";
import { admin } from "@/lib/supabase/admin";
import { MEDIA_STAGING_BUCKET } from "@/lib/supabase/env";
import {
  PENDING_FOLDER,
  VEHICLE_FOLDER,
  VIDEO_DELIVERY_WIDTH,
  videoTransform,
  type MediaKind,
} from "@/lib/cloudinary";

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
 * 50MB, which is the staging bucket's per-file limit and therefore the real
 * ceiling, not a number chosen here. It is about a minute of phone video,
 * more than a walkaround of a car needs, and Cloudinary re-encodes on
 * delivery so a big original is never served as filmed.
 */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

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
  signature: string;
  /**
   * Every signed parameter, to be sent back exactly as given.
   *
   * A flat bag rather than named fields on purpose: the signature covers
   * precisely these keys and values, so a browser that forgets one, or a
   * parameter added here and not there, fails as a refused upload rather than
   * as a silently unsigned one.
   */
  params: Record<string, string>;
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
function cloudinaryTicket(slug: string | null, kind: MediaKind): UploadTicket | null {
  const settings = config();
  if (!settings) return null;

  const params: Record<string, string> = {
    allowed_formats: FORMATS[kind].join(","),
    folder: folderFor(slug),
    timestamp: String(Math.floor(Date.now() / 1000)),
  };

  if (kind === "image") {
    // An incoming transformation, so what is STORED is already sensible.
    //
    // A phone photograph of a car is 4000px and several megabytes, and every
    // width the site asks for is generated from whatever is stored. Deriving
    // a 300px tile from a 4000px original is slow the first time each size is
    // requested, which is exactly when a customer is looking at a new
    // vehicle. 2000px is well above the largest size the site ever draws.
    params.transformation = "w_2000,c_limit";
  } else {
    // Transcode the file the site will actually play, now, in the background,
    // instead of when the first customer presses play. `eager_async` keeps
    // the upload itself quick for whoever is adding the vehicle.
    params.eager = `${videoTransform({ width: VIDEO_DELIVERY_WIDTH })}/mp4`;
    params.eager_async = "true";
  }

  return {
    endpoint: `${API}/${settings.cloud}/${kind}/upload`,
    apiKey: settings.key,
    params,
    signature: sign(params, settings.secret),
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


/* -------------------------------------------------------------------------- */
/* Staging: the browser uploads to Mumbai, Cloudinary fetches from there       */
/* -------------------------------------------------------------------------- */

/**
 * Where the browser actually sends the file.
 *
 * Not Cloudinary. Measured from Sri Lanka on 2026-09-25, the same 8.67MB clip
 * took 18s to 207s to reach Cloudinary and 14.5s to 23.0s to reach this
 * bucket in Mumbai. The long route is not just slower, it is a lottery, and
 * Cloudinary's own Asia-Pacific hostname was no better.
 *
 * The key is generated HERE, never taken from the caller, so an upload cannot
 * be aimed at an object somebody else staged.
 */
export interface StagingTicket {
  /** A one-off signed URL. The browser PUTs the bytes to it. */
  url: string;
  /** Handed back to the server afterwards to identify what was staged. */
  key: string;
  maxBytes: number;
  accept: string;
}

const KEY_PATTERN = /^[0-9a-f]{32}$/;

export async function stagingTicket(kind: MediaKind): Promise<StagingTicket | null> {
  const key = crypto.randomBytes(16).toString("hex");
  const { data, error } = await admin()
    .storage.from(MEDIA_STAGING_BUCKET)
    .createSignedUploadUrl(key);

  if (error || !data) {
    console.error(`[media] could not sign a staging upload: ${error?.message}`);
    return null;
  }
  return { url: data.signedUrl, key, maxBytes: MAX_BYTES[kind], accept: ACCEPT[kind] };
}

export type RelayResult =
  | { ok: true; media: UploadedMedia }
  | { ok: false; error: string };

/**
 * Hands a staged object to Cloudinary and clears it away.
 *
 * Cloudinary accepts a URL in place of a file and fetches it itself, which
 * turns the slow half of the journey into a server to server transfer: 1.67
 * MB/s measured, four times what the browser manages on the same connection.
 *
 * The signed read URL is short lived and is never shown to anyone: it exists
 * for the seconds Cloudinary needs it.
 */
export async function relayToCloudinary(
  slug: string | null,
  kind: MediaKind,
  key: string,
): Promise<RelayResult> {
  if (!KEY_PATTERN.test(key)) return { ok: false, error: "That upload did not go through. Try again." };

  const ticket = cloudinaryTicket(slug, kind);
  if (!ticket) return { ok: false, error: "Uploads are not configured yet. Ask the developer." };

  const store = admin().storage.from(MEDIA_STAGING_BUCKET);
  const { data: readable, error: readError } = await store.createSignedUrl(key, 600);
  if (readError || !readable) {
    return { ok: false, error: "That upload did not arrive. Try again." };
  }

  const body = new FormData();
  body.set("file", readable.signedUrl);
  body.set("api_key", ticket.apiKey);
  body.set("signature", ticket.signature);
  for (const [name, value] of Object.entries(ticket.params)) body.set(name, value);

  try {
    const response = await fetch(ticket.endpoint, {
      method: "POST",
      body,
      // Cloudinary is downloading the file and, for video, transcoding the
      // delivery copy. Generous, because failing at four minutes and asking
      // someone to upload it all again is the worst outcome here.
      signal: AbortSignal.timeout(300_000),
    });
    const raw = await response.text();
    let payload: {
      public_id?: string;
      version?: number;
      signature?: string;
      error?: { message?: string };
    } = {};
    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      return { ok: false, error: `Cloudinary replied with HTTP ${response.status}.` };
    }

    if (!response.ok || !payload.public_id || !payload.version || !payload.signature) {
      const detail = payload.error?.message ?? raw.slice(0, 200);
      console.error(`[media] relay failed for ${key}: ${detail}`);
      if (response.status === 401 || response.status === 403) {
        return {
          ok: false,
          error: "Cloudinary refused the account key. It needs upload permission. Ask the developer.",
        };
      }
      return { ok: false, error: "That upload did not go through. Try again." };
    }

    const media: UploadedMedia = {
      publicId: payload.public_id,
      version: String(payload.version),
      signature: payload.signature,
    };
    // The same check as before: what comes back is only trusted because
    // Cloudinary signed it. The relay does not change that.
    if (!verifyUpload(media)) {
      return { ok: false, error: "That upload could not be verified. Try again." };
    }

    // Cloudinary has it, so the staged copy is dead weight. A failure here is
    // logged rather than raised: the upload worked, and the daily sweep will
    // clear the object.
    const { error: removeError } = await store.remove([key]);
    if (removeError) {
      console.error(`[media] staged ${key} not removed: ${removeError.message}`);
    }

    return { ok: true, media };
  } catch (error) {
    console.error(`[media] relay error for ${key}: ${(error as Error).message}`);
    return { ok: false, error: "That upload did not go through. Try again." };
  }
}

/**
 * Staged objects older than `olderThanMs`, for the daily sweep.
 *
 * Anything still here is the residue of an upload that was abandoned or of a
 * relay that failed. Nothing points at it and nothing ever will.
 */
export async function staleStagedKeys(olderThanMs: number): Promise<string[]> {
  const cutoff = Date.now() - olderThanMs;
  const { data, error } = await admin()
    .storage.from(MEDIA_STAGING_BUCKET)
    .list("", { limit: 1000, sortBy: { column: "created_at", order: "asc" } });

  if (error) {
    console.error(`[media] listing the staging bucket failed: ${error.message}`);
    return [];
  }
  return (data ?? [])
    .filter((object) => KEY_PATTERN.test(object.name))
    .filter((object) => object.created_at && Date.parse(object.created_at) < cutoff)
    .map((object) => object.name);
}

export async function deleteStaged(keys: string[]): Promise<number> {
  const safe = keys.filter((key) => KEY_PATTERN.test(key));
  if (safe.length === 0) return 0;
  const { error } = await admin().storage.from(MEDIA_STAGING_BUCKET).remove(safe);
  if (error) {
    console.error(`[media] clearing staged objects failed: ${error.message}`);
    return 0;
  }
  return safe.length;
}

/** Exported for tests: the signature rule is the whole security of this. */
export const __testing = { sign, FORMATS };
