import crypto from "node:crypto";
import { cookies } from "next/headers";
import { readData, verifyPassword } from "./store";
import type { Role, StaffUser } from "./types";

/**
 * Sessions.
 *
 * A signed cookie holding the staff id and an expiry. The signature is an
 * HMAC over the payload, so the cookie cannot be edited to become somebody
 * else. There is no session table: with the store reset on redeploy that would
 * add bookkeeping without adding safety at this stage.
 *
 * Real authorisation is done by the guards in guard.ts, next to the data.
 * proxy.ts only does the cheap cookie check, per the Next.js guidance in
 * docs/HANDOVER.md section 3.
 */

export const SESSION_COOKIE = "ec_panel";
const SESSION_HOURS = 12;

function secret(): string {
  return process.env.PANEL_SESSION_SECRET ?? "extra-cabs-dev-secret-change-me";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionValue(staffId: string): string {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = `${staffId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the staff id, or null if the cookie is missing, edited or expired. */
export function readSessionValue(value: string | undefined): string | null {
  if (!value) return null;

  const parts = value.split(".");
  if (parts.length !== 3) return null;

  const [staffId, expiresAt, signature] = parts;
  const payload = `${staffId}.${expiresAt}`;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length) return null;
  if (!crypto.timingSafeEqual(expected, given)) return null;

  if (Number(expiresAt) < Date.now()) return null;

  return staffId;
}

export const SESSION_MAX_AGE = SESSION_HOURS * 60 * 60;

/* -------------------------------------------------------------------------- */
/* The data access layer                                                       */
/* -------------------------------------------------------------------------- */

/** The signed-in user, or null. Every panel page starts here. */
export async function getCurrentUser(): Promise<StaffUser | null> {
  const jar = await cookies();
  const staffId = readSessionValue(jar.get(SESSION_COOKIE)?.value);
  if (!staffId) return null;

  const user = readData().staff.find((s) => s.id === staffId);
  if (!user || !user.active) return null;

  return user;
}

export interface SignInResult {
  ok: boolean;
  staffId?: string;
  error?: string;
}

export function attemptSignIn(email: string, password: string): SignInResult {
  const target = email.trim().toLowerCase();
  const user = readData().staff.find((s) => s.email === target);

  // Same message either way, so the form cannot be used to discover which
  // addresses have accounts.
  const generic = "That email and password do not match an account.";

  if (!user || !user.active) return { ok: false, error: generic };
  if (!verifyPassword(password, user)) return { ok: false, error: generic };

  return { ok: true, staffId: user.id };
}

export function isOwner(user: StaffUser | null): boolean {
  return user?.role === "owner";
}

export function roleLabel(role: Role): string {
  return role === "owner" ? "Owner" : "Employee";
}
