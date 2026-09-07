import { getCurrentUser } from "@/lib/panel/auth";
import { markAway } from "@/lib/panel/time";

/**
 * The tab is going away. Sent by navigator.sendBeacon on pagehide.
 *
 * Best effort: the browser may never deliver it. The presence sweeper closes
 * the segment either way, at the last proven heartbeat.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return new Response("no session", { status: 401 });

  markAway(user.id, "browser_closed");
  return new Response(null, { status: 204 });
}
