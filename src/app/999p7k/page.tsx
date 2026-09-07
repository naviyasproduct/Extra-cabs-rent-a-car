import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  attemptSignIn,
  createSessionValue,
  getCurrentUser,
} from "@/lib/panel/auth";
import { openShift } from "@/lib/panel/time";

/**
 * Staff sign-in.
 *
 * The route is deliberately obscure and carries `noindex`, and robots.ts
 * disallows /panel. That is not security, it just keeps the door off search
 * results. The actual protection is the session check in proxy.ts and the
 * guards next to the data.
 */
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

async function signIn(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const result = attemptSignIn(email, password);
  if (!result.ok || !result.staffId) {
    redirect(`/999p7k?error=${encodeURIComponent(result.error ?? "Sign in failed")}`);
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionValue(result.staffId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  // Signing in IS the start of the shift. The plan wants one deliberate act,
  // not a sign-in followed by a separate clock-in nobody remembers to press.
  openShift(result.staffId);

  redirect("/panel");
}

export default async function StaffSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (await getCurrentUser()) redirect("/panel");

  return (
    <div className="flex min-h-dvh items-center justify-center px-(--gutter) py-24">
      <div className="w-full max-w-[26rem]">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-brand text-white">
            <Lock className="size-4" aria-hidden />
          </span>
          <span className="font-display text-sm font-bold uppercase tracking-[0.16em] text-muted">
            Staff only
          </span>
        </div>

        <h1 className="display-md mt-6">Extra Cabs control</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Signing in starts your shift. Sign out when you leave so your hours
          are recorded correctly.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-6 bg-brand-tint px-4 py-3 text-sm font-medium text-brand-bright"
          >
            {error}
          </p>
        ) : null}

        <form action={signIn} className="mt-6 flex flex-col gap-4">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="you@extracabs.lk"
            />
          </Field>

          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </Field>

          <Button type="submit" size="lg" className="mt-2 w-full">
            Sign in and start shift
          </Button>
        </form>
      </div>
    </div>
  );
}
