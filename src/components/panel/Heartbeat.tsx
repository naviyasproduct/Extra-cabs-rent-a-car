"use client";

import { useEffect, useState } from "react";

/**
 * Proof of presence.
 *
 * Beats every 20 seconds while the tab is visible. The server writes its own
 * clock on receipt, so nothing here can inflate the figure: stopping the beats
 * can only ever record LESS time, never more.
 *
 * On pagehide it fires a beacon so a deliberate close is recorded immediately.
 * That is best effort only. The sweeper is the source of truth, and it records
 * the end at the last heartbeat rather than the moment it noticed.
 */
export function Heartbeat({ intervalSeconds }: { intervalSeconds: number }) {
  const [beating, setBeating] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const beat = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/panel/heartbeat", { method: "POST", keepalive: true })
        .then((res) => {
          if (!cancelled) setBeating(res.ok);
        })
        .catch(() => {
          if (!cancelled) setBeating(false);
        });
    };

    beat();
    const timer = setInterval(beat, intervalSeconds * 1000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onLeave = () => {
      navigator.sendBeacon?.("/api/panel/away");
    };
    window.addEventListener("pagehide", onLeave);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onLeave);
    };
  }, [intervalSeconds]);

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted"
      title={
        beating
          ? "Your presence is being recorded"
          : "Not recording. Check your connection."
      }
    >
      <span
        className={
          "size-1.5 rounded-full " + (beating ? "bg-success" : "bg-warning")
        }
        aria-hidden
      />
      {beating ? "Recording" : "Offline"}
    </span>
  );
}
