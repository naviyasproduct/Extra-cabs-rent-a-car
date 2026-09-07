import { getCurrentUser } from "@/lib/panel/auth";
import { recordHeartbeat } from "@/lib/panel/time";

/**
 * One beat from an open panel tab.
 *
 * Deliberately takes no body. The only thing that matters is who is calling,
 * which comes from the session cookie, and when, which is the server's clock.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return new Response("no session", { status: 401 });

  const recorded = recordHeartbeat(user.id);
  return Response.json({ recorded });
}
