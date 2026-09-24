import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Route protection for the staff panel.
 *
 * NOTE: in Next.js 16 this file is `proxy.ts`, not `middleware.ts`. See
 * docs/HANDOVER.md section 3.
 *
 * Two jobs:
 *
 *   1. Keep the Supabase session fresh. Server Components cannot write
 *      cookies, so an expired access token has to be refreshed here, before
 *      any panel page renders, and the new cookies passed both to the page
 *      (on the request) and to the browser (on the response).
 *   2. Bounce anyone with no session to the sign-in page, so signed-out
 *      visitors never see a panel shell.
 *
 * This is NOT the authorisation. Proxy runs on prefetches too, and Next's own
 * guidance is to keep real checks next to the data: every panel page and
 * action calls src/lib/panel/guard.ts, which also requires an active staff
 * row. A Supabase login with no staff row passes this proxy and is refused
 * there.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Misconfigured deployment: fail closed rather than serve the panel.
    return NextResponse.redirect(new URL("/999p7k", request.url));
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet, headers) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
        // Cache-control headers the library sends with refreshed auth cookies,
        // so no shared cache ever stores one visitor's session for another.
        for (const [header, value] of Object.entries(headers ?? {})) {
          response.headers.set(header, value);
        }
      },
    },
  });

  // Verifies the token and refreshes it if it has expired. Must run before
  // anything reads the session, and nothing may run between createServerClient
  // and this call.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    return NextResponse.redirect(new URL("/999p7k", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/panel/:path*"],
};
