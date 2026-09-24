import "server-only";
import crypto from "node:crypto";
import {
  accessRequestsWithStatus,
  auditForRequest,
  getAccessRequest,
  insertAccessRequest,
  insertAudit,
  newId,
  updateAccessRequest,
} from "./db";
import { currentShift } from "./time";
import type { AccessRequest, StaffUser, WindowScope } from "./types";

/**
 * The write window. See docs/internal-platform-plan.md section 4.
 *
 * One code opens a scoped, time-boxed window rather than authorising a single
 * save. Adding a vehicle is a dozen writes; nobody phones the owner twelve
 * times.
 *
 * NO SMS YET. The plan sends the code to the owner by Text.lk. Until that is
 * wired the code is shown on the owner's own screen in the panel and he reads
 * it out the same way. `devCode` is the only part of this that changes when
 * the gateway lands.
 */

export const CODE_TTL_MINUTES = 10;
export const WINDOW_MINUTES = 45;
export const MAX_ATTEMPTS = 5;

export const SCOPES: { id: WindowScope; label: string; description: string }[] = [
  { id: "fleet.create", label: "Add a vehicle", description: "Put a new vehicle on the site" },
  { id: "fleet.update", label: "Edit a vehicle", description: "Change details on an existing vehicle" },
  { id: "fleet.delete", label: "Remove a vehicle", description: "Take a vehicle off the site" },
  { id: "pricing.update", label: "Change pricing", description: "The daily rate, the long-hire rate table or the deposit" },
  { id: "booking.delete", label: "Delete a booking", description: "Remove a booking record entirely" },
];

export function scopeLabel(scope: WindowScope): string {
  return SCOPES.find((s) => s.id === scope)?.label ?? scope;
}

/**
 * The secret mixed into every code hash.
 *
 * The repo is public, so the development fallback is public too. In
 * production a missing PANEL_OTP_PEPPER is a hard error rather than a quiet
 * fallback to a value anyone can read.
 */
function pepper(): string {
  const value = (process.env.PANEL_OTP_PEPPER ?? "").trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("PANEL_OTP_PEPPER is not set. Refusing to hash access codes with the public fallback.");
  }
  return "extra-cabs-dev-pepper-change-me";
}

/** Only the hash is stored, so nobody reading the database can use a live code. */
function hashCode(code: string, requestId: string): string {
  return crypto.createHmac("sha256", pepper()).update(`${requestId}.${code}`).digest("hex");
}

function sixDigits(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/* -------------------------------------------------------------------------- */

export async function requestWindow(
  user: StaffUser,
  scope: WindowScope,
  reason: string,
  targetSlug: string | null,
): Promise<AccessRequest> {
  const shift = await currentShift(user);
  const id = newId("acc");
  const code = sixDigits();
  const now = new Date();

  const request: AccessRequest = {
    id,
    staffId: user.id,
    shiftId: shift?.id ?? null,
    scope,
    targetSlug,
    reason: reason.trim().slice(0, 200),
    codeHash: hashCode(code, id),
    attempts: 0,
    status: "awaiting_code",
    createdAt: now.toISOString(),
    codeExpiresAt: new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000).toISOString(),
    windowExpiresAt: null,
    closedAt: null,
    closeReason: null,
    devCode: code,
  };

  await insertAccessRequest(request);
  await insertAudit({
    staffId: user.id,
    action: "access.requested",
    entity: "access",
    entityId: id,
    summary: `Asked to ${scopeLabel(scope).toLowerCase()}${targetSlug ? ` (${targetSlug})` : ""}: ${request.reason}`,
    accessRequestId: id,
    at: now.toISOString(),
  });

  return request;
}

export interface RedeemResult {
  ok: boolean;
  error?: string;
}

/**
 * Consume a code.
 *
 * Bound to the employee who asked: typed into anyone else's session it fails,
 * and that failure is written to the audit log because it is exactly the event
 * the owner would want to see.
 */
export async function redeemCode(
  user: StaffUser,
  requestId: string,
  code: string,
): Promise<RedeemResult> {
  const request = await getAccessRequest(requestId);
  if (!request) return { ok: false, error: "That request no longer exists." };

  if (request.staffId !== user.id) {
    await insertAudit({
      staffId: user.id,
      action: "access.wrong_person",
      entity: "access",
      entityId: request.id,
      summary: "Tried to use a code raised by someone else",
      accessRequestId: request.id,
    });
    return { ok: false, error: "That code was not issued to you." };
  }

  if (request.status !== "awaiting_code") {
    return { ok: false, error: "That request is no longer waiting for a code." };
  }

  if (new Date(request.codeExpiresAt).getTime() < Date.now()) {
    await updateAccessRequest(request.id, { status: "burned", codeHash: null, devCode: null });
    return { ok: false, error: "That code has expired. Ask for a new one." };
  }

  const supplied = Buffer.from(hashCode(code.trim(), request.id));
  const expected = Buffer.from(request.codeHash ?? "");
  const matches = supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);

  if (!matches) {
    const attempts = request.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await updateAccessRequest(request.id, { attempts, status: "burned", codeHash: null, devCode: null });
      await insertAudit({
        staffId: user.id,
        action: "access.attempts_failed",
        entity: "access",
        entityId: request.id,
        summary: "Five wrong codes. Request burned.",
        accessRequestId: request.id,
      });
      return { ok: false, error: "Too many wrong codes. Ask for a new one." };
    }
    await updateAccessRequest(request.id, { attempts });
    return { ok: false, error: `Wrong code. ${MAX_ATTEMPTS - attempts} attempts left.` };
  }

  // Single use: consumed, then nulled.
  await updateAccessRequest(request.id, {
    codeHash: null,
    devCode: null,
    status: "open",
    windowExpiresAt: new Date(Date.now() + WINDOW_MINUTES * 60 * 1000).toISOString(),
  });
  await insertAudit({
    staffId: user.id,
    action: "access.opened",
    entity: "access",
    entityId: request.id,
    summary: `Window open for ${WINDOW_MINUTES} minutes: ${scopeLabel(request.scope)}`,
    accessRequestId: request.id,
  });

  return { ok: true };
}

export async function closeWindow(
  requestId: string,
  closeReason: string,
  byStaffId: string,
): Promise<void> {
  const request = await getAccessRequest(requestId);
  if (!request || request.status !== "open") return;

  const closedAt = new Date().toISOString();
  await updateAccessRequest(requestId, { status: "closed", closedAt, closeReason });

  // The summary the owner would have received by SMS. It lives in the
  // activity feed until the gateway is wired.
  const changes = (await auditForRequest(requestId)).filter((a) => a.entity !== "access");
  const summary =
    changes.length > 0 ? changes.map((c) => c.summary).join("; ") : "No changes were made";

  await insertAudit({
    staffId: byStaffId,
    action: "access.closed",
    entity: "access",
    entityId: requestId,
    summary: `Window closed (${closeReason}). ${summary}`,
    accessRequestId: requestId,
    at: closedAt,
  });
}

/** Expire windows whose time ran out. Cheap, so callers can run it freely. */
export async function expireWindows(): Promise<void> {
  const now = Date.now();
  const stale = (await accessRequestsWithStatus(["open"])).filter(
    (r) => r.windowExpiresAt !== null && new Date(r.windowExpiresAt).getTime() < now,
  );
  for (const request of stale) {
    await closeWindow(request.id, "time ran out", request.staffId);
  }
}

/** The employee's currently open window, if any. */
export async function openWindowFor(staffId: string): Promise<AccessRequest | null> {
  await expireWindows();
  return (await accessRequestsWithStatus(["open"], staffId))[0] ?? null;
}

export async function pendingRequestFor(staffId: string): Promise<AccessRequest | null> {
  return (await accessRequestsWithStatus(["awaiting_code"], staffId))[0] ?? null;
}

/** Everything the owner needs to see and act on, newest first. */
export async function liveRequests(): Promise<AccessRequest[]> {
  await expireWindows();
  return accessRequestsWithStatus(["awaiting_code", "open"]);
}
