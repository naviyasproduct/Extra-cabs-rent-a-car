import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";
import { openWindowFor } from "./window";
import { sweep } from "./time";
import type { StaffUser, WindowScope } from "./types";

/**
 * The guards. See docs/internal-platform-plan.md section 5, "Three walls".
 *
 * Wall one is here: every page and every mutating action re-reads the session
 * and the window FROM THE DATABASE, never from anything the browser sent. A
 * disabled button in the UI is a courtesy, not a control.
 *
 * Wall two is row level security: on for every table, with no policies, so a
 * staff session used straight from a browser reaches nothing. Proven on the
 * live project 2026-09-22 (HANDOVER).
 *
 * Wall three is that these run only on the server.
 */

/** Any signed-in staff member, or bounced to the sign-in page. */
export async function requireStaff(): Promise<StaffUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/999p7k");

  // Any authenticated read is a good moment to close abandoned presence.
  // Runs in the database and ends each stale segment at its last heartbeat.
  await sweep();

  return user;
}

/** The owner, or bounced back to the panel home. */
export async function requireOwner(): Promise<StaffUser> {
  const user = await requireStaff();
  if (user.role !== "owner") redirect("/panel");
  return user;
}

export class WindowRequiredError extends Error {
  constructor(public scope: WindowScope) {
    super(`This needs an open window for ${scope}.`);
    this.name = "WindowRequiredError";
  }
}

/**
 * The write gate.
 *
 * The owner writes freely. An employee needs an open window whose scope covers
 * the operation, and whose target matches when one was named. Returns the
 * authorising request id so the change can be tied to it in the audit log.
 */
export async function assertCanWrite(
  user: StaffUser,
  scope: WindowScope,
  targetSlug: string | null = null,
): Promise<string | null> {
  if (user.role === "owner") return null;

  const open = await openWindowFor(user.id);
  if (!open) throw new WindowRequiredError(scope);
  if (open.scope !== scope) throw new WindowRequiredError(scope);
  if (open.targetSlug !== null && open.targetSlug !== targetSlug) {
    throw new WindowRequiredError(scope);
  }

  return open.id;
}

/**
 * True when the employee could perform this write right now.
 *
 * Pass the vehicle when asking about one. A window opened for a single
 * vehicle is refused for any other target, so asking without the slug would
 * answer "no" for the very vehicle it was granted for, and the screen would
 * hide controls the server would happily accept. Found 2026-09-24.
 */
export async function canWrite(
  user: StaffUser,
  scope: WindowScope,
  targetSlug: string | null = null,
): Promise<boolean> {
  try {
    await assertCanWrite(user, scope, targetSlug);
    return true;
  } catch {
    return false;
  }
}
