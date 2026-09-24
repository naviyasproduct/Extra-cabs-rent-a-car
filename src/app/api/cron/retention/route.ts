import crypto from "node:crypto";
import { runRetention } from "@/lib/panel/retention";

/**
 * The daily retention run: deletes ID photos whose time is up and uploads no
 * booking ever claimed. Scheduled in vercel.json.
 *
 * The bookings screen runs the same sweep on every load, but a rule that runs
 * only when someone opens a page stops running the week nobody does. This is
 * the guarantee.
 *
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` on scheduled calls when
 * CRON_SECRET is set on the project. Without the secret configured this
 * refuses to run at all, rather than let anyone on the internet trigger it.
 */
export const dynamic = "force-dynamic";

function authorised(header: string | null): boolean {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

export async function GET(request: Request) {
  if (!(process.env.CRON_SECRET ?? "").trim()) {
    return new Response("CRON_SECRET is not configured", { status: 503 });
  }
  if (!authorised(request.headers.get("authorization"))) {
    return new Response("Unauthorised", { status: 401 });
  }

  try {
    const result = await runRetention();
    console.info(`[retention] expired bookings cleared: ${result.expired}, orphan uploads removed: ${result.orphans}`);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error(`[retention] run failed: ${(error as Error).message}`);
    return Response.json({ ok: false, error: "Retention run failed; see server log." }, { status: 500 });
  }
}
