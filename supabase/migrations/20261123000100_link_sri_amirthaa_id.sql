-- Link the immutable Sri Amirthaa ID subject to an existing E-Commerce profile.
-- Additive only: no account merges, deletes, or changes to existing auth providers.
alter table public.profiles
  add column if not exists sri_amirthaa_sub uuid;

create unique index if not exists profiles_sri_amirthaa_sub_uidx
  on public.profiles (sri_amirthaa_sub)
  where sri_amirthaa_sub is not null;

-- This identity mapping is server-managed; do not grant it to browser roles.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
grant all on public.profiles to service_role;
