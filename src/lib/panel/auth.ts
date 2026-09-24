import "server-only";
import { cache } from "react";
import { authClient } from "@/lib/supabase/server";
import { getStaff, getStaffByEmail } from "./db";
import type { Role, StaffUser } from "./types";

/**
 * Who is signed in. Supabase Auth since 2026-09-22.
 *
 * Supabase Auth owns passwords and sessions; the `staff` table owns who may
 * use the panel. BOTH must agree on every request: a valid Supabase session
 * with no staff row, or a disabled one, is no session at all. So disabling an
 * employee in /panel/team locks them out on their very next click, without
 * waiting for their session to expire.
 *
 * getClaims() verifies the session token's signature rather than trusting the
 * cookie's contents, which is what Supabase's own docs require before a
 * session is believed on the server.
 */

/**
 * The signed-in staff member, or null. Memoised for the length of one request,
 * so a page, its layout and its actions ask Supabase once between them.
 */
export const getCurrentUser = cache(async (): Promise<StaffUser | null> => {
  const supabase = await authClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") return null;

  const staff = await getStaff(userId);
  if (!staff || !staff.active) return null;
  return staff;
});

export interface SignInResult {
  ok: boolean;
  user?: StaffUser;
  error?: string;
}

/** Same message for every failure, so the form cannot reveal which emails have accounts. */
const GENERIC = "That email and password do not match an account.";

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const address = email.trim().toLowerCase();
  if (!address || !password) return { ok: false, error: GENERIC };

  const supabase = await authClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: address, password });
  if (error || !data.user) {
    // Supabase rate-limits repeated attempts on its own; say so rather than
    // letting "wrong password" hide a lockout.
    if (error?.status === 429) {
      return { ok: false, error: "Too many attempts. Wait a few minutes and try again." };
    }
    return { ok: false, error: GENERIC };
  }

  // A real Supabase login is not enough: it must be an active staff account.
  const staff = await getStaff(data.user.id);
  if (!staff || !staff.active) {
    await supabase.auth.signOut();
    return { ok: false, error: GENERIC };
  }

  return { ok: true, user: staff };
}

export async function signOut(): Promise<void> {
  const supabase = await authClient();
  await supabase.auth.signOut();
}

/** For the owner's create-account form: is this address already taken? */
export async function emailHasAccount(email: string): Promise<boolean> {
  return (await getStaffByEmail(email)) !== null;
}

export function isOwner(user: StaffUser | null): boolean {
  return user?.role === "owner";
}

export function roleLabel(role: Role): string {
  return role === "owner" ? "Owner" : "Employee";
}
