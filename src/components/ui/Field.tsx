import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Form controls.
   Controls are filled surfaces rather than outlined boxes — the site uses
   tone changes instead of borders to separate things.
--------------------------------------------------------------------------- */

const controlBase =
  "w-full rounded-(--radius-inner) bg-surface-alt px-4 text-base " +
  "text-ink placeholder:text-muted/70 transition-colors duration-200 " +
  "hover:bg-line/60 focus:bg-surface-alt";

export function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 flex items-baseline justify-between gap-2 font-display text-[0.9375rem] font-bold uppercase tracking-[0.1em] text-ink-soft"
    >
      <span>{children}</span>
      {hint ? (
        <span className="font-sans text-sm normal-case tracking-normal text-muted">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlBase, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlBase, "py-3.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(controlBase, "h-12 appearance-none pr-11", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </div>
  );
}

/** Label + control pair, so every form keeps the same vertical rhythm. */
export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <FieldLabel htmlFor={htmlFor} hint={hint}>
        {label}
      </FieldLabel>
      {children}
    </div>
  );
}

/** Checkbox styled as a selectable tile, used for booking extras. */
export function CheckTile({
  checked,
  onToggle,
  title,
  description,
  meta,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  description?: string;
  meta?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-start gap-3 rounded-(--radius-inner) p-4 text-left transition-colors duration-200",
        checked ? "bg-ink text-white" : "bg-surface-alt text-ink hover:bg-line/60",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md transition-colors",
          checked ? "bg-brand text-white" : "bg-white text-transparent",
        )}
        aria-hidden
      >
        <svg viewBox="0 0 20 20" className="size-3.5" fill="none">
          <path
            d="m4 10.5 4 4 8-9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-semibold">{title}</span>
          {meta ? (
            <span className={cn("text-sm font-semibold", checked ? "text-white/70" : "text-brand")}>
              {meta}
            </span>
          ) : null}
        </span>
        {description ? (
          <span
            className={cn(
              "mt-1 block text-sm leading-relaxed",
              checked ? "text-white/60" : "text-muted",
            )}
          >
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}
