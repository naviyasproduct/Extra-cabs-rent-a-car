-- Put the counter back to EC-0001 after proving the previous reset worked.
--
-- The only way to read this sequence is to take a number from it, so the
-- check that the reset had worked consumed EC-0001 and EC-0002. This gives
-- them back, and the first real customer gets EC-0001.
--
-- Same warning as the previous reset: the table still holds no bookings, so
-- this is safe. Do NOT run it once real bookings exist; references would
-- repeat, which is the fault the sequence exists to prevent.

alter sequence public.booking_reference_seq restart with 1;
