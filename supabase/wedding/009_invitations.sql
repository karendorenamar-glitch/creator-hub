-- Kefoo Wedding Planner - 009: e-invitation website + RSVP.
-- Run NINTH, after 008. Safe to re-run. Non-destructive.

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null unique references public.weddings(id) on delete cascade,
  slug text not null unique
    check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$'),
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  template text not null default 'elegant' check (template = 'elegant'),
  content jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invitations_wedding_idx on public.invitations (wedding_id);

drop trigger if exists invitations_set_updated_at on public.invitations;
create trigger invitations_set_updated_at before update on public.invitations
  for each row execute function public.set_updated_at();

create table if not exists public.invitation_rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  attendance text not null check (attendance in ('attending', 'not_attending')),
  guests integer not null default 1 check (guests between 1 and 10),
  message text check (message is null or char_length(message) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists invitation_rsvps_invitation_idx
  on public.invitation_rsvps (invitation_id, created_at desc);
create index if not exists invitation_rsvps_wedding_idx
  on public.invitation_rsvps (wedding_id);

alter table public.invitations enable row level security;
alter table public.invitation_rsvps enable row level security;

drop policy if exists "Owners manage invitations" on public.invitations;
create policy "Owners manage invitations" on public.invitations
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

drop policy if exists "Public reads published invitations" on public.invitations;
create policy "Public reads published invitations" on public.invitations
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists "Owners read rsvps" on public.invitation_rsvps;
create policy "Owners read rsvps" on public.invitation_rsvps
  for select to authenticated
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id
        and public.is_wedding_member(i.wedding_id)
    )
  );

drop policy if exists "Owners delete rsvps" on public.invitation_rsvps;
create policy "Owners delete rsvps" on public.invitation_rsvps
  for delete to authenticated
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id
        and public.is_wedding_member(i.wedding_id)
    )
  );

drop policy if exists "Public submits rsvp" on public.invitation_rsvps;
create policy "Public submits rsvp" on public.invitation_rsvps
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id
        and i.status = 'published'
        and i.wedding_id = invitation_rsvps.wedding_id
    )
  );

revoke all on public.invitations from anon, authenticated;
grant select on public.invitations to anon;
grant select, insert, update, delete on public.invitations to authenticated;

revoke all on public.invitation_rsvps from anon, authenticated;
grant insert on public.invitation_rsvps to anon;
grant select, insert, delete on public.invitation_rsvps to authenticated;

-- Public read: returns only published invitations, joined with the couple's
-- names and date, without exposing the weddings table or any draft.
create or replace function public.get_public_invitation(p_slug text)
returns table (
  id uuid,
  wedding_id uuid,
  content jsonb,
  template text,
  published_at timestamptz,
  partner_one_name text,
  partner_two_name text,
  wedding_date date,
  location text
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.wedding_id, i.content, i.template, i.published_at,
         w.partner_one_name, w.partner_two_name, w.wedding_date, w.location
  from public.invitations i
  join public.weddings w on w.id = i.wedding_id
  where i.slug = lower(p_slug)
    and i.status = 'published'
  limit 1;
$$;

revoke all on function public.get_public_invitation(text) from public;
grant execute on function public.get_public_invitation(text) to anon, authenticated;

notify pgrst, 'reload schema';
