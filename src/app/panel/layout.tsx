import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  CalendarCheck,
  Car,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Users,
} from "lucide-react";
import { requireStaff } from "@/lib/panel/guard";
import { roleLabel } from "@/lib/panel/auth";
import { HEARTBEAT_SECONDS, currentShift } from "@/lib/panel/time";
import { openWindowFor, pendingRequestFor } from "@/lib/panel/window";
import { readData } from "@/lib/panel/store";
import { Heartbeat } from "@/components/panel/Heartbeat";
import { ShiftClock } from "@/components/panel/ShiftClock";
import { WindowBanner } from "@/components/panel/WindowBanner";
import { signOutAction } from "./actions";

export const metadata: Metadata = {
  title: { default: "Control room", template: "%s | Extra Cabs control" },
  robots: { index: false, follow: false },
};

/** The panel is live data. Never serve a cached shell. */
export const dynamic = "force-dynamic";

const nav = [
  { href: "/panel", label: "Today", icon: LayoutDashboard, ownerOnly: false },
  { href: "/panel/bookings", label: "Bookings", icon: CalendarCheck, ownerOnly: false },
  { href: "/panel/fleet", label: "Fleet", icon: Car, ownerOnly: false },
  { href: "/panel/enquiries", label: "Enquiries", icon: MessageSquare, ownerOnly: false },
  { href: "/panel/team", label: "Team", icon: Users, ownerOnly: true },
  { href: "/panel/activity", label: "Activity", icon: Activity, ownerOnly: false },
];

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();

  // Always null for the owner, who is not on a timesheet, so neither the
  // running clock nor the heartbeat mounts for him and his tab proves nothing.
  // The rule lives in tracksTime() in lib/panel/time.ts, not here.
  const shift = currentShift(user.id);
  const openWindow = openWindowFor(user.id);
  const pending = pendingRequestFor(user.id);

  const data = readData();
  const pendingBookings = data.bookings.filter((b) => b.status === "pending").length;
  const openEnquiries = data.enquiries.filter((e) => e.status === "open").length;

  const links = nav.filter((item) => !item.ownerOnly || user.role === "owner");

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="shell flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-bold uppercase tracking-tight text-brand">
              Extra Cabs
            </span>
            <span className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Control
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {shift ? <ShiftClock signedInAt={shift.signedInAt} /> : null}
            {shift ? <Heartbeat intervalSeconds={HEARTBEAT_SECONDS} /> : null}

            <span className="text-sm text-ink-soft">
              {user.name}
              <span className="ml-2 text-xs uppercase tracking-[0.12em] text-muted">
                {roleLabel(user.role)}
              </span>
            </span>

            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-field px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-field-hover"
              >
                <LogOut className="size-3.5" aria-hidden />
                Sign out
              </button>
            </form>
          </div>
        </div>

        <nav className="shell flex gap-1 overflow-x-auto pb-2 no-scrollbar">
          {links.map((item) => {
            const badge =
              item.href === "/panel/bookings"
                ? pendingBookings
                : item.href === "/panel/enquiries"
                  ? openEnquiries
                  : 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-field hover:text-ink"
              >
                <item.icon className="size-4 text-muted" aria-hidden />
                {item.label}
                {badge > 0 ? (
                  <span className="rounded-full bg-brand px-1.5 text-xs font-bold text-white">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </header>

      <WindowBanner openWindow={openWindow} pending={pending} role={user.role} />

      <main className="shell py-8">{children}</main>
    </div>
  );
}
