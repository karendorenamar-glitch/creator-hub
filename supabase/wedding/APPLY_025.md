# Apply migration 025 (built-in KUA + custom checklists)

Migration `025_checklists.sql` is additive and must be reviewed/applied before
deploying the checklist UI that depends on it.

What it adds:

- `public.checklists` for custom and built-in checklist containers;
- `checklist_tasks.checklist_id`, `group_name`, `sort_order`,
  `template_item_key`, and `is_required`;
- a composite foreign key so deleting a custom checklist removes its own items;
- a unique `(checklist_id, template_item_key)` guard for idempotent KUA seeding;
- RLS for `checklists` using the existing `wedding_has_access(wedding_id)` rule.

Existing `checklist_tasks` rows are untouched: `checklist_id` stays `NULL` and
they remain visible under “Tugas & Timeline lainnya.”

The built-in KUA checklist is a **snapshot**: initialization inserts the current
year and the 24 template rows once. Later template edits do not rewrite an
existing wedding snapshot. The same wedding cannot receive a duplicate built-in
checklist because of the unique `(wedding_id, template_key)` constraint.

Run after 024, then verify:

```sql
select to_regclass('public.checklists') is not null as checklists_table;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'checklist_tasks'
  and column_name in (
    'checklist_id', 'group_name', 'sort_order',
    'template_item_key', 'is_required'
  )
order by column_name;

select count(*) as checklist_count
from public.checklists
where kind = 'builtin_kua';
```

Expected after the first Checklist page load for a wedding:

- `checklists_table = true`
- five checklist-task columns present
- one `builtin_kua` checklist per wedding, never more

This migration must be applied before deploying the checklist UI.
