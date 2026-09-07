# Handover - Extra Cabs & Rent a Cars

**Read this first.** It exists so a new session (human or agent) can start work
without reading the whole codebase. If something here is wrong, fix it here
rather than working around it.

Last updated: **2026-09-07**

---

## 1. What this project is

A website for **Extra Cabs & Rent a Cars**, a vehicle rental agency in Colombo,
Sri Lanka. Self-drive rentals, cabs with a driver, airport transfers, wedding
cars, long-term lease. Prices in LKR.

The project has **two halves**:

| Half | State | Lives at |
| --- | --- | --- |
| **Public website** - what customers see | Built, UI-only, deployed on Vercel | `/`, `/fleet`, `/booking`, `/services`, `/about`, `/contact`, `/faq` |
| **Internal platform** - what the owner and 2 employees use | **Built and working** against a local store, no Supabase yet. See [`panel.md`](./panel.md) | `/999p7k` to sign in, `/panel` |

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
- **Still no Supabase.** Everything persists to one gitignored JSON file at
  `.data/panel.json` via `src/lib/panel/store.ts`. That is a deliberate
  scaffold, not a production store, and it falls back to memory on Vercel.
- **No SMS or WhatsApp.** The access code appears on the owner's dashboard for
  him to read out.
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

- `src/lib/data/site.ts` - phone numbers, address, email, social links.
  **The owner's real mobile number is now load-bearing** - it is where every
  access OTP goes.
- `src/lib/data/cars.ts` - rates are realistic but made up.
- `src/app/terms/page.tsx`, `src/app/privacy/page.tsx` - drafted, not vetted.
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
    fleet.ts           catalogue + panel overrides. Server only.
    panel/             store, auth, guard, time, window. Server only.
    utils/
  types/               car.ts, booking.ts, service.ts, common.ts
  proxy.ts             cookie gate on /panel. NOT middleware.ts
  app/(site)/          public pages + navbar/footer layout
  app/999p7k/          staff sign in
  app/panel/           the staff screens + actions.ts
  app/api/panel/       heartbeat, away
public/images/         home/, cars/, icons/
.data/panel.json       the store. Gitignored. Delete it to reset.
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
- Colours are from the logo: signal red `#E01B22`, deep maroon `#8E1420`,
  graphite, warm paper. **No blues, violets, or default framework greys.**
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
| **Text.lk account + API key + registered sender ID** | No OTP delivery without it. Sri Lankan gateways require sender-ID/mask registration with the telco, which is a business process, not a signup form. | **Days to weeks - start now** |
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
