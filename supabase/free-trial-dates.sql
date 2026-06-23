-- Run in Supabase → SQL Editor.
-- Ensures every free trial workspace has trial_ends_at = created_at + 30 days.

update public.organizations
set trial_ends_at = created_at + interval '30 days'
where plan = 'free_trial'
  and trial_ends_at is null
  and id <> '11111111-1111-1111-1111-111111111111';

create or replace function public.set_free_trial_end_date()
returns trigger
language plpgsql
as $$
begin
  if new.plan = 'free_trial' and new.trial_ends_at is null then
    new.trial_ends_at := coalesce(new.created_at, now()) + interval '30 days';
  end if;

  return new;
end;
$$;

drop trigger if exists organizations_set_free_trial_end_date on public.organizations;

create trigger organizations_set_free_trial_end_date
  before insert on public.organizations
  for each row
  execute function public.set_free_trial_end_date();

notify pgrst, 'reload schema';
