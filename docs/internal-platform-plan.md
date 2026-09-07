# Internal platform - build plan

The staff side of the Extra Cabs site. One owner, two employees, ~40 vehicles.

Context and stack decisions: [`HANDOVER.md`](./HANDOVER.md).
Status: **planned, not started.**

---

## 1. Shape

One codebase, two front doors. The public site stays where it is; the staff
platform lives in the same Next.js app under `/panel`, sharing the same design
tokens, components and database. Customers never see a link to it.

Two apps would mean two deployments, two sets of env vars, and a
synchronisation problem that does not need to exist for a 40-car fleet.

### Three things have to be right

Everything else is ordinary CRUD. These are where the project quietly fails:

1. **The timesheet must be honest.** The owner needs to distinguish a worked day
   from a signed-in day.
2. **The lock must not be bypassable.** Hiding a Delete button is not a lock.
   The check sits next to the data, where a crafted request cannot route around it.
3. **The messages must arrive.** The owner rarely signs in. A silently dropped
   notification means the oversight model is gone and nobody notices for a month.

---

## 2. Roles

| Capability | Employee | Owner |
| --- | --- | --- |
| View bookings, fleet, enquiries | Always | Always |
| Confirm/cancel a booking, reply to an enquiry | Always | Always |
| Add, edit, remove a vehicle | **Window only** | Always |
| Upload or delete vehicle photos | **Window only** | Always |
| Change pricing or deposit | **Window only** | Always |
| Delete a booking record | **Window only** | Always |
| See time logs and reports | Own only | Everyone |
| Approve requests, revoke windows, manage staff | Never | Always |

Employees can see their own hours. That matters for trust and removes a class of
dispute before it starts. They cannot see each other's figures or income reports.

---

## 3. The timesheet

**Two records per day: what the employee claims, and what the system can prove.**

There is a Sign in button and a Sign out button, and the employee presses both.
That is the **claim**. Underneath, the panel records every stretch of time it
could prove someone was present. That is the **evidence**.

Keeping these separate is the whole design. One number can be argued with; two
numbers side by side cannot.

### The day the owner sees

One row per employee, sign-in to sign-out, with proven presence drawn solid and
gaps drawn hollow:

```
                08:00    10:00    12:00    14:00    16:00    18:00
                  |        |        |        |        |        |
Kasun    ████████████████████████░░░░░░████████████████████         91%  worked
         08:04                    12:30  13:15              17:04

Nuwan    █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░█        3%  FLAGGED
         08:11 (8 min)                                   16:52 (6 min) 16:58

         █ proven present    ░ signed in, not there
```

Nuwan's row is the case the owner described: signed in at 8:11, laptop closed
eight minutes later, reopened at 16:52 to sign out at 16:58. His timesheet
claims 8h 47m. The evidence is 14 minutes.

The panel does not accuse anyone. It draws the day and lets the owner ask.

### How the evidence is gathered

- While the panel is open it sends a heartbeat every **20 seconds**.
- The server writes **its own clock** into `last_heartbeat_at` - never the
  browser's, which can be wrong or deliberately changed.
- A `pg_cron` job runs every minute inside Supabase and closes any presence
  segment whose last heartbeat is more than **90 seconds** old (three missed beats).
- **The segment is recorded as ending at `last_heartbeat_at`**, the last moment
  presence was proven - not at the moment the sweeper noticed. A lid closed at
  16:41:03 is recorded as 16:41:03 even though the job ran at 16:42:33.

Reopening the laptop does **not** start a new shift - the sign-in is still
standing. It opens a **new presence segment** inside the same day, which is what
puts the gap on the chart instead of hiding it.

### What a gap can and cannot tell us

| Signal | Meaning | Label |
| --- | --- | --- |
| `visibilitychange` | Tab switched away or minimised; panel still loaded | Tab hidden |
| `pagehide` + `sendBeacon` | Browser/tab deliberately closed | Browser closed |
| Heartbeat simply stops | Lid closed, sleep, network drop, or crash - **these genuinely cannot be told apart server-side** | Went offline |
| No input 5 min, tab open | Present but not working | Idle |

Label them honestly. Do not guess between lid-close and network loss.

### Three numbers, not one

- **Claimed** - `signed_out_at − signed_in_at`. What the employee asserts.
- **Present** - sum of proven segments. What the system witnessed.
- **Active** - present minus idle.

**Coverage = present ÷ claimed.** This is the figure for the daily digest. Any
shift under 60% coverage, or with a single gap over 2 hours, is flagged
automatically and named in the 8pm message - so a day like Nuwan's surfaces that
evening, not at month end.

### Sign-outs that never happen

If someone goes home without pressing Sign out, the shift closes at 23:59 with
`end_reason = shift_expiry` and **`signed_out_at` left null**, because we do not
know when they left. The report shows it unclosed and falls back to the last
proven heartbeat. Guessing a sign-out time would be the one dishonest thing this
system could do.

### Be straight with everyone about the limits

- Accuracy is **±20 seconds** on an ungraceful exit (the heartbeat interval). A
  pressed Sign out button is exact.
- The system **cannot see work done away from the panel** - a phone call with a
  customer, a car handed over in the yard. Coverage is a strong signal, not a
  verdict.
- Describe it to the employees that way from day one, so it reads as
  transparency rather than surveillance.

---

## 4. The write window

**One OTP opens a scoped, time-boxed window - not a single edit.**

Asking for an OTP on every save falls apart on contact with the work: adding one
vehicle means a record, eight photos, a price table and a feature list. Nobody
phones the boss twelve times to list a Suzuki Alto.

Instead the code opens a **window**: permission to do a named kind of work, for
a limited time, which then closes on its own. This is what the owner described -
he lets them in, they do the job, afterwards they cannot touch it.

### Lifecycle

```
LOCKED
  │  employee picks a scope + writes a one-line reason
  ▼
AWAITING CODE          6-digit code → owner's phone by SMS (Text.lk)
  │                    valid 10 min · 5 wrong attempts burns it
  │  owner reads the code out · employee types it in
  ▼
OPEN (45 min)          only in-scope controls unlock
  │                    countdown in the header · Extend raises a fresh request
  │                    every save writes an audit row
  │
  │  employee clicks "Finish & lock"
  │  - or the timer runs out
  │  - or the heartbeat dies
  │  - or the owner revokes it from his phone
  ▼
CLOSED                 owner gets an SMS summary of what changed
```

### Scopes

A window for photos should not also permit price changes:

`fleet.create` · `fleet.update` · `fleet.delete` · `fleet.photos` ·
`pricing.update` · `booking.delete`

Where it makes sense the request names a single vehicle, so the window opens on
the Toyota Prius and nothing else.

### What stops the code being reused

- Only the **hash** is stored - HMAC-SHA256 with a server-side pepper, compared
  in constant time. Nobody with database access can read a live code.
- **Bound to the employee who asked and their current work session.** Typed into
  a different browser it fails - and that failure messages the owner
  immediately, because it is exactly the event he would want to know about.
- **Single use.** Consumed on success, then nulled.
- 10-minute expiry, 5 attempts. Both burn the request rather than locking the
  employee out; they can raise a fresh one.

> **Worth raising with the owner later:** a code spoken aloud is a secret the
> employee now holds, and the session binding above is what keeps that from
> mattering. If he ever wants it tighter, an Approve button in the same message
> removes the spoken code entirely - same flow, one tap. It slots into this
> design without rework, so it can wait until he has lived with the OTP.

---

## 5. Three walls

A disabled button is a courtesy to the user, not a security control. Anyone can
re-enable it in devtools. The window is verified again at every layer:

1. **The action guard.** Every mutating Server Action opens with
   `requireWindow('fleet.update', carId)`. It re-reads the request **from the
   database**, never from the session cookie, and checks status, expiry, scope
   and ownership. No guard, no write.
2. **Row-level security.** Supabase RLS denies all writes to `vehicles`,
   `vehicle_images` and `pricing` for any non-owner identity. A leaked anon key
   gets nothing.
3. **Server-only writes.** The service-role key never reaches the browser. All
   writes route through Server Actions; the client bundle holds only the anon
   key, and that key is read-only on these tables.

### The audit row is not optional

Each change writes to `audit_log` **in the same transaction** as the change -
actor, action, entity, before/after JSON, the authorising window, the work
session. If the log write fails, the change rolls back with it. That is what
makes the owner's activity feed trustworthy rather than usually-correct.

### Deletes are soft

"Remove a vehicle" sets `deleted_at` and drops it from the public site
immediately. The record and its photos survive **30 days**, so a vehicle removed
by mistake on Friday is recoverable Monday with one click.

---

## 6. Notifications

Written to an outbox table first, then delivered by a worker that retries with
backoff. A send is **never** attempted inside the request that caused it - that
is how notifications get silently lost when a function times out.

The one exception is the OTP, which has a person standing over it: sent via
Next's `after()` so the response is not held up, with delivery state shown live
on the employee's screen (*Sent to owner's phone · 3s ago*) and a Resend button
after 60 seconds.

### Channel split

| Event | Channel | Timing |
| --- | --- | --- |
| `access.requested` - employee wants to edit the fleet, **carries the OTP** | **SMS - Text.lk** | Instant |
| `access.closed` - window shut, short summary | **SMS - Text.lk** | Instant |
| `access.attempts_failed` - wrong code 5× | **SMS - Text.lk** | Instant |
| `booking.confirmed` - booking confirmed on the platform | **WhatsApp Business API** | Instant |
| `booking.created` - new request from the website | **WhatsApp Business API** | Instant |
| `enquiry.unanswered` - customer waiting > 4h | WhatsApp | Hourly check |
| `staff.clock_in` / `clock_out` | In-app + digest | Digest |
| `digest.daily` - hours, coverage, flagged shifts, bookings, revenue, replies | WhatsApp + email | 8:00 pm |

### The two internal messages that matter

```
Extra Cabs - access request
Kasun wants to ADD A VEHICLE.
Reason: "New Aqua joined the fleet today."
Code: 418236  (valid 10 min, opens a 45 min window)
```

```
Extra Cabs - access closed
Kasun finished 3:42pm. Added Toyota Aqua 2019,
Suzuki Alto 2021. Edited Prius monthly 165000>172000.
He can no longer edit the fleet.
```

### SMS practicalities (Text.lk)

- A GSM-7 message is **160 characters per segment**; longer messages are billed
  per segment. Keep the closing summary terse - full detail lives in the panel
  and the daily digest.
- **Any Sinhala or Tamil character drops the limit to 70 characters** (UCS-2).
  Vehicle names are Latin so this should not bite, but a free-text reason field
  can. Validate and warn at input.
- Store the provider message id from every send so delivery can be audited.

### WhatsApp practicalities

- Free-form text only reaches someone inside a 24-hour window they opened.
  The owner never will - so **every WhatsApp message needs a pre-approved Meta
  template**, in the *utility* category. Approval takes days and can be rejected.
- Submit booking templates in Phase 1, before the code that uses them.
- Because the OTP is on SMS, **Meta's approval queue is not on the critical
  path.** This is the main reason the channel split is a good decision.

---

## 7. The owner's screen

Built for a phone - that is where he will open it. He signs in perhaps twice a
week, so the first screen answers "is everything fine?" in about four seconds,
with state carried by colour, icon and shape rather than paragraphs of text.

- **Right now.** Who is signed in, since when, with a live running timer. An
  open write window shows as an amber strip with the scope, the countdown, and a
  **Revoke** button he can hit from anywhere.
- **Today's timelines.** The chart from §3, per employee, with flagged shifts
  called out. Any past date reachable in two taps.
- **Money.** Bookings and confirmed value for the period, split by service -
  self-drive, cabs with driver, airport transfers, wedding cars, long-term lease
  - with a cash-vs-bank-transfer split and what is outstanding. Vehicle
  utilisation shows which of the 40 cars actually earn.
- **The team.** Per employee: claimed vs present vs active hours, coverage,
  bookings handled, enquiries answered, median reply time, vehicles added or
  edited, access requests raised.
- **Activity.** The audit log in plain language, filterable by person and date.
  *"Kasun changed the Prado deposit from LKR 40,000 to 50,000 - Tue 3:12pm"*
  with before/after one tap away.

Uses `lucide-react` and the tokens from `globals.css`, so it inherits the site's
visual language. Status is a coloured pill with an icon; locked surfaces carry a
padlock; the running clock is always in the header. Supabase Realtime drives the
live presence strip.

---

## 8. Enquiries and replies

"How many replies they send to users" is a feature request, not a reporting
line. Counting replies is only possible if staff reply **inside** the panel
rather than from their personal phones.

So the contact form and booking enquiries land in a shared inbox with threads,
assignment, and a reply box that sends by email (Resend) or WhatsApp. Each reply
is stamped with who sent it and how long the customer waited.

Canned replies for the usual questions - deposit, NIC and licence requirements,
airport pickup timing - make the panel the path of least resistance. **That is
the only way this metric stays honest.**

---

## 9. Data model

Postgres on Supabase. Every timestamp is `timestamptz`, rendered in Asia/Colombo.

| Table | Holds |
| --- | --- |
| `staff` | Owner and employees - role, phone for OTP delivery, active flag |
| `work_shifts` | The claim: `signed_in_at`, `signed_out_at` (nullable), `work_date`, `end_reason` |
| `presence_segments` | The evidence: `shift_id`, `from_at`, `to_at`, `ended_by`, `idle_seconds`, ip, device |
| `access_requests` | Scope, target, reason, `otp_hash`, attempts, expiry, `window_expires_at`, `closed_at`, close reason |
| `audit_log` | Actor, action, entity, before/after JSON, authorising window, work session |
| `vehicles` | The `Car` shape from `src/types/car.ts`, plus `deleted_at` |
| `vehicle_images` | Supabase Storage paths, sort order, soft delete |
| `bookings` | The `BookingDraft` shape from `src/types/booking.ts` - including NIC and licence - plus status and handler |
| `payments` | Amount, method `cash · bank_transfer · card_on_pickup · payhere`, reference, recorded by |
| `enquiries` / `enquiry_messages` | Threads from the contact form, replies, sender, response time |
| `notifications` | Outbox - event, channel, payload, attempts, delivery state, provider message id |

### Key shapes

```
work_shifts
  id            uuid pk
  staff_id      uuid → staff
  work_date     date              -- Asia/Colombo calendar day
  signed_in_at  timestamptz not null
  signed_out_at timestamptz null  -- null = never signed out, do not guess
  end_reason    manual_signout | shift_expiry | owner_closed

presence_segments
  id            uuid pk
  shift_id      uuid → work_shifts
  from_at       timestamptz not null
  to_at         timestamptz null  -- null = currently present
  last_heartbeat_at timestamptz
  ended_by      sign_out | heartbeat_timeout | tab_hidden | browser_closed
  idle_seconds  int default 0
```

A `shift_summary` view derives `claimed_seconds`, `present_seconds`,
`active_seconds`, `coverage_pct`, `longest_gap_seconds` and `flagged`.

`payments` exists from day one even though nothing is collected online. Staff
record how a customer paid; income reports read from it. When PayHere is
approved it becomes a fourth method and a webhook writes the same rows - **no
migration, no report rewrite.**

---

## 10. Joining the existing site

The front end was built for this. Very little moves.

- `src/lib/data/cars.ts` accessors keep their signatures; only their bodies
  change to Supabase queries. No component is touched. See HANDOVER §4.
- The two `BACKEND SEAM` markers become Server Action calls that write a booking
  or enquiry and enqueue the owner's notification.
- Public fleet pages stay cached, invalidated with `revalidateTag('fleet')` when
  a window closes - a car added at 3:40pm is live at 3:42pm without a rebuild.
- Uploaded photos come from Supabase Storage, so its hostname must be added to
  `images.remotePatterns` in `next.config.ts` (currently an empty array).
- The minute-by-minute sweeper runs as **`pg_cron` inside Supabase, not Vercel
  Cron** - Vercel's free tier only schedules daily, and this job is the backbone
  of the time accuracy.
- Auth gate is `proxy.ts` (**not** `middleware.ts` - see HANDOVER §3) doing a
  cheap cookie check, with real authorisation in the Data Access Layer.

---

## 11. Build order

Each phase ends with something the client can be shown.

| # | Phase | What he sees at the end |
| --- | --- | --- |
| 1 | **Foundations** - Supabase project, schema, RLS, staff sign-in, `/panel` shell with role-aware nav. *Submit WhatsApp templates now.* | Three accounts signing in and landing on different screens |
| 2 | **The timesheet** - Sign in/out buttons, heartbeat, presence segments, idle tracking, `pg_cron` sweeper, the day timeline, coverage flags | A running timer, and a session that closes correctly when the laptop shuts |
| 3 | **Fleet, locked** - vehicle CRUD, photo upload, the write-window state machine, the three walls, audit log. OTP shown on screen for testing | An employee blocked, unlocked by a code, every change logged |
| 4 | **Messages** - Text.lk SMS for access events, WhatsApp for bookings, outbox worker with retries, delivery status on screen | The OTP and the closing summary arriving on his own phone |
| 5 | **Bookings and inbox** - public form writes real records, booking management, payment recording, threaded enquiry replies | A website booking appearing in the panel and getting answered |
| 6 | **Reports** - income by period and service, vehicle utilisation, employee performance, activity feed, 8pm digest | The screen he actually asked for, with real data behind it |
| 7 | **PayHere** - held until the merchant account is approved. Checkout, webhook, reconciliation, refunds | Money arriving before the customer collects the car |

---

## 12. Open risks

| Risk | Mitigation |
| --- | --- |
| **Owner unreachable** - flight or dead phone, employee fully blocked | Pre-issued single-use break-glass codes, heavily flagged in the audit log, alert on use. **Needs his decision before Phase 3.** |
| **WhatsApp template approval** - days, sometimes rejected | Submit in Phase 1. Downgraded from critical because the OTP is on SMS. |
| **Staff route around the panel** - replying from personal phones makes reply metrics fiction | The inbox must be genuinely faster than WhatsApp on their own device: canned replies, shortcuts, no friction |
| **Coverage read as surveillance** | Employees see their own figures from day one; the limits in §3 are stated to them openly |
| **Midnight / day boundary undefined** | Suggested 23:59 auto-close with `shift_expiry`. **Needs his decision.** |
| **Placeholder contact details** | The owner's real mobile is load-bearing - it receives every OTP. Collect and verify early, not at launch. |
