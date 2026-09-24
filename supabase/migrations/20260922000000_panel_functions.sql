-- Two jobs only the database can do safely.
--
-- Both functions are callable by the service role alone. Postgres grants
-- EXECUTE on new functions to PUBLIC by default, which would let the anon key
-- call them through the REST API, so that grant is revoked explicitly.

-- --------------------------------------------------------------------------
-- Booking references.
--
-- The file store numbered bookings as "count + 1", so deleting one booking
-- made the next new booking reuse a reference already given to a customer.
-- A sequence never goes backwards and never hands out the same number twice,
-- even to two bookings made in the same instant.
-- --------------------------------------------------------------------------

create sequence public.booking_reference_seq;

create function public.next_booking_reference()
returns text
language sql
volatile
set search_path = public
as $$
  select 'EC-' || lpad(nextval('public.booking_reference_seq')::text, 4, '0');
$$;

-- --------------------------------------------------------------------------
-- The timesheet sweeper.
--
-- A presence segment that stopped beating is closed at its LAST HEARTBEAT, the
-- last moment presence was proven, not at the moment the sweep ran. That
-- detail is what keeps the coverage figure honest however late the sweep
-- runs, and it is why this is SQL: "set to_at to last_heartbeat_at" copies one
-- column into another, which the REST API cannot express.
--
-- A shift still open after its Colombo calendar day is closed with no sign-out
-- time: nobody knows when they left, and inventing a time would be the one
-- dishonest thing the timesheet could do.
-- --------------------------------------------------------------------------

create function public.panel_sweep(timeout_seconds integer)
returns void
language sql
volatile
set search_path = public
as $$
  update public.presence_segments
     set to_at = last_heartbeat_at,
         ended_by = 'heartbeat_timeout'
   where to_at is null
     and last_heartbeat_at < now() - make_interval(secs => timeout_seconds);

  update public.work_shifts
     set end_reason = 'shift_expiry'
   where signed_out_at is null
     and end_reason is null
     and work_date < (now() at time zone 'Asia/Colombo')::date;
$$;

-- --------------------------------------------------------------------------
-- Service role only.
-- --------------------------------------------------------------------------

revoke all on sequence public.booking_reference_seq from public, anon, authenticated;
grant usage, select on sequence public.booking_reference_seq to service_role;

revoke execute on function public.next_booking_reference() from public, anon, authenticated;
revoke execute on function public.panel_sweep(integer) from public, anon, authenticated;
grant execute on function public.next_booking_reference() to service_role;
grant execute on function public.panel_sweep(integer) to service_role;
