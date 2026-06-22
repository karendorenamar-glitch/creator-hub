-- Run in Supabase SQL editor if payouts table does not exist yet.

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  amount bigint not null default 0 check (amount >= 0),
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'CANCELLED')),
  requested_at date not null default current_date,
  due_date date not null,
  payment_term_days integer not null default 30 check (payment_term_days >= 0),
  notes text not null default '',
  proof_url text,
  created_at timestamptz not null default now()
);

alter table public.payouts enable row level security;

create policy "Allow public read access on payouts"
  on public.payouts for select using (true);

create policy "Allow public insert on payouts"
  on public.payouts for insert with check (true);

create policy "Allow public update on payouts"
  on public.payouts for update using (true) with check (true);

create policy "Allow public delete on payouts"
  on public.payouts for delete using (true);

create index if not exists payouts_creator_id_idx on public.payouts(creator_id);
create index if not exists payouts_due_date_idx on public.payouts(due_date);
