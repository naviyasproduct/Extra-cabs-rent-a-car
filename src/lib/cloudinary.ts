/**
 * Cloudinary delivery URLs.
 *
 * PURE and client-safe: no secrets, no node built-ins. The cloud name is
 * public by design (it is in every delivery URL). Uploading and deleting need
 * the API secret and live in src/lib/panel/vehicle-photos.ts, server only.
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

/** The folder every vehicle photo is uploaded into. */
export const VEHICLE_FOLDER = "extra-cabs/vehicles";
