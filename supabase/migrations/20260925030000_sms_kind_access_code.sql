-- Access codes are a kind of message we now send.
--
-- `sms_messages.kind` is a CHECK constraint mirroring the SmsKind union in
-- TypeScript, and the two drifted the moment 'access.code' was added in code
-- only. The failure mode is nastier than it sounds: deliver() in
-- src/lib/sms/notify.ts deliberately never throws when it cannot write the
-- log, because the texts have already gone and the caller may be finishing a
-- customer's booking. So the message was SENT and a unit of credit spent,
-- and the only trace was a line in the server log.
--
-- Found on 2026-09-25 by a test that asserted the row existed afterwards.
--
-- LESSON, worth the comment: adding a value to a TypeScript union that maps
-- to a text column means checking for a CHECK constraint on that column.
-- There are two in this schema, this one and access_requests.scope, and both
-- needed a migration for one feature.

alter table public.sms_messages
  drop constraint sms_messages_kind_check;

alter table public.sms_messages
  add constraint sms_messages_kind_check check (kind in (
    'booking.created', 'access.code', 'test'));
