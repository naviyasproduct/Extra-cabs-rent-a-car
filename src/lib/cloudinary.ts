/**
 * Cloudinary delivery URLs.
 *
 * PURE and client-safe: no secrets, no node built-ins. The cloud name is
 * public by design (it is in every delivery URL). Uploading and deleting need
 * the API secret and live in src/lib/panel/vehicle-media.ts, server only.
 *
 * Vehicle photos are stored as Cloudinary **public ids**, not URLs, so the
 * delivery options (format, quality, width) can change here without rewriting
 * a single database row.
 */

/** Set in .env.local and on Vercel. Public: it appears in every image URL. */
export function cloudName(): string {
  return (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "").trim();
}

export function cloudinaryConfigured(): boolean {
  return cloudName().length > 0;
}

/**
 * A public id is what we store; a path or a full URL is anything else (the
 * local placeholder images, for instance). This is how the image components
 * decide which loader to use.
 */
export function isPublicId(src: string | undefined): src is string {
  return (
    typeof src === "string" &&
    src.length > 0 &&
    !src.startsWith("/") &&
    !src.startsWith("http://") &&
    !src.startsWith("https://") &&
    !src.startsWith("data:") &&
    !src.startsWith("blob:")
  );
}

export interface DeliveryOptions {
  /** Rendered width in pixels. Cloudinary resizes to it. */
  width?: number;
  /** 1 to 100. Defaults to Cloudinary's automatic quality. */
  quality?: number;
}

/**
 * The delivery URL for a stored public id.
 *
 * `f_auto` serves AVIF or WebP to browsers that take them, `q_auto` picks a
 * quality per image, and `c_limit` never scales a photo up past its own size.
 * Cloudinary does the resizing, so Vercel's image optimiser is not involved
 * and is not billed for it.
 */
export function cloudinaryUrl(publicId: string, options: DeliveryOptions = {}): string {
  const cloud = cloudName();
  if (!cloud) return "";

  const transforms = [
    "f_auto",
    options.quality ? `q_${options.quality}` : "q_auto",
    ...(options.width ? [`w_${Math.round(options.width)}`, "c_limit"] : []),
  ].join(",");

  return `https://res.cloudinary.com/${cloud}/image/upload/${transforms}/${publicId}`;
}

/** The folder every vehicle photo and video is uploaded into. */
export const VEHICLE_FOLDER = "extra-cabs/vehicles";

/**
 * Where the add form puts media, since the vehicle has no slug until it is
 * saved. The folder is cosmetic (the public id is what gets stored), but it
 * is what lets the orphan sweep find files from a form somebody abandoned.
 */
export const PENDING_FOLDER = `${VEHICLE_FOLDER}/_new`;

/** Cloudinary keeps images and videos in separate resource types. */
export type MediaKind = "image" | "video";

/**
 * The poster frame for a video, delivered as an ordinary image.
 *
 * This is what makes a video on the page cost almost nothing: the `<video>`
 * element is given `preload="none"` and this poster, so a visitor who never
 * presses play downloads one small JPEG instead of tens of megabytes.
 *
 * The frame is taken 15% into the clip, not at zero. The very first frame of
 * a phone video is often the lens still settling, or black if the clip fades
 * in, and a black poster makes the whole gallery look dark. A moment in, the
 * camera is moving along the car and the frame is worth showing.
 */
export function cloudinaryPosterUrl(publicId: string, options: DeliveryOptions = {}): string {
  const cloud = cloudName();
  if (!cloud) return "";

  const transforms = [
    "so_15p",
    "f_auto",
    options.quality ? `q_${options.quality}` : "q_auto",
    ...(options.width ? [`w_${Math.round(options.width)}`, "c_limit"] : []),
  ].join(",");

  return `https://res.cloudinary.com/${cloud}/video/upload/${transforms}/${publicId}.jpg`;
}

/**
 * The playable file for a stored video public id.
 *
 * `vc_auto` lets Cloudinary pick the codec and `q_auto` the bitrate, so a
 * phone clip filmed at 4K is re-encoded once and then served small. `c_limit`
 * with a width caps the resolution without ever scaling a smaller clip up.
 *
 * Delivered as MP4 rather than as two `<source>` elements: every browser in
 * use plays H.264 MP4, and a second format would double what Cloudinary has
 * to store and transform for no visitor who could not already watch it.
 */
export function videoTransform(options: DeliveryOptions = {}): string {
  return [
    "vc_auto",
    options.quality ? `q_${options.quality}` : "q_auto",
    ...(options.width ? [`w_${Math.round(options.width)}`, "c_limit"] : []),
  ].join(",");
}

/**
 * The width every video is delivered at, and the one transcoded ahead of time
 * when it is uploaded.
 *
 * These two must be the same string. Cloudinary keys a derived video on its
 * transformation, so asking for one that was never pre-generated means the
 * first person to press play waits for a transcode. That is why the eager
 * transformation is built from this function rather than typed out again.
 */
export const VIDEO_DELIVERY_WIDTH = 1280;

export function cloudinaryVideoUrl(publicId: string, options: DeliveryOptions = {}): string {
  const cloud = cloudName();
  if (!cloud) return "";
  return `https://res.cloudinary.com/${cloud}/video/upload/${videoTransform(options)}/${publicId}.mp4`;
}
