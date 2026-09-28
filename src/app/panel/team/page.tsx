import { CircleAlert, KeyRound, MessageSquare, Nfc, UserPlus } from "lucide-react";
import { requireOwner } from "@/lib/panel/guard";
import { cookies } from "next/headers";
import {
  allShifts,
  countAudit,
  listSmsMessages,
  listStaff,
  segmentsForShifts,
} from "@/lib/panel/db";
import {
  colomboDate,
  colomboDateTime,
  formatDuration,
  shiftsForDate,
  summariseShift,
} from "@/lib/panel/time";
import { displayMsisdn, smsConfig, toMsisdn } from "@/lib/sms/textlk";
import { DayTimeline } from "@/components/panel/DayTimeline";
import { SubmitButton } from "@/components/panel/SubmitButton";
import { CODE_TTL_MINUTES, openWindowForScope, pendingRequestFor } from "@/lib/panel/window";
import { listCards, tapUrl } from "@/lib/panel/tap";
import {
  createTapCardAction,
  setTapCardActiveAction,
  createStaffAction,
  dismissOneTimePasswordAction,
  redeemCodeAction,
  requestPasswordResetAction,
  resetStaffPasswordAction,
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
  searchParams: Promise<{ error?: string; date?: string }>;
}) {
  const { error, date } = await searchParams;
  const user = await requireOwner();

  const day = date ?? colomboDate();
  const [staff, summaries, shifts, recentMessages] = await Promise.all([
    listStaff(),
    shiftsForDate(day),
    allShifts(),
    listSmsMessages(8),
  ]);
  const presence = await segmentsForShifts(shifts.map((s) => s.id));

  const nameFor = (staffId: string) =>
    staff.find((s) => s.id === staffId)?.name ?? "Unknown";

  // The account just created, with its one-time password, from a short-lived
  // httpOnly cookie set by createStaffAction. Never from the database, where
  // the password is not kept, and never from the URL.
  const justCreated = readNewStaff((await cookies()).get(NEW_STAFF_COOKIE)?.value);

  // Where the owner is in a password reset, if anywhere. Two steps: a code
  // texted to him, then the reset itself.
  const employees = staff.filter((person) => person.role !== "owner" && person.active);
  const pending = await pendingRequestFor(user.id);
  const resetPending = pending?.scope === "staff.password" ? pending : null;
  const resetOpen = resetPending
    ? null
    : (await Promise.all(
        employees.map((person) => openWindowForScope(user.id, "staff.password", person.id)),
      )).find((request) => request !== null) ?? null;
  const ownerCanBeTexted = toMsisdn(user.phone ?? "") !== null;

  const cards = await listCards();

  // Booking alerts. Everyone is listed, the owner included: this is a
  // notification, not the timesheet, so the owner/employee split does not
  // apply here. See notify.ts.
  const { ready: smsReady } = smsConfig();
  const alertCount = staff.filter(
    (s) => s.active && s.smsAlerts !== false && toMsisdn(s.phone ?? "") !== null,
  ).length;

  // Lifetime totals per person, so the owner has more than one day to look at.
  // Employees only: the owner keeps no shift and no presence record, so he has
  // no row here. See isTimeTracked() in lib/panel/time.ts.
  const totals = await Promise.all(
    staff
      .filter((person) => person.role !== "owner")
      .map(async (person) => {
        const theirs = shifts.filter((s) => s.staffId === person.id);
        const summed = theirs.map((s) => summariseShift(s, presence));

        const claimed = summed.reduce((n, s) => n + s.claimedSeconds, 0);
        const present = summed.reduce((n, s) => n + s.presentSeconds, 0);
        const [replies, bookingsHandled, fleetEdits] = await Promise.all([
          countAudit({ staffId: person.id, action: "enquiry.replied" }),
          countAudit({ staffId: person.id, entity: "booking" }),
          countAudit({ staffId: person.id, entity: "vehicle" }),
        ]);

        return {
          staff: person,
          shifts: theirs.length,
          claimed,
          present,
          coverage: claimed > 0 ? Math.round((present / claimed) * 100) : 0,
          flagged: summed.filter((s) => s.flagged).length,
          replies,
          bookingsHandled,
          fleetEdits,
        };
      }),
  );

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

      {justCreated ? (
        <section className="bg-warning/12 p-5">
          <h2 className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-warning">
            <KeyRound className="size-4" aria-hidden />
            Copy this now
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            One-time password for {justCreated.name} ({justCreated.email}). It is
            shown once.{" "}
            {justCreated.reset
              ? "If you close this without copying it, reset the password again."
              : "If you close this without copying it, delete the account and make another."}
          </p>
          <p className="mt-3 font-display text-3xl font-bold tracking-[0.15em] text-ink">
            {justCreated.password}
          </p>
          <form action={dismissOneTimePasswordAction} className="mt-4">
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

      {/* Resetting a password. Two steps, because a reset hands over the
          ability to sign in as that employee, so it is confirmed with a code
          to the owner's own mobile rather than being one button. */}
      <section className="bg-tile p-5">
        <h2 className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em]">
          <KeyRound className="size-4 text-brand-bright" aria-hidden />
          Reset a password
        </h2>

        {resetOpen ? (
          <>
            <p className="mt-2 max-w-[70ch] text-sm text-muted">
              Code confirmed. Issue the new password for{" "}
              <strong className="text-ink">{nameFor(resetOpen.targetSlug ?? "")}</strong>. It is
              shown once, here, and you read it out to them.
            </p>
            <form action={resetStaffPasswordAction} className="mt-4">
              <input type="hidden" name="staffId" value={resetOpen.targetSlug ?? ""} />
              <SubmitButton pendingLabel="Setting the password">
                Set a new password
              </SubmitButton>
            </form>
          </>
        ) : resetPending ? (
          <>
            <p className="mt-2 max-w-[70ch] text-sm text-muted">
              A code was sent to your mobile for{" "}
              <strong className="text-ink">{nameFor(resetPending.targetSlug ?? "")}</strong>. Type
              it in to confirm. It is good for {CODE_TTL_MINUTES} minutes.
            </p>
            <form action={redeemCodeAction} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="requestId" value={resetPending.id} />
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.12em] text-muted">
                  The code from your phone
                </span>
                <input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  className="h-11 w-40 bg-field px-4 font-display text-lg tracking-[0.3em] text-ink"
                />
              </label>
              <SubmitButton pendingLabel="Checking">Confirm</SubmitButton>
            </form>
          </>
        ) : employees.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No employee accounts yet. Add one above.
          </p>
        ) : (
          <>
            <p className="mt-2 max-w-[70ch] text-sm text-muted">
              For an employee who has forgotten their password. A code goes to your
              own mobile first, so nobody who finds this screen open can do it.
            </p>
            <form
              action={requestPasswordResetAction}
              className="mt-4 flex flex-wrap items-end gap-3"
            >
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.12em] text-muted">
                  Whose password
                </span>
                <select
                  name="staffId"
                  required
                  className="h-11 min-w-56 bg-field px-4 text-sm text-ink"
                >
                  {employees.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </label>
              <SubmitButton pendingLabel="Sending the code">
                Send a code to my mobile
              </SubmitButton>
            </form>
            {!ownerCanBeTexted ? (
              <p className="mt-3 text-sm text-warning">
                Your own mobile number is not saved below, so the code cannot be
                texted. It will still appear on your dashboard.
              </p>
            ) : null}
          </>
        )}
      </section>

      {/* The card at the desk. It carries no identity: whoever taps it is
          identified by the session on their own phone. */}
      <section className="bg-tile p-5">
        <h2 className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em]">
          <Nfc className="size-4 text-brand-bright" aria-hidden />
          Tap card at the desk
        </h2>
        <p className="mt-2 max-w-[70ch] text-sm text-muted">
          Stick the card to the desk. An employee taps their own phone on it to
          start and end their shift, and ending always asks first. The card
          holds no name: it says where the tap happened, and their phone says
          who they are, so it only works for somebody already signed in.
        </p>

        {cards.length === 0 ? (
          <form action={createTapCardAction} className="mt-5 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted">
                What to call it
              </span>
              <input
                name="label"
                defaultValue="Front desk"
                maxLength={60}
                className="h-11 min-w-56 bg-field px-4 text-sm text-ink"
              />
            </label>
            <SubmitButton pendingLabel="Creating">Create a card</SubmitButton>
          </form>
        ) : (
          <ul className="mt-5 flex flex-col gap-4">
            {cards.map((card) => (
              <li key={card.id} className="bg-field p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-display text-base font-bold uppercase">
                    {card.label}
                  </span>
                  <span className="text-xs text-muted">
                    {card.active ? "In use" : "Turned off"}
                    {card.lastTapAt
                      ? `, last tapped ${colomboDateTime(card.lastTapAt)}`
                      : ", never tapped"}
                  </span>
                </div>

                <p className="mt-3 text-xs uppercase tracking-[0.12em] text-muted">
                  Write this onto the tag
                </p>
                {/* Selectable and wrapping: it gets copied into an NFC writing
                    app on a phone, so it has to survive being read off a small
                    screen. */}
                <p className="mt-1 break-all font-mono text-sm text-ink">{tapUrl(card.token)}</p>

                <form action={setTapCardActiveAction} className="mt-4">
                  <input type="hidden" name="id" value={card.id} />
                  <input type="hidden" name="active" value={card.active ? "false" : "true"} />
                  <button
                    type="submit"
                    className="rounded-full bg-field-hover px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-brand hover:text-white"
                  >
                    {card.active ? "Turn this card off" : "Turn it back on"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 text-sm text-muted">
          <p className="font-semibold text-ink-soft">Writing the tag</p>
          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5">
            <li>Buy an NTAG213 sticker or card. Any NFC tag sold for phones works.</li>
            <li>
              Install an NFC writing app on an Android phone (NFC Tools is the
              usual one) and choose to write a URL record.
            </li>
            <li>Paste the address above, write it, then lock the tag if the app offers to.</li>
            <li>Stick it where both of them can reach it, and test one tap.</li>
          </ol>
          <p className="mt-3">
            iPhones from the XS read it with no app at all: a banner drops down
            and opens the page. Android is the same. Nobody has to install
            anything to use it, only to write it once.
          </p>
        </div>
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
          {staff.map((staff) => {
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

/** Must match createStaffAction in ../actions.ts. */
const NEW_STAFF_COOKIE = "ec_new_staff";

function readNewStaff(
  raw: string | undefined,
): { id: string; name: string; email: string; password: string; reset: boolean } | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    return typeof value.password === "string" && typeof value.name === "string"
      ? {
          id: String(value.id ?? ""),
          name: value.name,
          email: String(value.email ?? ""),
          password: value.password,
          // Set by resetStaffPasswordAction, so the advice below fits what
          // just happened: a lost password on a reset is resettable again.
          reset: value.reset === true,
        }
      : null;
  } catch {
    return null;
  }
}
