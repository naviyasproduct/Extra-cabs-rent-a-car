import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Layout primitives.

   These four components ARE the design system. Every page composes from them
   and nothing sets its own max-width, gap or radius. That is what keeps the
   left edge of the navbar, the hero copy, every card and the footer columns
   on exactly the same vertical lines all the way down the page.
--------------------------------------------------------------------------- */

interface ShellProps {
  as?: ElementType;
  id?: string;
  className?: string;
  children: ReactNode;
}

/** The one container width used site-wide. */
export function Shell({ as: Tag = "div", id, className, children }: ShellProps) {
  return (
    <Tag id={id} className={cn("shell", className)}>
      {children}
    </Tag>
  );
}

/** The 12-column bed. 4 columns on mobile, 8 on tablet, 12 on desktop. */
export function Grid({ as: Tag = "div", id, className, children }: ShellProps) {
  return (
    <Tag id={id} className={cn("grid12", className)}>
      {children}
    </Tag>
  );
}

type Band = "paper" | "surface" | "alt" | "dark" | "none";

/* The default band paints nothing. On a black page the background IS the
   page, so a band only sets a colour when it genuinely wants a surface under
   its content - otherwise the section floats straight on the black. */
const bands: Record<Band, string> = {
  paper: "text-ink",
  surface: "text-ink",
  alt: "text-ink",
  dark: "text-ink",
  none: "",
};

interface SectionProps {
  id?: string;
  band?: Band;
  /** Vertical padding. "flush" removes it so a child panel can bleed to the seam. */
  spacing?: "default" | "tight" | "flush" | "top" | "bottom";
  className?: string;
  children: ReactNode;
}

const spacings = {
  default: "py-(--section-y)",
  tight: "py-(--gap)",
  flush: "py-0",
  top: "pt-(--section-y) pb-0",
  bottom: "pt-0 pb-(--section-y)",
} as const;

/** A full-bleed horizontal band. Colour changes, rhythm never does. */
export function Section({
  id,
  band = "paper",
  spacing = "default",
  className,
  children,
}: SectionProps) {
  return (
    <section id={id} className={cn("relative", bands[band], spacings[spacing], className)}>
      {children}
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Right-hand slot, usually a "view all" link. Drops below the title on mobile. */
  action?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}

/**
 * Section headings sit on the same grid as the content beneath them: the copy
 * occupies columns 1-7 and the action sits flush to column 12.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  tone = "light",
  className,
}: SectionHeaderProps) {
  return (
    <Grid className={cn("items-end", className)}>
      <div className="col-span-4 md:col-span-8 lg:col-span-7">
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h2 className="display-lg">{title}</h2>
        {description ? (
          <p
            className={cn(
              "mt-4 max-w-[52ch] text-base leading-relaxed",
              tone === "dark" ? "text-white/65" : "text-muted",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="col-span-4 md:col-span-8 lg:col-span-5 lg:flex lg:justify-end">
          {action}
        </div>
      ) : null}
    </Grid>
  );
}

type SlabTone = "surface" | "alt" | "dark" | "brand";

const slabTones: Record<SlabTone, string> = {
  surface: "text-ink",
  alt: "text-ink",
  dark: "text-ink",
  brand: "bg-brand text-white",
};

/**
 * A full-width rounded slab that sits inside the shell.
 *
 * This is how a section changes colour. Full-bleed bands were dropped because
 * a tone change running edge to edge reads as an accidental seam across the
 * page - you see the colour switch in the left and right margins. Containing
 * the change inside a rounded slab makes it look like a deliberate card on a
 * continuous background instead.
 */
export function Slab({
  as: Tag = "div",
  id,
  tone = "surface",
  className,
  children,
}: ShellProps & { tone?: SlabTone }) {
  return (
    <Tag
      id={id}
      className={cn(
        "rounded-(--radius-shell) px-6 py-10 sm:px-8 lg:px-12 lg:py-14",
        slabTones[tone],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

type PanelTone = "surface" | "alt" | "dark" | "brand";

const panelTones: Record<PanelTone, string> = {
  surface: "text-ink",
  alt: "text-ink",
  dark: "text-ink",
  brand: "bg-brand text-white",
};

interface PanelProps {
  as?: ElementType;
  tone?: PanelTone;
  /** "card" is the default radius. "shell" is the larger one used for big slabs. */
  radius?: "card" | "shell" | "inner";
  padding?: "default" | "tight" | "none";
  className?: string;
  children: ReactNode;
}

const panelRadii = {
  card: "rounded-(--radius-card)",
  shell: "rounded-(--radius-shell)",
  inner: "rounded-(--radius-inner)",
} as const;

const panelPadding = {
  default: "p-6 lg:p-8",
  tight: "p-5",
  none: "",
} as const;

/** A modular surface. One radius scale, one padding scale, no borders. */
export function Panel({
  as: Tag = "div",
  tone = "surface",
  radius = "card",
  padding = "default",
  className,
  children,
}: PanelProps) {
  return (
    <Tag
      className={cn(
        panelTones[tone],
        panelRadii[radius],
        panelPadding[padding],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
