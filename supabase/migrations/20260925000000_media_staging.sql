-- Staging for vehicle photographs and video on their way to Cloudinary.
--
-- WHY THIS EXISTS, measured from Sri Lanka on 2026-09-25 with one 8.67MB
-- clip, uploaded repeatedly:
--
--   to Cloudinary directly   18s, 22.6s, 26.3s, 67.8s, 69.4s, 82.2s, 99.6s, 207.1s
--   to Supabase in Mumbai    14.5s, 15.3s, 16.7s, 23.0s
--
-- The long route to Cloudinary is not merely slower, it is unpredictable:
-- the same file to the same endpoint took 22.6s and then 207.1s minutes
-- apart. Cloudinary's own Asia-Pacific hostname was no better (26.3s).
--
-- So the browser uploads here, close by, and the server then has Cloudinary
-- FETCH the object from a short lived signed URL. That leg is server to
-- server and measured 1.67 MB/s, four times what the browser achieves.
--
-- Nothing lives here for long: the object is deleted as soon as Cloudinary
-- has it, and anything left behind by a failure is swept after a day.
--
-- Private, with no storage policies, exactly like id-documents: only the
-- service role touches it, and the browser only ever holds a signed URL for
-- one object at a time.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-staging',
  'media-staging',
  false,
  -- 50MB. This is the cap on a video, and it is set by the Supabase plan's
  -- own per-file limit rather than chosen: a larger bucket limit is refused
  -- outright ("The object exceeded the maximum allowed size").
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp', 'video/x-msvideo'
  ]
);
