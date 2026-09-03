import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "dark" | "muted" | "success" | "light";

const tones: Record<Tone, string> = {
  brand: "bg-brand text-white",
  dark: "bg-ink text-white",
  muted: "bg-surface-alt text-ink-soft",
  success: "bg-success/12 text-success",
  light: "bg-white/12 text-white",
};

export function Badge({
  tone = "muted",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
        "font-display text-xs font-semibold uppercase tracking-[0.12em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Rating({
  value,
  count,
  tone = "light",
  className,
}: {
  value: number;
  count?: number;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <Star className="size-4 shrink-0 fill-brand text-brand" aria-hidden />
      <span className="font-semibold">{value.toFixed(1)}</span>
      {count !== undefined ? (
        <span className={tone === "dark" ? "text-white/50" : "text-muted"}>({count})</span>
      ) : null}
    </span>
  );
}

/** Availability pill used on fleet cards and the vehicle page. */
export function AvailabilityDot({ available }: { available: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium">
      <span
        className={cn(
          "size-2 rounded-full",
          available ? "bg-success" : "bg-muted",
        )}
        aria-hidden
      />
      <span className={available ? "text-success" : "text-muted"}>
        {available ? "Available now" : "On hire"}
      </span>
    </span>
  );
}
