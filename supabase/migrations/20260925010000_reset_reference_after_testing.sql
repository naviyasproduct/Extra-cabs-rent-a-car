-- Start booking references at EC-0001 again, after the test data was cleared.
--
-- The developer tested the booking form and the fleet on 2026-09-25 and then
-- asked for the project to be emptied. Every table but `staff` was cleared,
-- along with the identity photos, the staging bucket and the Cloudinary
-- files. The sequence is not a table, so it kept counting, and the first real
-- customer would otherwise get EC-0002 or later.
--
-- SAFE ONLY BECAUSE `bookings` IS EMPTY. Verified empty immediately before
-- this was written. RESTART WITH 1 means the next call returns 1, not that 1
-- has already been used.
--
-- Do NOT run this again once real bookings exist: references would repeat,
-- which is the exact fault the sequence was introduced to fix.

alter sequence public.booking_reference_seq restart with 1;
