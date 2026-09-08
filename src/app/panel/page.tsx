import Link from "next/link";
import {
  CalendarCheck,
  CircleAlert,
  KeyRound,
  MessageSquare,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { requireStaff } from "@/lib/panel/guard";
import { readData } from "@/lib/panel/store";
import {
  colomboDate,
  colomboDateTime,
  formatDuration,
  isTimeTracked,
  shiftsForDate,
  whoIsPresent,
} from "@/lib/panel/time";
import { liveRequests, scopeLabel } from "@/lib/panel/window";
import { closeWindowAction } from "./actions";
import { DayTimeline } from "@/components/panel/DayTimeline";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Today" };

export default async function PanelHome() {
  const user = await requireStaff();
  const data = readData();
  const today = colomboDate();

  const nameFor = (staffId: string) =>
    data.staff.find((s) => s.id === staffId)?.name ?? "Unknown";

  // An employee sees only their own hours. The owner sees everyone.
  const allToday = shiftsForDate(today);
  const summaries =
    user.role === "owner"
      ? allToday
      : allToday.filter((s) => s.shift.staffId === user.id);

  const present = whoIsPresent();
  const requests = user.role === "owner" ? liveRequests() : [];

  const pendingBookings = data.bookings.filter((b) => b.status === "pending");
  const openEnquiries = data.enquiries.filter((e) => e.status === "open");

  const confirmedValue = data.bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.amount, 0);

  const flagged = summaries.filter((s) => s.flagged);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="display-md">
          {user.role === "owner" ? "Everything, right now" : `Hello ${user.name}`}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Colombo",
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(new Date())}
          {" in Colombo"}
        </p>
      </div>

      {/* Owner: codes waiting to be read out */}
      {user.role === "owner" && requests.length > 0 ? (
        <section>
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-muted">
            Access requests
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className={
                  "flex flex-wrap items-center justify-between gap-4 p-4 " +
                  (request.status === "awaiting_code"
                    ? "bg-warning/12"
                    : "bg-success/12")
                }
              >
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold uppercase">
                    {nameFor(request.staffId)} wants to{" "}
                    {scopeLabel(request.scope).toLowerCase()}
                    {request.targetSlug ? ` (${request.targetSlug})` : ""}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {request.reason || "No reason given"}
                  </p>
                </div>

                {request.status === "awaiting_code" && request.devCode ? (
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted">
                      Read this out
                    </p>
                    <p className="font-display text-3xl font-bold tracking-[0.2em] text-ink">
                      {request.devCode}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      No SMS yet, so it shows here
                    </p>
                  </div>
                ) : (
                  <form action={closeWindowAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                    >
                      Revoke now
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Numbers */}
      <section className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={ShieldCheck}
          label="Signed in now"
          value={String(present.length)}
          detail={
            present.length > 0
              ? present.map(nameFor).join(", ")
              : "Nobody is present"
          }
        />
        <Stat
          icon={CalendarCheck}
          label="Bookings waiting"
          value={String(pendingBookings.length)}
          detail="Pending confirmation"
          href="/panel/bookings"
        />
        <Stat
          icon={MessageSquare}
          label="Enquiries open"
          value={String(openEnquiries.length)}
          detail="Nobody has replied yet"
          href="/panel/enquiries"
        />
        <Stat
          icon={Wallet}
          label="Booking value"
          value={formatPrice(confirmedValue)}
          detail="Recorded across all live bookings"
        />
      </section>

      {/* The day */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-muted">
            {user.role === "owner" ? "Today, everyone" : "Your day"}
          </h2>
          {flagged.length > 0 && user.role === "owner" ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-bright">
              <CircleAlert className="size-4" aria-hidden />
              {flagged.length} shift{flagged.length === 1 ? "" : "s"} flagged
            </span>
          ) : null}
        </div>

        <div className="mt-4 bg-tile p-4 sm:p-6">
          <DayTimeline summaries={summaries} nameFor={nameFor} />
        </div>

        {/* The owner is not on the timesheet, so say so rather than leaving
            him to wonder why he is missing from his own day. */}
        {!isTimeTracked(user.id) ? (
          <p className="mt-3 max-w-[62ch] text-xs leading-relaxed text-muted">
            You are not on the timesheet. No shift and no presence is recorded
            for your account, which is why you do not appear above.
          </p>
        ) : null}
      </section>

      {/* Employee: how to get write access */}
      {user.role === "employee" ? (
        <section className="bg-tile p-5">
          <h2 className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em]">
            <KeyRound className="size-4 text-brand-bright" aria-hidden />
            Editing the fleet
          </h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            Bookings and enquiries you can handle any time. Adding, editing or
            removing a vehicle needs a code from the owner. Ask from the{" "}
            <Link href="/panel/fleet" className="font-semibold text-brand-bright underline-offset-4 hover:underline">
              fleet screen
            </Link>
            ; the window opens for 45 minutes and then locks itself.
          </p>
        </section>
      ) : null}

      {/* Recent activity */}
      <section>
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-muted">
          Latest activity
        </h2>
        <ul className="mt-4 flex flex-col">
          {data.audit
            .slice(-8)
            .reverse()
            .map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line py-2.5 first:border-t-0"
              >
                <span className="text-sm text-ink-soft">
                  <span className="font-semibold text-ink">
                    {nameFor(entry.staffId)}
                  </span>{" "}
                  {entry.summary}
                </span>
                <span className="text-xs tabular-nums text-muted">
                  {colomboDateTime(entry.at)}
                </span>
              </li>
            ))}
          {data.audit.length === 0 ? (
            <li className="py-3 text-sm text-muted">Nothing has happened yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  detail,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  href?: string;
}) {
  const body = (
    <div className="h-full bg-tile p-5 transition-colors hover:bg-tile-hover">
      <Icon className="size-5 text-brand-bright" />
      <p className="mt-3 text-xs uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      <p className="mt-1 line-clamp-1 text-xs text-muted">{detail}</p>
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
