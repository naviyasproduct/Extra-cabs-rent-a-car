-- Tap to start and end a shift.
--
-- THE DESIGN, and it is the client's, not the obvious one. The NFC card is
-- GLUED TO THE DESK. It is not issued to a person and it never leaves the
-- office, so:
--
--   the card proves the PLACE,
--   the phone that taps it proves the PERSON (their own signed-in session).
--
-- That is why there is one card here and not one per employee, and why this
-- table has no staff_id. A card taken home cannot exist, and a phone alone
-- cannot clock anybody in.
--
-- The card holds a plain URL, which every iPhone from the XS and every
-- Android reads with no app installed. Web NFC was rejected: it is Chromium
-- on Android only, about 6% of browsers, and Safari does not implement it.
--
-- WHAT THIS DOES NOT STOP, stated plainly: the URL is visible in the address
-- bar when the page opens, so somebody who notes it down can open the same
-- page from home. They still need their own signed-in session, so it is an
-- employee cheating deliberately rather than a stranger getting in, and the
-- proven-presence heartbeat already makes a claimed shift with no presence
-- visible to the owner. Closing it properly needs a tag that signs each tap
-- (NTAG 424 DNA), which is a hardware change, not a code one.

create table public.tap_cards (
  id           text primary key,
  -- What goes in the URL on the tag. 32 hex characters, so it cannot be
  -- guessed or walked, and unique so a tag can be replaced without touching
  -- the rows that reference it.
  token        text not null unique,
  label        text not null default '',
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  created_by   uuid references public.staff (id) on delete set null,
  last_tap_at  timestamptz
);

alter table public.tap_cards enable row level security;
revoke all on public.tap_cards from anon, authenticated;

comment on table public.tap_cards is
  'NFC cards fixed at the office. The card proves the place; the phone that taps it proves the person.';
