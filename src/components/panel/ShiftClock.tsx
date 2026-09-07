"use client";

import { useEffect, useState } from "react";

/**
 * Running shift timer.
 *
 * Counts from the server-supplied sign-in time. This is display only: it shows
 * elapsed CLAIMED time, which is not the same as proven presence. The figures
 * that matter are worked out on the server from the presence segments.
 */
export function ShiftClock({ signedInAt }: { signedInAt: string }) {
  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Date.now() - new Date(signedInAt).getTime()),
  );

  useEffect(() => {
    const tick = () =>
      setElapsed(Math.max(0, Date.now() - new Date(signedInAt).getTime()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [signedInAt]);

  const total = Math.floor(elapsed / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");

  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="text-xs uppercase tracking-[0.12em] text-muted">
        On shift
      </span>
      <span className="font-display text-base font-bold tabular-nums text-ink">
        {h}:{m}:{s}
      </span>
    </span>
  );
}
