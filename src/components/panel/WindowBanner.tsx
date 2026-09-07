import { KeyRound, Lock, Unlock } from "lucide-react";
import { closeWindowAction, redeemCodeAction } from "@/app/panel/actions";
import { scopeLabel } from "@/lib/panel/window";
import { colomboTime } from "@/lib/panel/time";
import type { AccessRequest, Role } from "@/lib/panel/types";
import { WindowCountdown } from "./WindowCountdown";

/**
 * The state of the employee's write access, always visible.
 *
 * Three states, matching the lifecycle in the plan: locked (nothing shown),
 * awaiting a code, and open with a countdown. The owner never sees this: they
 * write freely.
 */
export function WindowBanner({
  openWindow,
  pending,
  role,
}: {
  openWindow: AccessRequest | null;
  pending: AccessRequest | null;
  role: Role;
}) {
  if (role === "owner") return null;

  if (openWindow) {
    return (
      <div className="bg-success/12">
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-3">
          <p className="inline-flex items-center gap-2.5 text-sm">
            <Unlock className="size-4 shrink-0 text-success" aria-hidden />
            <span className="font-semibold text-success">
              {scopeLabel(openWindow.scope)} unlocked
            </span>
            {openWindow.targetSlug ? (
              <span className="text-ink-soft">on {openWindow.targetSlug}</span>
            ) : null}
            {openWindow.windowExpiresAt ? (
              <WindowCountdown expiresAt={openWindow.windowExpiresAt} />
            ) : null}
          </p>

          <form action={closeWindowAction}>
            <input type="hidden" name="requestId" value={openWindow.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full bg-field px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-field-hover"
            >
              <Lock className="size-3.5" aria-hidden />
              Finish and lock
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="bg-warning/12">
        <div className="shell flex flex-wrap items-end justify-between gap-4 py-3">
          <div>
            <p className="inline-flex items-center gap-2.5 text-sm font-semibold text-warning">
              <KeyRound className="size-4 shrink-0" aria-hidden />
              Waiting for the owner&apos;s code
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {scopeLabel(pending.scope)}. Code expires at{" "}
              {colomboTime(pending.codeExpiresAt)}.
            </p>
          </div>

          <form action={redeemCodeAction} className="flex items-end gap-2">
            <input type="hidden" name="requestId" value={pending.id} />
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted">
                Six digit code
              </span>
              <input
                name="code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoComplete="one-time-code"
                className="h-11 w-36 bg-field px-3 font-display text-lg font-bold tracking-[0.3em] text-ink"
              />
            </label>
            <button
              type="submit"
              className="h-11 rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
