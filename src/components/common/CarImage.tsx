import { Car as CarIcon } from "lucide-react";
import { SafeImage } from "./SafeImage";
import { cn } from "@/lib/utils";

interface CarImageProps {
  src: string;
  alt: string;
  /** Shown inside the placeholder while the real photo is missing. */
  label?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Inset around the vehicle. Turn off for thumbnails, where it wastes space. */
  inset?: boolean;
}

/**
 * Vehicle photo.
 *
 * Fleet photography is supplied as cut-outs on a transparent background, so
 * the image is fitted rather than cropped — cropping a cut-out lops the nose
 * and tail off the car. Falls back to a branded placeholder tile when the
 * file is missing.
 */
export function CarImage({
  src,
  alt,
  label,
  sizes,
  priority,
  className,
  inset = true,
}: CarImageProps) {
  return (
    <SafeImage
      src={src}
      alt={alt}
      fit="contain"
      sizes={sizes}
      priority={priority}
      className={cn(inset && "p-4", className)}
      fallback={
        <>
          <CarIcon className="size-10 stroke-[1.25]" aria-hidden />
          {label ? (
            <span className="px-4 text-center font-display text-sm font-semibold uppercase tracking-[0.16em]">
              {label}
            </span>
          ) : null}
        </>
      }
    />
  );
}
