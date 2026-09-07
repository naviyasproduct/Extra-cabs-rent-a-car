"use client";

import { useEffect, useState } from "react";

/** Time left on an open write window. Display only; the server enforces it. */
export function WindowCountdown({ expiresAt }: { expiresAt: string }) {
  const [left, setLeft] = useState(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now()),
  );

  useEffect(() => {
    const tick = () =>
      setLeft(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const total = Math.floor(left / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");

  return (
    <span className="font-display font-bold tabular-nums text-ink">
      {m}:{s} left
    </span>
  );
}
