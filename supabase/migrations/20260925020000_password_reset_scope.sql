-- A new access scope: resetting an employee's password.
--
-- `access_requests.scope` is a CHECK constraint, not an enum, so a scope
-- added in TypeScript alone is accepted by the compiler and rejected by the
-- database at the moment someone uses it. That is exactly how this was found:
-- the first real request raised against the live project failed with
-- "violates check constraint access_requests_scope_check".
--
-- WHAT THIS SCOPE MEANS, and it is unlike the others. Every existing scope
-- grants an employee something the owner already has. This one is held by the
-- OWNER and confirms his own action: a reset hands over the ability to sign in
-- as an employee, so a code to his own mobile is a second factor rather than a
-- permission. assertConfirmed() in src/lib/panel/guard.ts is the check, and it
-- deliberately does NOT wave the owner through the way assertCanWrite does.

alter table public.access_requests
  drop constraint access_requests_scope_check;

alter table public.access_requests
  add constraint access_requests_scope_check check (scope in (
    'fleet.create', 'fleet.update', 'fleet.delete',
    'fleet.photos', 'pricing.update', 'booking.delete',
    'staff.password'));
