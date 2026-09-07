import crypto from "node:crypto";
import { newId, readData, writeData } from "./store";
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
  { id: "pricing.update", label: "Change pricing", description: "Daily, weekly, monthly rates or the deposit" },
  { id: "booking.delete", label: "Delete a booking", description: "Remove a booking record entirely" },
];

export function scopeLabel(scope: WindowScope): string {
  return SCOPES.find((s) => s.id === scope)?.label ?? scope;
}

function pepper(): string {
  return process.env.PANEL_OTP_PEPPER ?? "extra-cabs-dev-pepper-change-me";
}

/** Only the hash is stored, so nobody reading the store can use a live code. */
function hashCode(code: string, requestId: string): string {
  return crypto
    .createHmac("sha256", pepper())
    .update(`${requestId}.${code}`)
    .digest("hex");
}

function sixDigits(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/* -------------------------------------------------------------------------- */

export function requestWindow(
  user: StaffUser,
  scope: WindowScope,
  reason: string,
  targetSlug: string | null,
): AccessRequest {
  const shift = currentShift(user.id);

  return writeData((data) => {
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
      codeExpiresAt: new Date(
        now.getTime() + CODE_TTL_MINUTES * 60 * 1000,
      ).toISOString(),
      windowExpiresAt: null,
      closedAt: null,
      closeReason: null,
      devCode: code,
    };

    data.accessRequests.push(request);
    data.audit.push({
      id: newId("aud"),
      at: now.toISOString(),
      staffId: user.id,
      action: "access.requested",
      entity: "access",
      entityId: id,
      summary: `Asked to ${scopeLabel(scope).toLowerCase()}${targetSlug ? ` (${targetSlug})` : ""}: ${request.reason}`,
      accessRequestId: id,
    });

    return request;
  });
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
export function redeemCode(
  user: StaffUser,
  requestId: string,
  code: string,
): RedeemResult {
  return writeData((data) => {
    const request = data.accessRequests.find((r) => r.id === requestId);
    if (!request) return { ok: false, error: "That request no longer exists." };

    if (request.staffId !== user.id) {
      data.audit.push({
        id: newId("aud"),
        at: new Date().toISOString(),
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
      request.status = "burned";
      request.codeHash = null;
      request.devCode = null;
      return { ok: false, error: "That code has expired. Ask for a new one." };
    }

    const supplied = hashCode(code.trim(), request.id);
    const expected = request.codeHash ?? "";
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    const matches =
      a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!matches) {
      request.attempts += 1;
      if (request.attempts >= MAX_ATTEMPTS) {
        request.status = "burned";
        request.codeHash = null;
        request.devCode = null;
        data.audit.push({
          id: newId("aud"),
          at: new Date().toISOString(),
          staffId: user.id,
          action: "access.attempts_failed",
          entity: "access",
          entityId: request.id,
          summary: `Five wrong codes. Request burned.`,
          accessRequestId: request.id,
        });
        return { ok: false, error: "Too many wrong codes. Ask for a new one." };
      }
      return {
        ok: false,
        error: `Wrong code. ${MAX_ATTEMPTS - request.attempts} attempts left.`,
      };
    }

    // Single use: consumed, then nulled.
    request.codeHash = null;
    request.devCode = null;
    request.status = "open";
    request.windowExpiresAt = new Date(
      Date.now() + WINDOW_MINUTES * 60 * 1000,
    ).toISOString();

    data.audit.push({
      id: newId("aud"),
      at: new Date().toISOString(),
      staffId: user.id,
      action: "access.opened",
      entity: "access",
      entityId: request.id,
      summary: `Window open for ${WINDOW_MINUTES} minutes: ${scopeLabel(request.scope)}`,
      accessRequestId: request.id,
    });

    return { ok: true };
  });
}

export function closeWindow(
  requestId: string,
  closeReason: string,
  byStaffId: string,
): void {
  writeData((data) => {
    const request = data.accessRequests.find((r) => r.id === requestId);
    if (!request || request.status !== "open") return;

    request.status = "closed";
    request.closedAt = new Date().toISOString();
    request.closeReason = closeReason;

    // The summary the owner would have received by SMS. It lives in the
    // activity feed until the gateway is wired.
    const changes = data.audit.filter((a) => a.accessRequestId === requestId && a.entity !== "access");
    const summary =
      changes.length > 0
        ? changes.map((c) => c.summary).join("; ")
        : "No changes were made";

    data.audit.push({
      id: newId("aud"),
      at: request.closedAt,
      staffId: byStaffId,
      action: "access.closed",
      entity: "access",
      entityId: requestId,
      summary: `Window closed (${closeReason}). ${summary}`,
      accessRequestId: requestId,
    });
  });
}

/** Expire windows whose time ran out. Cheap, so callers can run it freely. */
export function expireWindows(): void {
  const now = Date.now();
  const stale = readData().accessRequests.filter(
    (r) =>
      r.status === "open" &&
      r.windowExpiresAt !== null &&
      new Date(r.windowExpiresAt).getTime() < now,
  );
  for (const request of stale) {
    closeWindow(request.id, "time ran out", request.staffId);
  }
}

/** The employee's currently open window, if any. */
export function openWindowFor(staffId: string): AccessRequest | null {
  expireWindows();
  return (
    readData().accessRequests.find(
      (r) => r.staffId === staffId && r.status === "open",
    ) ?? null
  );
}

export function pendingRequestFor(staffId: string): AccessRequest | null {
  return (
    readData().accessRequests.find(
      (r) => r.staffId === staffId && r.status === "awaiting_code",
    ) ?? null
  );
}

/** Everything the owner needs to see and act on. */
export function liveRequests(): AccessRequest[] {
  expireWindows();
  return readData()
    .accessRequests.filter(
      (r) => r.status === "awaiting_code" || r.status === "open",
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
