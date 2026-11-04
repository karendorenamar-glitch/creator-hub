# Apply 045 — customer country + country-based pricing

Adds the country chosen at registration and enforces the right one-time price
and payment method for it. Existing users, payments, and entitlements are not
touched.

What it changes:

- creates `public.customer_profiles (user_id, country_code)` with RLS so a
  customer can only read/write their own country
- sets the international price to **USD 3.00** and adds a check constraint
- replaces the payment insert policy so the database itself enforces:
  - Indonesia → `bank_transfer`, IDR 30.000, receipt required
  - every other country → `paypal`, USD 3.00, email + transaction ID required
  - a payment method that does not match the stored country is rejected

Run manually in the Supabase SQL editor after review:

```text
supabase/wedding/045_customer_country_pricing.sql
```

Existing customers without a country keep their access. They are asked to
choose a country only when they open checkout to pay.
