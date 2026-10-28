# Migration 039 — SUPERSEDED, DO NOT APPLY

This migration belonged to an earlier duplicate-guest-row approach and is now
**superseded**. Do not run it: the current seating design keeps one guest record
per group and stores one allocation per pax in
`seating_assignments.seat_ids`.

The SQL file has a guard that raises an exception if it is run accidentally. It
remains in the repository only as history for databases where it was already
applied.

No database migration is required for the pax-seating feature.
