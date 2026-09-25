"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { CarImage } from "@/components/common/CarImage";
import { MAX_VEHICLE_IMAGES, MAX_VEHICLE_VIDEOS } from "@/types";
import type { CarVideo } from "@/types/car";
import { cloudinaryPosterUrl, cloudinaryVideoUrl } from "@/lib/cloudinary";
import { Badge } from "@/components/ui/Badge";

/**
 * Vehicle gallery. One large plate plus a thumbnail rail beneath it, both
 * using the inner radius so they read as one unit inside the page slab.
 *
 * Photographs first, then any walkaround videos. Capped at MAX_VEHICLE_IMAGES
 * and MAX_VEHICLE_VIDEOS. The fleet data applies the same caps, so this is
 * belt and braces for any caller passing its own array: past five thumbnails
 * the rail wraps to a second row and unbalances the page.
 *
 * **A video here costs a visitor nothing until they press play.** The element
 * carries `preload="none"` and a Cloudinary poster frame, so what actually
 * loads is one small JPEG. Without that, every visit to a vehicle page would
 * start pulling tens of megabytes on a mobile connection, and the page would
 * feel slower than one with no video at all.
 */

type Slide =
  | { kind: "image"; id: string | undefined }
  | { kind: "video"; id: string };

export function CarGallery({
  images,
  videos = [],
  name,
  badge,
}: {
  images: string[];
  videos?: CarVideo[];
  name: string;
  badge?: string;
}) {
  const [active, setActive] = useState(0);

  const photos = images.slice(0, MAX_VEHICLE_IMAGES);
  const clips = videos.slice(0, MAX_VEHICLE_VIDEOS);

  // No photos yet renders one placeholder plate. This used to point at
  // /images/cars/placeholder.png, a file that never existed, so it only
  // reached the placeholder after a failed request.
  const slides: Slide[] = [
    ...(photos.length > 0
      ? photos.map((id): Slide => ({ kind: "image", id }))
      : [{ kind: "image", id: undefined } as Slide]),
    ...clips.map((clip): Slide => ({ kind: "video", id: clip.id })),
  ];

  const current = slides[Math.min(active, slides.length - 1)];
  const photoCount = photos.length > 0 ? photos.length : 1;

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-(--radius-card) bg-surface-alt">
        {current.kind === "video" ? (
          <video
            // Keyed on the id so switching between two clips swaps the element
            // rather than leaving the first one's buffered data playing.
            key={current.id}
            controls
            playsInline
            // A video slide can only become current by being clicked, so this
            // plays on that click rather than making the visitor press play a
            // second time. Nothing autoplays on arrival: until the thumbnail
            // is clicked there is no <video> element on the page at all.
            autoPlay
            preload="none"
            poster={cloudinaryPosterUrl(current.id, { width: 1280 })}
            className="h-full w-full bg-charcoal object-cover"
          >
            <source src={cloudinaryVideoUrl(current.id, { width: 1280 })} type="video/mp4" />
            Your browser cannot play this video.
          </video>
        ) : (
          <CarImage
            src={current.id}
            alt={`${name}, view ${active + 1}`}
            label={name}
            sizes="(max-width: 1024px) 100vw, 60vw"
            preload
          />
        )}
        {badge ? (
          <div className="absolute left-4 top-4">
            <Badge tone="brand">{badge}</Badge>
          </div>
        ) : null}
      </div>

      {slides.length > 1 ? (
        <div className="mt-(--gap) grid grid-cols-3 gap-(--gap) sm:grid-cols-4">
          {slides.map((slide, index) => (
            <button
              key={`${slide.kind}-${slide.id}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={
                slide.kind === "video"
                  ? `Play video ${index - photoCount + 1} of ${name}`
                  : `Show view ${index + 1} of ${name}`
              }
              aria-current={active === index}
              // Client instruction, 2026-09-25: thumbnails show at full
              // colour. They used to be dimmed to 55% unless selected, which
              // made a rail of photographs of a car look like a rail of dark
              // rectangles. The red bar along the bottom of the active one is
              // the only thing marking the selection now.
              className="relative aspect-[4/3] overflow-hidden rounded-(--radius-inner) bg-surface-alt"
            >
              {slide.kind === "video" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- the
                      poster is already a Cloudinary transform at this width,
                      so next/image would front it with a second optimiser. */}
                  <img
                    src={cloudinaryPosterUrl(slide.id, { width: 320 })}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  {/* No scrim over the poster, for the same reason: the
                      badge is brand red on white and reads perfectly well
                      without darkening the picture behind it. */}
                  <span
                    className="absolute inset-0 flex items-center justify-center"
                    aria-hidden
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-brand text-white">
                      <Play className="size-4 fill-current" />
                    </span>
                  </span>
                </>
              ) : (
                <CarImage
                  src={slide.id}
                  alt=""
                  label={`View ${index + 1}`}
                  sizes="20vw"
                />
              )}
              {active === index ? (
                <span
                  className="absolute inset-x-0 bottom-0 h-1 bg-brand"
                  aria-hidden
                />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
