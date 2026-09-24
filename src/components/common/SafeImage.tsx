"use client";

import Image, { type ImageLoaderProps } from "next/image";
import { useState, type ReactNode } from "react";
import { cloudinaryUrl, isPublicId } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

/**
 * Vehicle photos are stored as Cloudinary public ids, so they are delivered by
 * Cloudinary, resized to the width actually being drawn. Local files (the
 * hero, the logo) keep Next's own optimiser: this loader is only attached when
 * the src is a public id.
 */
function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  return cloudinaryUrl(src, { width, quality });
}

interface SafeImageProps {
  /** Empty or missing renders the placeholder without a request. */
  src: string | undefined;
  alt: string;
  /** Rendered inside the placeholder while the real file is missing. */
  fallback: ReactNode;
  /**
   * "cover" fills the frame (photographs). "contain" fits the whole subject
   * inside it (cut-outs on a transparent background). Kept as a prop rather
   * than a class so callers never have two object-fit utilities competing.
   */
  fit?: "cover" | "contain";
  sizes?: string;
  /**
   * Insert a <link rel="preload"> for this image.
   *
   * Next 16 deprecated `priority` in favour of this; `priority` still works
   * but the two cannot be passed together. Use it for the ONE image that is
   * the LCP element on the page. Do not use it where the largest element
   * changes with the viewport: preloading a file the screen will not show is
   * worse than not preloading at all.
   */
  preload?: boolean;
  /**
   * Load immediately without preloading. The right setting for an image that
   * is above the fold but is one of several candidates for the LCP, such as
   * the first tile in a grid.
   */
  eager?: boolean;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Image with a designed empty state.
 *
 * Photography is supplied by the client and dropped into /public/images.
 * Until a file exists at the expected path this renders a matching tile
 * instead of a broken image, so nothing shifts when the photos land.
 */
export function SafeImage({
  src,
  alt,
  fallback,
  fit = "cover",
  sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw",
  preload = false,
  eager = false,
  className,
  // Owns the placeholder's surface entirely. Kept out of the base classes so
  // a caller's background never has to fight the default one for specificity.
  // Opaque on purpose: an empty tile should read as a deliberate placeholder,
  // not as a hole in whatever surface sits behind it.
  fallbackClassName = "bg-charcoal text-muted",
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  // No source at all is the normal case for a vehicle added in the panel
  // before its photos are uploaded. next/image throws on a missing src, so
  // this has to be caught here rather than left to onError.
  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-3",
          fallbackClassName,
        )}
      >
        {fallback}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      loader={isPublicId(src) ? cloudinaryLoader : undefined}
      sizes={sizes}
      preload={preload}
      // Left undefined rather than set to "lazy": next/image throws when a
      // preloaded image is also told to load lazily.
      loading={eager ? "eager" : undefined}
      onError={() => setFailed(true)}
      className={cn(fit === "contain" ? "object-contain" : "object-cover", className)}
    />
  );
}
