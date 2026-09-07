"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SafeImageProps {
  src: string;
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
  priority?: boolean;
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
  priority = false,
  className,
  // Owns the placeholder's surface entirely. Kept out of the base classes so
  // a caller's background never has to fight the default one for specificity.
  // Opaque on purpose: an empty tile should read as a deliberate placeholder,
  // not as a hole in whatever surface sits behind it.
  fallbackClassName = "bg-charcoal text-muted",
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
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
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={cn(fit === "contain" ? "object-contain" : "object-cover", className)}
    />
  );
}
