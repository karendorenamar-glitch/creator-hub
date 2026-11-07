# Apply 059 — Seserahan module

Additive migration. Creates three tables, a private storage bucket and the RLS
policies that keep everything scoped to the customer's wedding.

## Tables

| Table | Purpose |
|---|---|
| `seserahan_categories` | custom categories per wedding, unique name (case-insensitive) |
| `seserahan_items` | one row per item: party, name, category, **single** price, quantity, status, notes |
| `seserahan_photos` | many photos per item, cascade delete with the item |

Deleting a category sets `seserahan_items.category_id = NULL` — items are never
removed silently.

## Storage

Bucket `seserahan-photos`, private, path `<weddingId>/<itemId>/<file>`.
Policies allow read/write/delete only when `wedding_has_access(<weddingId>)`.

## Run

Supabase SQL Editor -> `supabase/wedding/059_seserahan.sql`.

## Verify

```sql
select table_name from information_schema.tables
where table_schema = 'public' and table_name like 'seserahan%';
-- expect 3 rows

select id, public from storage.buckets where id = 'seserahan-photos';
-- expect public = false
```
