# Apply 043 — Pay one debt installment

Adds `public.pay_debt_installment(uuid)`, an atomic operation that:

- records one monthly payment for the stored `installment_amount`,
- advances `installment_month` by one,
- advances `due_date` by one calendar month,
- marks the account `paid` on the final installment,
- uses the payment idempotency key so a retry of the same installment is a no-op.

It uses the existing RLS rules and only works for the authenticated owner.

## Run after 042

Open Supabase SQL Editor and run:

```text
supabase/wedding/043_debt_pay_installment.sql
```

Verify:

```sql
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'pay_debt_installment';
```

Expected: one row.

## Behavior

Example:

```text
installment amount : 200.000
status before      : 10/12
due date before    : 3 Nov 2026
```

After clicking **Bayar angsuran**:

```text
payment recorded   : 200.000
status             : 11/12
due date           : 3 Dec 2026
remaining          : 200.000
```
