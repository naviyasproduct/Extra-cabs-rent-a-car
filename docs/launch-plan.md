# Launch plan: deployment, Supabase, Cloudinary and local SEO

Written 2026-09-20. This is the plan, not a record of work done. As each phase
lands, record it in [`HANDOVER.md`](./HANDOVER.md) section 8 and tick it here.

Goal, in the client's words: when someone searches **"rent a car near Makola"**,
**"rent a car Siyabalape"** or **"rent a vehicle"**, this site should be first.
Section 2 explains honestly how much of that is achievable, which parts are code
and which are not.

Decisions taken 2026-09-20: full Supabase migration, Cloudinary for vehicle
photos only, the Google Business Profile exists but the client controls it, and
the invented ratings and testimonials get stripped.

---

## 0. Read this before planning your time

Three things dominate everything below. None of them are code.

**The site is optimised for the wrong town.** The office is at 653 Samurdhi
Mawatha, **Heiyanthuduwa**, in Gampaha district. The site says "Colombo" **29
times**, about 16 of them in customer-facing copy, and says **Makola,
Siyabalape, Kadawatha, Biyagama, Kelaniya, Gampaha or Kiribathgoda exactly zero
times** (verified 2026-09-20). Every keyword the client named is a town the
site has never heard of. This is the single biggest on-site gap and it is fixed
in phase 2.

**The panel cannot run on Vercel today.** `.data/panel.json` falls back to
memory on a read-only filesystem, so every redeploy wipes bookings, staff
accounts, shifts and the audit log. Customer ID document uploads do the same.
Supabase is not an improvement here, it is the thing that makes `/panel`
function in production at all. Until it lands, `/panel` must not be publicly
reachable.

**The site currently publishes fabricated review data.** Every vehicle page
emits an `aggregateRating` built from invented numbers in `cars.ts`, there are
six invented testimonials, and the home page claims 4.8 stars from 12,000
rentals. Fake review markup is explicitly against Google's structured data
policy and is among the most reliably penalised things on the web. On a new
domain competing for local search, a manual action does not make ranking harder,
it makes it impossible. This is removed in phase 1, before the site is
submitted to anything.

---

## 1. Phase 1: truth before traffic

**Everything in this phase blocks going live.** Not because it is tidy, but
because local SEO is built on the business details being consistent everywhere,
and right now most of them are invented.

### 1a. The real business details

> **Done 2026-09-21**, except the postcode, which is still unknown. See
> HANDOVER for the values and for the map-link bug found along the way.

`src/lib/data/site.ts` is placeholders. For local search, the business name,
address and phone number (the "NAP") must be **byte for byte identical** on the
website, on the Google Business Profile and on every directory listing. Google
uses that agreement as evidence the business is real and where it says it is.
Different phone numbers across sources actively suppress rankings.

Collect from the client, all of it, before anything else:

| Field | Current value | Needed |
| --- | --- | --- |
| `phone` | `+94 77 123 4567` | the real mobile |
| `phoneAlt` | `+94 11 234 5678` | the real landline, or delete the field |
| `whatsapp` | placeholder | the real WhatsApp number |
| `email`, `bookingEmail` | `@extracabs.lk` | real inboxes on the real domain |
| `address.postal` | blank | the real postcode |
| `socials` | `facebook.com`, `instagram.com`, `tiktok.com` | the real profile URLs, or delete the entries |
| `established` | 2016 | confirm |

> The `socials` array is not cosmetic. It becomes `sameAs` in the business
> structured data, which is how Google connects the website to the social
> profiles and the Business Profile. Pointing `sameAs` at `https://facebook.com`
> tells Google the business is Facebook. **Delete any social entry that has no
> real profile** rather than leaving the placeholder.

Also confirm the map pin. `site.mapEmbed` resolves to a place called "Extra Cabs
& Rent A", which is good evidence the Business Profile already exists.

> **Corrected 2026-09-21.** This section originally quoted `6.9615799,
> 79.9772074` as the office. Those were the old embed's **map view centre**, not
> the pin, about 1.1km out. The true pin, read from the place share link, is
> `6.9716567, 79.9774439`, now `site.geo`.

### 1b. Strip the invented social proof

> **Done 2026-09-21.** No `AggregateRating` is emitted anywhere, verified on a
> served build.

Decided 2026-09-20. Four edits:

1. **`aggregateRating` out of `carLd()`** ([src/lib/seo.ts:139](../src/lib/seo.ts#L139)).
   This is the one that carries penalty risk.
2. **`rating` and `reviewCount` out of `types/car.ts` and all 12 vehicles.**
   Removing the fields, not just the markup, so nothing can re-emit them. Check
   `CarCard` and the vehicle page for a visible rating first.
3. **The six testimonials in `content.ts`**, and whatever renders them. Invented
   customer quotes attributed to invented people in "Colombo 05".
4. **`site.stats`**: "12k+ completed rentals", "4.8/5 average rating", "40+
   vehicles". If the client can stand behind a real number, use it. If not,
   delete the block.

Real Google reviews on the Business Profile do this job far better than any of
this, and they are also a genuine ranking factor, which invented markup is not.
Phase 6 covers getting them.

### 1c. The photographs

All 12 vehicles share 3 stock photos. Beyond being untrue, it is a thin-content
signal: 12 pages whose main image is one of three files, none of which are the
vehicle named. Ask the client for real photos of the real fleet. This is the
kind of request that takes weeks to come back, so **ask in week one** even
though it does not block deployment.

### 1d. The legal pages

> **Rewritten 2026-09-21** from the client's policy (100 km a day, no refunds,
> per-vehicle deposit). Not reviewed by a lawyer. The retention promise in the
> privacy policy is not yet enforced by the code.

`/privacy` and `/terms` are unvetted drafts, and `/privacy` does not mention
that the site collects NIC, passport and driving licence images, which it does.
Sri Lanka's Personal Data Protection Act No. 9 of 2022 applies. Fix the privacy
policy to describe what is actually collected, how long it is kept and who sees
it. See HANDOVER section 7d.

---

## 2. Phase 2: the SEO build

This is the part the client cares most about, so this section is longer and it
is deliberately honest about what is and is not winnable.

### 2a. How "rent a car near Makola" is actually answered

That query returns **two different result sets**, ranked by two different
systems, and they need two different pieces of work.

**The map pack** (the three businesses with pins, at the top). Ranked almost
entirely from the **Google Business Profile**, on three factors Google names
itself: relevance, distance and prominence. The website is a minor input.

> **Distance cannot be engineered.** Makola is roughly 6 to 8km from
> Heiyanthuduwa, Siyabalape is closer. For a searcher standing in Makola,
> Google will prefer rental businesses in Makola. **No amount of code changes
> where the office is.** Anyone promising the client a guaranteed number one in
> the map pack for a town the business is not in is lying. What is winnable is
> being in the three-result pack for searches across this cluster of towns, and
> first for Heiyanthuduwa and the immediate area.

**The organic results** (the ordinary blue links below the map). Here the
website is the whole game, and here **number one is a realistic target**,
because the competition for "rent a car Siyabalape" as a written phrase is thin.
This is what phase 2b builds.

The split matters when reporting to the client: promise organic, work hard on
the profile, and never promise the map pack.

### 2b. Location landing pages

New route, `src/app/(site)/rent-a-car/[area]/page.tsx`, generating
`/rent-a-car/makola`, `/rent-a-car/siyabalape` and so on. Backed by a new
`src/lib/data/areas.ts` following the same accessor pattern as `services.ts`.

**Start with six, done properly**, not twenty thin ones:

| Page | Why |
| --- | --- |
| `/rent-a-car/heiyanthuduwa` | where the office actually is, the easiest win |
| `/rent-a-car/makola` | named by the client |
| `/rent-a-car/siyabalape` | named by the client |
| `/rent-a-car/kadawatha` | large nearby town, high search volume |
| `/rent-a-car/biyagama` | same district, close |
| `/rent-a-car/kiribathgoda` | large nearby town, high search volume |

Later, once these rank: Kelaniya, Wattala, Ja-Ela, Gampaha, Delgoda, Ragama.

> **The trap that kills this technique.** Templated location pages with the town
> name swapped in are **doorway pages** under Google's spam policies, and they
> get the whole set deindexed. The difference between a location page that ranks
> and one that gets you penalised is whether it contains information that is
> genuinely specific to that town.

So each page needs, written once per town and not generated:

- **Real distance and drive time** from the office to that town.
- **What delivery costs and how long it takes** to that specific town. This is
  the commercially useful fact and nobody else publishes it.
- **Local landmarks and roads**, so the page reads as written by someone who
  knows the area. For Makola, the Makola Road and the Kandy Road junction. For
  Siyabalape, proximity to the Colombo to Katunayake expressway interchange.
- **A reason specific to that town**, for example expressway access from
  Siyabalape making it convenient for airport runs.
- **Two or three vehicles recommended for that area**, linking into `/fleet`.
- **A unique FAQ block** of three or four questions with `FAQPage` markup.
- **Its own canonical, title, meta description and Open Graph image.**

Titles should carry the phrase people type, for example "Rent a Car in Makola |
Self Drive and With Driver | Extra Cabs".

### 2c. Fix the "Colombo" copy

29 references, listed by `grep -rn "Colombo" src/`. Not a blanket replace, they
split three ways:

- **Delete or correct**: `/fleet` page's "Free delivery: Colombo" stat, the
  vehicle page's "Free delivery inside Colombo", the contact page's "anywhere
  inside Colombo". Free delivery from Heiyanthuduwa is presumably to the
  surrounding towns, not to Colombo city 20km away. **Ask the client what the
  real free delivery radius is**, then say so, naming the towns. That sentence
  is itself a ranking signal.
- **Keep**: `Asia/Colombo` timezone identifiers in `lib/panel/`, and the
  landline references in `lib/contact.ts`. These are code, not copy.
- **Rewrite**: the vehicle meta description template at
  [fleet/[slug]/page.tsx:42](<../src/app/(site)/fleet/[slug]/page.tsx#L42>)
  currently reads "Hire the Toyota Prius in Colombo". It should name the real
  service area.

### 2d. Structured data fixes

In `src/lib/seo.ts`, `organisationLd()`:

- **Add `geo`.** Done 2026-09-21, from the verified pin. A `GeoCoordinates` block with the real latitude and longitude.
  It is missing entirely, and it is one of the core local signals.
- **Add `hasMap`** pointing at `site.mapLink`. Done 2026-09-21.
- **Replace `areaServed`.** It is currently `{ "@type": "Country", name: "Sri
  Lanka" }`, which tells Google nothing about local relevance. It becomes an
  array of the towns actually served, as `Place` or `City` entries. Same change
  in `serviceLd()`.
- **Add `@type: "LocalBusiness"`** alongside `AutoRental` in the array, since
  some consumers understand only the general type.
- **Remove `aggregateRating`** from `carLd()`, per phase 1b. Done 2026-09-21.
- **Add an `areaServed` `Service` block** on each location page, pointing at the
  same `@id` as the organisation so Google understands one business, many pages.

Validate everything with Google's Rich Results Test and Schema.org validator
against the deployed URL, not against the source.

### 2e. Technical SEO checklist

- **`NEXT_PUBLIC_SITE_URL=https://extracabs.lk`** in Vercel production. Without
  it every canonical, sitemap entry and Open Graph URL is built from the
  fallback. The fallback happens to be the right domain, which is luck, not
  design. Set it explicitly.
- **Pick one canonical host.** Apex (`extracabs.lk`) or `www`, not both.
  Recommend apex, with `www` permanently redirecting to it. Whichever you pick
  must match `NEXT_PUBLIC_SITE_URL`, the Business Profile's website field and
  every citation, exactly.
- **The `/fleet?category=` links in the footer.** Four footer links point at
  filtered fleet URLs. Query-string variants of one page are duplicate content.
  Either add a self-referencing canonical to `/fleet` that strips the query, or
  give the categories real routes. Decide, do not leave it.
- **Add the location pages to `sitemap.ts`**, generated from `areas.ts` the way
  vehicles and services already are.
- **Google Search Console**: verify the domain (DNS TXT record is easiest, and
  you are in the DNS panel anyway for phase 3), submit the sitemap, then watch
  the Coverage and Core Web Vitals reports.
- **Bing Webmaster Tools**: same, and it takes ten minutes.
- **Image alt text audit.** Every `<Image>` and `<img>` in `(site)/`. Vehicle
  photos should carry the vehicle name, not "car".
- **Core Web Vitals.** The hero is the LCP element and was tuned for it already,
  so this is a verification step, not expected work. Measure on the deployed
  domain with PageSpeed Insights on mobile, which is what Google ranks on.
- **`/panel` and `/999p7k` stay out of the index.** `robots.ts` already
  disallows `/panel` and `/api`. **It does not disallow `/999p7k`.** Add it, and
  add `noindex` metadata to both routes, because robots.txt only asks.

### 2f. What SEO cannot do, and what to tell the client

Say this out loud early, because it manages the only expectation that matters:

- A brand-new domain does not rank quickly. Local results typically take **three
  to six months** to settle, with the Business Profile moving faster than the
  website.
- **Reviews are the strongest lever available**, and they are the client's job,
  not yours. A profile with 40 genuine reviews beats a technically perfect
  website with none, every time.
- Proximity is fixed. See 2a.

---

## 3. Phase 3: deployment

### 3a. Pre-deploy blockers

> **Added 2026-09-21. Read these first: they outrank everything below.**
>
> **The GitHub repo is public** (`naviyasproduct/Extra-cabs-rent-a-car`
> answers unauthenticated). That turns two development shortcuts into open
> doors the moment the site is deployed:
>
> - **The test accounts.** `TEST_ACCOUNTS` in `src/lib/panel/store.ts` and the
>   table in `docs/panel.md` publish `owner1234` and the two employee
>   passwords. A fresh deploy seeds exactly those accounts, so **anyone who
>   reads the repo can sign in to `/panel` as the owner**: bookings, customer
>   ID photos, fleet, staff. Replace the seed with real accounts created from
>   environment variables (or Supabase Auth) before the first deploy, and
>   delete the table from `panel.md`.
> - **The session secret fallback**, see `PANEL_SESSION_SECRET` in 3b.
>
> Consider making the repo private. Either way, anything already pushed is
> public for good: the owner's mobile number was in `docs/sms.md` (removed
> from the working tree 2026-09-21, still in history).
>
> **The fleet ships empty.** The catalogue was cleared on 2026-09-21; staff
> add every vehicle through the panel. That makes two later phases launch
> critical rather than follow-ups:
>
> - **Supabase (phase 4).** On Vercel the panel store is memory, one copy per
>   server bundle. A vehicle added in the panel saves and then **never appears
>   on the public site**, and vanishes on the next deploy. Until phase 4 the
>   live site can have no vehicles at all.
> - **Photo upload (phase 5).** Panel-added vehicles have no photos and show a
>   placeholder tile. There is no way to add one yet.
>
> So the realistic order is: Supabase and photo upload first, **then** launch
> with a fleet. Launching earlier is possible, but the fleet pages will say
> "being listed" and send people to the phone.

- **`npm run lint` is dead.** `package.json` still calls `next lint`, which
  Next 16 removed, and there is no ESLint config at all. Install the ESLint CLI
  with `eslint-config-next` and fix the script. Do this before auth code ships.
- **No tests.** The write-window guard, the coverage calculation and now the
  Supabase row mapping are where a silent bug is expensive.
- **Commit history.** Recent commits are named `sadasd`, `addad`, `dfsdfsfsdf`.
  Not a deployment blocker, but there is no usable baseline to roll back to
  during a multi-phase backend migration. Tag a known-good commit before
  starting phase 4.

### 3b. Vercel project

1. Import the GitHub repo. Next.js is auto-detected, no build settings needed.
2. Production branch `main`. Every other branch gets a preview URL.
3. **Set the function region to Singapore (`sin1`).** The default is US East,
   which adds roughly 200ms of round trip to every server-rendered page for a
   Sri Lankan visitor. This is the single largest performance win available at
   deploy time and it is a dropdown.
4. Environment variables, Production and Preview separately:

   | Variable | Production | Preview |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://extracabs.lk` | leave unset |
   | `TEXTLK_API_TOKEN` | the token | the token |
   | `TEXTLK_SENDER_ID` | `zsensu.com` | `zsensu.com` |
   | `SMS_ENABLED` | `true` | **`false`** |
   | `PANEL_SESSION_SECRET` | **a long random string** | a different one |
   | `SUPABASE_*` | phase 4 | phase 4 |
   | `CLOUDINARY_*` | phase 5 | phase 5 |

   > **`PANEL_SESSION_SECRET` is a security requirement, not a setting.**
   > `src/lib/panel/auth.ts` signs staff session cookies with it and **falls
   > back to a hardcoded string that is in the repo**. Without it set, anyone
   > who reads the code can mint a valid owner cookie and walk into `/panel`.
   > Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
   > Found 2026-09-21. Until Supabase Auth replaces this, it guards everything.

   > `SMS_ENABLED=false` on Preview is not optional while credit is at 4 units.
   > Every test booking on a preview URL would otherwise text the owner and
   > spend real credit. See [`sms.md`](./sms.md).

5. **Deploy to the `.vercel.app` URL first and test everything there** before
   pointing the domain at it. A broken first impression on the real domain is
   worse than a day's delay.

### 3c. Connecting extracabs.lk from domains.lk

The `.lk` registry (LK Domain Registry, `domains.lk` / `nic.lk`) gives you a DNS
management panel. Two ways to connect, and the choice is real:

**Option A, keep DNS at the registry and add records.** Recommended. You keep
control of MX records for email, and nothing else that uses the domain breaks.
Add an `A` record for the apex and a `CNAME` for `www`.

**Option B, delegate nameservers to Vercel.** Simpler, Vercel manages
everything, but it moves *all* DNS including any email records. Only do this if
nothing else uses the domain.

> **Do not use a DNS target value from memory, mine or anyone's.** Vercel has
> changed its apex IP historically, and a stale value produces a domain that
> half works and is painful to diagnose. Add the domain in the Vercel project
> first, open its Domains tab, and copy the **exact** `A` and `CNAME` values
> Vercel shows you at that moment. They are on screen for this reason.

Then:

- **Set the redirect direction** in Vercel so `www` and apex do not both serve.
  One canonical host, per 2e.
- **SSL is automatic** via Let's Encrypt once DNS resolves. If it does not issue
  within an hour, check for a `CAA` record on the domain blocking Let's Encrypt.
  Some registrars add one.
- **`.lk` propagation is often slower than `.com`.** Allow up to 24 hours before
  assuming something is wrong. Verify with `nslookup extracabs.lk` rather than
  by loading the site in a browser that may have cached.
- **Once the domain is live**, update the Google Business Profile's website
  field to the exact canonical URL, and re-submit the sitemap in Search Console
  under the new domain property.

---

## 4. Phase 4: Supabase

Full migration, decided 2026-09-20. The panel does not work on Vercel without
it.

**Ownership first.** Create the project under the **client's** account with you
granted access, not under yours. Otherwise handover becomes a migration and
there is a bus factor. The exception is if the payment leverage discussed for
the SMS sender ID also applies here, in which case that is a deliberate
commercial decision and should be a conscious one, not an accident of who
clicked sign up. See HANDOVER section 7b.

**Cost.** The free tier is not appropriate for a production system running
`pg_cron` every minute for the presence sweeper. Get the current figure and put
a monthly number in front of the owner **before** building, not after.

### The work

1. **Schema from `src/lib/panel/types.ts`.** The types were written to become
   table rows and should not need reshaping: `staff`, `work_shifts`,
   `presence_segments`, `bookings`, `enquiries`, `vehicles`,
   `vehicle_overrides`, `access_requests`, `audit`, `messages`.
2. **Row Level Security on every table, with no exceptions.** RLS off on one
   table is the whole wall gone.
3. **Keep the Data Access Layer.** `src/lib/panel/store.ts` exposes
   `readData()` / `writeData()`; the accessors above it keep their signatures
   and their bodies become queries. Per HANDOVER section 3, real authorisation
   belongs beside the queries, not in `proxy.ts`, which runs on prefetches.
4. **`hydrate()` becomes migrations.** Everything `hydrate()` currently fixes on
   read (missing fields, the `fuel: "hybrid"` rewrite, rate tiers) has to happen
   once as a real migration instead. Read that function carefully before
   writing the schema.
5. **Storage bucket for identity documents, private.** The ID documents move out
   of `.data/uploads/` into a **private** bucket. They must keep going through
   `/api/panel/documents/[id]`, which requires a staff session and returns 404
   rather than 401 to a stranger. **Never a public bucket URL.**
6. **Supabase Auth for the owner and two employees.** Replaces the signed-cookie
   session. The `/999p7k` route and `proxy.ts` both change.
7. **The migration must not carry over the stale owner rows.** The dev store
   holds one owner shift and one owner presence segment from before the owner
   was taken off the timesheet. They are filtered on read today, which means
   they are invisible but still there. Do not migrate them.

---

## 5. Phase 5: Cloudinary

Vehicle photos only, decided 2026-09-20.

- **Identity documents do not go here.** They go to the private Supabase bucket
  in phase 4. Cloudinary is built for public CDN delivery and a misconfigured
  delivery type on a folder of customer NICs is a PDPA breach, not a bug.
- **`next.config.ts` `images.remotePatterns` is currently `[]`**, which blocks
  every remote image. Add the Cloudinary hostname, scoped to your cloud name's
  path rather than wildcarded.
- **Upload from the panel with a signed upload preset**, so the API secret never
  reaches the browser. The unsigned preset is the easy path and it lets anyone
  who reads your JS upload to your account.
- Cap the transformation: the repo already caps `deviceSizes` at 1920 for good
  reasons. Keep that ceiling.
- The static site imagery (hero, logo) stays in the repo. `next/image` already
  handles it well and moving it buys nothing.

---

## 6. Phase 6: the Business Profile, which the client controls

The client controls the listing, so this is a **list to hand them**, not work
you can do. It is also, per 2a, the highest-leverage item on this page.

Ask them to:

1. **Verify the listing** if it is not already, and confirm the pin is on the
   actual office.
2. **Primary category: "Car rental agency".** Secondary categories for the other
   services, for example "Van rental agency", "Chauffeur service", "Airport
   shuttle service". Categories are a major relevance signal and are frequently
   left wrong.
3. **Set the service area** to the towns in 2b, explicitly. This is how a
   business ranks for towns it is not physically in, and it is the one lever
   that partially answers the proximity problem.
4. **Make the NAP match the website exactly**, per 1a. Same phone format, same
   address wording, and the canonical website URL from 2e.
5. **Opening hours**, matching `site.openingHours`.
6. **Photos.** Real ones, of the real fleet and the real office, uploaded
   regularly. Also solves 1c if they are gathering them anyway.
7. **Reviews.** The single strongest ranking factor they control. A simple
   process: a short link texted to every customer after the hire ends. They
   already text customers for bookings, so the habit exists. **Never incentivise
   reviews**, it violates Google's policy and can remove the listing.
8. **Google Posts**, weekly. Low effort, and an active profile outranks a
   dormant one.

Alongside, build **local citations**: consistent NAP entries on Sri Lankan
directories. Consistency across them is the point, not volume.

---

## 7. Order of work

Dependencies, so nothing waits on the wrong thing.

**Week 1, in parallel**
- Ask the client for everything in 1a, the real photos (1c) and the free
  delivery radius (2c). These have the longest lead times and block the most.
- Hand the client the phase 6 Business Profile list. It starts earning while
  the code work happens.
- Phase 1b, strip the invented ratings and testimonials. Needs nothing from
  anyone and removes the only penalty risk on the site.
- Phase 3a, fix `lint`, tag a baseline commit.

**Week 1 to 2**
- Phase 3b, Vercel project on the `.vercel.app` URL, region `sin1`.
- Phase 2d and 2e, the structured data and technical SEO fixes.
- Phase 2c, the Colombo copy, once the client answers on the delivery radius.

**Week 2 to 3**
- Phase 2b, the six location pages. The biggest single piece of work here, and
  the one that wins the organic results the client asked about.
- Phase 3c, connect `extracabs.lk`, but **only after the `.vercel.app` URL is
  fully tested**.
- Search Console and Bing verification, sitemap submitted, the moment the
  domain resolves.

**Week 3 onward**
- Phase 4, Supabase. `/panel` must not be publicly reachable before this lands.
- Phase 5, Cloudinary, which is small once phase 4 is done.
- Phase 1d, the legal pages, before the panel handles real customer documents
  in production.

**Ongoing**
- Reviews, posts, citations, and watching Search Console.

---

## 8. Open questions for the client

Gather these in one conversation rather than five:

1. What is the **real free delivery radius**, by town name?
2. What are the **real phone numbers, email addresses and social profiles**?
3. What is the **postcode**?
4. Are the "40+ vehicles, 12,000 rentals, 4.8 stars" figures real? If so, which?
5. Who owns the **Supabase and Cloudinary accounts**, and has the monthly
   running cost been signed off?
6. Does anything else use `extracabs.lk`, particularly **email**? It decides
   option A versus option B in 3c.
7. When do we get **real vehicle photographs**?
