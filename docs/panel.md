# The internal platform, as built

Phase 1 to 3 of [`internal-platform-plan.md`](./internal-platform-plan.md),
running against a local store instead of Supabase. No SMS.

Sign in at **`/999p7k`**.

---

## Test accounts

Development only. Defined in `TEST_ACCOUNTS` in `src/lib/panel/store.ts`,
hashed with scrypt on first run so the store never holds plaintext.

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@extracabs.lk` | `owner1234` |
| Employee | `kasun@extracabs.lk` | `kasun1234` |
| Employee | `nuwan@extracabs.lk` | `nuwan1234` |

**Delete that block before this is reachable by anyone else.**

---

## What is there

| Screen | Who | What it does |
| --- | --- | --- |
| `/panel` | Both | Live presence, today's timelines, counts, latest activity. The owner also sees access requests with the code to read out. |
| `/panel/bookings` | Both | Confirm, cancel, start and end hires. Record cash or bank payment. |
| `/panel/fleet` | Both | Mark booked or free, add, edit, remove, restore. Employees ask for a window from here. |
| `/panel/fleet/[slug]` | Both | Edit one vehicle. Fields are locked for employees without a window. |
| `/panel/enquiries` | Both | Shared inbox with threaded replies. |
| `/panel/team` | Owner | Staff accounts, one-time passwords, timesheets, lifetime totals. |
| `/panel/activity` | Both | Audit log. Employees see only their own. |

---

## The three things the plan cares about

### 1. Booked means gone, not badged

Marking a vehicle booked, or confirming a booking on it, sets
`available: false`. `publicCars()` in `src/lib/fleet.ts` filters those out
entirely, so **a customer does not see it in the list at all**. Staff still see
it, labelled "Booked, hidden". Removing a vehicle is a soft delete: hidden
everywhere, restorable from Show removed.

`src/lib/data/cars.ts` is never rewritten. Panel edits are stored as overrides
layered on top, which is why the catalogue file stays a clean seam for the
database later.

### 2. The write window

An employee can handle bookings and enquiries any time. Adding, editing or
removing a vehicle needs a code:

1. Employee picks a scope and a reason on the fleet screen.
2. A six digit code is generated, HMAC hashed with a pepper, and stored.
   **There is no SMS yet, so it appears on the owner's dashboard** for him to
   read out. `devCode` in `src/lib/panel/types.ts` is the only part that
   changes when Text.lk is wired.
3. The employee types it in. The window opens for 45 minutes with a countdown.
4. Finish and lock, or it expires, or the owner revokes it.

Enforced in `assertCanWrite()` in `src/lib/panel/guard.ts`, which re-reads the
window from the store on every mutation. The disabled fields in the UI are a
courtesy; the guard is the control.

Proven by self-test: wrong code refused, another employee's code refused and
logged, code destroyed on use, cannot be reused, a fleet window does not unlock
pricing, a window on one vehicle does not unlock another, and closing relocks.

### 3. Claimed against proven

Signing in starts the shift. A heartbeat every 20 seconds records presence; the
server writes its own clock, never the browser's, so stopping the beats can
only ever record less time, never more.

A segment with no beat for 90 seconds is closed **at its last heartbeat**, not
at the moment it was noticed. That is what keeps the number honest.

The plan uses `pg_cron` every minute. There is no scheduler here, so
`sweepStalePresence()` runs lazily on any authenticated read. Same recorded
result, different trigger.

A shift with no sign out keeps `signedOutAt: null` and falls back to the last
proven heartbeat. Coverage is proven over claimed; under 60%, or one gap over
two hours, flags the shift.

---

## Where things live

```
src/lib/panel/types.ts    domain types
src/lib/panel/store.ts    JSON store, scrypt, TEST_ACCOUNTS
src/lib/panel/auth.ts     HMAC session cookie, sign-in
src/lib/panel/guard.ts    requireStaff / requireOwner / assertCanWrite
src/lib/panel/time.ts     shifts, presence, sweeper, coverage
src/lib/panel/window.ts   OTP lifecycle
src/lib/fleet.ts          catalogue + overrides, public vs staff views
src/proxy.ts              cookie check on /panel (NOT middleware.ts)
src/app/999p7k/           sign in
src/app/panel/            the screens
src/app/panel/actions.ts  every mutation
src/app/api/panel/        heartbeat, away
```

Data lives in `.data/panel.json`, gitignored. Delete it to reset.

---

## Two caching traps, both already hit

Panel edits were saving to the store but never showing on the website. Two
separate causes, and fixing only one of them looked like no fix at all.

### 1. The store was cached per bundle

Next compiles pages, route handlers and server actions into **separate server
bundles**, and each gets its own instance of every module. `store.ts` cached
the parsed JSON in a module-level variable, so the public page held a copy from
its first request and never saw anything the panel wrote afterwards.

`load()` now reads the file on every call. The in-memory copy is only a
fallback for when the disk cannot be written. A JSON parse per read is nothing
at this scale, and it removes the whole class of bug.

### 2. The public pages were prerendered at build

`/`, `/fleet`, `/fleet/[slug]` and `/booking` were static, baked at build time
from whatever the store held then. **`revalidatePath` did not help**: all three
forms were tried, including the concrete path, and none of them busted fully
static build output.

The public readers in `src/lib/fleet.ts` now call `await connection()`, which
is exactly the case the Next docs describe for synchronous database reads
completing during prerendering. Any page reading live fleet data becomes
request-time automatically, including pages added later. It is there rather
than `export const dynamic` on six routes, which is six chances to forget.

`publicCarSlugs()` deliberately does NOT call it: `generateStaticParams` and
the sitemap run at build, where there is no request to wait for.

`/about`, `/contact`, `/faq`, `/terms` and `/privacy` read no fleet data and
are still static.

---

## Known limits

- **The store is a scaffold.** One JSON file, no transactions, no concurrency
  control. Fine for three users on one process; it is the guarantee that
  improves when this becomes Postgres.
- **On Vercel the writes fall back to memory** and reset on redeploy. The
  filesystem is read only there. This is meant to be run locally for now.
- **No SMS and no WhatsApp.** The OTP is shown on the owner's screen.
- **Sessions are not revocable** beyond the 12 hour expiry, because there is no
  session table yet.
- **Only some specs are editable.** Name, seats, doors, the four prices and the
  home-page flag. Luggage, transmission, fuel and engine size are set when a
  vehicle is created but cannot be changed afterwards, and luggage is still
  fixed at 2 on create. They show on the public vehicle page, so they are the
  same gap doors had.
- **Photo upload is not built.** Vehicles added in the panel reuse the three
  stock photos. `fleet.photos` exists as a scope with nothing behind it.
- **Break-glass access is not built.** If the owner is unreachable the employee
  is blocked, which is the open decision in HANDOVER section 7c.
- **A booked vehicle 404s its own detail page.** It leaves the list, the
  sitemap and the related-vehicle rails, and `/fleet/<slug>` returns 404 until
  it is free again. That is stricter than "cannot see it in the list", and it
  means a URL Google has indexed goes 404 for the length of a hire. Worth a
  decision: the alternative is to keep the page reachable and show "currently
  on hire" while still hiding it from every list.
