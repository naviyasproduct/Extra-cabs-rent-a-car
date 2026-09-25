/**
 * Supabase configuration, read once and checked.
 *
 * A missing variable fails loudly with its name, rather than surfacing later
 * as "Invalid URL" or a 401 from a request that looked fine.
 */

function required(name: string, value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    throw new Error(
      `${name} is not set. See .env.example; on Vercel, Project Settings, Environment Variables.`,
    );
  }
  return trimmed;
}

/**
 * Public values. Written out as literal process.env.NAME reads, because Next
 * only inlines NEXT_PUBLIC_ variables into a browser bundle when it can see
 * them spelled out in full.
 */
export function supabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabaseAnonKey(): string {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** SERVER ONLY. Bypasses row level security entirely. */
export function supabaseServiceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** The private bucket for customer identity photos. */
export const ID_DOCUMENTS_BUCKET = "id-documents";

/**
 * Where vehicle photographs and video land on their way to Cloudinary.
 *
 * Private, and transient: an object lives here only until Cloudinary has
 * fetched it. It exists because uploading straight to Cloudinary from Sri
 * Lanka is slow and wildly inconsistent, while this bucket is in Mumbai.
 * See the migration for the measurements.
 */
export const MEDIA_STAGING_BUCKET = "media-staging";
