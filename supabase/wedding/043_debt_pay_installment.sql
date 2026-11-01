-- Kefoo — 043 Debt Tracker installment payment
-- Atomically records one monthly installment, advances the due month, and
-- updates the account status. SECURITY INVOKER so the existing RLS policies
-- apply to the authenticated owner.

begin;

create or replace function public.pay_debt_installment(p_account_id uuid)
returns table (
  installment_month integer,
  installment_total_months integer,
  installment_amount numeric,
  due_date date,
  status text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_account public.debt_accounts%rowtype;
  v_next_month integer;
  v_next_due date;
  v_inserted integer;
  v_next_status text;
  v_key text;
  v_schedule public.debt_schedules%rowtype;
begin
  if not public.is_debt_owner() then
    raise exception 'Not authorized.';
  end if;

  select * into v_account
  from public.debt_accounts
  where id = p_account_id
    and owner_user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Debt account not found.';
  end if;
  if v_account.status <> 'active' then
    raise exception 'Debt account is not active.';
  end if;

  -- Variable mode: pay the earliest upcoming schedule. The schedule amount is
  -- the source of truth, so each month can have a different nominal.
  if v_account.installment_amount <= 0 then
    select * into v_schedule
    from public.debt_schedules
    where debt_account_id = v_account.id
      and owner_user_id = v_account.owner_user_id
      and status = 'upcoming'
    order by due_date asc, created_at asc
    limit 1
    for update;

    if not found then
      raise exception 'No upcoming installment schedule.';
    end if;

    v_key := format('schedule:%s', v_schedule.id);

    if exists (
      select 1
      from public.debt_payments
      where owner_user_id = v_account.owner_user_id
        and idempotency_key = v_key
    ) then
      return query
        select
          v_account.installment_month,
          v_account.installment_total_months,
          v_account.installment_amount,
          v_account.due_date,
          v_account.status;
      return;
    end if;

    insert into public.debt_payments (
      owner_user_id,
      debt_account_id,
      schedule_id,
      amount,
      payment_date,
      payment_method,
      reference,
      idempotency_key
    ) values (
      v_account.owner_user_id,
      v_account.id,
      v_schedule.id,
      v_schedule.amount_due,
      current_date,
      'installment',
      format('Jadwal %s', v_schedule.due_date),
      v_key
    );

    update public.debt_schedules
    set status = 'paid'
    where id = v_schedule.id
      and owner_user_id = v_account.owner_user_id;

    select due_date into v_next_due
    from public.debt_schedules
    where debt_account_id = v_account.id
      and owner_user_id = v_account.owner_user_id
      and status = 'upcoming'
    order by due_date asc, created_at asc
    limit 1;

    v_next_month := v_account.installment_month + 1;
    v_next_status := case when v_next_due is null then 'paid' else 'active' end;

    update public.debt_accounts
    set
      installment_month = v_next_month,
      due_date = v_next_due,
      status = v_next_status
    where id = v_account.id
      and owner_user_id = v_account.owner_user_id;

    return query
      select
        v_next_month,
        v_account.installment_total_months,
        v_account.installment_amount,
        v_next_due,
        v_next_status;
    return;
  end if;

  if v_account.installment_total_months <= 0 then
    raise exception 'Debt account has no installment schedule.';
  end if;
  if v_account.installment_month >= v_account.installment_total_months then
    raise exception 'All installments are already paid.';
  end if;

  v_next_month := v_account.installment_month + 1;
  v_next_due := (coalesce(v_account.due_date, current_date) + interval '1 month')::date;
  v_next_status :=
    case
      when v_next_month >= v_account.installment_total_months then 'paid'
      else 'active'
    end;
  v_key := format('installment:%s:%s', v_account.id, v_next_month);

  -- Serialize the same account's payment attempts. A retry of the same
  -- installment returns the current values without creating a second payment.
  if exists (
    select 1
    from public.debt_payments
    where owner_user_id = v_account.owner_user_id
      and idempotency_key = v_key
  ) then
    return query
      select
        v_account.installment_month,
        v_account.installment_total_months,
        v_account.installment_amount,
        v_account.due_date,
        v_account.status;
    return;
  end if;

  insert into public.debt_payments (
    owner_user_id,
    debt_account_id,
    amount,
    payment_date,
    payment_method,
    reference,
    idempotency_key
  ) values (
    v_account.owner_user_id,
    v_account.id,
    v_account.installment_amount,
    current_date,
    'installment',
    format('Angsuran %s/%s', v_next_month, v_account.installment_total_months),
    v_key
  );

  get diagnostics v_inserted = row_count;

  -- A repeated request for this installment is a no-op.
  if v_inserted = 0 then
    return query
      select
        v_account.installment_month,
        v_account.installment_total_months,
        v_account.installment_amount,
        v_account.due_date,
        v_account.status;
    return;
  end if;

  update public.debt_accounts
  set
    installment_month = v_next_month,
    due_date = v_next_due,
    status = v_next_status
  where id = v_account.id
    and owner_user_id = v_account.owner_user_id;

  return query
    select
      v_next_month,
      v_account.installment_total_months,
      v_account.installment_amount,
      v_next_due,
      v_next_status;
end;
$$;

revoke all on function public.pay_debt_installment(uuid) from public, anon;
grant execute on function public.pay_debt_installment(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
