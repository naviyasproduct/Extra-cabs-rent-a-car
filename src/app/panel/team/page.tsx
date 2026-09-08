import { CircleAlert, KeyRound, MessageSquare, UserPlus } from "lucide-react";
import { requireOwner } from "@/lib/panel/guard";
import { readData } from "@/lib/panel/store";
import {
  colomboDate,
  colomboDateTime,
  formatDuration,
  shiftsForDate,
  summariseShift,
} from "@/lib/panel/time";
import { displayMsisdn, smsConfig, toMsisdn } from "@/lib/sms/textlk";
import { DayTimeline } from "@/components/panel/DayTimeline";
import {
  createStaffAction,
  dismissOneTimePasswordAction,
  sendTestSmsAction,
  setStaffActiveAction,
  setStaffAlertsAction,
  setStaffPhoneAction,
} from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team" };

/**
 * Owner only. Staff accounts, and what everyone actually worked.
 *
 * The one-time password is shown once, here, at the moment the account is
 * created. That is the flow the client chose: the owner reads it out and the
 * employee changes it later. See HANDOVER section 6.
 */
export default async function PanelTeam({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; date?: string }>;
}) {
  const { error, created, date } = await searchParams;
  await requireOwner();

  const data = readData();
  const day = date ?? colomboDate();
  const summaries = shiftsForDate(day);

  const nameFor = (staffId: string) =>
    data.staff.find((s) => s.id === staffId)?.name ?? "Unknown";

  const justCreated = created
    ? data.staff.find((s) => s.id === created)
    : undefined;

  // Booking alerts. Everyone is listed, the owner included: this is a
  // notification, not the timesheet, so the owner/employee split does not
  // apply here. See notify.ts.
  const { ready: smsReady } = smsConfig();
  const recentMessages = (data.messages ?? []).slice(0, 8);
  const alertCount = data.staff.filter(
    (s) => s.active && s.smsAlerts !== false && toMsisdn(s.phone ?? "") !== null,
  ).length;

  // Lifetime totals per person, so the owner has more than one day to look at.
  // Employees only: the owner keeps no shift and no presence record, so he has
  // no row here. See tracksTime() in lib/panel/time.ts.
  const totals = data.staff
    .filter((staff) => staff.role !== "owner")
    .map((staff) => {
      const shifts = data.shifts.filter((s) => s.staffId === staff.id);
      const summed = shifts.map((s) => summariseShift(s, data.presence));

      const claimed = summed.reduce((n, s) => n + s.claimedSeconds, 0);
      const present = summed.reduce((n, s) => n + s.presentSeconds, 0);
      const replies = data.audit.filter(
        (a) => a.staffId === staff.id && a.action === "enquiry.replied",
      ).length;
      const bookingsHandled = data.audit.filter(
        (a) => a.staffId === staff.id && a.entity === "booking",
      ).length;
      const fleetEdits = data.audit.filter(
        (a) => a.staffId === staff.id && a.entity === "vehicle",
      ).length;

      return {
        staff,
        shifts: shifts.length,
        claimed,
        present,
        coverage: claimed > 0 ? Math.round((present / claimed) * 100) : 0,
        flagged: summed.filter((s) => s.flagged).length,
        replies,
        bookingsHandled,
        fleetEdits,
      };
    });

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="display-md">Team</h1>
        <p className="mt-2 max-w-[62ch] text-sm text-muted">
          Claimed is what they signed in for. Present is what the panel could
          prove. Coverage is the second divided by the first. Employees only:
          your own account is not timed and does not appear below.
        </p>
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 bg-brand-tint px-4 py-3 text-sm font-medium text-brand-bright">
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      {justCreated?.oneTimePassword ? (
        <section className="bg-warning/12 p-5">
          <h2 className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-warning">
            <KeyRound className="size-4" aria-hidden />
            Copy this now
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            One-time password for {justCreated.name} ({justCreated.email}). It is
            shown once. If you close this without copying it, delete the account
            and make another.
          </p>
          <p className="mt-3 font-display text-3xl font-bold tracking-[0.15em] text-ink">
            {justCreated.oneTimePassword}
          </p>
          <form action={dismissOneTimePasswordAction} className="mt-4">
            <input type="hidden" name="id" value={justCreated.id} />
            <button
              type="submit"
              className="rounded-full bg-field px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-field-hover"
            >
              I have written it down
            </button>
          </form>
        </section>
      ) : null}

      {/* Today */}
      <section>
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-muted">
          {day}
        </h2>
        <div className="mt-4 bg-tile p-4 sm:p-6">
          <DayTimeline summaries={summaries} nameFor={nameFor} />
        </div>
      </section>

      {/* Totals */}
      <section className="overflow-x-auto">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-muted">
          Since the beginning
        </h2>
        <table className="mt-4 w-full min-w-[48rem] border-collapse text-sm">
          <thead>
            <tr className="text-left">
              {["Person", "Shifts", "Claimed", "Present", "Coverage", "Flagged", "Replies", "Bookings", "Fleet edits", ""].map((h) => (
                <th
                  key={h}
                  className="border-b border-line pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {totals.map((row) => (
              <tr key={row.staff.id} className="border-b border-line-strong/30">
                <td className="py-3 pr-4">
                  <p className="font-display text-base font-bold uppercase">
                    {row.staff.name}
                  </p>
                  <p className="text-xs text-muted">
                    {row.staff.email} · {row.staff.role}
                    {row.staff.active ? "" : " · disabled"}
                  </p>
                </td>
                <td className="py-3 pr-4 tabular-nums">{row.shifts}</td>
                <td className="py-3 pr-4 tabular-nums">{formatDuration(row.claimed)}</td>
                <td className="py-3 pr-4 tabular-nums">{formatDuration(row.present)}</td>
                <td className="py-3 pr-4">
                  <span
                    className={
                      "font-display text-base font-bold tabular-nums " +
                      (row.shifts === 0
                        ? "text-muted"
                        : row.coverage < 60
                          ? "text-brand-bright"
                          : "text-success")
                    }
                  >
                    {row.shifts === 0 ? "-" : `${row.coverage}%`}
                  </span>
                </td>
                <td className="py-3 pr-4 tabular-nums">{row.flagged}</td>
                <td className="py-3 pr-4 tabular-nums">{row.replies}</td>
                <td className="py-3 pr-4 tabular-nums">{row.bookingsHandled}</td>
                <td className="py-3 pr-4 tabular-nums">{row.fleetEdits}</td>
                <td className="py-3 text-right">
                  {row.staff.role !== "owner" ? (
                    <form action={setStaffActiveAction}>
                      <input type="hidden" name="id" value={row.staff.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={row.staff.active ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="rounded-full bg-field px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-field-hover"
                      >
                        {row.staff.active ? "Disable" : "Enable"}
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Who gets told about a booking */}
      <section className="bg-tile p-5">
        <h2 className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em]">
          <MessageSquare className="size-4 text-brand-bright" aria-hidden />
          Booking alerts by SMS
        </h2>
        <p className="mt-2 max-w-[64ch] text-sm text-muted">
          Every booking taken on the website sends one text to everyone below,
          you included. Sri Lankan mobiles only, in any of these forms: 077 123
          4567, 0771234567 or +94 77 123 4567. Clear the box to stop texting
          someone.
        </p>

        {!smsReady ? (
          <p className="mt-4 bg-warning/12 px-4 py-3 text-sm text-warning">
            The Text.lk gateway is not configured, so no text has actually left
            the building. Set TEXTLK_API_TOKEN and TEXTLK_SENDER_ID, then
            restart. Until then every message is written to the server log and
            recorded below as skipped.
          </p>
        ) : alertCount === 0 ? (
          <p className="mt-4 bg-warning/12 px-4 py-3 text-sm text-warning">
            Nobody has a number saved, so bookings are arriving silently. Add at
            least your own.
          </p>
        ) : null}

        <ul className="mt-4 flex flex-col">
          {data.staff.map((staff) => {
            const msisdn = toMsisdn(staff.phone ?? "");
            const on = staff.active && staff.smsAlerts !== false && msisdn !== null;

            return (
              <li
                key={staff.id}
                className="flex flex-wrap items-end gap-3 border-t border-line py-4 first:border-t-0"
              >
                <div className="min-w-[10rem] flex-1">
                  <p className="font-display text-base font-bold uppercase">
                    {staff.name}
                  </p>
                  <p className="text-xs text-muted">
                    {staff.role}
                    {staff.active ? "" : " · disabled"}
                    {msisdn ? ` · ${displayMsisdn(msisdn)}` : " · no number"}
                  </p>
                </div>

                <form action={setStaffPhoneAction} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={staff.id} />
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted">
                      Mobile
                    </span>
                    <input
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="off"
                      defaultValue={staff.phone ?? ""}
                      placeholder="077 123 4567"
                      className="h-11 w-44 bg-field px-3 text-sm text-ink"
                    />
                  </label>
                  <button
                    type="submit"
                    className="h-11 rounded-full bg-field px-4 text-sm font-semibold transition-colors hover:bg-field-hover"
                  >
                    Save
                  </button>
                </form>

                <form action={setStaffAlertsAction}>
                  <input type="hidden" name="id" value={staff.id} />
                  <input
                    type="hidden"
                    name="on"
                    value={staff.smsAlerts === false ? "true" : "false"}
                  />
                  <button
                    type="submit"
                    className="h-11 rounded-full bg-field px-4 text-sm font-semibold transition-colors hover:bg-field-hover"
                  >
                    {staff.smsAlerts === false ? "Turn alerts on" : "Turn alerts off"}
                  </button>
                </form>

                <form action={sendTestSmsAction}>
                  <input type="hidden" name="id" value={staff.id} />
                  <button
                    type="submit"
                    disabled={msisdn === null}
                    className="h-11 rounded-full bg-field px-4 text-sm font-semibold transition-colors hover:bg-field-hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Send a test
                  </button>
                </form>

                <span
                  className={
                    "text-xs font-semibold uppercase tracking-[0.12em] " +
                    (on ? "text-success" : "text-muted")
                  }
                >
                  {on ? "Will be texted" : "Will not be texted"}
                </span>
              </li>
            );
          })}
        </ul>

        {recentMessages.length > 0 ? (
          <div className="mt-6 border-t border-line pt-4">
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Last messages sent
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {recentMessages.map((message) => (
                <li
                  key={message.id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs"
                >
                  <span className="tabular-nums text-muted">
                    {colomboDateTime(message.at)}
                  </span>
                  <span className="text-ink-soft">
                    {nameFor(message.staffId ?? "")} · {displayMsisdn(message.to)}
                  </span>
                  <span
                    className={
                      "font-semibold uppercase tracking-[0.12em] " +
                      (message.status === "sent"
                        ? "text-success"
                        : message.status === "failed"
                          ? "text-brand-bright"
                          : "text-muted")
                    }
                  >
                    {message.status}
                  </span>
                  {message.segments > 1 ? (
                    <span className="text-muted">{message.segments} segments</span>
                  ) : null}
                  {message.error ? (
                    <span className="text-brand-bright">{message.error}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* Add someone */}
      <section className="bg-tile p-5">
        <h2 className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em]">
          <UserPlus className="size-4 text-brand-bright" aria-hidden />
          Add an employee
        </h2>
        <p className="mt-2 max-w-[60ch] text-sm text-muted">
          A one-time password is generated and shown once on this screen. There
          is no email yet, so hand it over in person.
        </p>
        <form
          action={createStaffAction}
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.12em] text-muted">Name</span>
            <input
              name="name"
              required
              className="h-11 bg-field px-3 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.12em] text-muted">Email</span>
            <input
              name="email"
              type="email"
              required
              className="h-11 bg-field px-3 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.12em] text-muted">
              Mobile for alerts
            </span>
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="077 123 4567"
              className="h-11 bg-field px-3 text-sm text-ink"
            />
          </label>
          <button
            type="submit"
            className="h-11 self-end rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Create account
          </button>
        </form>
      </section>
    </div>
  );
}
