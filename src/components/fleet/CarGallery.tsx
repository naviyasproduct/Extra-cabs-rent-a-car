"use client";

import { useState } from "react";
import { CarImage } from "@/components/common/CarImage";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

/**
 * Vehicle gallery. One large plate plus a thumbnail rail beneath it, both
 * using the inner radius so they read as one unit inside the page slab.
 */
export function CarGallery({
  images,
  name,
  badge,
}: {
  images: string[];
  name: string;
  badge?: string;
}) {
  const [active, setActive] = useState(0);
  const shots = images.length > 0 ? images : ["/images/cars/placeholder.png"];

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-(--radius-card) bg-surface-alt">
        <CarImage
          src={shots[active]}
          alt={`${name} — view ${active + 1}`}
          label={name}
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
        />
        {badge ? (
          <div className="absolute left-4 top-4">
            <Badge tone="brand">{badge}</Badge>
          </div>
        ) : null}
      </div>

      {shots.length > 1 ? (
        <div className="mt-(--gap) grid grid-cols-3 gap-(--gap) sm:grid-cols-4">
          {shots.map((shot, index) => (
            <button
              key={shot}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show view ${index + 1} of ${name}`}
              aria-current={active === index}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-(--radius-inner) bg-surface-alt transition-opacity duration-200",
                active === index ? "opacity-100" : "opacity-55 hover:opacity-85",
              )}
            >
              <CarImage
                src={shot}
                alt=""
                label={`View ${index + 1}`}
                sizes="20vw"
                inset={false}
              />
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
