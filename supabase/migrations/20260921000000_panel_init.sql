-- The staff panel, moved from .data/panel.json into Postgres.
--
-- Mirrors src/lib/panel/types.ts. Column names are snake_case; the data layer
-- maps them to the camelCase the rest of the app already uses.
--
-- SECURITY MODEL. Read this before adding a policy.
--
--   Supabase Auth proves WHO a staff member is. It does not grant data access.
--   Every table below has row level security ON and NO policies, so the anon
--   and authenticated roles can read and write nothing, even with a valid
--   staff session used straight from a browser. All data access goes through
--   the server, with the service role, AFTER src/lib/panel/guard.ts has checked
--   the session, the staff row and, for employees, the owner-approved write
--   window. That keeps the three walls of docs/internal-platform-plan.md:
--   the guard, RLS as a backstop, and server-only execution.
--
--   Adding a policy that grants `authenticated` access opens that table to any
--   staff member's browser, bypassing the write windows. Do not, without
--   redesigning the guard.

-- --------------------------------------------------------------------------
-- Staff. One row per auth user who may use the panel.
-- --------------------------------------------------------------------------

create table public.staff (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null,
  email       text not null unique,
  role        text not null check (role in ('owner', 'employee')),
  active      boolean not null default true,
  -- As the person typed it. Normalised to 94XXXXXXXXX only when sending.
  phone       text not null default '',
  sms_alerts  boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Exactly one owner. The timesheet exemption and the approval flow both
-- assume it.
create unique index staff_one_owner on public.staff ((role)) where role = 'owner';

-- --------------------------------------------------------------------------
-- The timesheet: the claim (shifts) and the evidence (presence).
-- --------------------------------------------------------------------------

create table public.work_shifts (
  id             text primary key,
  staff_id       uuid not null references public.staff (id) on delete cascade,
  -- Asia/Colombo calendar day.
  work_date      date not null,
  signed_in_at   timestamptz not null,
  -- Null means they never pressed Sign out. Never guess a value here.
  signed_out_at  timestamptz,
  end_reason     text check (end_reason in ('manual_signout', 'shift_expiry', 'owner_closed'))
);
create index work_shifts_staff_date on public.work_shifts (staff_id, work_date);

create table public.presence_segments (
  id                 text primary key,
  shift_id           text not null references public.work_shifts (id) on delete cascade,
  staff_id           uuid not null references public.staff (id) on delete cascade,
  from_at            timestamptz not null,
  to_at              timestamptz,
  last_heartbeat_at  timestamptz not null,
  ended_by           text check (ended_by in ('sign_out', 'heartbeat_timeout', 'tab_hidden', 'browser_closed'))
);
create index presence_open on public.presence_segments (staff_id) where to_at is null;
create index presence_shift on public.presence_segments (shift_id);

-- --------------------------------------------------------------------------
-- The write window: an employee asks, the owner reads out a code.
-- --------------------------------------------------------------------------

create table public.access_requests (
  id                 text primary key,
  staff_id           uuid not null references public.staff (id) on delete cascade,
  shift_id           text references public.work_shifts (id) on delete set null,
  scope              text not null check (scope in (
                       'fleet.create', 'fleet.update', 'fleet.delete',
                       'fleet.photos', 'pricing.update', 'booking.delete')),
  -- When set, the window opens on this vehicle only.
  target_slug        text,
  reason             text not null default '',
  -- HMAC-SHA256 of the code. Nulled the moment it is consumed.
  code_hash          text,
  attempts           integer not null default 0,
  status             text not null check (status in ('awaiting_code', 'open', 'closed', 'burned')),
  created_at         timestamptz not null default now(),
  code_expires_at    timestamptz not null,
  window_expires_at  timestamptz,
  closed_at          timestamptz,
  close_reason       text,
  -- Shown on the owner's screen until the code goes out by SMS. Remove the
  -- column when it does.
  dev_code           text
);
create index access_requests_staff_status on public.access_requests (staff_id, status);

-- --------------------------------------------------------------------------
-- Audit. Append only. staff_id null means the system itself acted (the
-- retention rule deleting ID photos, for example).
-- --------------------------------------------------------------------------

create table public.audit (
  id                 text primary key,
  at                 timestamptz not null default now(),
  staff_id           uuid references public.staff (id) on delete set null,
  action             text not null,
  entity             text not null check (entity in ('vehicle', 'booking', 'enquiry', 'staff', 'access', 'shift')),
  entity_id          text not null,
  summary            text not null,
  access_request_id  text references public.access_requests (id) on delete set null
);
create index audit_at on public.audit (at desc);
create index audit_staff on public.audit (staff_id, at desc);

-- --------------------------------------------------------------------------
-- Vehicles. Every vehicle is added by staff: the catalogue in
-- src/lib/data/cars.ts ships empty, so there is nothing to layer overrides
-- over and edits update the row directly.
-- --------------------------------------------------------------------------

create table public.vehicles (
  slug               text primary key,
  name               text not null,
  brand              text not null default '',
  year               integer not null,
  category           text not null,
  tagline            text not null default '',
  description        text not null default '',
  features           text[] not null default '{}',
  seats              integer not null check (seats between 1 and 60),
  doors              integer not null check (doors between 1 and 8),
  luggage            integer not null default 2,
  transmission       text not null check (transmission in ('automatic', 'manual')),
  fuel               text not null check (fuel in ('petrol', 'diesel', 'electric')),
  hybrid             boolean not null default false,
  engine_cc          integer not null default 0,
  daily              integer not null check (daily >= 0),
  -- Per-day rate for each long-hire duration: week1, week2, week3, month1,
  -- month3, month6. Totals are never stored.
  tiers              jsonb not null,
  deposit            integer not null default 0,
  -- LKR per km beyond 100 km a day. Null means "ask us".
  extra_km           integer check (extra_km is null or extra_km > 0),
  with_driver_daily  integer,
  -- Cloudinary public ids, in display order. At most five are shown.
  images             text[] not null default '{}',
  available          boolean not null default true,
  featured           boolean not null default false,
  created_at         timestamptz not null default now(),
  created_by         uuid references public.staff (id) on delete set null,
  -- Soft delete: hidden everywhere, restorable for 30 days.
  deleted_at         timestamptz
);
create index vehicles_live on public.vehicles (featured desc, created_at) where deleted_at is null;

-- --------------------------------------------------------------------------
-- Bookings.
-- --------------------------------------------------------------------------

create table public.bookings (
  id                   text primary key,
  reference            text not null unique,
  car_slug             text references public.vehicles (slug) on delete set null,
  customer_name        text not null,
  -- The number staff call, and the one they message. The website requires
  -- both and requires them to differ.
  phone                text not null,
  whatsapp             text not null default '',
  email                text not null default '',
  pickup_location      text not null,
  pickup_date          date not null,
  return_date          date not null,
  with_driver          boolean not null default false,
  notes                text not null default '',
  status               text not null default 'pending'
                         check (status in ('pending', 'confirmed', 'on_hire', 'returned', 'cancelled')),
  payment_method       text not null default 'unpaid'
                         check (payment_method in ('unpaid', 'cash', 'bank_transfer', 'card_on_pickup')),
  amount               integer not null default 0,
  created_at           timestamptz not null default now(),
  handled_by           uuid references public.staff (id) on delete set null,
  source               text not null check (source in ('website', 'panel')),
  id_type              text not null default 'nic' check (id_type in ('nic', 'passport')),
  -- Metadata only: { id, slot, fileName, contentType, size, uploadedAt }.
  -- The bytes live in the private id-documents bucket, keyed by id.
  documents            jsonb not null default '[]',
  -- Typed by staff at handover. They keep a past customer identifiable after
  -- the photos are deleted. See src/lib/panel/retention-rules.ts.
  id_number            text not null default '',
  licence_number       text not null default '',
  closed_at            timestamptz,
  documents_hold       boolean not null default false,
  documents_purged_at  timestamptz,
  check (return_date >= pickup_date)
);
create index bookings_created on public.bookings (created_at desc);
create index bookings_car_status on public.bookings (car_slug, status);
-- Finding a past customer: by phone, by ID number, by licence number.
create index bookings_phone on public.bookings (phone);
create index bookings_id_number on public.bookings (id_number) where id_number <> '';
create index bookings_licence_number on public.bookings (licence_number) where licence_number <> '';

-- --------------------------------------------------------------------------
-- Enquiries from the contact form.
-- --------------------------------------------------------------------------

create table public.enquiries (
  id           text primary key,
  name         text not null,
  email        text not null default '',
  phone        text not null default '',
  subject      text not null default '',
  created_at   timestamptz not null default now(),
  status       text not null default 'open' check (status in ('open', 'answered', 'closed')),
  assigned_to  uuid references public.staff (id) on delete set null
);
create index enquiries_created on public.enquiries (created_at desc);

create table public.enquiry_messages (
  id             text primary key,
  enquiry_id     text not null references public.enquiries (id) on delete cascade,
  at             timestamptz not null default now(),
  -- Null for the customer's own message.
  from_staff_id  uuid references public.staff (id) on delete set null,
  body           text not null
);
create index enquiry_messages_thread on public.enquiry_messages (enquiry_id, at);

-- --------------------------------------------------------------------------
-- Outbound SMS log. One send attempt, one row.
-- --------------------------------------------------------------------------

create table public.sms_messages (
  id           text primary key,
  at           timestamptz not null default now(),
  -- Normalised 94XXXXXXXXX.
  "to"         text not null,
  staff_id     uuid references public.staff (id) on delete set null,
  kind         text not null check (kind in ('booking.created', 'test')),
  body         text not null,
  segments     integer not null,
  status       text not null check (status in ('sent', 'failed', 'skipped')),
  provider_id  text,
  error        text
);
create index sms_messages_at on public.sms_messages (at desc);

-- --------------------------------------------------------------------------
-- Row level security: ON everywhere, no policies. See the header.
-- --------------------------------------------------------------------------

alter table public.staff             enable row level security;
alter table public.work_shifts       enable row level security;
alter table public.presence_segments enable row level security;
alter table public.access_requests   enable row level security;
alter table public.audit             enable row level security;
alter table public.vehicles          enable row level security;
alter table public.bookings          enable row level security;
alter table public.enquiries         enable row level security;
alter table public.enquiry_messages  enable row level security;
alter table public.sms_messages      enable row level security;

-- Belt and braces: RLS with no policies already denies these roles, but an
-- explicit revoke means a policy added by mistake still has no grant to use.
revoke all on all tables in schema public from anon, authenticated;

-- --------------------------------------------------------------------------
-- Identity photos: a private bucket. Never public, no storage policies, so
-- only the service role can read or write it. Staff see a photo only through
-- /api/panel/documents/[id], which checks the session first.
-- --------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'id-documents',
  'id-documents',
  false,
  8388608,  -- 8MB, matching MAX_UPLOAD_BYTES in src/lib/panel/uploads.ts
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
);
