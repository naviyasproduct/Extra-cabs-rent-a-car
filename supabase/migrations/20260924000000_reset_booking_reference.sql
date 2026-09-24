-- Start booking references at EC-0001 for the real business.
--
-- Building and proving the booking flow against this project consumed
-- EC-0001 to EC-0010: every test booking, and every check of
-- next_booking_reference() itself, takes the next number, because that is the
-- point of a sequence (it never hands out the same reference twice).
--
-- The database holds no bookings at this point, so restarting is safe and the
-- first real customer gets EC-0001. RESTART WITH 1 means the next call
-- returns 1, not that 1 has already been used.
--
-- Do NOT run this again once real bookings exist: references would repeat,
-- which is the exact fault the sequence was introduced to fix.

alter sequence public.booking_reference_seq restart with 1;
