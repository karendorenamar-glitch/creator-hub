-- Delete ALL data linked to one email (workspace + login).
-- Run in Supabase → SQL Editor.
--
-- Safe defaults:
-- - Never deletes the shared default Kefoo org (11111111-1111-1111-1111-111111111111)
-- - Deletes workspaces this user created/founded
-- - Removes their membership from shared workspaces (e.g. default Kefoo)
-- - Deletes pending invites + auth account
--
-- Change the email below if needed.

Paste a TikTok link