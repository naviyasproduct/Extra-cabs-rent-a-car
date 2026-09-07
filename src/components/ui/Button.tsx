import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "dark" | "outline" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none " +
  "whitespace-nowrap select-none";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  dark: "bg-contrast text-white hover:bg-charcoal-soft",
  outline: "bg-transparent text-ink ring-1 ring-inset ring-line-strong hover:bg-field",
  ghost: "bg-transparent text-ink hover:bg-field",
  light: "bg-white text-charcoal hover:bg-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[0.9375rem]",
  lg: "h-14 px-8 text-base",
};

/* When `arrow` is set the button ends in a circular badge instead of a bare
   icon. Padding on the trailing side shrinks so the badge sits flush inside
   the pill. */
const arrowSizes: Record<Size, string> = {
  sm: "pr-1 gap-2.5",
  md: "pr-1.5 gap-3",
  lg: "pr-2 gap-3",
};

const badgeSizes: Record<Size, string> = {
  sm: "size-8",
  md: "size-9",
  lg: "size-10",
};

/** The badge inverts against its button so it always reads as a separate chip. */
const badgeTones: Record<Variant, string> = {
  primary: "bg-white text-brand",
  dark: "bg-brand text-white",
  outline: "bg-brand text-white",
  ghost: "bg-brand text-white",
  light: "bg-brand text-white",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  /** Ends the button with a circular arrow badge. */
  arrow?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps &
  Omit<ComponentProps<"button">, "className" | "children">;

type LinkButtonProps = CommonProps &
  Omit<ComponentProps<typeof Link>, "className" | "children">;

function ArrowBadge({ variant, size }: { variant: Variant; size: Size }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full transition-transform duration-200 group-hover/btn:translate-x-0.5",
        badgeSizes[size],
        badgeTones[variant],
      )}
      aria-hidden
    >
      <ArrowUpRight className="size-4" />
    </span>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        base,
        variants[variant],
        sizes[size],
        arrow && arrowSizes[size],
        className,
      )}
      {...props}
    >
      {children}
      {arrow ? <ArrowBadge variant={variant} size={size} /> : null}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(
        base,
        variants[variant],
        sizes[size],
        arrow && arrowSizes[size],
        className,
      )}
      {...props}
    >
      {children}
      {arrow ? <ArrowBadge variant={variant} size={size} /> : null}
    </Link>
  );
}
