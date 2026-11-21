-- Sri Amirthaa ID: customer identity foundation
-- Safe, additive migration. Does not modify Supabase-managed auth tables.

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  supabase_user_id uuid unique references auth.users(id) on delete set null,
  firebase_uid text unique,
  phone_e164 text unique,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_phone_e164_format
    check (phone_e164 is null or phone_e164 ~ '^\\+[1-9][0-9]{7,14}$')
);

create index if not exists profiles_supabase_user_id_idx
  on public.profiles (supabase_user_id);

create index if not exists profiles_phone_e164_idx
  on public.profiles (phone_e164);

alter table public.profiles enable row level security;

-- Restrict client privileges: identity keys are writable only by trusted server code.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- A signed-in Supabase user can read and update only their own linked profile.
-- Profile creation and Firebase UID linking are reserved for trusted server code.
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (supabase_user_id = (select auth.uid()));

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (supabase_user_id = (select auth.uid()))
  with check (supabase_user_id = (select auth.uid()));

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_profiles_updated_at();

-- Backfill existing Supabase Auth users (including current Google accounts).
insert into public.profiles (supabase_user_id, email, full_name, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
on conflict (supabase_user_id) do update
set
  email = coalesce(excluded.email, public.profiles.email),
  full_name = coalesce(excluded.full_name, public.profiles.full_name),
  avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
