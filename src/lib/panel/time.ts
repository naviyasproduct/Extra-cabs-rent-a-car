import { newId, readData, writeData } from "./store";
import type { PanelData, PresenceSegment, WorkShift } from "./types";

/**
 * The timesheet. See docs/internal-platform-plan.md section 3.
 *
 * Two records per day: the shift is what the employee claims, the presence
 * segments are what the system can prove. Coverage is proven over claimed, and
 * the gap between the two is the whole point.
 */

export const HEARTBEAT_SECONDS = 20;
export const PRESENCE_TIMEOUT_SECONDS = 90; // three missed beats
export const COVERAGE_FLAG_PERCENT = 60;
export const LONG_GAP_FLAG_SECONDS = 2 * 60 * 60;

const COLOMBO = "Asia/Colombo";

/** The Colombo calendar day for an instant, as YYYY-MM-DD. */
export function colomboDate(at: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which is what we want to store and sort by.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: COLOMBO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** Wall-clock time in Colombo, for display. */
export function colomboTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: COLOMBO,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function colomboDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: COLOMBO,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/* -------------------------------------------------------------------------- */
/* The sweeper                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Closes presence segments that stopped beating.
 *
 * The plan calls for pg_cron running every minute. There is no scheduler here,
 * so this runs lazily instead: any panel read calls it first. The recorded end
 * is still `lastHeartbeatAt`, the last moment presence was proven, NOT the
 * moment this happened to run. That is the detail that keeps the figure honest
 * whichever way the job is triggered.
 */
export function sweepStalePresence(data: PanelData): boolean {
  const cutoff = Date.now() - PRESENCE_TIMEOUT_SECONDS * 1000;
  let changed = false;

  for (const segment of data.presence) {
    if (segment.toAt !== null) continue;
    if (new Date(segment.lastHeartbeatAt).getTime() >= cutoff) continue;

    segment.toAt = segment.lastHeartbeatAt;
    segment.endedBy = "heartbeat_timeout";
    changed = true;
  }

  // A shift left open past its Colombo day closes with no sign-out time. We do
  // not know when they left, and inventing a value would be the one dishonest
  // thing this system could do.
  const today = colomboDate();
  for (const shift of data.shifts) {
    if (shift.signedOutAt !== null || shift.endReason !== null) continue;
    if (shift.workDate >= today) continue;

    shift.endReason = "shift_expiry";
    changed = true;
  }

  return changed;
}

/** Run the sweeper and persist if it changed anything. */
export function sweep(): void {
  writeData((data) => sweepStalePresence(data));
}

/* -------------------------------------------------------------------------- */
/* Sign in and out                                                             */
/* -------------------------------------------------------------------------- */

export function openShift(staffId: string): WorkShift {
  return writeData((data) => {
    sweepStalePresence(data);

    const existing = data.shifts.find(
      (s) => s.staffId === staffId && s.signedOutAt === null && s.endReason === null,
    );
    if (existing) {
      ensureOpenSegment(data, existing);
      return existing;
    }

    const now = new Date().toISOString();
    const shift: WorkShift = {
      id: newId("shift"),
      staffId,
      workDate: colomboDate(),
      signedInAt: now,
      signedOutAt: null,
      endReason: null,
    };
    data.shifts.push(shift);
    ensureOpenSegment(data, shift);

    data.audit.push({
      id: newId("aud"),
      at: now,
      staffId,
      action: "shift.sign_in",
      entity: "shift",
      entityId: shift.id,
      summary: "Signed in",
      accessRequestId: null,
    });

    return shift;
  });
}

export function closeShift(staffId: string, reason: WorkShift["endReason"]): void {
  writeData((data) => {
    const shift = data.shifts.find(
      (s) => s.staffId === staffId && s.signedOutAt === null && s.endReason === null,
    );
    if (!shift) return;

    const now = new Date().toISOString();

    for (const segment of data.presence) {
      if (segment.shiftId === shift.id && segment.toAt === null) {
        segment.toAt = now;
        segment.endedBy = "sign_out";
      }
    }

    shift.signedOutAt = now;
    shift.endReason = reason;

    data.audit.push({
      id: newId("aud"),
      at: now,
      staffId,
      action: "shift.sign_out",
      entity: "shift",
      entityId: shift.id,
      summary: "Signed out",
      accessRequestId: null,
    });
  });
}

function ensureOpenSegment(data: PanelData, shift: WorkShift): PresenceSegment {
  const open = data.presence.find(
    (p) => p.shiftId === shift.id && p.toAt === null,
  );
  if (open) return open;

  const now = new Date().toISOString();
  const segment: PresenceSegment = {
    id: newId("seg"),
    shiftId: shift.id,
    staffId: shift.staffId,
    fromAt: now,
    toAt: null,
    lastHeartbeatAt: now,
    endedBy: null,
  };
  data.presence.push(segment);
  return segment;
}

/**
 * A beat from an open panel tab.
 *
 * The server writes its own clock, never a timestamp sent by the browser: a
 * client clock can be wrong, or deliberately changed.
 */
export function recordHeartbeat(staffId: string): boolean {
  return writeData((data) => {
    sweepStalePresence(data);

    const shift = data.shifts.find(
      (s) => s.staffId === staffId && s.signedOutAt === null && s.endReason === null,
    );
    if (!shift) return false;

    const segment = ensureOpenSegment(data, shift);
    segment.lastHeartbeatAt = new Date().toISOString();
    return true;
  });
}

/** The tab went away. Best effort only; the sweeper is the source of truth. */
export function markAway(staffId: string, how: PresenceSegment["endedBy"]): void {
  writeData((data) => {
    for (const segment of data.presence) {
      if (segment.staffId === staffId && segment.toAt === null) {
        segment.toAt = segment.lastHeartbeatAt;
        segment.endedBy = how;
      }
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Reading the day                                                             */
/* -------------------------------------------------------------------------- */

export interface ShiftSummary {
  shift: WorkShift;
  segments: PresenceSegment[];
  claimedSeconds: number;
  presentSeconds: number;
  coveragePercent: number;
  longestGapSeconds: number;
  flagged: boolean;
  open: boolean;
}

function seconds(from: string, to: string): number {
  return Math.max(0, (new Date(to).getTime() - new Date(from).getTime()) / 1000);
}

export function summariseShift(
  shift: WorkShift,
  allSegments: PresenceSegment[],
): ShiftSummary {
  const segments = allSegments
    .filter((s) => s.shiftId === shift.id)
    .sort((a, b) => a.fromAt.localeCompare(b.fromAt));

  const nowIso = new Date().toISOString();
  const open = shift.signedOutAt === null && shift.endReason === null;

  // An unclosed shift falls back to the last proven heartbeat rather than
  // inventing a sign-out time.
  const claimEnd =
    shift.signedOutAt ??
    (open
      ? nowIso
      : segments.length > 0
        ? segments[segments.length - 1].lastHeartbeatAt
        : shift.signedInAt);

  const claimedSeconds = seconds(shift.signedInAt, claimEnd);

  let presentSeconds = 0;
  for (const segment of segments) {
    presentSeconds += seconds(segment.fromAt, segment.toAt ?? nowIso);
  }

  let longestGapSeconds = 0;
  let cursor = shift.signedInAt;
  for (const segment of segments) {
    longestGapSeconds = Math.max(longestGapSeconds, seconds(cursor, segment.fromAt));
    cursor = segment.toAt ?? nowIso;
  }
  longestGapSeconds = Math.max(longestGapSeconds, seconds(cursor, claimEnd));

  const coveragePercent =
    claimedSeconds > 0 ? Math.round((presentSeconds / claimedSeconds) * 100) : 0;

  return {
    shift,
    segments,
    claimedSeconds,
    presentSeconds,
    coveragePercent,
    longestGapSeconds,
    flagged:
      claimedSeconds > 5 * 60 &&
      (coveragePercent < COVERAGE_FLAG_PERCENT ||
        longestGapSeconds > LONG_GAP_FLAG_SECONDS),
    open,
  };
}

export function shiftsForDate(date: string): ShiftSummary[] {
  const data = readData();
  return data.shifts
    .filter((s) => s.workDate === date)
    .map((s) => summariseShift(s, data.presence))
    .sort((a, b) => a.shift.signedInAt.localeCompare(b.shift.signedInAt));
}

export function currentShift(staffId: string): WorkShift | null {
  return (
    readData().shifts.find(
      (s) => s.staffId === staffId && s.signedOutAt === null && s.endReason === null,
    ) ?? null
  );
}

/** Who is signed in and proven present within the timeout right now. */
export function whoIsPresent(): string[] {
  const data = readData();
  const cutoff = Date.now() - PRESENCE_TIMEOUT_SECONDS * 1000;
  return data.presence
    .filter(
      (p) => p.toAt === null && new Date(p.lastHeartbeatAt).getTime() >= cutoff,
    )
    .map((p) => p.staffId);
}
