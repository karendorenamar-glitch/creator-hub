-- Kefoo Wedding Planner - 022: restrict MIME types for NEW uploads only.
-- Run TWENTY-SECOND, after 021. Non-destructive.
--
-- Existing objects are not modified or deleted. Existing WEBP files remain
-- readable through the existing storage policies; only new uploads are
-- restricted by the bucket allowlists below.
--
-- Prerequisites: storage buckets from 006 (payment-proofs) and 007
-- (inspiration-images). Application-level validation will also enforce these
-- lists, so this migration is defense in depth.

update storage.buckets
set allowed_mime_types = array['image/png', 'image/jpeg', 'application/pdf']
where id = 'payment-proofs';

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png']
where id = 'inspiration-images';

notify pgrst, 'reload schema';
