# Apply migration 028 (inspiration photo captions)

Migration `028_inspiration_photo_captions.sql` is additive and must be reviewed
before deploying the photo-caption UI.

What it adds:

- optional `caption` column on `public.inspiration_photos`;
- maximum length 120 characters;
- existing photos and captions are not changed/deleted.

Run manually in the Supabase SQL Editor after 027. Verify:

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'inspiration_photos'
  and column_name = 'caption';
```

Expected: one `caption` column of type `text`, nullable.

The app also has a read fallback so existing Inspiration pages do not break
before this migration is applied, but captions cannot be saved until it is
applied.
