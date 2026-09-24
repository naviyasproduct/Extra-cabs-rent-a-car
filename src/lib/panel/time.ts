import "server-only";
import {
  insertAudit,
  insertSegment,
  insertShift,
  listStaff,
  livePresenceSince,
  newId,
  openSegmentForShift,
  openSegmentsForStaff,
  openShiftFor,
  segmentsForShifts,
  shiftsOn,
  sweepTimesheet,
  updateSegment,
  updateShift,
} from "./db";
import type { PresenceSegment, StaffUser, WorkShift } from "./types";

/**
 * The timesheet. See docs/internal-platform-plan.md section 3.
 *
 * Two records per day: the shift is what the employee claims, the presence
 * segments are what the system can prove. Coverage is proven over claimed, and
 * the gap between the two is the whole point.
 *
 * Employees only. The owner is not tracked at all: see `isTimeTracked` below.
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
/* Who is on a timesheet                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The owner is not on a timesheet. Client decision, 2026-09-07.
 *
 * He does not employ himself, so there is no shift for him to claim, and the
 * report is FOR him, so proving his presence would be measuring the reader.
 * Nothing about his hours or his whereabouts is written down.
 *
 * Enforced here, in the data layer, rather than by hiding the buttons: a
 * control that exists only in the UI is a courtesy. `openShift`, `closeShift`,
 * `recordHeartbeat` and `markAway` all refuse an owner, so no route, action or
 * later caller can start recording him by accident. The read side filters
 * too, so an owner row can never reach a report.
 */
export function isTimeTracked(user: Pick<StaffUser, "role">): boolean {
  return user.role !== "owner";
}

/** Ids of everyone whose time is tracked, for filtering reads. */
async function trackedIds(): Promise<Set<string>> {
  return new Set((await listStaff()).filter(isTimeTracked).map((s) => s.id));
}

/* -------------------------------------------------------------------------- */
/* The sweeper                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Closes presence segments that stopped beating, and shifts left open past
 * their day. It runs in the database (`panel_sweep`, in
 * supabase/migrations/20260922000000_panel_functions.sql) because the end it
 * records is each segment's OWN last heartbeat, the last moment presence was
 * proven, NOT the moment the sweep ran. That keeps the figure honest however
 * the job is triggered.
 */
export async function sweep(): Promise<void> {
  await sweepTimesheet(PRESENCE_TIMEOUT_SECONDS);
}

/* -------------------------------------------------------------------------- */
/* Sign in and out                                                             */
/* -------------------------------------------------------------------------- */

async function ensureOpenSegment(shift: WorkShift): Promise<PresenceSegment> {
  const open = await openSegmentForShift(shift.id);
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
  await insertSegment(segment);
  return segment;
}

export async function openShift(user: StaffUser): Promise<WorkShift | null> {
  await sweep();

  // No shift for the owner. Callers may call this blindly; the refusal is
  // here so it cannot be forgotten at a call site.
  if (!isTimeTracked(user)) return null;

  const existing = await openShiftFor(user.id);
  if (existing) {
    await ensureOpenSegment(existing);
    return existing;
  }

  const now = new Date().toISOString();
  const shift: WorkShift = {
    id: newId("shift"),
    staffId: user.id,
    workDate: colomboDate(),
    signedInAt: now,
    signedOutAt: null,
    endReason: null,
  };
  await insertShift(shift);
  await ensureOpenSegment(shift);
  await insertAudit({
    staffId: user.id,
    action: "shift.sign_in",
    entity: "shift",
    entityId: shift.id,
    summary: "Signed in",
    accessRequestId: null,
    at: now,
  });
  return shift;
}

export async function closeShift(user: StaffUser, reason: WorkShift["endReason"]): Promise<void> {
  if (!isTimeTracked(user)) return;

  const shift = await openShiftFor(user.id);
  if (!shift) return;

  const now = new Date().toISOString();
  for (const segment of await openSegmentsForStaff(user.id)) {
    if (segment.shiftId === shift.id) {
      await updateSegment(segment.id, { toAt: now, endedBy: "sign_out" });
    }
  }
  await updateShift(shift.id, { signedOutAt: now, endReason: reason });
  await insertAudit({
    staffId: user.id,
    action: "shift.sign_out",
    entity: "shift",
    entityId: shift.id,
    summary: "Signed out",
    accessRequestId: null,
    at: now,
  });
}

/**
 * A beat from an open panel tab.
 *
 * The server writes its own clock, never a timestamp sent by the browser: a
 * client clock can be wrong, or deliberately changed.
 */
export async function recordHeartbeat(user: StaffUser): Promise<boolean> {
  await sweep();

  // The owner's presence is never recorded, so his beats are dropped rather
  // than stored and filtered out later.
  if (!isTimeTracked(user)) return false;

  const shift = await openShiftFor(user.id);
  if (!shift) return false;

  const segment = await ensureOpenSegment(shift);
  await updateSegment(segment.id, { lastHeartbeatAt: new Date().toISOString() });
  return true;
}

/** The tab went away. Best effort only; the sweeper is the source of truth. */
export async function markAway(user: StaffUser, how: PresenceSegment["endedBy"]): Promise<void> {
  if (!isTimeTracked(user)) return;

  // Each open segment ends at its own last heartbeat, never at "now": the
  // moment the tab closed is not a moment presence was proven.
  for (const segment of await openSegmentsForStaff(user.id)) {
    await updateSegment(segment.id, { toAt: segment.lastHeartbeatAt, endedBy: how });
  }
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

/** Pure: claimed against proven for one shift. */
export function summariseShift(
  shift: WorkShift,
  allSegments: PresenceSegment[],
): ShiftSummary {
  const segments = allSegments
    .filter((s) => s.shiftId === shift.id)
    .sort((a, b) => Date.parse(a.fromAt) - Date.parse(b.fromAt));

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

export async function shiftsForDate(date: string): Promise<ShiftSummary[]> {
  const [shifts, tracked] = await Promise.all([shiftsOn(date), trackedIds()]);
  const mine = shifts.filter((s) => tracked.has(s.staffId));
  const segments = await segmentsForShifts(mine.map((s) => s.id));
  return mine
    .map((s) => summariseShift(s, segments))
    .sort((a, b) => Date.parse(a.shift.signedInAt) - Date.parse(b.shift.signedInAt));
}

export async function currentShift(user: StaffUser): Promise<WorkShift | null> {
  if (!isTimeTracked(user)) return null;
  return openShiftFor(user.id);
}

/** Who is signed in and proven present within the timeout right now. */
export async function whoIsPresent(): Promise<string[]> {
  const cutoff = new Date(Date.now() - PRESENCE_TIMEOUT_SECONDS * 1000).toISOString();
  const [live, tracked] = await Promise.all([livePresenceSince(cutoff), trackedIds()]);
  return live.filter((p) => tracked.has(p.staffId)).map((p) => p.staffId);
}
