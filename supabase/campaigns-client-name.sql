-- Rename brand_name to client_name on campaigns.

alter table public.campaigns
  rename column brand_name to client_name;

notify pgrst, 'reload schema';
