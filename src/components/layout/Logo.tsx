import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The mark.
 *
 * Two forms, one link:
 *
 *   variant="image"  the supplied artwork, "EXTRA" flanked by two car fronts.
 *                    This is the navbar.
 *   variant="text"   the typographic lockup: heavy condensed caps with the red
 *                    edge offset behind them, over the full business name. A
 *                    hard offset, not a blur, so it stays crisp at any size and
 *                    adds no glow. This is the footer, where the full name is
 *                    worth spelling out and the artwork does not carry it.
 *
 * The artwork is cropped to its own edges (the file dropped into
 * public/images/home is a 2000x2000 square that is 80% empty), so its size is
 * set by the height class and the width follows. `tone` only affects the text
 * form; the artwork reads on any dark surface.
 */
export function Logo({
  variant = "text",
  tone = "dark",
  className,
  href = "/",
}: {
  variant?: "text" | "image";
  tone?: "dark" | "light";
  className?: string;
  href?: string;
}) {
  if (variant === "image") {
    return (
      <Link
        href={href}
        className={cn("group inline-flex items-center", className)}
        aria-label="Extra Cabs & Rent a Cars, home"
      >
        <Image
          // REPLACING THIS FILE MEANS A NEW FILENAME, not new bytes at the old
          // one. The image optimiser caches by URL, so overwriting in place
          // serves the previous artwork from .next/cache until that entry
          // expires, and the same is true of every browser and CDN that has
          // already fetched it. That is exactly what happened to v1.
          src="/images/brand/nav-logo-v2.png"
          // The link carries the accessible name, so the image must not repeat
          // it. Two labels on one link reads as two links to a screen reader.
          alt=""
          width={188}
          height={40}
          // Above the fold on every page, so never lazy: waiting for the lazy
          // observer to fire leaves a hole where the brand should be.
          loading="eager"
          className="h-9 w-auto transition-transform duration-300 group-hover:-translate-y-px lg:h-10"
        />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn("group inline-flex flex-col leading-none", className)}
      aria-label="Extra Cabs & Rent a Cars, home"
    >
      <span
        className={cn(
          "font-display text-[1.75rem] font-extrabold uppercase tracking-[-0.02em] transition-transform duration-300 group-hover:-translate-y-px",
          tone === "dark" ? "text-ink" : "text-white",
        )}
        style={{ textShadow: "2px 2px 0 var(--color-brand)" }}
      >
        Extra
      </span>
      <span
        className={cn(
          "mt-1 font-display text-xs font-semibold uppercase tracking-[0.1em]",
          tone === "dark" ? "text-muted" : "text-white/55",
        )}
      >
        Cabs &amp; Rent a Cars
      </span>
    </Link>
  );
}
