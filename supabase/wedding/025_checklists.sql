-- Kefoo Wedding Planner - 025: checklist containers + built-in KUA metadata.
-- Additive only. Existing checklist_tasks rows keep checklist_id = NULL and are
-- treated as legacy "Tugas & Timeline" entries.
--
-- The built-in checklist's task rows are a snapshot inserted once per wedding.
-- Updating the application template later does not rewrite an existing snapshot.

create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  kind text not null default 'custom'
    check (kind in ('custom', 'builtin_kua')),
  template_key text,
  template_year integer
    check (template_year is null or template_year between 2000 and 2100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id),
  unique (wedding_id, template_key)
);

create index if not exists checklists_wedding_idx
  on public.checklists (wedding_id, kind, created_at);

drop trigger if exists checklists_updated_at on public.checklists;
create trigger checklists_updated_at
  before update on public.checklists
  for each row execute function public.set_updated_at();

alter table public.checklists enable row level security;

drop policy if exists "Subscribed members manage checklists" on public.checklists;
create policy "Subscribed members manage checklists"
  on public.checklists
  for all to authenticated
  using (public.wedding_has_access(wedding_id))
  with check (public.wedding_has_access(wedding_id));

revoke all on public.checklists from anon, authenticated;
grant select, insert, update, delete on public.checklists to authenticated;

alter table public.checklist_tasks
  add column if not exists checklist_id uuid,
  add column if not exists group_name text
    check (group_name is null or char_length(group_name) <= 120),
  add column if not exists sort_order integer not null default 0
    check (sort_order >= 0),
  add column if not exists template_item_key text,
  add column if not exists is_required boolean not null default false;

alter table public.checklist_tasks
  drop constraint if exists checklist_tasks_checklist_fk;
alter table public.checklist_tasks
  add constraint checklist_tasks_checklist_fk
  foreign key (checklist_id, wedding_id)
  references public.checklists (id, wedding_id) on delete cascade;

alter table public.checklist_tasks
  drop constraint if exists checklist_tasks_checklist_template_item_key;
alter table public.checklist_tasks
  add constraint checklist_tasks_checklist_template_item_key
  unique (checklist_id, template_item_key);

create index if not exists checklist_tasks_checklist_idx
  on public.checklist_tasks (checklist_id, sort_order);

notify pgrst, 'reload schema';
