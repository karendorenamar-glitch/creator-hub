# Apply 047 — original currency per financial record

Additive table only. No existing amount column is changed, and no historical
row is converted.

`public.financial_entries` stores, for each financial record that was entered
in a currency other than IDR:

- `entered_amount` and `entered_currency` (what the customer typed)
- `fx_rate` and `fx_rate_at` (the rate used when saving)
- `module` + `record_id` pointing at the existing row

Existing records have no row here, which keeps the documented convention:
their stored amount is IDR. Nothing is guessed or bulk-converted.

Run manually:

```text
supabase/wedding/047_financial_entry_currency.sql
```

After running it, the write paths for budget, vendors, expenses, other costs
and donations can start recording original currencies. Until that wiring is
reviewed and enabled, the dashboard stays display-only in the display currency.
