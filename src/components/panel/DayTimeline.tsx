import { colomboTime, formatDuration } from "@/lib/panel/time";
import type { ShiftSummary } from "@/lib/panel/time";

/**
 * One employee's day, drawn.
 *
 * Solid is proven presence, hatched is signed in but not there. This is the
 * picture from section 3 of the plan: it does not accuse anyone, it draws the
 * day and lets the owner ask.
 *
 * The track runs 08:00 to 18:00 Colombo, which is the office day. Anything
 * outside is clamped to the ends rather than dropped, so a late shift still
 * reads as work rather than vanishing.
 */

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18;
const SPAN_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

function minutesIntoDay(iso: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(iso))
    .split(":");

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  return hour * 60 + minute;
}

function toPercent(iso: string): number {
  const raw = minutesIntoDay(iso) - DAY_START_HOUR * 60;
  return Math.min(100, Math.max(0, (raw / SPAN_MINUTES) * 100));
}

export function DayTimeline({
  summaries,
  nameFor,
}: {
  summaries: ShiftSummary[];
  nameFor: (staffId: string) => string;
}) {
  if (summaries.length === 0) {
    return (
      <p className="py-6 text-sm text-muted">
        Nobody has signed in on this day.
      </p>
    );
  }

  const nowIso = new Date().toISOString();

  return (
    <div>
      {summaries.map((summary) => {
        const start = toPercent(summary.shift.signedInAt);
        const end = toPercent(
          summary.shift.signedOutAt ??
            (summary.open ? nowIso : summary.shift.signedInAt),
        );

        return (
          <div
            key={summary.shift.id}
            className="grid grid-cols-[7rem_minmax(0,1fr)_4.5rem] items-center gap-3 border-t border-line-strong/40 py-3 first:border-t-0 sm:grid-cols-[9rem_minmax(0,1fr)_5.5rem]"
          >
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold uppercase">
                {nameFor(summary.shift.staffId)}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-muted">
                {colomboTime(summary.shift.signedInAt)}
                {" to "}
                {summary.shift.signedOutAt
                  ? colomboTime(summary.shift.signedOutAt)
                  : summary.open
                    ? "now"
                    : "no sign out"}
              </p>
            </div>

            {/* The track. Hatched is the claimed span, solid blocks are proof. */}
            <div
              className="relative h-8 overflow-hidden bg-field"
              role="img"
              aria-label={`${nameFor(summary.shift.staffId)}: ${formatDuration(
                summary.presentSeconds,
              )} proven of ${formatDuration(summary.claimedSeconds)} claimed`}
            >
              <div
                className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,var(--color-line-strong)_0_1px,transparent_1px_6px)]"
                style={{ left: `${start}%`, width: `${Math.max(0, end - start)}%` }}
                aria-hidden
              />
              {summary.segments.map((segment) => {
                const from = toPercent(segment.fromAt);
                const to = toPercent(segment.toAt ?? nowIso);
                return (
                  <div
                    key={segment.id}
                    className="absolute inset-y-0 bg-success/25 shadow-[inset_0_-3px_0_var(--color-success)]"
                    style={{
                      left: `${from}%`,
                      width: `${Math.max(0.6, to - from)}%`,
                    }}
                    aria-hidden
                  />
                );
              })}
            </div>

            <div className="text-right">
              <p
                className={
                  "font-display text-base font-bold tabular-nums " +
                  (summary.flagged ? "text-brand-bright" : "text-success")
                }
              >
                {summary.coveragePercent}%
              </p>
              <p className="text-[0.625rem] uppercase tracking-[0.1em] text-muted">
                {summary.flagged ? "Flagged" : "Worked"}
              </p>
            </div>
          </div>
        );
      })}

      <div className="mt-2 grid grid-cols-[7rem_minmax(0,1fr)_4.5rem] gap-3 sm:grid-cols-[9rem_minmax(0,1fr)_5.5rem]">
        <span />
        <div className="flex justify-between text-[0.625rem] tabular-nums text-muted">
          <span>08:00</span>
          <span>11:00</span>
          <span>14:00</span>
          <span>18:00</span>
        </div>
        <span />
      </div>

      <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">
        Solid is proven presence, hatched is signed in but not there. Coverage is
        proven divided by claimed. Accuracy is plus or minus 20 seconds on an
        ungraceful exit, and work done away from the panel cannot be seen at all,
        so this is a signal rather than a verdict.
      </p>
    </div>
  );
}
