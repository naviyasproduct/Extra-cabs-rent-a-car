"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A submit button that disables itself while its form is being submitted.
 *
 * **This exists because of a real incident.** Adding a vehicle takes a second
 * or two (the row, the audit entry, revalidation), and nothing on screen said
 * so. The first person to use the add form pressed the button three times in
 * four seconds and created three identical vehicles, which then appeared three
 * times on the website. A plain submit button gives no feedback at all, and a
 * slow action with no feedback gets pressed again.
 *
 * `useFormStatus` reads the pending state of the form this button sits inside,
 * which is why it has to be its own client component: the hook only reports on
 * a form ABOVE it in the tree, so putting it in the page itself would always
 * read false.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  /** Shown instead of the label while the form is submitting. */
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      // aria-disabled as well as disabled: a screen reader announces the
      // state, and the styling below is what a sighted person sees.
      aria-disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover",
        pending && "cursor-not-allowed opacity-70 hover:bg-brand",
        className,
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}
