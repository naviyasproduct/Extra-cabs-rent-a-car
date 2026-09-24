-- Vehicle walkaround videos.
--
-- Each entry is {"id": "<cloudinary public id>", "uploadedAt": "<ISO 8601>"},
-- in display order.
--
-- jsonb rather than text[] because a video needs a date beside it. Google
-- will not treat a VideoObject as a video result without `uploadDate`, so a
-- bare list of ids would put a video on the page that search engines could
-- see but never rank. Photographs need no such thing and stay text[].
--
-- Kept as its own column rather than mixed into `images` so that a caller
-- reading a vehicle cannot render a 30MB video where a photograph belongs,
-- and so the five photo cap stays a count of photographs.

alter table public.vehicles
  add column if not exists videos jsonb not null default '[]'::jsonb;

comment on column public.vehicles.videos is
  'Walkaround videos as [{"id": cloudinary public id, "uploadedAt": ISO 8601}], in display order. At most two are shown.';
