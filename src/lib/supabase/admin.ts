import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseServiceRoleKey, supabaseUrl } from "./env";

/**
 * The service role client: every read and write of panel data goes through it.
 *
 * SERVER ONLY, and `server-only` makes importing it from a client component a
 * build error. It bypasses row level security, which is the design: RLS is on
 * with no policies, so the public keys reach nothing, and access control is
 * the guard in src/lib/panel/guard.ts, which every caller must pass first.
 * See the header of supabase/migrations/20260921000000_panel_init.sql.
 *
 * It never holds a user session. Who is signed in is the job of
 * ./server.ts; this client only ever acts as the server itself.
 */

let client: SupabaseClient | null = null;

export function admin(): SupabaseClient {
  client ??= createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}
