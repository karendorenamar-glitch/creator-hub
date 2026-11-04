# Apply 046 — dashboard display currency

Adds a per-account display currency preference. Additive only: no payments,
entitlements, balances, weddings or existing rows are modified.

- new table `public.customer_currency_preferences (user_id, display_currency)`
- allowed values: IDR, USD, MYR, SGD, AUD, GBP, EUR, JPY
- RLS: a customer can only read/insert/update their own row

Run manually:

```text
supabase/wedding/046_display_currency.sql
```

Without a saved row the dashboard defaults to IDR for Indonesian accounts and
USD for everyone else. Checkout prices are unaffected.
