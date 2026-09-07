import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection for the staff panel.
 *
 * NOTE: in Next.js 16 this file is `proxy.ts`, not `middleware.ts`. See
 * docs/HANDOVER.md section 3.
 *
 * This is an OPTIMISTIC check and nothing more. It reads the session cookie
 * and bounces anyone without one, so signed-out visitors never see a panel
 * shell. It deliberately does not verify the signature or touch the store:
 * proxy runs on every request including prefetches, and Next's own guidance is
 * to keep real authorisation next to the data. That lives in
 * src/lib/panel/guard.ts, which every panel page and action calls.
 */

const SESSION_COOKIE = "ec_panel";

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession) {
    const url = new URL("/999p7k", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};
