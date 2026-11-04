# Apply 044 — PayPal lifetime payments (USD 2.99)

Adds USD 2.99 PayPal support alongside the existing BCA transfer flow.

What it changes:

- adds `amount_usd`, `payer_email`, `paypal_transaction_id` to `public.payments`
- allows `currency = 'USD'` and `method = 'paypal'`
- allows `amount_idr = 0` for PayPal rows (BCA rows still require 30.000)
- makes a PayPal transaction ID unique (prevents duplicate submissions)
- updates the customer insert policy so a PayPal row needs an email and a
  transaction ID instead of a receipt upload

BCA rows keep the same rules: IDR 30.000, receipt required, manual approval.

Run manually in the Supabase SQL editor after review:

```text
supabase/wedding/044_paypal_payments.sql
```

Nothing is deployed automatically. Approvals still happen in the admin
dashboard, and access is only granted after approval.
