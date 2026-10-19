-- Kefoo Wedding Planner - 002 features: budget, vendors, guests, tasks, inspiration.
-- Run SECOND (after 001_core.sql). Safe to re-run. Non-destructive.
--
-- Cross-wedding safety: every child row carries wedding_id, and references to
-- another table use COMPOSITE foreign keys (wedding_id, x_id). A row can never
-- point at another couple's category, vendor or member even if an ID is guessed.
-- "on delete set null (column)" requires PostgreSQL 15+ (Supabase default).

-- ---------------------------------------------------------------------------
-- budget_categories
-- ---------------------------------------------------------------------------
create table if not exists public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  planned_amount numeric(14,0) not null default 0 check (planned_amount >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id)
);
create unique index if not exists budget_categories_name_idx
  on public.budget_categories (wedding_id, lower(name));

-- ---------------------------------------------------------------------------
-- vendors
-- ---------------------------------------------------------------------------
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  category text not null default 'other' check (category in (
    'venue','catering','photography','videography','makeup_artist','wedding_attire',
    'decoration','entertainment','invitations','souvenirs','other')),
  contact_name text check (contact_name is null or char_length(contact_name) <= 120),
  phone text check (phone is null or char_length(phone) <= 40),
  email text check (email is null or char_length(email) <= 200),
  website text check (website is null or char_length(website) <= 500),
  quoted_price numeric(14,0) check (quoted_price is null or quoted_price >= 0),
  agreed_price numeric(14,0) check (agreed_price is null or agreed_price >= 0),
  deposit_amount numeric(14,0) not null default 0 check (deposit_amount >= 0),
  amount_paid numeric(14,0) not null default 0 check (amount_paid >= 0),
  booking_status text not null default 'considering'
    check (booking_status in ('considering','contacted','booked','cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','deposit_paid','partially_paid','paid')),
  booking_date date,
  event_service_date date,
  next_payment_due date,
  contract_notes text check (contract_notes is null or char_length(contract_notes) <= 4000),
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id)
);
create index if not exists vendors_wedding_idx on public.vendors (wedding_id, category);

-- ---------------------------------------------------------------------------
-- expenses (outstanding balance = amount - amount_paid, computed in queries)
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  category_id uuid,
  vendor_id uuid,
  name text not null check (char_length(trim(name)) between 1 and 120),
  amount numeric(14,0) not null default 0 check (amount >= 0),  -- agreed/actual cost
  deposit_amount numeric(14,0) not null default 0 check (deposit_amount >= 0),
  amount_paid numeric(14,0) not null default 0 check (amount_paid >= 0),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','deposit_paid','partially_paid','paid')),
  due_date date,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (amount_paid <= amount),
  check (deposit_amount <= amount),
  foreign key (category_id, wedding_id)
    references public.budget_categories (id, wedding_id) on delete set null (category_id),
  foreign key (vendor_id, wedding_id)
    references public.vendors (id, wedding_id) on delete set null (vendor_id)
);
create index if not exists expenses_wedding_idx on public.expenses (wedding_id, due_date);
create index if not exists expenses_category_idx on public.expenses (category_id);
create index if not exists expenses_vendor_idx on public.expenses (vendor_id);

-- ---------------------------------------------------------------------------
-- guests
-- ---------------------------------------------------------------------------
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  phone text check (phone is null or char_length(phone) <= 40),
  email text check (email is null or char_length(email) <= 200),
  guest_group text check (guest_group is null or char_length(guest_group) <= 80),
  invitation_status text not null default 'not_sent'
    check (invitation_status in ('not_sent','sent')),
  rsvp_status text not null default 'pending'
    check (rsvp_status in ('pending','attending','not_attending')),
  plus_ones integer not null default 0 check (plus_ones between 0 and 20),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists guests_wedding_idx on public.guests (wedding_id, rsvp_status);

-- ---------------------------------------------------------------------------
-- checklist_tasks (assigned_to must be a member of the SAME wedding)
-- ---------------------------------------------------------------------------
create table if not exists public.checklist_tasks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text check (description is null or char_length(description) <= 2000),
  stage text not null default 'planning' check (stage in (
    '12_plus_months','9_to_12_months','6_to_9_months','3_to_6_months',
    '1_to_3_months','final_month','wedding_week','planning')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  due_date date,
  assigned_to uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (wedding_id, assigned_to)
    references public.wedding_members (wedding_id, user_id) on delete set null (assigned_to)
);
create index if not exists checklist_tasks_wedding_idx
  on public.checklist_tasks (wedding_id, status, due_date);

-- ---------------------------------------------------------------------------
-- inspiration_items
-- ---------------------------------------------------------------------------
create table if not exists public.inspiration_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  category text not null default 'other' check (category in (
    'wedding_dress','decoration','flowers','invitations','makeup','venue','other')),
  link_url text check (link_url is null or
    (char_length(link_url) <= 1000 and link_url ~* '^https?://')),
  image_url text check (image_url is null or
    (char_length(image_url) <= 1000 and image_url ~* '^https?://')),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inspiration_items_wedding_idx
  on public.inspiration_items (wedding_id, category);

-- ---------------------------------------------------------------------------
-- updated_at triggers + RLS + grants, applied uniformly.
-- Policy: a signed-in member of the wedding WITH an active subscription may
-- read/write rows; WITH CHECK stops moving a row into someone else's wedding.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'budget_categories','vendors','expenses','guests','checklist_tasks','inspiration_items'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t);

    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I',
      'Subscribed members manage ' || t, t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.wedding_has_access(wedding_id)) with check (public.wedding_has_access(wedding_id))',
      'Subscribed members manage ' || t, t);

    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end;
$$;


