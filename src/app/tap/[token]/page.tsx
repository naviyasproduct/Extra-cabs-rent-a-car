import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, Clock, Lock, LogIn, LogOut, TriangleAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/panel/auth";
import { lookupTapCard, recordTap } from "@/lib/panel/tap";
import { colomboDateTime, currentShift, formatDuration, isTimeTracked } from "@/lib/panel/time";
import { tapEndShiftAction, tapStartShiftAction } from "@/app/panel/actions";
import { SubmitButton } from "@/components/panel/SubmitButton";

/**
 * What an employee sees when they tap their phone on the card at the desk.
 *
 * A real page, not a silent link: the client asked for something they can see
 * and press, so a mistaken tap cannot change anything on its own. Ending a
 * shift takes a second, deliberate press, because an accidental tap that
 * signed somebody out would quietly cost them the rest of the day's proven
 * time. Starting one does not, since an accidental start is visible and
 * harmless.
 *
 * The card carries no identity (see lib/panel/tap.ts). Everything below
 * depends on the session already on this phone.
 */

export const dynamic = "force-dynamic";

// The tap page must never be indexed: it is an operational URL, and one that
// is deliberately hard to guess.
export const metadata = {
  title: "Shift",
  robots: { index: false, follow: false },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-(--gutter) py-16">
      <div className="w-full max-w-[26rem] text-center">{children}</div>
    </div>
  );
}

export default async function TapPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ confirm?: string; done?: string }>;
}) {
  const { token } = await params;
  const { confirm, done } = await searchParams;

  const lookup = await lookupTapCard(token);
  if (lookup.state === "unknown") notFound();

  if (lookup.state === "revoked") {
    return (
      <Shell>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-field text-muted">
          <TriangleAlert className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold uppercase">Card turned off</h1>
        <p className="mt-3 text-sm text-muted">
          This card is no longer in use. Ask the owner, or sign in and use the
          buttons in the panel.
        </p>
        <Link
          href="/panel"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-field px-6 text-sm font-semibold transition-colors hover:bg-field-hover"
        >
          Open the panel
        </Link>
      </Shell>
    );
  }

  // A real card, so record the visit whoever it turns out to be. This is what
  // tells the owner the tag is alive without him going to the desk.
  await recordTap(lookup.card.id);

  const user = await getCurrentUser();

  if (!user) {
    return (
      <Shell>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand text-white">
          <Lock className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold uppercase">Sign in once</h1>
        <p className="mt-3 text-sm text-muted">
          Sign in on this phone and you will come straight back here. After
          that, tapping the card is all you need.
        </p>
        <Link
          href={`/999p7k?next=${encodeURIComponent(`/tap/${token}`)}`}
          className="mt-6 inline-flex h-12 items-center rounded-full bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Sign in
        </Link>
      </Shell>
    );
  }

  // The owner keeps no shift (2026-09-07). Gated on the same predicate the
  // data layer uses, not on the role, so there is one rule.
  if (!isTimeTracked(user)) {
    return (
      <Shell>
        <h1 className="font-display text-2xl font-bold uppercase">Hello {user.name}</h1>
        <p className="mt-3 text-sm text-muted">
          You are not on a timesheet, so there is nothing to start or end here.
          The card is for the employees.
        </p>
        <Link
          href="/panel"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-field px-6 text-sm font-semibold transition-colors hover:bg-field-hover"
        >
          Open the panel
        </Link>
      </Shell>
    );
  }

  const shift = await currentShift(user);

  if (done === "out") {
    return (
      <Shell>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-field text-brand-bright">
          <CircleCheck className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold uppercase">Shift ended</h1>
        <p className="mt-3 text-sm text-muted">
          Thanks {user.name}. Tap the card again tomorrow to start.
        </p>
      </Shell>
    );
  }

  if (!shift) {
    return (
      <Shell>
        <p className="text-sm uppercase tracking-[0.14em] text-muted">Extra Cabs</p>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase">{user.name}</h1>
        <p className="mt-3 text-sm text-muted">
          You are not signed in for today yet.
        </p>
        <form action={tapStartShiftAction} className="mt-8">
          <input type="hidden" name="token" value={token} />
          <SubmitButton pendingLabel="Starting" className="h-14 w-full justify-center text-base">
            <LogIn className="size-5" aria-hidden />
            Start my shift
          </SubmitButton>
        </form>
      </Shell>
    );
  }

  const workedSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(shift.signedInAt).getTime()) / 1000),
  );

  if (confirm === "end") {
    return (
      <Shell>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-field text-muted">
          <LogOut className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold uppercase">End your shift?</h1>
        <p className="mt-3 text-sm text-muted">
          You have been signed in for {formatDuration(workedSeconds)}. This stops
          the clock for today.
        </p>
        <form action={tapEndShiftAction} className="mt-8">
          <input type="hidden" name="token" value={token} />
          <SubmitButton pendingLabel="Ending" className="h-14 w-full justify-center text-base">
            Yes, end my shift
          </SubmitButton>
        </form>
        <Link
          href={`/tap/${token}`}
          className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-full bg-field px-6 text-sm font-semibold transition-colors hover:bg-field-hover"
        >
          No, keep working
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      {done === "in" ? (
        <p className="mb-4 inline-flex items-center gap-2 bg-field px-4 py-2 text-sm font-medium text-ink">
          <CircleCheck className="size-4 shrink-0 text-brand-bright" aria-hidden />
          Shift started
        </p>
      ) : null}

      <p className="text-sm uppercase tracking-[0.14em] text-muted">Extra Cabs</p>
      <h1 className="mt-2 font-display text-3xl font-bold uppercase">{user.name}</h1>

      <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted">
        <Clock className="size-4 shrink-0" aria-hidden />
        Signed in at {colomboDateTime(shift.signedInAt)}
      </p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">
        {formatDuration(workedSeconds)}
      </p>

      {/* A link, not a form: the first press only asks the question. Nothing
          changes until the confirmation below it is submitted. */}
      <Link
        href={`/tap/${token}?confirm=end`}
        className="mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-semibold text-white transition-colors hover:bg-brand-hover"
      >
        <LogOut className="size-5" aria-hidden />
        End my shift
      </Link>

      <Link
        href="/panel"
        className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-full bg-field px-6 text-sm font-semibold transition-colors hover:bg-field-hover"
      >
        Open the panel
      </Link>
    </Shell>
  );
}
