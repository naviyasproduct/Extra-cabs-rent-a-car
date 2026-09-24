import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * The sign-in client: Supabase Auth, with the session in cookies.
 *
 * Used ONLY to establish who is signed in (getClaims, signInWithPassword,
 * signOut). It is never used to read panel data: with the anon key and a staff
 * session it would be refused anyway, by design. Data goes through ./admin.ts
 * after the guard has approved the caller.
 *
 * Server Components cannot set cookies, so a token refresh attempted during a
 * render is swallowed here. That is safe because src/proxy.ts refreshes the
 * session on every panel request before any page renders.
 */
export async function authClient() {
  const jar = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) jar.set(name, value, options);
        } catch {
          // Called from a Server Component render, where cookies are read
          // only. The proxy has already refreshed the session.
        }
      },
    },
  });
}
