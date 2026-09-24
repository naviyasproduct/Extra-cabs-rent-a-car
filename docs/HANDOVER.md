# Handover - Extra Cabs & Rent a Cars

**Read this first.** It exists so a new session (human or agent) can start work
without reading the whole codebase. If something here is wrong, fix it here
rather than working around it.

Last updated: **2026-09-20**

---

## 1. What this project is

A website for **Extra Cabs & Rent a Cars**, a vehicle rental agency in
Heiyanthuduwa, Biyagama (Gampaha district), Sri Lanka, founded 2019. Self-drive rentals, cabs with a driver, airport transfers, wedding
cars, long-term lease. Prices in LKR.

The project has **two halves**:

| Half | State | Lives at |
| --- | --- | --- |
| **Public website** - what customers see | Built, UI-only, deployed on Vercel | `/`, `/fleet`, `/booking`, `/services`, `/about`, `/contact`, `/faq` |
| **Internal platform** - what the owner and 2 employees use | **Built and working on Supabase** (Postgres, Auth, private Storage) since 2026-09-22. See [`panel.md`](./panel.md) | `/999p7k` to sign in, `/panel` |

The agency is **one owner + two employees**. The internal platform is the
current piece of work. Its full spec is in
[`internal-platform-plan.md`](./internal-platform-plan.md).

---

## 2. Current state

- The public site is complete, and its three forms now **write real records**
  into the panel. There are no `BACKEND SEAM` markers left: the booking form,
  the quick request on each vehicle page and the contact form all create
  bookings and enquiries staff can act on.
- **The staff panel is built and working.** Sign in at `/999p7k`. Full
  description, test accounts and limits in [`panel.md`](./panel.md).
- **On Supabase since 2026-09-22.** Project `nyjmsjdallwwomxmcdrh`, Mumbai.
  All panel data goes through `src/lib/panel/db.ts` with the service role;
  RLS is on with no policies, so the public keys and staff browsers reach
  nothing. Sign-in is Supabase Auth plus an active `staff` row. The JSON store
  (`store.ts`, `.data/`) is gone. There is **no owner account yet**: create it
  with `scripts/create-owner.mjs`.
- **Booking alerts by SMS are built** (Text.lk), and dormant until a token and
  a sender ID are set. See [`sms.md`](./sms.md). Every website booking texts the
  owner and every staff member who has a number saved in `/panel/team`.
- **No WhatsApp, and the access OTP is still not on SMS.** The access code
  appears on the owner's dashboard for him to read out.
- Deployed on **Vercel**. Only the public UI is live there.
- **SEO is done** (2026-09-06). See §2a.

> **The public fleet is now filtered.** `publicCars()` in `src/lib/fleet.ts`
> excludes any vehicle marked booked or removed in the panel. Server pages must
> import fleet data from `@/lib/fleet`, not `@/lib/data/cars`, or the customer
> will see vehicles that are out on hire. `cars.ts` stays the pure catalogue and
> is still safe for client components to import `filterCars` from.

### 2a. SEO layer

| Piece | Where |
| --- | --- |
| Structured data builders | `src/lib/seo.ts` |
| Renderer | `src/components/common/JsonLd.tsx` |
| Sitemap | `src/app/sitemap.ts` (generated from fleet + services data) |
| Robots | `src/app/robots.ts` (disallows `/panel` and `/api`) |
| Share card | `src/app/opengraph-image.tsx` |
| Favicon | `src/app/icon.tsx` |
| Canonical origin | `siteUrl` in `src/lib/data/site.ts` |

**schema.org types emitted:** `AutoRental` and `WebSite` sitewide,
`Product`+`Car` with `Offer` per vehicle, `Service` per service,
`FAQPage` on `/faq`, `BreadcrumbList` and `ItemList` where they apply.

> **Trap to remember:** `alternates.canonical` set in the root layout is
> **inherited by every child route**, which would point the whole site at the
> home page. It is deliberately NOT in `src/app/layout.tsx`. Every page sets its
> own. If you add a route, give it a canonical.

> **Set `NEXT_PUBLIC_SITE_URL`** in the Vercel project to the real domain. It
> falls back to `https://extracabs.lk`, which is a guess. Every canonical,
> sitemap entry, Open Graph tag and JSON-LD URL is built from it.

### Known placeholders still in the code

These are invented and must be replaced before launch:

- `src/lib/data/site.ts` - **real since 2026-09-21** (phones, email, address,
  socials, map, founding date). Only the postcode is still unknown.
- `src/lib/data/cars.ts` - **empty since 2026-09-21, on purpose.** Staff add
  every vehicle through the panel after launch. The client's fleet is Vezel,
  Prius, C-HR, Wagon R, Honda Fit GP5, Daihatsu Move Canbus and Honda Insight.
- `src/lib/data/services.ts` - every price table and "starting from" is empty
  until the client supplies real prices; pages show a quote line meanwhile.
- `src/app/(site)/terms/page.tsx`, `src/app/(site)/privacy/page.tsx` -
  rewritten 2026-09-21 from the client's policy, **not reviewed by a lawyer**.
- `public/images/cars/` - **all 12 vehicles share three stock photographs.**
  They are not the real fleet: the same three cars appear under twelve names.
  See the README in that folder.

---

## 3. Stack - and the versions that matter

```
Next.js  16.3.4   (App Router)
React    19.2.8
Tailwind CSS v4   (via @tailwindcss/postcss - no tailwind.config.js)
TypeScript 7.0.2
lucide-react      (the only UI dependency; there is no component framework)
```

### Next.js 16 gotchas - this is not the Next.js most training data knows

`AGENTS.md` in the repo root says it, and it is true. Before writing code, read
the relevant guide in `node_modules/next/dist/docs/`. Specifically:

- **`middleware.ts` is deprecated - the file is `proxy.ts`.** Same behaviour,
  renamed. Codemod: `npx @next/codemod@canary middleware-to-proxy .`
  Docs: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- **Proxy must not be the only auth check.** It runs on prefetches too, so it
  does cheap cookie-only checks. Real authorisation belongs in a Data Access
  Layer beside the queries.
  Docs: `node_modules/next/dist/docs/01-app/02-guides/authentication.md`
- **`after()`** schedules work once the response is flushed - the right tool for
  firing a notification without blocking the user.
  Docs: `.../04-functions/after.md`
- `unauthorized()` / `forbidden()` exist but need
  `experimental.authInterrupts` in `next.config.ts`.

---

## 4. Repo map

```
src/
  app/                 routes (App Router)
    globals.css        ← the entire visual language lives here
    layout.tsx         Barlow + Barlow Condensed via next/font/google
  components/
    ui/                Layout, Button, Field, Badge, Accordion, Icon
    layout/            Navbar, Footer, PageHeader, Logo
    home/ fleet/ booking/ common/
  lib/
    data/              cars.ts, services.ts, content.ts, site.ts  ← catalogue
    contact.ts         phone + email validation. PURE, client-safe.
    fleet.ts           catalogue + panel overrides. Server only.
    panel/             store, auth, guard, time, window. Server only.
    utils/
  types/               car.ts, booking.ts, service.ts, common.ts
  proxy.ts             cookie gate on /panel. NOT middleware.ts
  app/(site)/          public pages + navbar/footer layout
  app/999p7k/          staff sign in
  app/panel/           the staff screens + actions.ts
  app/api/panel/       heartbeat, away, documents/[id]
public/images/         home/, cars/, icons/
.data/panel.json       the store. Gitignored. Delete it to reset.
.data/uploads/         customer NIC, passport and licence images. Gitignored.
                       Served ONLY by /api/panel/documents/[id], which needs a
                       staff session. Never put these under public/.
```

### The data accessors are the backend seam

`src/lib/data/cars.ts` already exposes **async** functions over a mock array:

```
getCars()  getCarBySlug()  getFeaturedCars()  getShowcaseCars()
getRelatedCars()  getCategoryCounts()  getCarSlugs()  filterCars(list, filters)
```

Their bodies become database queries. **Their signatures do not change**, so no
component is touched. `filterCars()` already accepts the same filter shape the
availability query needs - the query contract is settled.

Same pattern in `services.ts` and `content.ts`.

---

## 5. Design system rules - do not violate these

The whole visual language is three files: `src/app/globals.css`,
`src/components/ui/Layout.tsx`, and the control components in `src/components/ui/`.

- **Never hardcode spacing, radius or colour in a component.** Use the tokens.
- One container width (`--shell`), one gap value (`--gap`), one radius scale,
  one section rhythm (`--section-y`).
- **Separation comes from background tone, not borders.** Borders are rare;
  hairline rules (`.rule`) are preferred.
- No glows, no coloured shadows, no gradient shine, no background patterns.
  Surfaces are flat; shadows are neutral and tight.
- Cards deliberately overlap section seams (`--overlap`).
- Colours are from the logo: signal red `#FF5151`, lifted to `#FF7A7A` for
  accents on black and deepened to `#FF3B3B` on hover, plus graphite and warm
  paper. **No blues, violets, or default framework greys.** The red lives in
  six tokens in `globals.css` and nothing hardcodes it, except `icon.tsx` and
  `opengraph-image.tsx`, which render through Satori and cannot read CSS.
  **White on the brand fill is 3.21:1**, below AA for normal text; see the
  note beside the tokens before making that worse.
- **Flat and hard-edged** (client instruction, 2026-09-06). No background boxes
  on content, no rounded corners. Both are controlled by tokens in
  `globals.css`, not by classes in components:
  - `--radius-shell / -card / -inner / -chip` are all **`0rem`**. Put values
    back there to restore the rounded look everywhere at once.
  - `--radius-nav` and `--radius-nav-inner` are the **navbar's own** radii. The
    navbar is the one exempt surface.
  - `rounded-full` is untouched: circles and pills stay round.
  - `--color-surface` and `--color-surface-alt` are **`transparent`**. Cards,
    panels and section bands paint nothing and are separated by whitespace and
    `.rule` hairlines.
  - `--color-field` / `--color-field-hover` are for **controls only**. Inputs,
    toggles, chips and menu rows keep a fill because a control with no
    background and no border is invisible. Use these, never `bg-surface*`, for
    anything a person operates.
  - **`select option` is styled globally in `globals.css` and must stay that
    way.** `--color-field` is white at 8.5% opacity, and the browser draws the
    option popup outside the page, compositing that translucent white over its
    own white ground. With text inheriting near-white `--color-ink` that gave
    1.17:1 contrast: completely invisible. Options are pinned to an **opaque**
    `--color-charcoal` background, which is 17.17:1. Never give a `<select>` a
    translucent background and expect the popup to inherit sensibly.
  - The navy `--color-contrast` survives only on buttons, badges and the scrim
    over destination photos. It is no longer used as a slab anywhere.
- Type: `Barlow_Condensed` for display (uppercase), `Barlow` for body.
- **No em dashes or en dashes anywhere.** Not in UI copy, not in code comments,
  not in CSS comments, not in these docs. Client instruction, 2026-09-06. Use a
  comma, a full stop, a colon, or the word "to" for ranges.
  The repo is at zero. Keep it there. Check with:

  ```bash
  grep -rn $'\xe2\x80\x94\|\xe2\x80\x93' src/ docs/
  ```

  Those are the UTF-8 bytes for em dash and en dash. Written as escapes so the
  check does not flag its own documentation. Do not use `grep -P "\x{2014}"`
  here: this grep is not in UTF-8 mode and errors out, which reads as a pass if
  you chained it with `||`.

> Note: `globals.css` currently runs a **dark** palette (`--color-paper: #000`).
> The README still describes the original light "warm paper" scheme. The dark
> palette is the current truth; the README section is stale.

The internal platform reuses these tokens so it looks like one product, not a
bolted-on admin tool.

---

## 6. Decisions locked with the client

Gathered in person with the owner, **2026-09-05**.

| Area | Decision |
| --- | --- |
| Database | **Supabase** (Postgres + auth + storage + realtime) |
| Hosting | Vercel (unchanged) |
| Booking notifications | **WhatsApp Business API** |
| Internal / access OTP | **SMS via Text.lk** |
| Payments today | Cash and bank transfer, recorded by staff |
| Payments later | PayHere, once the merchant account is approved |
| Timezone | Asia/Colombo (UTC+05:30) |
| Approval model | Owner receives an OTP on his phone and reads it to the employee |
| Time tracking | Explicit Sign in / Sign out buttons **plus** proven-presence tracking |

### Why the channel split matters

OTP goes over **SMS, not WhatsApp**. This is significant: WhatsApp Business API
will not send free-form text to someone who has not messaged you in 24 hours,
and the owner never will - so WhatsApp messages need pre-approved Meta
templates, which take days to approve and can be rejected. Putting the OTP on
SMS **takes Meta's approval queue off the critical path entirely.**

---

## 7. What blocks the build

Verified 2026-09-06. **The codebase is not a blocker** - `npm run build` passes
(28 static pages), `npx tsc --noEmit` is clean. Everything below is external or
a decision.

### 7a. Accounts and credentials we do not have

| Need | Why it blocks | Lead time |
| --- | --- | --- |
| **Owner's real mobile, verified** | Every access OTP goes there. `site.ts` has a placeholder. Phase 4 cannot be tested without it. | Immediate - just ask |
| **Text.lk account + API key + registered sender ID** | Account exists (2026-09-08). Still needs an API token and an approved sender ID: without them no OTP delivery **and no booking alerts**, both of which are written and waiting. Text.lk quote hours to 3 business days for a sender ID, with free fast-track. | **Hours to days** |
| **WhatsApp Business API access** | Booking notifications. Needs Meta Business verification. | **Weeks - start now** |
| **Supabase project** | Everything from Phase 1 onward. | Minutes, once ownership is decided |
| **Employee names + mobile numbers** | Seeding the `staff` table. | Immediate |

> **The WhatsApp trap, flag this early.** A number used for WhatsApp Business
> API **cannot also be a normal WhatsApp account on a phone.** If `+94 77 …` is
> the number the agency uses for day-to-day customer WhatsApp, putting it on the
> API means losing it from the handset. Decide now: either a second number for
> the API, or accept the migration. This surprises people late and hurts.

### 7b. Ownership and cost - settle before building

- **Whose Supabase and Meta accounts?** These should be created under the
  **client's** ownership with us granted access, not ours. Otherwise handover
  becomes a migration and there is a bus factor.
- **Monthly running cost needs client sign-off before we build**, not after:
  Supabase paid tier (the free tier is not appropriate for a production system
  running `pg_cron` every minute), per-SMS charges on Text.lk, per-conversation
  charges on WhatsApp, and possibly a Vercel paid plan. Get current figures and
  put them in front of the owner as a monthly number.

### 7c. Decisions only the owner can make

1. **Break-glass access.** If he is unreachable (flight, dead phone) the employee
   is fully blocked. Recommendation: pre-issued single-use emergency codes,
   heavily flagged in the audit log. **Needed before Phase 3.**
2. **Reporting day boundary.** When does a "day" end, and what happens to a
   shift still open at midnight? Suggested: auto-close at 23:59 with
   `end_reason = shift_expiry`. Office hours are 8am-8pm.
3. **Coverage threshold.** What counts as a flagged shift? Suggested: under 60%,
   or any single gap over 2 hours.
4. **Do the two employees share a device?** If they share one laptop, separate
   logins and sign-out discipline become load-bearing, and presence tracking
   needs a plan for account switching.

### 7d. Legal - check, do not assume

- Sri Lanka's **Personal Data Protection Act No. 9 of 2022** applies. We will be
  storing customer **NIC and driving licence numbers** (already in
  `BookingDraft`) and monitoring employee activity. Both deserve a proper look.
- `/privacy` and `/terms` are **unvetted drafts** and do not currently describe
  what the real system collects.
- **Employee monitoring should be disclosed to the employees in writing** before
  Phase 2 ships. This is the right thing to do regardless of what the law
  requires, and it is also what keeps coverage reporting from being read as
  surveillance.

### 7e. Repo hygiene - fix before backend work lands

- **36 uncommitted files against a single commit named `dfsdfsfsdf`.** The whole
  current front-end revision is unversioned. Commit it properly first - starting
  a multi-phase backend build with no baseline to roll back to is asking for
  trouble.
- **`npm run lint` is dead.** Next 16 removed `next lint` (the CLI is
  `dev · build · start · info · telemetry · typegen · upgrade ·
  experimental-analyze`), and there is no ESLint config in the repo at all.
  Needs replacing with the ESLint CLI before a build that involves auth guards.
- **No test setup.** The write-window guard and the coverage calculation are the
  two places a silent bug is expensive. They need tests; nothing else does yet.

### 7f. What is NOT blocked

**Only Phase 4 is externally blocked.** As soon as a Supabase project exists:

- **Phase 1** (schema, RLS, sign-in, panel shell) - needs nothing else.
- **Phase 2** (the entire timesheet: heartbeat, presence segments, `pg_cron`
  sweeper, day timeline, coverage flags) - **needs no external vendor at all.**
  Highest value, zero dependencies. This is where to start.
- **Phase 3** (fleet CRUD, write window, three walls, audit log) - fully
  testable with the OTP printed on screen instead of sent.

---

## 8. Changelog

Append to this. One entry per working session - what changed and why.

### 2026-09-05 - Requirements gathered, internal platform planned

- Owner interviewed. Requirements captured for the internal staff platform:
  time tracking, OTP-gated fleet edits, owner reporting.
- Stack decisions locked (see §6).
- Wrote [`internal-platform-plan.md`](./internal-platform-plan.md) - full spec.
- **Design revision after client feedback:** time tracking changed from a single
  session record to **two separate records** - the claimed shift (Sign in /
  Sign out buttons) and proven presence (heartbeat segments). The owner needs to
  see the per-day timeline of each employee, including when the laptop closed
  and reopened, so a claimed 9-hour shift with 14 minutes of proven presence is
  visible rather than hidden. See plan §3.
- **Design revision after client feedback:** notification channels split -
  WhatsApp for booking confirmations, Text.lk SMS for internal access OTPs.
- No application code written yet. Repo is unchanged apart from `docs/`.

### 2026-09-06 - Pre-build blocker audit

- Verified the codebase is healthy: `npm run build` passes (28 static pages),
  `npx tsc --noEmit` clean, Node v24.17.0.
- Audited what stands between us and Phase 1. Written up in §7.
- **Findings that were not previously known:**
  - `npm run lint` is broken - Next 16 removed the `next lint` command, and
    there is no ESLint config in the repo.
  - 36 files uncommitted against one commit named `dfsdfsfsdf`; no usable
    baseline to roll back to.
  - A WhatsApp Business API number cannot also be a normal WhatsApp account on
    a handset - the agency must decide whether to use a second number.
  - Text.lk sender-ID registration is a telco business process, not a signup;
    it is now the longest external lead time on the critical path.
- Conclusion: **only Phase 4 is externally blocked.** Phases 1-3 can start as
  soon as a Supabase project exists, and Phase 2 needs no vendor at all.

### 2026-09-06 (later) - Public site: SEO, vehicle cards, quick booking

Client decisions this session: build without messaging for now; public site
first; quick request form on the vehicle page; employee accounts get a
**one-time password shown once on screen** at creation.

**Added**

- Full SEO layer (see §2a): `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`,
  `icon.tsx`, `src/lib/seo.ts`, `JsonLd.tsx`, `metadataBase`, per-page
  canonicals and Open Graph URLs, `lang="en-LK"`.
- `siteUrl` and machine-readable `openingHours` in `src/lib/data/site.ts`.
- `src/components/fleet/QuickRequest.tsx` - five-field booking request on each
  vehicle page. Placed in the wide left column, not the narrow sidebar, because
  its two-column date fields are cramped in a 4-of-12 column.

**Changed**

- `CarCard` now leads with **three icon stats: seats (`Armchair`), daily rate
  (`Banknote`), fuel (`Fuel`)**, replacing the four small chips. The duplicated
  price block at the bottom is gone; the bottom row is free-km plus a text link.
  Icon-only arrow link replaced with real anchor text for SEO, with the vehicle
  name in an `sr-only` span so it does not overflow on long names.
- Removed `keywords` from root metadata. Google has ignored meta keywords since
  2009 and it was noise.
- **All 42 em and en dashes stripped from `src/`, and 97 from `docs/`.** Zero
  remain. See the rule in §5.

**Verified**

- `npm run build` passes, 32 routes. `npx tsc --noEmit` clean.
- Generated `sitemap.xml`, `robots.txt`, per-page canonicals and the vehicle
  JSON-LD were read out of `.next/server/app/` and confirmed correct, not
  assumed.

**Next:** the panel. Waiting on Supabase credentials (see §7a).

### 2026-09-06 (later still) - Home layout, 4-up grid, mobile list view

Client feedback: hero too tall, vehicles too far down, want 4 per row, want a
list on mobile instead of one big image per vehicle, and delete the search bar
because nobody uses it.

**Removed**

- `src/components/home/SearchBar.tsx` **deleted**. It was the service tabs plus
  pickup location and date pickers that overlapped the bottom of the hero. Only
  Hero used it. The `.overlap-up` CSS class stays: `WhyUs.tsx` still uses it.

**Changed**

- `Hero.tsx` is materially shorter. The slab went from
  `pt-8 pb-[calc(var(--overlap)+2rem)]` to `py-7 lg:py-9`; that bottom padding
  existed only to make room for the search card overlapping it, so removing the
  card removed the need. Image dropped from `lg:aspect-square` to
  `lg:aspect-[4/3]`, buttons from `size="lg"` to default, and the copy spacing
  tightened one step throughout.
- `FeaturedFleet.tsx` shows **8 vehicles, 4 per row** on desktop
  (`lg:col-span-3`), 2 on tablet, list on phones. Eight because two full rows
  read as a fleet where one row plus a stranded pair reads as a mistake.
  "See all 12 models" is now computed, not hardcoded.
- **`CarCard` is now two shapes from one component.** Below 768px it is a list
  row: 112px thumbnail left, title, tagline and the three stats inline. From
  768px up it is the tall card with the stats as tiles.
- `FleetBrowser` grid moved from `sm:grid-cols-2` to `md:grid-cols-2` so its
  breakpoint matches the card's own switch and the `.grid12` breakpoint. It
  stays 3-up at `xl` because the filter sidebar takes 3 of 12 columns; 4-up
  there would leave each card about 215px wide.
- Added `getShowcaseCars(limit)` to `cars.ts`: featured first, then the rest, so
  the grid always fills. The home grid and its `ItemList` JSON-LD both read it,
  so they cannot disagree about what is on the page.

**Two bugs caught while building this**

- The stretched card link needed `before:z-10`. Without it the pseudo-element
  sat below later DOM siblings, so clicking the visible "View details" pill did
  nothing. The whole card is one anchor now, with the vehicle name as its text.
- First pass switched the card layout at `sm:` (640px) while `.grid12` goes
  multi-column at 768px, which left 640px to 767px showing one full-width tall
  card per row: exactly the thing the client asked to remove. Both are `md:` now.

**Verified**

- `tsc` clean, build passes, 32 routes.
- Served the production build on :3111 and checked the real HTML: hero then
  "Pick your ride" with nothing between them, 8 `<article>` cards, 8 unique
  `/fleet/...` links (one anchor per card, not two), reduced hero padding and
  the new image aspect all present. Server stopped afterwards.
- Not viewed in a real browser: there is no browser tooling installed in this
  repo, so the check was structural. Worth a look on a phone before shipping.

### 2026-09-06 (evening) - Flat redesign and centred hero

Client: drop the hero's background box, centre everything, put a much bigger
image in the middle with "EXTRA CABS" over it in red, remove every background
box site-wide, and remove rounded corners except the navbar. Confirmed by
question: fields stay filled, the navy slabs go too, circles and pills stay.

**Approach**

127 rounded corners and 83 background surfaces, but almost all came from four
radius tokens and two colour tokens, so this was a token change plus a short
list of exceptions rather than 35 file edits. See §5 for the resulting rules.

**Hero rebuilt** (`Hero.tsx`)

- No slab. Centred. `<h1>` is the word "Extra Cabs" at the new `.display-hero`
  scale (`clamp(3.25rem, 15.5vw, 11.5rem)`), in `text-brand-bright`.
- The fleet image is full shell width and rises into the bottom of the
  lettering via a negative margin. **Deliberately not an absolute overlay:** an
  overlay sits at a fixed offset and collides with the cars at some widths,
  whereas an overlap always lands in the same place relative to the type.
- Cut from two buttons to one, per "we use too many buttons".

**Exceptions kept, and why**

- Buttons, badges, the rating chip, status dots: `rounded-full`, unchanged.
- Form controls, category chips, the with-driver toggle, navbar menu rows:
  moved from `bg-surface*` to `bg-field` so they stay visible and tappable.
- Destination tiles keep `bg-contrast/40` as a **scrim over photography**. That
  is legibility, not decoration.

**Follow-on fixes this forced**

- Everything that used to sit on navy had `text-white/40` through `/80` and
  `bg-white/10` through `/25` tuned for that backdrop. On black those opacities
  were wrong, so they were mapped onto `text-ink` / `text-ink-soft` /
  `text-muted` / `bg-field`. `text-white` was kept only where it sits on brand
  red.
- `services/page.tsx` had a `dark = index % 2 === 1` alternation. With the page
  flat, every branch resolved to the same thing (two were already
  `dark ? "text-muted" : "text-muted"`), so the variable was removed.
- One stray `rounded-md` on the checkbox indicator squared to the chip token.

**Verified**

- `tsc` clean, build passes, 32 routes.
- Served on :3112 and read the **shipped stylesheet**, not just the source:
  `--radius-shell/card/inner/chip` all resolve to `0rem`, `--radius-nav` holds
  `1.5rem`, `--color-surface` and `--color-surface-alt` are `transparent`,
  `--color-field` is `#ffffff16`, and `.panel-dark` ships with padding only.
  Hero HTML confirmed boxless and centred. Server stopped.
- Still not seen in a browser. The flat look removes every separator that was
  doing work, so it is worth a real look before shipping.

### 2026-09-06 (late) - Hero wordmark colour and image crop

Client: use the same red as the "Book now" button for the wordmark, and get the
image and text a lot closer.

- Wordmark moved from `text-brand-bright` (`#ff5b61`) to **`text-brand`**
  (`#e01b22`), which is what the "Book now" button uses via `bg-brand`.
- **The gap was inside the image, not the CSS.** `hero-fleet.png` is a
  2000x2000 square whose vehicles occupy only `y 788` to `1514`: **39.4%
  transparent padding above the cars, 24.3% below**. With `object-contain` that
  dead space rendered as an unclosable gap and shrank the cars to fit it. No
  margin change would have fixed it.
- Measured the opaque bounding box by decoding the PNG directly (it is colour
  type 3, palette + `tRNS`, so a plain RGBA scan does not work).
- Fix: a `aspect-[5/2]` frame with `object-cover` and a **derived**
  `object-position` of `50% 62.6%`. Content centre is 1151.5/2000 = 57.6% of
  the source; for a 0.4W-tall box holding an image scaled to height W the
  overflow is 0.6W, so centring that band needs 0.3755/0.6 = 62.6%. Verified at
  W=1280: cars land 23px from the top of the frame and 23px from the bottom.
- **If the hero image is ever replaced, re-measure and update that number.**
  The working is written out in a comment in `Hero.tsx`.
- The paragraph below the image had a negative top margin that existed only to
  claw back the old letterboxing. Now positive.

**Verified:** read the shipped stylesheet to confirm Tailwind actually emitted
the arbitrary utilities, since a malformed arbitrary value fails silently:
`object-position:50% 62.6%`, `object-fit:cover`, `aspect-ratio:5/2`, and
`.text-brand{color:var(--color-brand)}` are all present.

### 2026-09-06 (last) - Fleet tiles stripped back, kilometres removed

Client: give each fleet card a tile background so vehicles read as separate
objects; on the card show only the name and the three icons; drop taglines,
marketing tags and the view-details button; and remove the free-kilometre
figure from the whole site.

**Fleet tile** (`CarCard.tsx`)

- New `--color-tile` / `--color-tile-hover` tokens. **This is the only content
  surface on the site that paints.** It exists because four vehicles in a row
  with no surfaces read as one strip of photos and you cannot tell which name
  belongs to which car. Everything else stays flat per the rules in §5.
- Card is now image, name, three stats. Removed: tagline, `car.badge`, the
  rating, the "View details" pill and the mobile arrow.
- Stats sit in a `mt-auto` row so tiles in a row align regardless of how long
  the vehicle name is. The hairlines between the three cells are drawn with
  `gap-px` over a `bg-line` track rather than borders.
- `car.badge` and `car.tagline` are **still shown on the vehicle detail page**
  and the fields remain in the data. Only the card was in scope. Say the word
  if they should go everywhere.

**Kilometres removed entirely**

Confirmed with the client: **unlimited kilometres, no charge.** So this is not
just hiding a number, it is a policy change through the copy.

- Deleted `specs.freeKmPerDay` and `pricing.extraKm` from `types/car.ts` and
  all 12 vehicles in `cars.ts`.
- Rewrote every place that described an allowance: the FAQ answer to "Is there
  a kilometre limit?", clause 5 of the rental terms, two self-drive service
  bullets ("Generous kilometre allowance" became "Unlimited kilometres"), the
  booking form summary line, and the per-vehicle SEO description.
- `PriceCard` now shows "Kilometres: Unlimited" in place of the free and extra
  kilometre rows. "Unlimited kilometres" added to the in-the-price list.
- `grep -rn "freeKmPerDay\|extraKm\|free km"` over `src/` returns nothing.

**Verified**

- `tsc` clean, build passes, 32 routes.
- Served on :3114 and checked the real HTML: zero occurrences of "head-turner",
  "Most booked", "Best on fuel", "View details", "km free per day"; the name and
  all three stats present on every tile; `bg-tile` on all 8 cards.
- Confirmed in the shipped CSS that `--color-tile:#ffffff0e` and
  `.bg-tile{background-color:var(--color-tile)}` were actually emitted.
- **Note for next time:** the built stylesheet filename can contain an
  underscore (`3_h75rh9tynub.css`). A `[a-z0-9]*\.css` grep silently misses it
  and you end up diffing the HTML against itself. Use `href="[^"]+\.css"`.

### 2026-09-06 (final) - Real photographs replace the cut-outs

Client dropped three Unsplash photos into `public/images/cars` and asked to use
them for every vehicle, replacing the old transparent PNGs.

**Images**

- Resized 6000px originals to **1920px** (the `deviceSizes` cap in
  `next.config.ts`) at quality 82 using the `sharp` already present in
  `node_modules`. **7.7 MB became 0.59 MB, a 92% cut**, with no visible loss:
  the largest render slot is about 840px CSS, so anything above 1920 was dead
  weight in the repo.
- Renamed to `fleet-01.jpg` / `-02` / `-03`. Deleted the three old transparent
  PNGs and the oversized originals.
- All 12 vehicles now point at all three, **rotated** so neighbouring tiles in
  the grid do not show an identical shot.

**The styling had to change with them**

The old photography was cut-outs on transparency, and two pieces of the design
existed only to cope with that. Both are now gone:

- `CarImage` used `fit="contain"` plus a `p-4` inset, because cropping a
  cut-out lops the nose off the car. Photographs want the frame filled, so it
  is `fit="cover"` with no inset. The `inset` prop was removed entirely.
- **`.car-stage` is deleted** from `globals.css` and all five usages. It was a
  radial pool of light behind each vehicle, there to lift a dark cut-out off
  the black page. A photograph brings its own background, and the glow only
  muddied it.

> If anyone ever supplies transparent PNGs again, they will now render as a car
> floating on plain black. Restore `fit="contain"` and the stage light, or ask
> for ordinary photographs. This is written into the folder README too.

**These are placeholders.** They are stock photos, not the real fleet, and the
same three cars appear under twelve names. `public/images/cars/README.md` says
so and explains how to swap in real photography.

**Verified**

- `tsc` clean, build passes, 32 routes.
- Served on :3115: all three files return 200, the Next optimizer serves a
  resized variant (640px wide, 43 KB), and the old `toyota-chr.png` correctly
  404s. Home and vehicle pages reference only `fleet-0*`, no `.png` paths, no
  `car-stage`, and zero placeholder fallbacks triggered, so every path resolves.

### 2026-09-06 (later) - One location, routes section removed

Client: remove the "Where people go" routes section, and the agency has only
one location: **653 Samurdhi Mawatha, Heiyanthuduwa**.

**Removed**

- `Destinations.tsx` deleted along with its home page slot. The orphaned
  `destinations` data, the `getDestinations` accessor and the `Destination`
  type went with it, and `public/images/gallery/` was deleted since nothing
  referenced those images any more.

**One location**

- `site.address` is now `653 Samurdhi Mawatha, Heiyanthuduwa, Sri Lanka`.
  **The postal code is genuinely unknown, so it is blank, not guessed.**
- Added `addressLines` and `addressOneLine` to `site.ts`, which drop empty
  parts. Every place that shows the address reads one of those two, so filling
  in the postal code later fixes all pages at once. Without this a blank field
  rendered as an empty line in the contact block and a stray comma in the
  footer. The structured data omits `postalCode` entirely rather than emitting
  an empty string.
- `locations` in `content.ts` is a single entry. Negombo, Kandy and the airport
  are gone.
- The booking form had two location dropdowns plus a "return to the same
  location" checkbox. With one office all three were dead controls, so they are
  one field now. **Delivery survives as an option** (`pickupOptions` in
  `BookingForm.tsx`) because free Colombo delivery is promised in the hero and
  in the in-the-price list; it is a service, not a location, which is why it is
  added in the component rather than in the locations data.
- Dropped `sameReturnLocation` from `BookingDraft`.
- The single location card was `lg:col-span-4`, which left it sitting alone in
  a third of a row. Now `lg:col-span-6` on both the about and contact pages.

**Stale copy this exposed**

The about and contact pages were still advertising branches that do not exist.
Fixed: the about meta description, the 2016 milestone ("Started in Dehiwala"),
the 2025 milestone ("Forty vehicles, four branches" / "Dehiwala, Negombo, Kandy
and the airport"), the timeline heading "Nine years, four branches", and the
contact meta description "Branches in Dehiwala, Negombo, Kandy and at
Bandaranaike International Airport".

**Verified**

- `tsc` clean, build passes, 32 routes.
- Served on :3116. Home has no "Where people go", "Popular routes" or
  destination names. Contact shows the new address with zero occurrences of
  Galle Road, Dehiwala, 10350, Negombo or Kandy. The footer renders
  "653 Samurdhi Mawatha, Heiyanthuduwa, Sri Lanka" with no empty comma, and the
  business structured data carries one `location` and no `postalCode`.
- The booking form could not be checked this way: it uses `useSearchParams`, so
  its subtree is client-rendered and the SSR HTML only contains the Suspense
  fallback. Its changes are typechecked but not visually confirmed.

**Still open:** the site says "Colombo" throughout (free Colombo delivery, "car
hire Colombo" keywords, the Open Graph card). Heiyanthuduwa is in Gampaha
district, about 20km out. Left alone because it is a marketing decision, but it
is worth a look. The phone numbers in `site.ts` are also still placeholders.

### 2026-09-06 (fix) - White text restored on brand-red fills

Client reported the "Ready when you are" paragraph was not white. It was a
**regression from the flat redesign sweep** earlier the same day.

**What went wrong.** That sweep mapped `text-white/40` through `/80` onto
`text-ink` / `text-ink-soft` / `text-muted`, on the reasoning that those
elements used to sit on the navy slab and now sit on black. Correct for most of
them, but it also caught elements sitting on **`bg-brand` red**, which never
changed and where white was always right. The cool grey tokens
(`--color-ink-soft` is `#adb7c9`) read washed out and slightly blue on signal
red.

**Fixed, all confirmed against git as previously `text-white`:**

- `Footer.tsx` CTA heading and paragraph, on the red slab.
- `contact/page.tsx` and `services/[slug]/page.tsx`: icon tiles whose
  `group-hover:bg-brand` was paired with `group-hover:text-ink`.
- `ServicesGrid.tsx`: the same icon-tile pattern.
- `Footer.tsx` "Call us" button was `bg-white/15` and had been mapped to
  `bg-field` (opacity 0.085), noticeably dimmer and losing definition against
  the red. Restored. **`--color-field` is for controls on the flat black page;
  it is the wrong token on a coloured fill.**

**Rule going forward:** anything on a solid `bg-brand` (or any coloured fill)
takes `text-white`, not the ink tokens. Swept the whole of `src/` to confirm no
grey token remains on a brand fill, static or hover.

**Verified:** `tsc` clean, build passes, and the rendered HTML shows
`<h2 class="display-lg text-white">` and `<p class="... text-white">` inside the
`bg-brand` slab.

### 2026-09-07 - Five image limit per vehicle

- `MAX_VEHICLE_IMAGES = 5` in `src/types/car.ts`. **Deliberately not in
  `cars.ts`:** `CarGallery` is a client component, and importing the constant
  from the data module risks pulling the whole fleet array into the browser
  bundle. `types/car.ts` has no data in it.
- Applied **once, at the source**. `cars.ts` now declares the literal as
  `fleet` and derives `const cars = fleet.map(car => ({...car, images:
  car.images.slice(0, MAX_VEHICLE_IMAGES)}))`. Every accessor reads `cars`, so
  no page, component or structured-data builder has to remember the limit.
  When this becomes a database query, apply the same cap there.
- `CarGallery` also slices defensively, since it takes `images` as a prop from
  any caller.
- Fixed a real bug next to it: the thumbnail rail keyed on `key={shot}`. A
  vehicle may legitimately repeat an image path, and duplicate keys break
  React's reconciliation. Keyed on path plus index now.

**Verified by proving it, not by reading it:** temporarily gave one vehicle
eight images, rebuilt, and confirmed the page rendered exactly five (a to e)
and the `Product` JSON-LD `image` array carried exactly five. Then reverted.

> ### A mistake worth not repeating
>
> That revert was done with `git checkout -- src/lib/data/cars.ts`, which
> discards **all** uncommitted changes to a file. This repo still has only the
> one `dfsdfsfsdf` commit, so it silently wiped a day of work on that file:
> the kilometre removal, the new image paths, `getShowcaseCars`, the `fleet`
> rename and the cap itself. It was caught by `tsc` and fully rebuilt.
>
> Two lessons. **Do not use `git checkout --` as an undo while the baseline is
> uncommitted** (see §7e, still open). And note the working tree is **CRLF**;
> Node scripts doing multi-line string matching must normalise `\r\n` first or
> every anchor silently fails to match.

**Re-verified after the restore**, on a served build: 8 tiles on the home page
all on `bg-tile`, the three photos referenced, one Heiyanthuduwa location, no
"Most booked", "head-turner", "View details", "km free per day" or "Where
people go" anywhere, and the Prius page showing unlimited kilometres and its
three gallery images.

### 2026-09-07 (later) - Hero trimmed and dropped

Client: remove the promises row and the rating line from the hero, move the
wordmark and image down a little, and do not change the gap between them.

- Removed the three promises (Insurance included, Free Colombo delivery, No
  hidden charges) and the rating plus stats line (4.8, 412 reviews, 40+
  vehicles, 12,000+ completed rentals). The `Check` and `Rating` imports and the
  `promises` const went with them. The hero is now wordmark, image, one
  paragraph, one button.
- Moved the pair down by extending the **section top padding only**:
  `pt-[calc(4.75rem+var(--gap)+2rem)]` and
  `sm:pt-[calc(5.5rem+var(--gap)+3rem)]`.
  **The `-mt-4 sm:-mt-8 lg:-mt-12` on the image is what sets the
  wordmark-to-cars gap, and it was left untouched**, so the two move together.

**Verified:** read the shipped stylesheet, because a Tailwind arbitrary value
with a nested calc fails silently. Both `calc(4.75rem + var(--gap) + 2rem)` and
`calc(5.5rem + var(--gap) + 3rem)` were emitted. The rendered home page has zero
occurrences of the removed copy and still carries the original negative margins.

> **Shell note:** this entry had to be written twice. Passing Markdown through
> `node -e "..."` inside bash lets the shell evaluate every backtick as command
> substitution, which silently strips all the code spans. Write docs with the
> Write or Edit tool, or a heredoc, not through an inline `node -e` string.

### 2026-09-07 (build) - The staff panel

Built phases 1 to 3 of the plan against a local store. No Supabase, no SMS.
Full description in [`panel.md`](./panel.md), including test accounts.

**Added:** `/999p7k` sign in, six panel screens, `src/lib/panel/*` (store,
auth, guard, time, window), `src/lib/fleet.ts`, `src/proxy.ts`, heartbeat and
away route handlers.

**Wired the public site to it.** The three forms create real bookings and
enquiries. Server pages moved from `@/lib/data/cars` to `@/lib/fleet` so the
customer-facing list reflects what staff do. `cars.ts` stays pure because
`FleetBrowser` is a client component that imports `filterCars` from it, and
pulling `node:fs` in through that import would break the browser bundle.

**Proven, not assumed.** A temporary self-test route exercised the real
modules and was then deleted. All 19 checks passed: a booked vehicle leaves the
public list while staff still see it, soft delete hides but keeps it, the owner
writes freely, an employee without a window is blocked, a wrong code is
refused, another employee's code is refused and logged, the code is destroyed
on use and cannot be reused, a fleet window does not unlock pricing, a window
on one vehicle does not unlock another, closing relocks, and the sweeper ends a
dead segment at its last heartbeat rather than at sweep time.

Also verified over HTTP: `/panel` redirects signed-out visitors, a **forged
cookie signature is rejected by the data layer** even though proxy lets it past
(which is the point of the two layers), `/panel/team` bounces an employee, and
the fleet screen shows an employee the request form with no create or remove
controls while the owner gets the reverse.

**Two things that cost time and are worth knowing:**

- A route folder starting with `_` is a **private folder** in the App Router and
  is never registered. `/api/panel/_selftest` silently 404ed until renamed.
- Bash tool calls are sandboxed per invocation, so a file written by a server
  started in one call is not visible to a later call. `.data/panel.json` was
  being written correctly the whole time; it just could not be seen from
  outside that process. It will persist normally in a plain terminal.

**Next:** Supabase, then Text.lk for the OTP. `panel.md` lists the other gaps
(photo upload, break-glass access, revocable sessions).

### 2026-09-07 (fix) - Route groups: the panel had the customer chrome

Client spotted the "Ready when you are" footer CTA on the staff screens. The
panel was nested inside the root layout, so **every panel page was rendering
the customer navbar and the footer**, including a Book a vehicle button. So was
the sign-in page. My oversight when building it.

Fixed structurally rather than patched:

```
src/app/
  layout.tsx           html, body, fonts, sitewide metadata. NOTHING visual.
  (site)/
    layout.tsx         navbar, footer, skip link, organisation JSON-LD
    page.tsx about/ booking/ contact/ faq/ fleet/ privacy/ services/ terms/
    not-found.tsx      404 inside the site, inherits the chrome above
  999p7k/  panel/      no group, so no customer chrome
  not-found.tsx        global 404 for unmatched URLs, deliberately bare
```

**Route groups change nothing about URLs**: `(site)/fleet/page.tsx` is still
`/fleet`. Nothing was renamed and no links changed.

> **A trap worth knowing.** My first attempt put the navbar and footer into the
> root `not-found.tsx` so 404s kept their chrome. The panel then still showed
> "Ready when you are" in the HTML, because **Next embeds the root not-found
> component in the RSC payload of every page**. It was inside the serialized
> flight data rather than rendered markup, so invisible, but it shipped the
> entire footer on every request. The root 404 is bare for that reason, and the
> site group has its own chromed one.

**Verified on a served build:** zero occurrences of the footer CTA or any
customer nav across all six panel screens and the sign-in page, while every
public page still has navbar, footer, correct canonicals and its JSON-LD.
`/nope` still returns a real 404.

### 2026-09-07 (fix) - Invisible dropdown options

Client reported white text on white in every dropdown, on the site and in the
panel.

**Cause.** Selects carry `bg-field`, which is `rgba(255, 255, 255, 0.085)`. The
browser draws the option popup *outside the page*, so that translucent white
composites over the popup's own white ground rather than over the black page.
Text meanwhile inherited `--color-ink` (`#e9edf5`). Measured contrast:
**1.17:1**, which is genuinely unreadable.

**Fix.** One element-level rule in `globals.css`, so every select on the site
and in the panel is covered without any component knowing about it:

```css
select option, select optgroup {
  background-color: var(--color-charcoal);  /* opaque #05070c */
  color: var(--color-ink);
}
select option:disabled { color: var(--color-muted); }
select option:checked  { background-color: var(--color-brand); color: #fff; }
```

Contrast after: **17.17:1** normal, 6.01:1 disabled, 4.83:1 on the selected
row. See the rule in section 5.

The navbar's services dropdown was never affected: it is a `div` on
`--color-overlay`, which is already opaque.

**Verified** in the shipped stylesheet, not just the source, since the whole
point is what the browser actually receives.

### 2026-09-07 (fix) - Hero too big on tablets and short laptops

Client viewed the site on a Galaxy Tab S7 in landscape: the hero image filled
the screen and nothing below it was reachable.

**Cause.** The hero was sized off viewport **width** only. The wordmark is
`15.5vw` and the vehicle band is a 5:2 frame at full shell width, so its height
is always 40% of the shell. That is fine on a screen whose height is
proportionate to its width, and wrong on a wide but short one. On the tablet in
landscape (about 1138x712 CSS) the band was 430px, 60% of the screen, and its
bottom edge landed at 686px against a 712px fold. The paragraph and the button
were below it, so the hero really did cover everything.

**Fix.** One new token, `--hero-cap: 125svh` in `globals.css`, bounds the hero
by screen height as well as width:

- `.hero-stage` wraps the wordmark and the image, `max-width: var(--hero-cap)`,
  centred. The stage is a 5:2 frame, so a width of `125svh` is a vehicle band
  exactly `50svh` tall. It stays full width until that binds.
- `.display-hero` now reads
  `clamp(3.25rem, min(15.5vw, calc(0.155 * var(--hero-cap))), 11.5rem)`. The
  second term is the same 15.5%, taken of the capped stage width instead of the
  viewport width, so the wordmark shrinks by exactly the factor the vehicles do
  and the two stay in proportion. The `var()` carries a fallback so the clamp
  stays valid if the class is ever used outside the hero.

**Why one number drives both.** Capping only the image would leave a wordmark
sized for a screen the hero no longer fills, and the negative margin would pull
the cars into the wrong part of the lettering. Tying both to `--hero-cap` means
the composition is scaled, not rebalanced, and tuning the hero on short screens
is a single edit.

**Deliberately untouched:** the `-mt-4 sm:-mt-8 lg:-mt-12` overlap, the derived
`object-position: 50% 62.6%` (it depends on the frame's aspect ratio, which has
not changed, not on its size), and the section's top padding.

`svh` not `dvh`, so the hero is sized for the worst case with the browser
toolbars showing and does not resize as the address bar hides.

**Measured, by mirroring the shipped CSS rather than eyeballing it.** Image
height as a share of the screen, before to after:

| Screen | Band height | Share of screen |
| --- | --- | --- |
| Phone portrait 390x730 | 140 to 140 | 19% (unchanged) |
| Tab S7 portrait 712x1050 | 266 to 266 | 25% (unchanged) |
| Tab S7 landscape 1138x712 | 430 to 356 | 60% to 50% |
| Laptop 1366x768 | 486 to 315 | 77% to 50% |
| Laptop 1080p 1920x950 | 486 to 475 | 51% to 50% |

So **phones and tablet portrait are byte for byte unchanged**, which is what
the client asked for, and a 1080p laptop moves by 2%, which keeps it as the
reference the other sizes are being matched to. Landscape phones and 768px
laptops were suffering the same fault and are fixed by the same token.

**Verified**

- `tsc` clean, build passes, 32 routes.
- Read the **shipped** stylesheet, since a minifier can rewrite or drop a
  `min()` nested in a `clamp()`. All three survive intact:
  `--hero-cap:125svh`, `.hero-stage{width:100%;max-width:var(--hero-cap);
  margin-inline:auto}` and the full `clamp(...min(15.5vw, calc(.155 *
  var(--hero-cap,125svh)))...)`.
- Served on :3117 and confirmed the rendered HTML wraps the `h1` and the image
  frame in one `.hero-stage`, with the paragraph and the button left outside it
  at full shell width. Server stopped.
- Not seen in a real browser: there is still no browser tooling in this repo,
  so the check was structural plus arithmetic. Worth a look on the tablet.

### 2026-09-07 (change) - The owner is not on a timesheet

Client: the owner does not have a shift, and nothing about him should be
recorded. Time tracking is for the two employees.

**Why it was wrong.** Nothing distinguished the roles in the timesheet. Signing
in opened a shift for whoever signed in, the panel shell mounted the heartbeat
for anyone with an open shift, and the owner appeared on his own team report
with a row measuring himself. The plan always framed the timesheet as the owner
watching employees (see plan sections 3 and 7); it was simply never enforced.

**Where the rule lives.** One predicate, `tracksTime(data, staffId)` in
`src/lib/panel/time.ts`, in the **data layer** rather than in the UI. Same
reasoning as `assertCanWrite`: a control that exists only in the screen is a
courtesy. Every entry point is covered without any call site testing a role:

| Function | For the owner |
| --- | --- |
| `openShift` | returns `null`, writes nothing. Return type is now `WorkShift \| null` |
| `closeShift` | no-op |
| `recordHeartbeat` | returns `false`, no segment created |
| `markAway` | no-op |
| `currentShift` | `null` |
| `shiftsForDate` | owner rows filtered out |
| `whoIsPresent` | owner ids filtered out |

The read side filters as well as the write side, deliberately. A development
store written before this rule already holds owner rows, and filtering on read
keeps them out of every report without requiring `.data/panel.json` to be
deleted.

> **The old rows are still on disk.** The live dev store has one owner shift and
> one owner presence segment from earlier testing. They are invisible in the
> panel now, but **the Supabase migration must not carry them over**, and if the
> store is ever inspected by hand they are still there. Deleting
> `.data/panel.json` clears them.

**UI, all downstream of the same rule**

- `/panel/team`: the lifetime totals table is filtered to employees, so the
  owner has no row at all. The intro says so.
- `/panel`: the owner's day section carries one line explaining he is not on the
  timesheet, so his absence from his own report reads as deliberate. It gates on
  the new exported `isTimeTracked(staffId)`, not on `role`, so there is one
  source of truth.
- The panel shell: `currentShift` is `null` for him, so neither `ShiftClock` nor
  `Heartbeat` mounts and his tab sends no beats at all.
- `/999p7k`: the copy said "Signing in starts your shift" to everyone. It now
  addresses employees and states plainly that the owner's account is not timed.
  That is disclosure as much as copy, which HANDOVER section 7d asks for.

**Still recorded for the owner: the audit log.** `data.audit` keeps entries for
what the owner *does* (confirming a booking, editing a vehicle, opening a
window), and `/panel/activity` still shows them. That is provenance for changes
to shared records, not presence tracking, and the access-request trail is
incomplete without it. Say the word if the owner wants his actions out of the
log too, but that is a different change with consequences for the OTP audit
trail.

**Proven, not assumed.** A temporary route at `/api/panel/ownercheck` exercised
the real modules and was deleted afterwards. It snapshotted the store on entry
and restored it in a `finally`, so the dev data is unchanged. All 17 checks
passed: the owner is not tracked and an employee is; `openShift` returns null
and writes no row; the heartbeat is refused and adds no segment; `markAway`
writes nothing; `currentShift` is null; `closeShift` leaves an existing owner
row untouched rather than closing it; an employee's shift, heartbeat, current
shift and presence all still work; and an owner shift and segment injected
straight into the store are hidden from both `shiftsForDate` and `whoIsPresent`
while the employee alongside them stays visible.

One assertion failed on the first run, and the code was right: it asserted the
store held zero owner presence segments, which was false because of the rows
described above. Rewritten as a before-and-after delta on the same call.

**Verified:** `tsc` clean, build passes.

### 2026-09-08 - The add-vehicle form was missing the copy the customer reads

Client, as the owner: adding a vehicle gives no way to write the "About this
vehicle" paragraph or the "Features and equipment" list, and the add form must
carry everything a vehicle needs.

**How bad it actually was.** Worse than a missing textarea:

- The add form had **no description field at all**, yet
  `createVehicleAction` read `formData.get("description")`. So every
  panel-added vehicle was created with `description: ""`.
- `features` was **hardcoded to `[]`** in `createdToCar()` in `src/lib/fleet.ts`.
  There was no field, no store column and no way to set one.
- The result on the public vehicle page: an "About this vehicle" heading over
  an empty paragraph, and a "Features and equipment" heading over an empty
  list. Two empty sections on every vehicle the owner added.
- Nothing was editable afterwards either. `VehicleOverride` had no copy fields,
  so even the twelve catalogue vehicles had no route to fix their own wording.

Also missing from the add form, all of which the vehicle page renders:
tagline, luggage (**hardcoded to 2**), engine cc, the weekly, monthly and
deposit rates, and the with-driver rate (**hardcoded to `null`**, which is what
makes a vehicle read as self drive only). The client's own example is a
chauffeur-driven wedding car, so that last one mattered.

**Data model**

- `CreatedVehicle` gains `tagline` and `features`.
- `VehicleOverride` gains `tagline?`, `description?` and `features?`, so the
  copy is editable on catalogue vehicles too, not just panel-added ones.
- `applyOverride()` and `createdToCar()` in `src/lib/fleet.ts` carry them
  through. `MAX_VEHICLE_FEATURES = 12` sits in `src/types/car.ts` beside the
  image cap, for the same reason: no data in that file, so client components
  can import it freely.

> **`??`, not a truthiness test.** In `applyOverride()` an empty string and an
> empty array are **real values**: they mean the owner cleared the box. A
> `||` there would silently resurrect the catalogue copy the moment someone
> emptied a field, and the bug would look like the save had failed.

**Both forms**

- `/panel/fleet` add form: rebuilt into three groups under hairline rules,
  "The vehicle", "Rates in LKR" and "What the customer reads". It now sets
  every field the vehicle page shows. Blank rates still fall back to the
  catalogue's own multiples (6x daily weekly, 24x daily monthly) so a hurried
  add still produces sane pricing.
- `/panel/fleet/[slug]` edit form: gains tagline, description and features, so
  copy can be corrected after the fact. **A description you cannot fix is a
  bug**, and the catalogue vehicles never had an edit route for theirs at all.
- The feature placeholder is the client's own wedding-car list, so the control
  explains itself.

**Parsers moved out of `actions.ts`**

`clamp`, `plainText`, `featureLines` and `optionalRate` now live in
`src/lib/panel/vehicle-form.ts`. Not tidying: `actions.ts` is `"use server"`,
where **every export must be an async server action**, so a helper there can be
neither exported nor tested. Pure functions in a plain module can be both.

- `featureLines()` splits on newlines, normalises CRLF, strips a leading
  bullet, dash, asterisk or dot, drops blank lines, caps each line at 90
  characters and the list at `MAX_VEHICLE_FEATURES`. The owner pastes a
  bulleted list out of a document and it lands clean.
- `optionalRate()` treats blank **and zero** as `null`, so an empty with-driver
  box means self drive only rather than a free chauffeur.

**Proven, not assumed.** A temporary route at `/api/panel/vehiclecheck`
exercised the real modules and was deleted afterwards; it snapshotted the store
and restored it in a `finally`. All 22 checks passed, including: a pasted list
mixing dashes, bullets, asterisks, blank lines and CRLF comes out as six clean
features; the list caps at 12; blank and zero with-driver rates give `null`
while 14500 survives; a created vehicle carries its description, features,
tagline, with-driver rate and a luggage value of 3 (not the old hardcoded 2)
all the way through `publicCarBySlug`; an override rewrites a **catalogue**
vehicle's description, features and tagline while `src/lib/data/cars.ts` stays
untouched; and an emptied feature list stays empty instead of falling back.

Verified over HTTP as the owner, on the running dev server: the add form
renders all nine previously-missing field names plus both textareas and the
three group headings, and the edit form renders the tagline field and both
textareas with the Prius's existing catalogue description prefilled.

**Still frozen after creation:** brand, year, category, luggage, transmission,
fuel, engine size and the with-driver rate. `VehicleOverride` has no fields for
them. Adding them is mechanical and is written up in `panel.md`.

> **Two shell traps, both cost time.** Passing escape-heavy code through a
> quoted bash heredoc mangled it: `\r\n` and `\s` in the source arrived as a
> real newline and a bare `s`, which `tsc` caught as an unterminated regular
> expression. Write such files with the Write tool and `String.raw`, per the
> note in the 2026-09-07 hero entry. Separately, `src/lib/fleet.ts` is **CRLF**
> while the rest of `src/` is LF, so multi-line anchors silently matched zero
> times until the edit helper normalised endings and restored them on write.

**Verified:** `tsc` clean, build passes.

### 2026-09-08 (later) - Booking alerts by SMS, via Text.lk

Client opened a Text.lk account and asked for the owner and both employees to
be texted whenever someone books a vehicle. Built. Setup steps, costs and the
remaining gaps are in [`sms.md`](./sms.md).

> **This deviates from the channel split in section 6**, which put booking
> notifications on WhatsApp. Deliberate, and an improvement: the alert goes to
> **our own staff**, not to a customer, so it needs no Meta template and no
> Business verification. WhatsApp is still the right channel for messaging the
> *customer*, and that decision is untouched. It just is not on the critical
> path any more.

**Added**

- `src/lib/sms/textlk.ts` - the gateway. `POST app.text.lk/api/v3/sms/send`
  with a Bearer token. Also owns phone normalising and segment counting.
- `src/lib/sms/notify.ts` - who gets told, what it says, and the log.
- `.env.example` (committed) and `.env.local` (gitignored, waiting for the
  token). `TEXTLK_API_TOKEN`, `TEXTLK_SENDER_ID`, `SMS_ENABLED`.
- `/panel/team` gains **Booking alerts by SMS**: a number per person, an
  alerts on/off toggle, a **Send a test** button, and the last messages sent
  with their status and error text.

**Data model**

- `StaffUser` gains `phone` and `smsAlerts`. The number is stored **as typed**
  and normalised only at send time, so the owner reads back what he entered.
- `PanelData` gains `messages: SmsMessage[]`, capped at 200. Each row keeps
  Text.lk's own message id, per the plan's "store the provider message id".
- **`hydrate()` in `store.ts` is new and matters.** The store on disk was
  written before these fields existed, so `data.messages.push()` would have
  thrown on the first booking. It fills missing fields on every read and never
  overwrites. Every future field added to the store needs a line there, or a
  developer store from last week takes down the new code.

**Three decisions worth knowing**

- **`after()`, not `await`.** The booking is saved first and the customer sees
  "request sent" immediately; the texts go out after the response. A dead
  gateway can never make a customer's booking hang or fail. Nothing in
  `src/lib/sms/` throws at its caller, for the same reason.
- **One HTTP call per recipient**, although Text.lk accepts a comma-separated
  list. One call means one delivery record per person, so "the owner got it and
  Kasun did not" is a fact in the log rather than a guess.
- **The message is built to fit one 160 character GSM-7 segment**, with the
  customer name and vehicle name clipped rather than left to run. One segment
  is one unit of credit, on every booking, forever. A single Sinhala character
  would drop the limit to 70 and double the bill, so `measure()` records the
  encoding and segment count of everything sent.

**The owner is on this list.** He is excluded from the timesheet (see the
2026-09-07 change) but not from notifications: `bookingRecipients()` treats him
like anyone else, because this is an alert and not presence tracking.

**Proven, not assumed.** A temporary route at `/api/panel/smscheck` exercised
the real modules and was deleted afterwards; it snapshotted the store and
restored it in a `finally`. **All 64 checks passed**, including: six input
forms of a Sri Lankan number normalise to `94771234567` and five bad ones are
rejected; Sinhala text is detected as UCS-2 and 71 characters of it bills as 2
segments; the booking message is 88 characters and one segment, and stays one
segment when handed a 120 character name and a 120 character vehicle; blank
numbers, opted-out people, disabled accounts and unparseable numbers all drop
off the recipient list while the owner stays on it; with the gateway stubbed,
the request carries the right URL, `Bearer` token, `sender_id`, `type: plain`
and **one** normalised recipient per call; the provider uid is stored; and a
provider error, an HTML error page, and a thrown network error each come back
as a recorded failure rather than an exception.

**Sent for real, same day.** The client pasted an API token and we ran one live
booking through `createBookingAction` on `TextLKDemo`, Text.lk's sandbox
sender, since our own sender ID is not approved yet. Text.lk accepted it: uid
`6a9ff544532c1`, status `sent`, one segment, to the owner's number. The
throwaway booking was removed from the store afterwards and the delivery record
kept.

**Still on the owner:** an approved sender ID (`TextLKDemo` cannot carry real
traffic), and the two employees' numbers typed into `/panel/team`.

**Verified:** `tsc` clean, build passes, 32 routes.

> **Trap, cost a rebuild.** `next dev` writes route types into
> `.next/dev/types/validator.ts`. Delete a route folder and `tsc --noEmit`
> keeps failing on the stale entry until `.next/dev/types` is removed. The
> error names a file that no longer exists, which reads like a broken import.

### 2026-09-11 - Hybrid is a drivetrain, not a fuel. Rate off the tiles

Client, twice over: the vehicle tiles should not lead with the daily rate, and
the fuel line says "Hybrid", which is not a fuel. A hybrid still takes petrol,
so the vehicle page was answering "what does this take at the pump" with an
answer nobody can put in a tank.

**The split**

- `FuelType` is now `petrol | diesel | electric`. **Hybrid is gone from it**
  and lives in the new `CarSpecs.hybrid` boolean.
- Five catalogue vehicles were recorded as `fuel: "hybrid"`: the C-HR, Prius,
  Wagon R Stingray, Aqua and Vezel. All five are now `fuel: "petrol"` with
  `hybrid: true`. The other seven gained `hybrid: false`.
- The vehicle page shows the real fuel and, **only when the vehicle is a
  hybrid**, a seventh Drivetrain cell reading "Hybrid". A `Drivetrain:
  Standard` cell on nine vehicles would be noise, and on the Leaf it would be
  nonsense.
- schema.org `fuelType` is built by `fuelDescription()` in `seo.ts`:
  "Petrol hybrid" for a hybrid, plain "Petrol" or "Diesel" otherwise. The
  vehicle meta description follows the same wording.

**Tiles**

`CarCard` now shows **seats, fuel, gearbox**. The daily rate cell is gone. The
client confirmed it should go from the fleet page as well as the home page, so
this is one component with no variant. `/fleet` keeps its maximum-price filter
and its two price sorts, which still work against a number the tile no longer
prints; worth a look if that reads oddly in use.

**Filtering**

Hybrid was an option in the fleet page's fuel dropdown, which is exactly the
confusion being removed. It is now a **Hybrid only** checkbox under that
dropdown, and `CarFilters.hybrid` narrows rather than replaces: "petrol" and
"hybrid only" are two answerable questions at once. Asking for petrol now
returns the hybrids too, because they burn petrol.

**Panel**

- The add form's Fuel select offers petrol, diesel and electric, with a
  **Hybrid** tick box beside it.
- **Fuel and the hybrid flag are editable after creation**, unlike the other
  specs. Deliberate: the twelve catalogue vehicles shipped with "hybrid"
  recorded as their fuel, and that had to be correctable without a deploy.
  `VehicleOverride` gained `fuel` and `hybrid` to make that possible.
- `fuelChoice()` and `checkbox()` joined the parsers in `vehicle-form.ts`.
  `fuelChoice` pins anything unrecognised to petrol, which matters because
  "hybrid" was a valid value until today and a stale form can still post it.
- **`hydrate()` in `store.ts` migrates the store on read**: a created vehicle
  or an override holding `fuel: "hybrid"` becomes petrol with the flag set.
  This is the first thing in `hydrate()` that rewrites a stored value rather
  than filling a missing one, and the doc comment there now says when that is
  allowed: only when the old value can no longer be represented.
- The audit summary mentions a fuel or hybrid change like any other edit.

**Proven, not assumed.** 22 checks against the real modules, run through
`node --experimental-strip-types` with a small resolver for the `@/` alias
rather than a temporary API route, so nothing had to be added to the app and
deleted afterwards. The script snapshotted `.data/panel.json` and restored it
in a `finally`, and the last assertion is that the dev store came back as it
was found. Covered: a posted `fuel=hybrid` never reaches the store; a stored
vehicle and a stored override both migrate; a migrated vehicle arrives at
`listVehicles()` as petrol plus hybrid; no vehicle anywhere reports hybrid as
a fuel; "hybrid only" returns only hybrids; petrol includes the hybrids;
diesel excludes them.

**Verified** on a served production build: the home page has zero "LKR / day"
and eight tiles each carrying Fuel and Gearbox, with no "Hybrid" anywhere. The
Prius page reads Fuel "Petrol" plus Drivetrain "Hybrid" and emits
`"fuelType":"Petrol hybrid"`; the Prado reads Diesel and the Leaf Electric,
neither with a Drivetrain cell. `/fleet` renders the Hybrid only checkbox and
no `<option value="hybrid">`. The two panel forms were fetched as the owner,
with the session cookie minted from the app's own `createSessionValue()`: the
add form offers three fuels and the tick box, and the Prius edit form comes
back with petrol selected and Hybrid checked. `tsc` clean, build passes, 34
routes.

> **Worth keeping: the TypeScript modules can be run directly.**
> `node --experimental-strip-types` plus a ~25 line resolve hook that maps
> `@/` and stubs `next/server` and `next/headers` runs the real `src/lib`
> modules outside Next. That is a lighter way to prove data-layer behaviour
> than the temporary-API-route pattern used in earlier sessions, and it avoids
> the stale `.next/dev/types` trap that follows deleting a route.

### 2026-09-11 (later) - New hero photographs, and three next/image warnings

Client: fix the three warnings `next dev` prints, and put the two new lineup
photographs on the home page, the wide one for desktop and the other for
phones.

**The hero is now art directed** (`Hero.tsx`)

`home-new-vehicles-lineup.png` (1774x887, eight vehicles) on desktop,
`home-new-vehicles-lineup-mobile.png` (2000x2000, three vehicles) below 768px.

- **One download, not two.** Two `<Image>` components toggled with `hidden`
  would have made every phone fetch the desktop file as well: a display:none
  image is still fetched. So this is `getImageProps()` feeding a `<picture>`,
  which is the Art Direction pattern in the Next 16 image docs, and the
  browser picks one.
- **Two frames, because the two photographs are different shapes.** The
  desktop lineup is a 5:1 strip; the phone one is 2.7:1. The frame is
  `aspect-[5/2] md:aspect-[5/1]`, and the vertical `object-position` is
  derived with the same formula the old hero used, re-run against freshly
  measured opaque boxes: **56.2% on desktop, 62.6% on mobile**. The mobile
  number is unchanged from the old hero because that file has almost exactly
  the same geometry. The working is written out in the component.
- A single 5:2 frame for both would have left the desktop lineup swimming in
  half a frame of empty transparent space, which is the exact fault the
  2026-09-06 crop work removed.
- `--hero-cap` is untouched at `125svh`. Its comment was, because the band it
  bounds is now 5:2 on phones and 5:1 above them.
- **`hero-fleet.png` is now unreferenced by any page.** It is still in
  `public/images/home/`, not deleted. The one thing that still pointed at it,
  the `image` on the business JSON-LD in `seo.ts`, now points at the new
  desktop lineup, so search results and link previews show what the site
  actually shows.

**Warning 1: LCP image not preloaded**

The vehicle page's gallery plate **already had `priority`** and was already
preloaded; that was confirmed in the served HTML before anything was changed.
The images that were genuinely lazy, and genuinely the largest thing on their
page, were the **vehicle tiles**: `/fleet` had no eager image at all, and on
the home page the first tile is `fleet-01.jpg`, the file the warning named.

- `CarCard` takes an `eager` prop; `FeaturedFleet` and `FleetBrowser` pass it
  to the first tile only.
- **Eager, not preloaded.** Which tile is largest depends on the viewport and,
  on `/fleet`, on the filters, and the docs say not to preload when the LCP
  element moves like that. An eager `<img>` still gets a preload link hoisted
  for it anyway, which was verified in the built HTML.

> **Next 16 deprecated `priority` in favour of `preload`.** They are the same
> switch internally (`preload: preload || priority`) and passing both throws.
> `SafeImage` and `CarImage` now expose `preload` and `eager` instead of
> `priority`, and `CarGallery` uses `preload`. The dev warning has changed
> wording to match: it now asks for `loading="eager"`, not for `priority`.

**Warning 2: missing `data-scroll-behavior`**

`globals.css` sets `scroll-behavior: smooth`. Next 16 stopped overriding that
during a route change, so a navigation was smooth-scrolling to the top of the
new page instead of landing there. `data-scroll-behavior="smooth"` on `<html>`
in the root layout opts back in: Next forces `auto` for the jump and restores
it afterwards, so in-page anchors stay smooth. Read the mechanism in
`node_modules/next/dist/shared/lib/router/utils/disable-smooth-scroll.js`.

**Warning 3: `sizes` mismatch on the hero**

The warning fires when a `fill` image has `sizes="100vw"` and renders at under
60% of the viewport. The hero is **one shell wide, not one viewport wide**: it
stops at `--shell` (1280px), so on a 2560px monitor it was asking for an image
twice the width it draws at. It is now
`sizes="(min-width: 1280px) 1280px, 100vw"`.

> Not the `(max-width: 768px) 100vw, 50vw` in the request. 50vw would be wrong
> here: the hero is full width at every breakpoint, and it is the shell cap,
> not a column, that limits it.

**Verified**

- `tsc` clean, build passes, 34 routes.
- Read the **shipped stylesheet**, since a Tailwind arbitrary value fails
  silently: `.md\:aspect-\[5\/1\]` is emitted (as `aspect-ratio:5`, which is
  the same thing normalised), both object-position utilities are there, and
  the 5:1 rule sits inside the `md` block.
- Served build: `<html ... data-scroll-behavior="smooth">`, one `<source
  media="(min-width: 768px)">` carrying the desktop file with the mobile file
  on the `<img>`, `loading="eager"` and `fetchPriority="high"` on it, the
  vehicle page still preloading its gallery plate, and the first tile of the
  home and `/fleet` grids eager with every other tile still lazy.
- The optimiser serves both new files: **28KB of WebP at 640px** and 126KB at
  1920px, against 438KB and 898KB of source PNG.
- The crops were checked by rendering them, not by trusting the arithmetic:
  both frames were reproduced with sharp at real widths and looked at.
- Still not seen in a real browser. There is no browser tooling in this repo,
  so the LCP claim in particular is reasoned from the served HTML and from the
  warning's own condition in `next/dist/shared/lib/get-img-props.js`, not
  measured with one.

### 2026-09-11 (last) - The brand red is now #FF5151

Client: the red used for buttons, text and boxes should be `#ff5151`, or
lighter in that vibe.

**A token change, not a sweep.** Nothing in the app hardcodes a red, so this
is six values in `globals.css` plus the two files that cannot read CSS.

| Token | Was | Now |
| --- | --- | --- |
| `--color-brand` | `#e01b22` | **`#ff5151`** |
| `--color-brand-hover` | `#f5343b` | **`#ff3b3b`** |
| `--color-brand-bright` | `#ff5b61` | **`#ff7a7a`** |
| `--color-brand-deep` | `#8e1420` | `#b83232` (declared, unused) |
| `--color-brand-tint` | `rgba(255, 58, 64, .14)` | `rgba(255, 81, 81, .14)` |
| `--color-brand-tint-strong` | `rgba(255, 58, 64, .26)` | `rgba(255, 81, 81, .26)` |

**Hover now goes darker, not lighter.** The old palette lifted the fill on
hover because the fill was dark. At this lightness that backfires: white label
text on a lifted `#ff6a6a` is 2.79:1, worse than the resting state. Deepening
to `#ff3b3b` instead takes white from 3.21:1 to 3.53:1 and still reads as a
state change.

**Also updated, because Satori cannot read a stylesheet:** `src/app/icon.tsx`
(the favicon) and `src/app/opengraph-image.tsx` (the share card, which carried
both the fill and the old bright red). Both carry a comment saying they must
move with the tokens.

> **Contrast, measured, and worth knowing.** White on the new brand fill is
> **3.21:1**, down from 4.83:1. That is below the 4.5:1 WCAG AA asks of normal
> text, and it is inherent to a red this light: no red bright enough to read as
> `#ff5151` can carry white text at AA. It still clears the 3:1 bar for large
> text and UI components, and everything else improved: the wordmark and other
> red-on-black text went from 4.35:1 to **6.55:1**, and accents from 6.92:1 to
> **8.32:1**. If the button text ever has to pass AA, the two ways out are a
> darker fill behind white text, or near-black text on this fill (6.28:1).
> Both are visible changes and neither was made unilaterally.

**Verified**

- `tsc` clean, build passes, 34 routes.
- Read the **shipped stylesheet**: `--color-brand:#ff5151`,
  `--color-brand-hover:#ff3b3b`, `--color-brand-bright:#ff7a7a` and
  `--color-brand-tint:#ff515124` are all emitted, and there are **zero**
  occurrences of `e01b22`, `ff5b61` or `f5343b` left in it.
- The favicon and the Open Graph card were **rendered and sampled pixel by
  pixel**, not assumed: the icon is `#ff5151` and the card's palette is
  `#000000`, `#e9edf5`, `#ff5151`, `#adb7c9`, `#ff7a7a`.
- Contrast figures above come from a WCAG relative-luminance calculation, not
  from eyeballing.

### 2026-09-11 (nav) - The logo artwork is in the navbar

Client dropped `nav--bar-logo.png` into `public/images/home` and asked for it in
the navigation bar.

**The file needed cropping first.** It is a 2000x2000 square whose artwork
occupies `x 75 to 1950, y 840 to 1246`: **80% of it is empty**, the same trap
the hero images had. Used as supplied, the browser would download a mostly
blank square and the optimiser would decode 4 megapixels to paint a 166x36
strip. So it is cropped to its own edges and resized to 768px wide, written to
**`public/images/brand/nav-logo.png`**: **207KB becomes 37KB**, and 18.6KB of
WebP on the wire at 2x.

- The original is **left untouched** in `public/images/home/`. Nothing
  references it now, so it can be deleted whenever the client is happy.
- New folder, `public/images/brand/`, because a logo is not home-page imagery.

**`Logo` now has two forms** (`src/components/layout/Logo.tsx`)

| `variant` | What it renders | Where |
| --- | --- | --- |
| `"image"` | the artwork | the navbar |
| `"text"` (default) | the typographic lockup, unchanged | the footer |

The footer keeps the text form on purpose: it spells out "Cabs & Rent a Cars",
which the artwork does not carry, and it is the only place on the page the full
business name appears in text. Say the word if it should be the artwork there
too; it is one prop.

- Sized by height (`h-9 lg:h-10`) with `w-auto`, so the 4.6:1 mark sits inside
  the 64px bar (72px at lg) with room to spare, at 166x36 CSS px.
- `width={184} height={40}` is the **rendered** size, not the file's. That is
  what makes next/image emit a 256w 1x and 384w 2x srcset instead of asking
  for the 768px source.
- `loading="eager"`: it is above the fold on every page, and a lazy logo leaves
  a hole where the brand should be.
- `alt=""`, because the `<Link>` already carries
  `aria-label="Extra Cabs & Rent a Cars, home"`. Labelling both would announce
  the name twice.

> **The artwork's red is the OLD red.** Sampled: it clusters around `#e02e2f`
> and `#e72729`, which is the `#e01b22` family the site moved away from earlier
> today. So the navbar mark reads slightly deeper than the `#ff5151` now used
> everywhere else. Left as supplied rather than recoloured, because shifting a
> 3D gradient by filter is a good way to ruin it: the fix belongs in whatever
> the artwork was made in.

**Verified**

- `tsc` clean, build passes, 34 routes.
- Served build: the header's `<img>` carries the cropped asset with
  `srcSet="...w=256 1x, ...w=384 2x"`, `loading="eager"`, `alt=""`, the link
  keeps its aria-label, and the footer still renders the text lockup.
- The optimiser returns **18,584 bytes of WebP** for the 2x candidate.
- The mark was **rendered at its true 166x36 size** on the navbar's own
  background and looked at, not assumed: "EXTRA" is crisp and the two car
  outlines still read, though their thinnest strokes soften at that height.

### 2026-09-11 (nav, again) - Second logo artwork, and a caching trap

Client supplied a revised mark, `public/images/home/nav-bar-logo-new.png`. Same
composition, but the two car outlines are **white instead of pale pink**, which
reads much better against the dark bar at 36px.

- Cropped to its opaque box (`x 49 to 1912, y 802 to 1198`, 4.695:1) and
  resized to 768px wide, as before: **160KB becomes 28KB**, 14.7KB of WebP on
  the wire at 2x.
- The declared size moved from `width={184}` to `width={188}`, because the new
  artwork is very slightly wider in proportion. That number is the rendered
  size at `h-10`, and it is what keeps the srcset at 256w/384w.

> **The trap, and it cost a round of verification.** The new artwork was first
> written over `public/images/brand/nav-logo.png`, the same path as v1. The
> built page then served **the old logo**: the image optimiser caches by URL,
> so identical params plus a changed file on disk still hit the cached entry in
> `.next/cache`. It was caught by decoding the served WebP and counting white
> pixels against the file on disk: 0 white in what was served, 2269 in what was
> on disk.
>
> The fix is a **new filename**, `nav-logo-v2.png`, not a cleared cache: every
> browser and CDN that already fetched the old URL has the same stale copy, and
> only a new URL reaches all of them. There is a comment on the `src` in
> `Logo.tsx` saying so. **Replace this artwork by adding a file, never by
> overwriting one.**

`nav-logo.png` (v1) was deleted, since nothing referenced it and leaving the
superseded artwork under the more obvious name is a trap of its own. The
client's own uploads in `public/images/home/` are untouched and can be deleted
whenever they are happy.

**Still the old red.** The new artwork's lettering samples at `#e72a2c` and
`#ec282a`, the same deep family as before, against the `#ff5151` the rest of
the site now uses. Unchanged from the note in the previous entry.

**Verified** on a served production build: the header requests
`nav-logo-v2.png` at 256w 1x and 384w 2x, and the **served WebP was decoded and
compared against the source pixel counts** rather than trusted, which is the
only reason the stale cache was caught at all. `tsc` clean, build passes.

### 2026-09-13 - Booking extras cut to the driver, at LKR 5,000

Client: on step 2 of the booking form, remove every extra except the
professional driver, and the driver is LKR 5,000 a day, not 6,500.

- `bookingExtras` in `src/lib/data/content.ts` is now a single entry,
  `extra-driver`, at `pricePerDay: 5000`. Child seat, GPS unit, WiFi router,
  zero-excess cover and delivery and collection are gone.
- **No component changed.** `BookingForm` already maps over the array for the
  tiles, the summary line and the extras total, so removing the data removed
  the options everywhere at once. The `sm:grid-cols-2` grid renders the one
  surviving tile at half width, which matches the tiles above it.
- Confirmed nothing else referenced the removed ids: `grep` for
  `extra-child-seat`, `extra-gps`, `extra-wifi`, `extra-full-cover` and
  `extra-delivery` over `src/` returns nothing.
- The `pricePerDay === 0` branch that printed "Free" is left in place. It has
  no data behind it now, but it is the right behaviour if a free extra is ever
  added back.

> Note: `/terms` clause on insurance still says "Zero-excess cover can be added
> for a daily charge", and the self-drive service copy still mentions extras.
> Left alone because removing the booking option is not the same as withdrawing
> the product, but say the word if zero-excess is no longer offered at all.

**Verified:** `tsc` clean, build passes, 34 routes.

### 2026-09-13 (later) - The footer carries the artwork, and a map

Client: put the navbar logo in the footer too, and add the Google Maps embed
of the office.

**Logo.** `Footer.tsx` now renders `<Logo variant="image" />` in place of the
`tone="light"` text lockup. No change to `Logo.tsx` itself: both forms were
already there. The footer is **not** paying a second download for it, which was
the thing worth checking: the navbar renders the same artwork at the same
`h-9 lg:h-10`, so both emit the identical `w=256 1x, w=384 2x` srcset and the
browser serves the footer copy from cache.

> The full business name in text is now gone from the page. The artwork says
> "EXTRA" and nothing else, and the text lockup was the only place
> "Cabs & Rent a Cars" appeared as readable words rather than as a link label
> or metadata. The legal name is still in the copyright line directly below,
> which is why this was left as the client asked rather than queried.

**Map.** Two new fields in `src/lib/data/site.ts`, so no URL is hardcoded in a
component:

- `site.mapEmbed` - the iframe src the client supplied, carrying the place id.
- `site.mapLink` - where "Open in Google Maps" goes. **Coordinates**
  (`6.9615799,79.9772074`, read out of the embed URL) rather than a place id,
  because a coordinate link opens the handset map app on both platforms.

It sits in its own row between the link columns and the copyright, as a
three-column caption ("Find us", the address, office hours, the maps link)
beside a nine-column map. **Not a tile in the contact column:** that column is
4 of 12, and a map that narrow shows a street name and nothing that helps
anyone find the place.

- The supplied `width="600" height="450"` and inline `style` were dropped for
  `h-[260px] w-full border-0 md:h-[300px] lg:h-[340px]`. A fixed 600px frame
  overflows a 390px phone, and the design rules put sizing in classes.
- `loading="lazy"` kept, and it matters: this is a third-party frame below the
  fold on **every** page.
- Added a `title`, which the supplied snippet had no attribute for. An iframe
  with no accessible name is announced as "frame" and nothing else.

**Verified** on a served production build, not assumed: the footer HTML carries
the iframe with its lazy loading, referrer policy and title; the text lockup is
gone (zero occurrences of its `textShadow` rule); the logo resolves to
`nav-logo-v2.png` at 256w/384w; and "Find us" and "Open in Google Maps" render.
`tsc` clean, build passes, 34 routes. No CSP headers are set in
`next.config.ts`, so nothing blocks the frame.

Still not seen in a real browser, as ever in this repo. The map is worth one
look on a phone.

### 2026-09-15 - The inline request form is gone from the vehicle page

Client: remove the "Request this vehicle" section from vehicle pages and leave
only a Book now button. No requests.

**Removed**

- `src/components/fleet/QuickRequest.tsx` **deleted**. It was the five-field
  form under "What you need" on every vehicle page: pick-up and return dates,
  name, mobile, the drive-yourself / with-a-driver toggle, a live price
  estimate and its own "Request sent" confirmation panel. Only the vehicle page
  used it.
- Its import and usage in `src/app/(site)/fleet/[slug]/page.tsx`.

**Added in its place**

One `LinkButton` to `/booking?car=<slug>`, reading **Book now**, centred where
the form was. It is wrapped in `car.available`, so a vehicle out on hire shows
nothing there rather than a button that leads to a form for a car nobody can
have. The sidebar `PriceCard` already handles that case in its own words
("Currently on hire"), so the page still says what is going on.

**What was deliberately NOT removed, and why**

The instruction included "if we add a admin page to receive requests remove it
also". There is no such page. `/panel/bookings` is not a request inbox that
came with this form: it is the panel's booking desk, it existed first, and it
is where the **full booking form at `/booking`** lands, which is exactly where
the new Book now button sends people. It also drives public availability
(confirming or starting a hire takes a vehicle off the public list), records
payments, and is what the Text.lk SMS alert points staff at. Deleting it would
break the flow the client asked to keep, so the quick request was removed as a
**source** feeding that desk while the desk stays.

`createBookingAction` stays for the same reason: `BookingForm` is its other
caller. Nothing in `src/lib/` or `src/app/panel/` existed solely for the quick
request, so there was nothing else to clear.

**Copy that referenced it, now corrected**

`/panel/bookings` empty state said bookings arrive "through the website booking
form or the quick request on a vehicle page". It now says the booking form or
taken by phone, which is what the two `source` values actually are.

> Left alone, flag it if wanted: the full form at `/booking` still says
> "Confirm request" on its last step and "Request received" on its confirmation.
> That is the booking flow's own wording, not the deleted section, and changing
> it was not part of this ask.

**Verified**

- `tsc` clean, build passes, 34 routes.
- Served on :3121 and read the real HTML of `/fleet/toyota-prius`, not the
  source: **zero** occurrences of "Request this vehicle", "No payment now",
  "Send request" and the `qr-*` field ids. Exactly one Book now in the page
  body pointing at `/booking?car=toyota-prius`, plus the navbar's own
  pre-existing one at `/booking`; the third match was the same element inside
  the RSC flight payload, not a second button. `PriceCard` still renders "Book
  this vehicle". `/fleet` and `/booking?car=toyota-prius` return 200 and
  `/panel/bookings` still redirects a signed-out visitor (307). Server stopped.
- Zero em or en dashes in `src/`.

**Not seen in a real browser**, as ever in this repo. The main column now ends
on a centred button instead of a bordered form, so the spacing below "What you
need" is worth one look.

### 2026-09-15 (later) - Booking card under the images on mobile, contact buttons rebuilt

Client: on mobile the booking card must sit **under the images**, not under the
description. And make the Call and WhatsApp buttons look like buttons.

**The reorder is a grid change, not a duplicate card**

`/fleet/[slug]` was two grid items: everything in a `lg:col-span-8` column, and
the `PriceCard` in a `lg:col-span-4` one. Below `lg` the grid collapses to a
single column, so the card landed after the gallery **and** the specs, the
description, the features and both list panels. On a phone that is a long way
down.

Now three items, in DOM order: gallery, `PriceCard`, then the rest of the
content. The card is second in the document, so the collapsed single-column
order is gallery, card, content, with nothing conditional and no second copy of
the card to keep in sync.

- **`lg:row-span-2` is what keeps the desktop unchanged.** At `lg` the gallery
  takes row 1 of columns 1 to 8 and the content takes row 2, so without a row
  span the card would occupy only row 1 and the area beside the content would
  be empty. Spanning both rows puts it back exactly where it was.
- The specs panel lost its leading `mt-(--gap)`. It is the first child of its
  own grid item now, and the grid's own `gap` already separates the rows, so
  keeping it would have doubled the space on every breakpoint.
- The old wrapper's `mt-(--gap) lg:mt-0` went for the same reason: the grid gap
  handles it, at every width.

> **Not changed, worth knowing.** `PriceCard`'s inner div carries
> `lg:sticky lg:top-28`, but the Grid is `items-start`, so the card's grid item
> shrinks to the card's own height and a sticky child has nowhere to travel.
> **The sticky has never done anything**, before this change or after it.
> `lg:self-stretch` on the wrapper would switch it on. Left alone because the
> ask was about mobile order and turning it on is a visible desktop change
> nobody requested.

**The contact buttons were invisible, which is why they did not read as buttons**

They carried `bg-surface`, and `--color-surface` is **`transparent`** since the
flat redesign. So "Call" and "WhatsApp" were bare text with a red glyph and no
button shape at all: a fill only appeared on hover, which a touch screen never
does. This is the exact case the design rules in section 5 call out, that a
control with no background and no border is invisible.

Rebuilt with the existing vocabulary rather than a new one:

- `bg-field` resting, `hover:bg-field-hover`. The **controls** token, which is
  what these are, not `bg-surface`.
- `rounded-full` and `h-14`, matching the "Book this vehicle" CTA directly
  above, so the three read as one primary and a secondary pair.
- The icon sits in a filled `bg-brand` circle that deepens to `bg-brand-hover`
  on hover. That is the same inverted-badge idea as `<Button arrow>`, so it is
  a pattern the site already uses rather than a one-off.
- Grid gap tightened from `gap-(--gap)` to `gap-3`: the two belong to each
  other, and a full section gap between them read as two unrelated links.

> **No WhatsApp green.** It is the obvious idea and it breaks the palette rule
> in section 5, which puts every colour on the site in the logo's family. The
> icon is brand red like every other icon.

**Verified**

- `tsc` clean, build passes, 34 routes.
- Served on :3122 and measured **DOM order in the rendered markup**, with the
  RSC flight payload sliced off first so nothing was counted twice. Character
  offsets: gallery image 17563, the Daily/Weekly/Monthly switch 22642, "Book
  this vehicle" 23894, Call 25219, WhatsApp 26038, **Specifications 26233**,
  "About this vehicle" 31040. The whole card sits between the images and the
  first block of copy, which is the ask.
- The in-page "Book now" is at 38634, after "What you need". The match at 8969
  is the navbar's own.
- Read the **shipped stylesheet**, because a Tailwind utility that fails to
  emit fails silently: `.lg\:row-span-2{grid-row:span 2/span 2}` is present and
  sits inside `@media (min-width:64rem)`, and both
  `.hover\:bg-field-hover:hover` and
  `.group-hover\/contact\:bg-brand-hover` are emitted.
- `tel:+94771234567` and `https://wa.me/94771234567` both render correctly.
  Server stopped.

> **The escape trap from the 2026-09-08 entry bit again, and was caught.**
> Writing `\s` through a Node script's string literal landed in the file as
> `replace(/s/g, "")`, which strips the letter s instead of whitespace. It is
> invisible on the current placeholder number (no s in it) and `tsc` cannot see
> it, so only reading the written line caught it. Fixed with `String.raw`.
> **Check any regex you write through a script by reading it back.**

Still not seen in a real browser. The reorder is worth one look on a phone.

### 2026-09-15 (then) - The payment reassurance line is off the price card

Client: remove "No payment taken until we confirm availability." It sat under
the "Book this vehicle" button in `PriceCard`, so it was on every vehicle page.

- Deleted the `<p>` and its `mt-3`. The button now ends the card body and the
  contact pair follows on the card's own `mt-(--gap)`, so no spacing was left
  hanging.

> **The same sentence is still the meta description on `/booking`**
> (`src/app/(site)/booking/page.tsx`). Left alone deliberately: it is a search
> result and link preview string, not copy anyone reads on the page, and it was
> not what was pointed at. Say the word if it should go there too, in which case
> the sentence leaves the codebase entirely.

**Verified** on a served production build: zero occurrences of "No payment
taken" across the Prius, Prado and Leaf pages, while each still renders "Book
this vehicle", the Call and WhatsApp buttons and the deposit row, so only the
line went. `tsc` clean, build passes, 34 routes. Server stopped.

### 2026-09-15 (evening) - Two numbers, and identity documents as uploads

Client, on the booking form: take **two mobile numbers**, one WhatsApp and one
ordinary number, and they must be different. Replace the NIC and licence
**number** boxes with **image uploads**, with the customer choosing whether they
are sending an NIC or a passport. Take the driving licence too. NIC and licence
are cards, so **front and back are separate uploads**. None of it optional: no
uploads, no continuing. And remove the "Optional now" hints.

**The shape of it**

| Chose | Must upload |
| --- | --- |
| National Identity Card | NIC front, NIC back, licence front, licence back |
| Passport | Passport photo page, licence front, licence back |

`requiredSlots()` in `src/types/booking.ts` is the single definition of that
table. The form's gate, the count in "2 more documents to upload" and the list
submitted to the panel all read it, so they cannot drift apart.

> **The passport is one image, not two.** The instruction said front and back
> for "those nic licens both", and a passport is a booklet whose photo page is
> the only face that carries anything. Say the word if the visa or entry stamp
> page is wanted as well; it is one more entry in that table.

**Where the bytes go, and why not in the JSON store**

New module, `src/lib/panel/uploads.ts`. Files are written to **`.data/uploads/`**
(already covered by the `.data/` line in `.gitignore`) and only the metadata
goes on the booking. **Images must never go into `panel.json`**: the whole file
is read and rewritten on every request, so four photographs per booking would
make every panel page slower for the life of the store. There is a comment
saying so on the field.

Same read-only-filesystem fallback as `store.ts`, so a Vercel preview still
works and just forgets on redeploy.

**These are the most sensitive records the system holds**, which the PDPA note
in section 7d already flagged. So:

- nothing is ever written under `public/`, and there is no static path to it,
- reading one goes through **`/api/panel/documents/[id]`**, which requires a
  signed-in staff session and returns **404, not 401**, to a stranger: whether
  an id exists is itself information,
- the id is 32 random hex characters, so a URL cannot be guessed or walked, and
  `readDocument()` refuses anything that is not exactly 32 hex characters
  **before** the id is joined to a path,
- the response carries `Cache-Control: private, no-store` and `nosniff`.

**The upload action is deliberately unauthenticated**, because the person
uploading is a customer who has no account and never will. The protection is
therefore on the content, not the caller: an 8MB cap, and an allowlist checked
against the file's **magic numbers** rather than the `Content-Type` the browser
claims. A shell script named `evil.jpg` is refused. **SVG is refused on purpose**
even though it is an image: it can carry script, and these are served back to
staff from our own origin.

> ### A bug caught before it shipped, and it would have broken every upload
>
> **Next caps server action request bodies at 1MB by default.** The upload goes
> through a server action, and a phone photograph of an NIC is routinely 2 to
> 5MB, so **every real upload would have failed** with an error the customer
> could do nothing about, and the 8MB check would never have run.
>
> `next.config.ts` now sets `experimental.serverActions.bodySizeLimit: "10mb"`,
> which leaves room above the 8MB cap for what `multipart/form-data` adds in
> boundaries and part headers. The real limit stays the one in `uploads.ts`,
> which refuses the file with a sentence explaining why.
>
> Proved against the running server rather than assumed: a 2MB and a 9MB body
> return 200, a 12MB body is refused. Under the default the 2MB would have
> failed.

**Uploading happens on pick, not on submit**

Each file goes up the moment it is chosen. These are phone photographs over a
Sri Lankan mobile connection: holding four to send in one request at the end
means a long silent wait and one failure that loses all four. This way each is
its own small transfer with its own error message, and the Continue button is
simply gated on what has already landed.

`DocumentUpload.tsx` shows a local `blob:` preview so the customer can see they
picked the right side of the card. It is revoked on replace and on unmount,
because an object URL is a live handle into browser memory. The file input is
cleared after every pick, or choosing the **same** file again fires no change
event and the retry looks broken.

**Two numbers means two numbers**

`phone` is the number staff call, `whatsapp` the one they message. They are
compared on **digits only**, after dropping a leading zero and a leading 94, so
`077 123 4567` and `+94771234567` are correctly seen as the same number and
refused. Switching between NIC and passport **keeps** the uploads already made,
so tapping the wrong chip and tapping back does not lose files; only the
required set is submitted.

**Panel and data model**

- `PanelBooking` gains `whatsapp`, `idType` and `documents`.
- `/panel/bookings` shows the WhatsApp number and the documents as **links, not
  thumbnails**: NIC and licence images should open when a staff member asks for
  one, not render unbidden on a screen someone else can see.
- **`hydrate()` fills all three on read.** The bookings screen maps over
  `booking.documents`, so a store written last week would have crashed it, not
  shown a blank cell. Seven existing bookings in the dev store are covered.
- `slotLabels` is duplicated in `BookingForm.tsx` rather than imported from
  `uploads.ts`, because that module reaches for `node:fs` and importing it into
  a client component would drag the filesystem into the browser bundle. Same
  reason `cars.ts` stays pure.

**Proven, not assumed.** 43 checks against the real modules, run with
`node --experimental-strip-types` and the resolver hook from the 2026-09-11
entry. The script snapshotted `.data/` and restored it in a `finally`, and the
last two assertions are that the store and the upload directory came back as
they were found. Covered: both required-slot tables; real JPEG, PNG, WEBP and
PDF accepted; **a shell script, an HTML file, a Windows executable and an SVG
all refused despite claiming an image Content-Type**; oversized and empty files
refused; an unknown slot refused; bytes round-tripping unchanged; and
`readDocument` returning null for `../../panel`, `../../../etc/passwd`, a short
id, a non-hex id and an empty id. Plus: no upload id appears anywhere under
`public/`, and `hydrate()` gives a legacy booking row written without the new
fields an empty documents array rather than an undefined one.

**Verified over HTTP** on a served production build, which is the only way to
prove the wall is real: the document route returns **404 with no cookie, 404
with a forged cookie signature, and 200 with the correct bytes and
`image/jpeg`** for a real session minted from the app's own
`createSessionValue()`. Unknown ids and a URL-encoded traversal both 404. The
response carries `private, no-store` and `nosniff`.

The form itself **cannot be read out of the SSR HTML** (it uses
`useSearchParams`, so its subtree is client rendered and the server sends only
the Suspense fallback, as the 2026-09-06 entry records). It was checked in the
**shipped client chunk** instead: "WhatsApp number", "We call this one", "We
message this one", "National Identity Card", "Passport photo page", "Driving
licence, back", "Choose a photo", "Give two different numbers" and "more
documents to upload" are all present, and **"Optional now" and "licenceNumber"
are absent** from the bundle entirely.

`tsc` clean, build passes. Test uploads deleted, dev store confirmed unchanged
at 7 bookings, server stopped.

**Still open, and worth deciding**

- **Supabase Storage is the real destination.** `.data/uploads/` is the same
  scaffold as `panel.json`: on Vercel it falls back to memory and forgets on
  redeploy. The ids become object keys and nothing else has to change.
- **Nothing deletes these images, ever.** Holding a customer's NIC and licence
  indefinitely is the part of this most likely to matter under the PDPA. A
  retention rule (delete N days after the hire returns) needs the owner's
  decision and belongs with the section 7d legal review. `/privacy` still does
  not mention that we collect identity documents at all.
- The upload endpoint is public by necessity. It is capped and content-checked,
  but there is **no rate limit**, and there cannot be a good one before there is
  a real backend in front of it.

### 2026-09-15 (night) - Real validation on the two numbers and the email

Client: the two phone fields should be number fields that bring up the **number
pad on a phone, not the keyboard**, the customer must not be able to type
letters into them, and the email should be checked as a real address.

**One definition of a usable number, shared by both sides**

`toMsisdn` and `displayMsisdn` already existed, but in `lib/sms/textlk.ts`,
which is **server only because it holds the API token**. The form could not
import them, and writing a second phone parser for the browser would have meant
two definitions of "valid" drifting apart, with the failure showing up as a
booking staff cannot text.

So the parsing moved to the new **`src/lib/contact.ts`**, which is pure and
client-safe: no node built-ins, no secrets, no data imports. `textlk.ts`
**re-exports** the two functions, so not one call site changed.

**What counts as a number**

| Typed | Result |
| --- | --- |
| `0771234567`, `077 123 4567`, `077-123-4567`, `(077) 123 4567` | accepted |
| `+94 77 123 4567`, `94771234567`, `771234567` | accepted, same number |
| `0112345678` (Colombo landline) | accepted to **call**, refused for WhatsApp |
| `+44 7700 900123` and other foreign numbers | accepted |
| `077abc4567`, `12`, `0001234567` | refused, with the reason |

> **Visitors were nearly locked out, and this is the part worth remembering.**
> The obvious implementation validates against Sri Lankan numbers only. But step
> 3 offers a **passport** precisely because people fly in and hire a car, and
> their WhatsApp is a foreign number. A Sri-Lanka-only rule would have refused
> exactly the customers the passport option exists for. Anything written in full
> international form with a leading plus is accepted at 8 to 15 digits, which is
> E.164.

> **A landline is refused for WhatsApp only.** It parses fine and can be rung,
> but it can never receive a WhatsApp message. The national part starting with 7
> is what separates an 07X mobile from an 011 landline.

**Letters cannot be typed at all**

`sanitisePhoneInput()` runs on every keystroke and keeps only digits, spaces,
brackets, dots, hyphens and a single **leading** plus. This is belt and braces
with `inputMode`: a phone shows the dialpad, but a desktop keyboard will type
whatever it likes and `type="tel"` does not stop it.

> **On the number pad.** The fields are `type="tel"` with `inputMode="tel"`,
> which is what raises the telephone dialpad rather than the alphabetic
> keyboard. `inputMode="numeric"` would give a bare digits pad, but it **drops
> the plus key**, and without a plus a visitor cannot type their own number. The
> dialpad is the correct control here, not a compromise.

**Email is checked properly, and honestly**

`checkEmail()` rejects what is definitely not deliverable: no @, two @, spaces,
a domain with no dot, a TLD that is not at least two letters, leading, trailing
or doubled dots, and a hyphen at either end of any domain label. It is
deliberately **not** one of the giant RFC 5322 regexes, which accept quoted
local parts and bracketed IP addresses no customer will ever type and which
nobody can read well enough to say what they allow.

> Nothing short of sending to an address proves it exists, and this does not
> pretend otherwise. If a genuinely verified address is ever needed, that is a
> confirmation email with a link, which is a different piece of work.

**Errors appear when they are useful**

A message shows once a field has been **left**, or once Continue has been
pressed, not while a box is still empty and untouched. Every message is the
reason rather than "invalid": "Numbers only, no letters", "That is a landline.
WhatsApp needs a mobile number", "The part after the @ needs a dot, like
gmail.com". Each is a `role="alert"` tied to its input by `aria-describedby`,
with `aria-invalid` on the field.

`goNext()` now re-checks and reveals the errors rather than doing nothing: the
Continue button is disabled, but it is still reachable by keyboard and the gate
has to hold on its own.

**Proven, not assumed.** 82 checks against the real module, run the same way as
the other data-layer work. Covered: eight ways of writing one Sri Lankan number
all reaching `+94771234567`; twelve rubbish inputs refused; letters and
too-short numbers each getting their own message; four foreign numbers accepted
and classified international; a landline accepted to call and refused for
WhatsApp; the duplicate check catching the same number written local, spaced,
and in bare national form while two genuinely different numbers pass; the typing
filter stripping letters, emoji and a pasted "Mobile: " label, keeping one
leading plus and dropping a plus in the middle; six valid addresses accepted and
nineteen invalid ones refused; and `toMsisdn`/`displayMsisdn` behaving exactly
as before, so the staff SMS path is untouched.

> **One real bug, caught by the tests rather than by reading.** `user@bad-.com`
> was being accepted. The hyphen check ran against the whole domain, which does
> not start or end with one, instead of against each **label**, where `bad-`
> does. Fixed and re-run.

> **The escape trap bit for the third session running.** The `pattern` attribute
> was written through a script as `\\s` and landed in the JSX as a literal
> backslash-then-s, which as a regex means something else entirely and would
> have silently mis-validated. The fix was to stop escaping: the class is now
> `[0-9+() .-]*` with a real space. **Prefer a literal to an escape whenever the
> string has to survive a script.**

**Verified** in the shipped client bundle, since the form is client rendered
behind Suspense and never appears in the SSR HTML: `type:"tel"`,
`inputMode:"tel"`, `pattern:"[0-9+() .-]*"` and every one of the new messages
are present. `tsc` clean, build passes.

### 2026-09-15 (late) - Cartoon arrows between the booking steps

Client: put curved arrows between the four steps, alternating up and down, drawn
cartoonish with a big end.

**`StepArrow` in `BookingForm.tsx`.** One inline SVG path, and the downward one
is the **same path flipped on the Y axis** (`translate(0,32) scale(1,-1)`), so
the two can never drift apart into slightly different drawings.

- It is a **filled outline, not a stroked line.** A stroke cannot taper, and the
  cartoon look is exactly a taper: a thin tail swelling into a big swept head.
  That is a shape, not a line width.
- A 1.6 stroke in the same colour as the fill rounds every corner off. Without
  it the barbs come to hard points and it reads spiky rather than friendly.
- `w-8 sm:w-11` (32px, 44px). Both sizes were **rendered and looked at**, not
  guessed: below about 28px the tapered tail thins out to nothing and only the
  head survives.

**The arrows carry progress, not just decoration.** A hop the customer has
already made is `text-brand-bright`; one they have not reached is
`text-muted/50`. So the row reads as a route with distance covered, which is
what a stepper is for. Alternation is `index % 2 === 0`, giving up, down, up.

**Markup.** The arrows are `<li aria-hidden>` between the step `<li>`s, not
loose `<div>`s: only `<li>` is valid as a child of `<ol>`, and the list already
tells a screen reader the order, so the drawing adds nothing to the
accessibility tree. Each iteration now returns two siblings, hence the
`Fragment`. The step buttons keep `flex-1` and the arrows are `shrink-0`, so the
arrows take their fixed width and the four buttons still divide what is left
equally.

> On a phone the labels are already hidden, so the row is four numbers and three
> 32px arrows. At 390px that leaves about 59px per button, which a numeral fits
> in comfortably.

**Verified**

- `tsc` clean, build passes.
- The shape was **drawn and inspected at real size** before it went in: three
  candidate paths rendered with sharp on the page's own black at 28, 36 and 44
  pixels, then the winner mocked up as the **whole step track** at 760px with
  labels and at 358px without, on step 1 and on step 3. The alternation, the
  brand-to-muted split and the button widths were checked in the picture rather
  than reasoned about.
- The shipped client chunk carries the path, the flip transform and the size
  classes.
- Read the **shipped stylesheet**, since a Tailwind utility that fails to emit
  fails silently: `.text-muted\/50{color:#828d9f80}` resolved its opacity
  modifier to a real value, and `.sm\:w-11` is emitted **inside**
  `@media (min-width:40rem)` rather than loose at the top level.
- The preview script was written at the repo root (it needs the `sharp` in
  `node_modules`) and **deleted afterwards**. It is not in the tree.

Still not seen in a real browser, as ever in this repo.

### 2026-09-17 - Long-hire rate table, set in the panel

Client sent a competitor's vehicle page as the reference: a table of **1 week,
2 weeks, 3 weeks, 1 month, 3 months, 6 months and over**, each with a per-day
rate and a total. Staff set it when adding a vehicle; the table fills itself
from the one day rate and every row can be overwritten.

**Data model**

- `CarPricing.weekly` and `.monthly` are **gone**, replaced by
  `tiers: RateTiers`, a per-day rate for each of six durations. **Totals are
  never stored.** They are always rate times days, so the two columns cannot
  disagree.
- The durations, their labels, day counts and suggested discounts live in
  **`src/lib/pricing.ts`** (`RATE_TIERS`). Pure and client-safe; the panel
  editor, the price card and the booking estimate all read it.
- A month tier's total is **one month** (rate x 30) with "per month" under it,
  as in the reference. A six month total is not a number anyone wants to read.
- Suggested rates: 10, 15, 20, 30, 35 and 40% off daily, **rounded to the
  nearest 50**, because that is how the agency quotes. The 12 catalogue
  vehicles now carry literal tier blocks at exactly those suggestions.

**Store migration.** `hydrate()` gives old rows tiers on read: a created
vehicle's stored weekly or monthly figure becomes that tier's per-day rate
(total / 7, total / 30), the rest are suggested from daily, and the legacy
fields are deleted. An override gets only the two tiers it can speak for;
`applyOverride()` merges tier by tier, so the rest fall through to the
catalogue.

**Panel.** `src/components/panel/RateEditor.tsx`, used by both the add and the
edit form. Typing the one day rate refills every row marked **Auto**. A row
typed into turns **Edited** and a later daily change leaves it alone, so a
deliberate price is never overwritten silently. On the edit form a saved rate
that differs from the suggestion starts as Edited. **Recalculate from the
daily rate** hands every row back to the suggestion. Each row shows its
discount off daily and its live total. The per-day rate is the editable value;
the total is shown, not typed, because a typed total rarely divides into a
whole daily rate.

- Fields post as `daily` and `tier_<id>`. `tierRates()` in `vehicle-form.ts`
  parses them: absent keeps the current rate (a locked fieldset posts
  nothing), and blank, zero or junk takes the suggestion.
- Any tier change needs the **pricing** window, like the daily rate did, and
  the audit line names each tier: "1 week rate 10350 to 9900 a day".

**Public site.** `PriceCard` lost its Daily/Weekly/Monthly switch and no longer
needs to be a client component. It shows the daily rate, then the table.
**The booking estimate now charges the tier rate**: `rateForDays()` picks the
longest tier the hire qualifies for, and the summary gains a Rate row. Before
this, the form charged daily x days whatever the length, which would have
contradicted the table.

**Proven, not assumed.** 43 checks against the real modules via
`node --experimental-strip-types`, run with the **scratchpad as the working
directory**, so the store it seeded and migrated was a throwaway and the real
`.data/panel.json` hash was identical before and after. Covered: the
reference's own figures (7000 x 7 = 49,000 through 4800 x 30 = 144,000);
`rateForDays` at every boundary from 1 to 400 days; the parser on absent,
blank, zero, negative, non-numeric and fractional input; migration of a
created vehicle, a created vehicle with zero legacy rates, and a catalogue
override; the partial override merging through `listVehicles()`; and the
migration staying stable across a write and a re-read.

**Verified on a served build** (:3123): the Prius page renders the table with
its real figures (10,350 / 72,450 through 6,900 / 207,000 per month) and no
period switch. As the owner, the add form has `daily` and all six `tier_*`
inputs and no `weekly` or `monthly`; the Prius edit form is prefilled with
11500 and its six rates, all marked Auto. `tsc` clean, build passes. Server
stopped.

Not seen in a real browser. The table sits in the 4 of 12 sidebar at `lg`,
so the "Total" column is worth one look at 1024px.

### 2026-09-20 - SMS is live, on a borrowed sender ID

The sandbox sender is gone. `TEXTLK_SENDER_ID` is now **`zsensu.com`**, an
approved sender ID, so booking alerts can carry real traffic for the first
time. Two environment values and the docs changed; **no code changed**, because
both credentials were always read from the environment at process start.

**The sender ID is the developer's, not the agency's.** The client did not
supply a business registration or an NIC, and Text.lk will not register a
sender ID without one, so the agency has no sender ID and no Text.lk account.
Texts therefore go out on the developer's account, under the developer's name,
spending the developer's credit. This is a commercial arrangement, deliberately
made, and it is written up in [`sms.md`](./sms.md) section 2b.

Three consequences worth knowing before anyone demos this:

- **Recipients see `zsensu.com` as the sender**, not `ExtraCabs`. Say so rather
  than let the client find out from a received text.
- **Rotating the token in the Text.lk dashboard revokes access immediately.**
  Nothing else breaks: `notifyNewBooking` records every attempt as `failed` and
  the booking still saves, because nothing in `src/lib/sms/` throws at its
  caller.
- **The token is the whole lock, and it is readable by anyone with the Vercel
  project.** Environment Variables are visible to project members. If the
  Vercel project is handed over before payment, rotate the token first or the
  revocation is theatre.

Moving to the agency's own sender ID later is two environment values and a
redeploy, once they produce a BR or an NIC.

> **Credit is low: 4 units, no top-up, as of 2026-09-20.** One booking spends
> one unit **per staff member with a number saved**, so a booking with the owner
> and two employees on the list costs three. The **Send a test** button on
> `/panel/team` spends one per press and has **no confirmation step**, which is
> now flagged in `sms.md` section 4. A confirm dialog would make that form a
> client component; not done, because nobody asked.

**Deliberately not verified by sending.** Whether Text.lk accepts `zsensu.com`
on this token can only be proved by spending a unit, and there were four. The
value was confirmed written to `.env.local`, and confirmed to pass through
`smsConfig()` untouched: the sender ID is read, trimmed and length-checked for
emptiness, and **never validated against a character set**, so the dot in
`zsensu.com` cannot be rejected by our code. `tsc` clean. The balance endpoint
in `sms.md` section 6 is a GET and costs nothing, so check the real figure there
before the first live booking.

### 2026-09-20 (later) - Launch planned: Vercel, the domain, Supabase, SEO

No code changed. Planning session, written up in
[`launch-plan.md`](./launch-plan.md).

Client has the domain **extracabs.lk** at domains.lk and wants the site
deployed, Cloudinary and Supabase connected, and the site ranking first for
"rent a car near Makola", "rent a car Siyabalape" and similar.

**Decisions taken with the developer this session:** full Supabase migration
(not auth only), Cloudinary for **vehicle photos only** with identity documents
staying in a private Supabase bucket, the Google Business Profile exists but is
controlled by the client, and the invented ratings and testimonials get
stripped.

**Three findings that reframe the work, all verified rather than assumed:**

- **The site is optimised for the wrong town.** "Colombo" appears **29 times**,
  about 16 in customer-facing copy, while **Makola, Siyabalape, Kadawatha,
  Biyagama, Kelaniya, Gampaha and Kiribathgoda appear zero times**. The office
  is in Heiyanthuduwa, Gampaha district. Every keyword the client named is a
  town the site has never mentioned.
- **The site publishes fabricated review data.** `carLd()` emits an
  `aggregateRating` from invented numbers in `cars.ts`, plus six invented
  testimonials and "4.8/5 from 12,000 rentals" in `site.stats`. Fake review
  markup is against Google's structured data policy and a manual action would
  make the client's ranking goal unreachable. This is removed before the site
  is submitted anywhere.
- **`/panel` cannot run on Vercel at all** until Supabase lands: the JSON store
  and `.data/uploads/` both fall back to memory on a read-only filesystem, so
  every redeploy wipes bookings, staff accounts and customer documents. It must
  not be publicly reachable before then.

**Also noted for the SEO phase:** `organisationLd()` has **no `geo` block**,
`areaServed` is the whole of Sri Lanka, `robots.ts` disallows `/panel` and
`/api` but **not `/999p7k`**, and the footer's four `/fleet?category=` links are
unresolved duplicate-content variants.

> **The honest limit, and it is in the plan in writing.** "Rent a car near
> Makola" returns a map pack ranked mostly by the Google Business Profile, where
> **distance is a dominant factor and cannot be engineered**. First place there
> for a town the business is not in cannot be promised. First place in the
> **organic** results below it is a realistic target, and that is what the six
> planned location pages are for.

### 2026-09-21 - Real business details, 100 km a day, no refunds, legal pages

Launch plan phases 1a, 1b and 1d. Client supplied the real details and three
policy changes. Answers confirmed by question: **100 km per hire day** with a
**per-vehicle** extra-km rate, **rent non-refundable** but the deposit still
returned less deductions, **per-vehicle deposits** kept, and the invented
history removed.

**Business details** (`src/lib/data/site.ts`)

- Phone `+94 74 159 6212`, which is also WhatsApp. Alt `+94 77 720 2906`. No
  landline. Email `extracabsinfo@gmail.com`, one inbox: `bookingEmail` deleted
  and the contact page reads `site.email`.
- Address as given: "No 653, Samurdhi Mawatha, Heiyanthuduwa, Biyagama,
  Gonawala, Sri Lanka". `addressOneLine` reproduces it exactly. Schema
  `addressLocality` is therefore **Gonawala**; confirm that matches the Google
  Business Profile, because NAP agreement is the point.
- Socials: real Facebook and TikTok (tracking query stripped), WhatsApp.
  **Instagram deleted**, since there is none and the entry fed `sameAs`.
- Founded **2019-01-01**, emitted as `foundingDate`.
- The office card in `content.ts` had its own hardcoded placeholder landline.
  It now reads `site.phone`, `site.hours.office` and `addressOneLine`.

> **A real bug, found while reading the map link.** The old `mapLink` used
> coordinates taken from the embed URL, but an embed's `!2d`/`!3d` values are
> the **centre of the map view, not the pin**. "Open in Google Maps" was
> landing people about **1.1km south of the office**. The client's share link
> was resolved to find the true pin, `6.9716567, 79.9774439`, now `site.geo`.
> `mapLink` is the share link itself, which opens the listing. There is a
> comment in `site.ts` so nobody rebuilds it from the embed again.

**100 km a day** (reverses the 2026-09-06 unlimited kilometres policy)

- `KM_PER_DAY = 100` and `kmAllowance(days)` in `src/lib/pricing.ts`. Every
  place that states the allowance in code reads that one constant.
- `CarPricing.extraKm: number | null`. Null means no rate set, and the price
  card says **"Ask us"** rather than showing a guess.
- Rates set from the client: C-HR 95, Prius 60, Wagon R Stingray 45, Vezel 75.
  The other eight catalogue vehicles are `null`.
- Panel: an **Extra km** field on the add and edit forms. It is a pricing
  field, so an employee needs the pricing window to change it, and the audit
  line reads "extra km rate 60 to 70". `optionalRate()` parses it, so blank or
  zero clears it back to "Ask us". `hydrate()` fills `null` on older rows.
- Copy that stated unlimited kilometres, all rewritten: the price card, the
  vehicle page's included list and meta description, the booking summary (which
  now shows the allowance for the chosen dates, e.g. "300 km (100 a day)"), the
  FAQ, and two self-drive service highlights. The cabs-with-driver service
  already said "10 hours + 100 km" and is unchanged.

> **If the allowance ever changes**, `KM_PER_DAY` updates the code, but these
> say "100 km" in words and must be edited by hand: FAQ 8 in `content.ts` and
> the self-drive highlights in `services.ts`.

**No refunds, deposit returned**

- Terms clause 4: once paid, the rental charge is not refundable, including
  cancellation, no-show and early return. The old 48 hour / 25 percent schedule
  and the wedding-car 50 percent clause are gone.
- **Kept one exception, deliberately:** if *we* cannot supply the confirmed
  vehicle, the customer gets an equivalent vehicle or their money back.
  Refusing a refund for the business's own failure is unlikely to hold up and
  reads badly. Remove it only if the client insists.
- Deposit relabelled **"Security deposit"** on the price card, not
  "Refundable": it comes back less deductions, and the rent beside it is not
  refundable at all. The booking form's confirm step now says both.
- "Pay the deposit by card" and "all major credit and debit cards" were wrong:
  payments are **cash and bank transfer** (section 6). Corrected in the FAQ, the
  how-it-works step and the terms.

**Invented social proof removed** (launch plan 1b)

- `aggregateRating` out of `carLd()`, `rating` and `reviewCount` out of the
  `Car` type and all 12 vehicles, the visible star rating off the vehicle page.
  The fleet's "recommended" sort used rating as a tiebreak and now keeps
  catalogue order. `seo.ts` carries a comment forbidding invented ratings.
- The six invented testimonials, `Testimonials.tsx`, the `Testimonial` type and
  the home page slot, deleted.
- `site.stats` ("12k+ rentals", "4.8/5") deleted, with its slab in `WhyUs.tsx`
  and its panel on `/about`. `.overlap-up` in `globals.css` is now unused, but
  kept as a design primitive.
- `/about`: the 2016 to 2025 milestone timeline removed, "since 2016" and
  "nine years" now read from `site.established`. The home fleet intro claimed
  "Forty vehicles, from an Alto to a Prado"; rewritten without a count.

**Legal pages**, rewritten against what the code actually does:

- **Terms**, 11 clauses: the agreement, eligibility and documents, booking and
  payment, no refunds, kilometres, deposit and its deductions, use, extensions,
  insurance and damage, personal data, governing law. The allowance and the
  business details are read from code, not retyped.
- **Privacy** now names the identity document uploads, which the old draft
  never mentioned; says a booking texts the customer's name and number to staff
  through an SMS provider; says providers may store data outside Sri Lanka;
  cites the PDPA No. 9 of 2022 rights; and discloses the Google Maps frame.
- **The old privacy draft claimed analytics the site does not have.** It said
  the site measures visitors. Nothing of the kind is installed. The new page
  says so, and a comment says to add a clause before adding any.

> **Needs deciding, and the privacy page makes a promise the code does not keep
> yet.** Clause 5 says bookings and documents are deleted once no longer needed.
> **Nothing deletes anything today**, as the 2026-09-15 entry recorded. The
> owner needs to pick a retention period and something needs to enforce it,
> ideally a scheduled job once Supabase lands.

**Carried over from the old terms draft, still unconfirmed by the client:** the
minimum age of 23, the LKR 25,000 insurance excess, the "replacement anywhere
on the island at no charge" breakdown promise, and 30-day corporate invoicing.

> **Is the business really a "(Pvt) Ltd"?** `site.legalName` says so, and the
> terms now name it as the contracting party. The client has not supplied a
> business registration. If it is not an incorporated company, the name is
> wrong in a legal document. Ask.

**Found in passing, and it matters for launch:** `PANEL_SESSION_SECRET` falls
back to a hardcoded string in `auth.ts`. Unset on Vercel, anyone who reads the
repo can forge an owner session. Added to the launch plan's environment table.

**Verified on a served production build** (:3124), 63 checks, all passing: the
real phone, email, geo, `hasMap`, founding date, street address, locality and
`sameAs` in the business JSON-LD; the new embed and place link in the footer;
no stats, testimonials or "Forty vehicles" on the home page; 100 km / day and
the right extra-km rate on the Prius, C-HR, Wagon R and Vezel pages, "Ask us"
on the Aqua; **no `AggregateRating` anywhere**; every clause of both legal pages;
no 2016 history on `/about`; the alt number and WhatsApp link on `/contact`.
As the owner, the Prius edit form is prefilled with 60, the Aqua's is blank,
and the add form has the new field. **A save was not exercised**, because it
writes to the dev store.

> **The escape trap, a fourth time, this time in the test.** A whole-word check
> was written as ``new RegExp(`\b2016\b`)`` in a template literal, where `\b` is
> a **backspace character**, so the check could never fail and read as a pass.
> Caught on re-reading. Fixed with `String.raw` and a sanity assertion that the
> matcher really does catch "2016". **A check that cannot fail is not a check.**

`tsc` clean, build passes, zero em or en dashes.

### 2026-09-21 (later) - Fleet emptied, sample prices gone, 90-day photo rule

Client decisions: the fleet ships at **zero** (staff add vehicles after
launch), all sample data comes off the site, the business **is** a (Pvt) Ltd
(so `site.legalName` stands), **no minimum age** but the one-year licence rule
stays, **no fixed insurance excess**, 100 km confirmed as **per day**, and ID
photos deleted **90 days after the hire** with the record kept.

**The fleet is empty** (`cars.ts`)

- The twelve sample vehicles, their invented rates and deposits, and the three
  stock photos (`public/images/cars/` and its README) are deleted. The
  accessors stay: they are the database seam, and `filterCars()` and the
  category lists are still used.
- Panel-added vehicles used to be given the three stock photos, so every car
  staff added showed pictures of other cars. They now get `images: []`.
- An empty fleet broke more than it looked: the home grid sat blank under
  "Pick your ride" with a "See all 0 models" button, `/fleet` offered filters
  over nothing and said "Nothing matches that combination", Browse by type
  showed eight tiles of "0 vehicles", and **`/booking` was a dead end**: step 2
  requires a vehicle, so nobody could get past it. New `NoVehiclesYet`
  component on all three pages sends people to call or WhatsApp. Browse by type
  hides itself when empty and, once vehicles exist, shows **only the categories
  the fleet has**, since each empty tile is a link to an empty page.
- `/fleet` header claimed "40+ vehicles on the road", "5 yrs" average age and
  "Free delivery: Colombo". Now a live vehicle count, 100 km / day, and cash or
  transfer. Empty `ItemList` JSON-LD is no longer emitted.

> **Two real bugs this exposed, both of which would have hit production.**
>
> 1. **Every vehicle staff added after launch would have returned a 500.**
>    `/fleet/[slug]` had a `generateStaticParams`. With a list that does not
>    include a slug (every car added after the build, and now every car at
>    all), Next renders that page statically on first visit, meets the
>    `connection()` call in `publicCarBySlug`, and aborts with
>    `DYNAMIC_SERVER_USAGE`. Unknown slugs also 500ed instead of 404ing. Removed;
>    the page is dynamic by nature. It never showed in `next dev`.
> 2. **A vehicle with no photos crashed the fleet grid.** `CarCard` passed
>    `car.images[0]`, which is `undefined`, and `next/image` throws on a missing
>    `src`. `SafeImage` now renders its placeholder when there is no source.
>    `CarGallery` fell back to `/images/cars/placeholder.png`, **a file that
>    never existed**, so it only reached the placeholder after a failed request.
>
> Also: **the sitemap was frozen at build time**, so cars added after launch
> would never be listed for search engines. It now has `revalidate = 3600`.

**Sample prices gone**

- All five service price tables and `startingFrom` figures emptied (they named
  a Prado, an E-Class and a KDH the business does not have).
  `Service.startingFrom` is now `string | null`; every page shows prices when
  present and "On request" / "call or WhatsApp for a quote" when not, with a
  working `tel:` link. `serviceLd()` omits `offers` without a price.
- The business JSON-LD carried `priceRange: "LKR 6,000 to LKR 30,000 per day"`,
  worked out from the sample fleet, **on every page**. Removed until real rates
  exist.

**Age and excess:** "at least 23 years old" removed from the terms, FAQ and
vehicle page; the one-year licence rule kept. The fixed LKR 25,000 excess is
gone; the terms and FAQ now say the excess depends on the vehicle and is
written on the rental agreement. The "excess published up front" line in the
differentiators was changed to match, since it no longer is.

**ID photo retention**, built rather than just promised:

| Booking | Photos deleted |
| --- | --- |
| Returned | 90 days after the later of the booked return date and the day it was marked returned |
| Confirmed, never started | 90 days after the booked return date |
| Cancelled | 30 days after it was cancelled |
| Pending, never confirmed | 30 days after the booked return date |
| On hire | never, the car is still out |
| Hold ticked | never, until the hold is released |

- The rule is **`src/lib/panel/retention-rules.ts`**, pure, with the day counts
  as constants. The privacy policy's clause 5 **reads those constants**, so the
  page and the code cannot disagree.
- `src/lib/panel/retention.ts` does the deleting: files first, then the
  record, then one audit row as `system` (shown as "Automatic" in activity).
  Only the photos go; the booking stays.
- `PanelBooking` gains `idNumber`, `licenceNumber`, `closedAt`,
  `documentsHold` and `documentsPurgedAt`, all filled by `hydrate()`. The
  bookings screen has NIC/passport number, licence number and **Hold photos**
  fields, says when each booking's photos will go, and explains the rule.
  **Typing the numbers at handover is what keeps a past customer findable**
  once the photos are gone; the form stopped collecting them as text on
  2026-09-15. Audit lines name which field changed, never the number itself.
- `closedAt` is stamped when a booking is marked returned or cancelled, and
  cleared if it is reopened.
- **Fixed a leak next to it:** deleting a booking left its ID photos on disk
  with nothing pointing at them, so nothing would ever have deleted them. They
  go with the booking now.

> **The purge runs when the bookings screen loads**, because there is no
> scheduler. Fine with a local store, but a rule that runs only when someone
> opens a page stops the week nobody does. **Make it a `pg_cron` job in the
> Supabase phase.** There is still no customer search in the panel either;
> the ID numbers make one possible, but it is not built.

**Security, found this session, all in the launch plan section 3a:**

- **The repo is public.** The panel test passwords (`owner1234` and the two
  employee ones) are in `store.ts` and `panel.md`, and a fresh deploy seeds
  those accounts, so anyone could sign in as the owner. **Must be replaced
  before the first deploy.** Not changed here: it needs the real accounts to
  replace them, which is the Supabase phase or an env-var seed.
- The owner's personal mobile was in `docs/sms.md`. Removed from the working
  tree; **still in git history**.
- **Uncommitted, and should stay that way until reviewed:** the 2026-09-20
  entries here and in `sms.md` describe the developer's plan to revoke the
  borrowed SMS sender ID if the client does not pay. The client can read a
  public repo.

**Also noted, not changed:** the panel's payment dropdown still offers "card on
pickup" while the terms say cards are not accepted. The local dev store
(`.data/`, gitignored) still holds sample messages and overrides from testing;
it never deploys.

**Proven, not assumed.**

- **23 checks on the pure rule** via `node --experimental-strip-types`: every
  status, the expiry-day boundary (kept the day before, deleted on the day),
  late and early returns, the hold, Colombo day boundaries at 18:29 and 18:30
  UTC, a leap day, and a bad date never triggering a delete.
- **20 checks on the real purge**, real store file and real upload files, run
  in a throwaway working directory with a guard that refuses to run anywhere
  else: expired photos removed from disk, the record, name and ID numbers
  kept, held, on-hire and not-yet-due photos untouched, one system audit row
  that does not contain the ID number, a second run deleting nothing, and the
  real `.data/panel.json` hash unchanged.
- **On a served production build**, empty fleet: no sample vehicle name
  anywhere (the hero's alt text names the client's real cars and is excluded
  on purpose), the empty panel on home, `/fleet` and `/booking`, no ItemList,
  no `priceRange`, old vehicle URLs and junk slugs **404, not 500**, no LKR
  figure anywhere on any service page, including the RSC payload.
- **Then with a staff-added car and three bookings injected** into the dev
  store (restored byte for byte afterwards, hash checked): the car's page is
  200 with a named placeholder tile and no broken image, its LKR 55 extra-km
  rate, a rate table filled by `hydrate()`; the home page shows it with "See
  all 1 model", Browse by type returns with only the Hatchback tile, `/booking`
  goes back to the form; the panel shows the three new fields, "Photos will be
  deleted on 2027-01-02" for a hire returned 2026-10-04, the hold message, and
  the on-hire message.

> **The unfailable check, again, caught this time before it counted.** A
> verification script contained `check("...in the sitemap route list", true)`,
> a literal `true`, the very thing the previous entry warned about. Removed,
> and the whole script grepped for `, true)` before the final run.

`tsc` clean, build passes, zero em or en dashes.

### 2026-09-21 (last) - Launch once, on the developer's accounts

No code changed. Two decisions, recorded in [`launch-plan.md`](./launch-plan.md):

- **Launch once, not staged.** Nothing is deployed until Supabase and
  Cloudinary are built and the fleet can be listed. The staged option (public
  site live now, panel off) was offered and declined.
- **Supabase and Cloudinary go on the developer's own accounts**, like the SMS
  sender ID. The plan now says what that carries: the client is the PDPA
  controller of its customers' data, so put the arrangement in writing, and
  keep any payment lever on the service rather than on the client's access to
  its own customer records.

**Region corrected** from Singapore to **Mumbai for both**: Vercel `bom1` and
Supabase `ap-south-1`. With a database, the function-to-database distance is
paid on every query, so the two must sit together; Mumbai is also closest to
Colombo.

**Size of the Supabase job, measured:** the panel store is read and written
synchronously in **62 places across 15 files** (`readData()` / `writeData()`).
Postgres is asynchronous, so every one of those call sites changes. This is
the bulk of phase 4 and needs no credentials to start: the data layer can be
made async against the local file store first, then swapped. The Supabase CLI
is available here (`npx supabase`, 2.107.0); the Vercel CLI is not installed.

### 2026-09-21 (Supabase) - Project connected, schema written, not yet pushed

Supabase project `nyjmsjdallwwomxmcdrh`, on the developer's account.
**Decision this session: staff sign in with Supabase Auth**, as the 2026-09-05
plan locked, over keeping the panel's own sign-in on Postgres (which was
offered as the lower-risk option).

**Verified, not assumed**

- `.env.local` had the **publishable key pasted into the URL slot**. The
  project ref was read out of the anon key's JWT and the URL corrected to
  `https://nyjmsjdallwwomxmcdrh.supabase.co`; the publishable key moved to its
  own `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` line.
- Anon and service role keys: same project, correct roles, auth health 200,
  REST 200, **no tables yet**. The publishable key authenticates against this
  project (the 401 seen first was only the REST schema root, which publishable
  keys may not read).
- **Region: `ap-south-1`, Mumbai**, established by resolving the database host
  and matching its IPv6 address against AWS's published ranges
  (`2406:da1a::/35`). The dashboard region was not visible from here.
- **The database password in `.env.local` is wrong.** The session pooler
  (`aws-0-ap-south-1.pooler.supabase.com`) found the tenant and refused the
  password. The direct host is IPv6 only and does not resolve for the CLI on
  this machine, so the pooler is the route. **Reset it in the dashboard**
  before any migration can be pushed.
- **The Supabase CLI is signed in to a different account.** `projects list`
  shows only "yhp-Helixra" (ref `lwawcrjubgcmzfbwdrsn`, Tokyo), not this
  project. **Never run `supabase link` or `db push` without an explicit
  `--db-url` for this project** until `npx supabase login` is redone with the
  right account, or a migration lands in someone else's database.

**Added**

- `@supabase/supabase-js` 2.116 and `@supabase/ssr` 0.12.7. Neither pins a Next
  or React version.
- `supabase/` from `supabase init` (local only), and
  **`supabase/migrations/20260921000000_panel_init.sql`**, written but **not
  pushed** and not yet validated against a real database.
- `.env.example` documents the Supabase and Cloudinary variable names.

**The schema's design, and why**

- **Auth proves who; it grants no data.** Every table has RLS **on with no
  policies**, and the migration revokes all grants from `anon` and
  `authenticated`. All reads and writes go through the server with the service
  role, after `guard.ts` has checked the session, the `staff` row and, for an
  employee, the owner-approved write window. A policy granting `authenticated`
  access would let any staff browser bypass the write windows; the header of
  the migration says so.
- `staff.id` is the `auth.users` id. A partial unique index allows **exactly
  one owner**.
- **One `vehicles` table, no overrides.** The catalogue ships empty, so the
  override layer in `lib/fleet.ts` has nothing to layer over. Edits update the
  row. `images` holds Cloudinary public ids.
- `audit.staff_id` null means the system acted, replacing the `"system"`
  string the retention rule writes today.
- Enquiry messages get their own table; booking documents stay a `jsonb`
  metadata array with the bytes in the **private `id-documents` bucket** (8MB
  cap and MIME allowlist matching `uploads.ts`, no storage policies).
- Indexes for finding a past customer by phone, ID number and licence number,
  which the 90-day photo rule makes the only way to identify them.

**Still to design, noted so it is not lost**

- **Orphaned uploads.** A customer who uploads ID photos and abandons the form
  leaves files no booking points at. That was true of `.data/uploads/` too,
  and nothing ever deleted them. The retention job must also remove unreferenced
  objects older than a day.
- **Where the retention job runs.** It deletes storage objects, which should go
  through the Storage API rather than raw SQL on `storage.objects`, so a
  scheduled server call (Vercel Cron to a secret-protected route) fits better
  than `pg_cron`. Decide when building it.
- **Creating staff accounts.** With Supabase Auth, the owner creates an
  employee through `auth.admin.createUser` on the server. The one-time password
  should be shown once and **never stored**, unlike today's `oneTimePassword`
  field.

**Next:** make the data layer async (62 call sites in 15 files) against these
tables, wire Supabase Auth into `/999p7k`, `proxy.ts` and `guard.ts`, then push
the migration once the password is reset.

### 2026-09-22 - Schema pushed and the lockdown proven on the live database

The developer reset the database password and re-linked the CLI. `projects
list` now shows only **extra-cabs, `ap-south-1`, linked**, so the wrong-account
warning in the previous entry no longer applies. The session pooler accepts
the new password.

`20260921000000_panel_init.sql` was dry-run (exactly that one migration), then
pushed with an explicit `--db-url`. The CLI warned it could not cache a
migrations catalog because Docker is not installed. That concerns only the
CLI's local development tooling and has no effect on the remote database.

**Verified against the live project, not assumed. 55 checks, all passing.**

- **All 10 tables exist** and the service role reads each one.
- **The anon key and the publishable key are refused** on every table, for
  reads and for inserts.
- **A signed-in staff member is refused too.** Two throwaway logins were
  created through the admin API; one was signed in exactly as a browser would,
  and with that session could not read `staff`, `bookings`, `vehicles`,
  `access_requests`, `audit`, `work_shifts` or `sms_messages`, could not
  insert a vehicle, **could not open its own write window**, **could not
  promote itself to owner**, and could not list the photo bucket. This is the
  check that proves the owner-approved windows cannot be bypassed from a
  browser.
- **One owner only:** a second `role = 'owner'` row is refused by the partial
  unique index; an employee row beside it is accepted.
- **`id-documents` bucket:** exists, **private**, 8MB limit, five allowed MIME
  types and no SVG; anon cannot list it, upload to it, or reach it through a
  public URL.
- Throwaway logins and staff rows removed afterwards; the database is empty
  again (0 staff rows, 0 test logins).

> **The internet dropped mid-test, and the cleanup ran during the outage.**
> The two throwaway logins and their staff rows were stranded in the live
> database until the connection returned and they were removed by hand. The
> re-run used a script whose cleanup retries for up to 50 seconds and fails
> loudly if it cannot finish. **Any test that creates rows in the live
> project needs a retrying cleanup and a check that it completed.**

**Next:** the data layer. The panel still reads and writes `.data/panel.json`;
nothing in the app talks to Supabase yet.

### 2026-09-22 (later) - The panel runs on Supabase

The whole panel moved off the JSON file store: 62 synchronous store calls in
15 files, every screen, action and route. `store.ts` is deleted. Details of
where things now live are in [`panel.md`](./panel.md).

**Built**

- `src/lib/supabase/`: `env.ts` (named errors for missing variables),
  `admin.ts` (service role, `server-only`), `server.ts` (the Supabase Auth
  cookie client, used for identity only).
- **`src/lib/panel/db.ts`: every table read and write.** Shallow snake/camel
  conversion (jsonb keeps its own keys), every error thrown with the operation
  named, count queries for badges and lifetime totals.
- Second migration, `20260922000000_panel_functions.sql`:
  **`next_booking_reference()`** on a sequence, and **`panel_sweep()`**, which
  closes stale presence at each segment's own last heartbeat (a column-to-column
  copy the REST API cannot express). Both are service-role only; Postgres
  grants new functions to PUBLIC by default, so that grant is revoked.
- Sign-in on Supabase Auth; `getCurrentUser` is memoised per request with
  React `cache()` and requires an **active** staff row. `proxy.ts` refreshes
  the session and gates `/panel`.
- `uploads.ts` on the private bucket; `retention.ts` async, plus
  **`purgeOrphanUploads()`**; **`/api/cron/retention`** behind `CRON_SECRET`;
  `vercel.json` pins functions to `bom1` and schedules the run daily at 02:00
  Colombo.
- `scripts/create-owner.mjs` creates the one owner (refuses if one exists).

**Bugs fixed on the way, each of which the move would otherwise have kept or
created**

- **Booking references repeated.** They were "count + 1", so deleting a
  booking made the next one reuse a live reference. Now a sequence.
- **One-time passwords were stored in plaintext** until dismissed. Now shown
  once from a five minute httpOnly cookie and held only as a Supabase Auth hash.
  Generated with `crypto.randomInt`, not `Math.random`.
- **`canWrite()` became async**, and `if (canWrite(...))` on a promise is always
  true: every employee would have been shown edit and delete controls.
  TypeScript's TS2801 flagged each site; all awaited. The server gate was never
  affected, but the screen would have lied.
- **Timestamps were sorted as text.** Postgres returns `+00:00`, fresh values
  end in `Z`, so text order breaks. Sorted by parsed time now.
- **The dashboard showed employees everyone's audit entries**, while
  `/panel/activity` showed them only their own. Same rule in both now.
- **`PANEL_OTP_PEPPER` fell back to a value in the public repo.** It now throws
  in production; proven when the first end-to-end run hit exactly that error.
- **The public actions trusted their callers.** `createBookingAction` now forces
  `source: "website"`, rounds and caps the amount, accepts only well-formed
  document metadata (one per real slot), real calendar dates, and a listed
  vehicle (anything else saves with no vehicle instead of a foreign-key crash).
- `safeName()` in uploads split only on `/`: the escape trap again. Fixed.

**Proven against the live project, 141 checks in all, every one passing**

- 31: every function in `db.ts`, round trip through each table.
- 5: the two functions are service-role only; the sequence never repeats.
- **43 end to end over HTTP** on a production build, forms submitted as a
  browser without JavaScript would: sign-in and wrong password, shift and
  heartbeat, owner kept off the timesheet, an employee **replaying the owner's
  add-vehicle action without a window refused server-side**, code request,
  wrong then right code, vehicle created inside the window and tied to it in
  the audit, public site showing it, booked vehicle 404ing, the one-time
  password shown once and absent from the table, a disabled employee locked out
  on the next click, a forged Supabase cookie bounced, sign out closing the
  shift.
- **24 on the customer side:** real uploads to the private bucket, an
  executable named `.jpg` and an SVG refused, a booking caller trying to claim
  `source: "panel"` and attach junk documents, the photo route (404 without a
  session and for a traversal; exact bytes, `private, no-store` and `nosniff`
  with one), retention clearing a 100-day-old hire while keeping the record,
  and the orphan sweep keeping a fresh upload and deleting it after a day.
- Cron route: 401 with no key and a wrong key, 200 with the right one.
- Every run cleaned up with a retrying cleanup and a check that it completed.

> **Measured, worth knowing: a deleted photo stays readable for up to about a
> minute** (53.6s measured) if it was read shortly before deletion. That is
> Supabase Storage's cache; its documented invalidation is up to 60 seconds.
> The delete itself is immediate (removed, gone from listings), and the cached
> copy is reachable only with the service role, so only through the staff
> photo route by someone who already has the id. On a 90-day rule this is
> harmless, but it is real and the tests wait for it.

**Test references consumed:** the sequence has handed out EC-0001 to EC-0004
during testing. **Restart it before launch** so the first real booking is
EC-0001.

**Not done in this session:** Cloudinary photo upload, the owner account
(needs the owner's email; the developer runs the script), changing an
employee's password from the panel, and the `PANEL_OTP_PEPPER` and
`CRON_SECRET` values on Vercel (both generated into `.env.local`).

> **Pushed while the payment-arrangement notes were in the docs.** Commit
> `vgfg` (2026-09-21) put the 2026-09-20 entries on public GitHub, including
> the line that the sender ID would be revoked "if the client does not pay".
> No secrets were in it: every secret in `.env.local` was checked against the
> full history and found zero times.

---

## 9. Working agreements

- **This file is auto-loaded.** `CLAUDE.md` references it, so it enters context
  at the start of every session. Keep it accurate and keep it tight - it is the
  substitute for reading the codebase, not a second copy of it.
- **Do not create presentation pages, dashboards or artifacts** unless asked.
  Plans and specs go in `docs/` as markdown.
- **Record every change in §8** so the next session does not have to
  reverse-engineer what happened.
- `AGENTS.md` in the repo root is written and re-added by `next dev`. Do not
  delete the block from a diff; commit it with the work to keep the tree clean.
