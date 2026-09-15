import { getCurrentUser } from "@/lib/panel/auth";
import { readDocument } from "@/lib/panel/uploads";

/**
 * Serves one customer identity document to a signed-in staff member.
 *
 * This is the ONLY way the bytes come back out. They are written under .data/,
 * never under public/, so there is no static path to them and no way to reach
 * one without passing this check first.
 *
 * A missing session gets 404, not 401: whether a given id exists is itself
 * information, and there is nothing useful a signed-out caller could do with
 * the difference.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Not found", { status: 404 });

  const { id } = await params;
  const found = readDocument(id);
  if (!found) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(found.bytes), {
    headers: {
      "Content-Type": found.contentType,
      // inline so staff can eyeball a card without downloading it.
      "Content-Disposition": "inline",
      // private: this must never be held by a shared cache or a CDN.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
