import { Car as CarIcon } from "lucide-react";
import { SafeImage } from "./SafeImage";

interface CarImageProps {
  src: string;
  alt: string;
  /** Shown inside the placeholder while the real photo is missing. */
  label?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Vehicle photo.
 *
 * Fleet photography is now supplied as ordinary photographs, so the frame is
 * filled and cropped. It used to be cut-outs on a transparent background,
 * which needed fitting rather than cropping plus a pool of light behind them
 * to lift the car off the black page. Both of those are gone: a photograph
 * brings its own background.
 *
 * Falls back to a branded placeholder tile when the file is missing.
 */
export function CarImage({
  src,
  alt,
  label,
  sizes,
  priority,
  className,
}: CarImageProps) {
  return (
    <SafeImage
      src={src}
      alt={alt}
      fit="cover"
      sizes={sizes}
      priority={priority}
      className={className}
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
