-- Kefoo Wedding Planner - 013: make account deletion simple.
-- Run THIRTEENTH, after 012. Idempotent. DESTRUCTIVE BY DESIGN:
-- deleting an auth user now removes their wedding and payment history.
-- Run only if you accept that behaviour (fine for testing, risky in production).

-- 1. Deleting the creator removes the wedding (and every child row:
--    members, invites, categories, vendors, expenses, guests, tasks,
--    inspiration, invitations, RSVPs, subscription).
alter table public.weddings
  drop constraint if exists weddings_created_by_fkey;
alter table public.weddings
  add constraint weddings_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete cascade;

-- 2. Deleting the wedding removes its payment records too.
alter table public.payments
  drop constraint if exists payments_wedding_id_fkey;
alter table public.payments
  add constraint payments_wedding_id_fkey
  foreign key (wedding_id) references public.weddings(id) on delete cascade;

-- 3. A payment that granted lifetime access must not block deletion.
--    (Keep the column, but clear the link when the payment disappears.)
alter table public.weddings
  drop constraint if exists weddings_lifetime_payment_fk;
alter table public.weddings
  add constraint weddings_lifetime_payment_fk
  foreign key (lifetime_access_payment_id)
  references public.payments(id) on delete set null;

notify pgrst, 'reload schema';
