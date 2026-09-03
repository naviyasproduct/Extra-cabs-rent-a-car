# Extra Cabs & Rent a Cars

Front-end for the Extra Cabs & Rent a Cars website. This is a **UI-only build**
for customer review: every page is complete and clickable, but nothing talks to
a server yet. The structure is laid out so the backend drops in without moving
files around.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm start   # production build
```

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home — hero, vehicle-type tiles, services, featured fleet, how it works, why us, popular routes, reviews, FAQ |
| `/fleet` | Full fleet with live filtering by category, transmission, fuel, seats and price |
| `/fleet/[slug]` | Vehicle page — gallery, specs, features, daily/weekly/monthly pricing, what's included, related vehicles |
| `/services` | All five services with indicative rate tables |
| `/services/[slug]` | Service page — how it works, rates, inclusions, vehicles used |
| `/booking` | Four-step booking flow with a live price estimate |
| `/about` | Story, timeline, values, branches |
| `/contact` | Contact channels, message form, branch list |
| `/faq` | Full FAQ grouped by topic |
| `/terms`, `/privacy` | Legal pages |

## The design system

Three files hold the entire visual language. Change them and the whole site
follows — do not hardcode spacing, radius or colour in a component.

- **`src/app/globals.css`** — colour tokens, the grid system (`--shell`,
  `--gutter`, `--gap`, `--section-y`, `--overlap`), the radius scale, and the
  `.shell` / `.grid12` / `.panel` classes.
- **`src/components/ui/Layout.tsx`** — `Shell`, `Grid`, `Section`,
  `SectionHeader`, `Panel`. Every page composes from these, which is why
  columns line up from the navbar to the footer.
- **`src/components/ui/Button.tsx`**, `Field.tsx`, `Badge.tsx` — the controls.

Rules the build follows:

- One container width, one gap value, one radius scale, one section rhythm.
- Separation comes from **background tone**, not borders. Borders are rare and
  hairline rules (`.rule`) are preferred.
- No glows, no coloured shadows, no gradient shine, no background patterns.
  Surfaces are flat; shadows are neutral and tight.
- Cards overlap section seams deliberately (hero search bar, stats slab, footer
  CTA) so bands lock together rather than stacking.

### Colours

Taken from the logo — signal red `#E01B22`, deep maroon `#8E1420`, graphite
`#101012`, warm paper `#F6F4F1`. No blues, violets or default framework greys.

## Where the backend plugs in

Data lives in one place and is read through async accessors, so swapping mock
arrays for database queries touches no components:

| File | Replace with |
| --- | --- |
| `src/lib/data/cars.ts` | `getCars`, `getCarBySlug`, `getFeaturedCars`, `getRelatedCars`, `getCategoryCounts` → DB queries |
| `src/lib/data/services.ts` | `getServices`, `getServiceBySlug` → DB queries |
| `src/lib/data/content.ts` | testimonials, FAQs, locations, destinations, extras |
| `src/lib/data/site.ts` | company details, navigation |

Two places submit form data. Both are marked `BACKEND SEAM` in the code:

- `src/components/booking/BookingForm.tsx` → `POST /api/bookings`
- `src/components/common/ContactForm.tsx` → `POST /api/contact`

`filterCars()` in `cars.ts` already accepts the same filter shape the
availability API should take, so the query contract is settled.

Add API routes under `src/app/api/`.

## Still to supply

- **Fleet photos** → `public/images/cars/` (see the README in that folder for
  exact filenames). Three are in place (C-HR, Prius, Wagon R Stingray); the
  other nine still show a branded placeholder rather than a broken image, so
  the site is safe to demo as-is.
- **Destination photos** → `public/images/gallery/` (README in that folder).
- **Real company details** — phone numbers, address, email and social links are
  placeholders in `src/lib/data/site.ts`.
- **Real rates** — pricing in `cars.ts` and `services.ts` is realistic but
  invented. Confirm before going live.
- **Legal review** — `/terms` and `/privacy` are drafted as a starting point,
  not vetted copy.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
lucide-react. No UI framework — the components are the design system.
