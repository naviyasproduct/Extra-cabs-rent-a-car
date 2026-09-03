import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Wordmark.
 *
 * Echoes the printed logo: heavy condensed caps with the red edge offset
 * behind them. It is a hard offset, not a blur, so it stays crisp at every
 * size and adds no glow.
 */
export function Logo({
  tone = "dark",
  className,
  href = "/",
}: {
  tone?: "dark" | "light";
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex flex-col leading-none", className)}
      aria-label="Extra Cabs & Rent a Cars — home"
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
