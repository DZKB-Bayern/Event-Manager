-- Fix Table RLS Policies ONLY (Safe version without storage permissions)

-- 1. Profiles Table
alter table public.profiles enable row level security;

-- Safely drop existing policies
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;

-- Re-create policies
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- 2. Events Table
alter table public.events enable row level security;

-- Safely drop existing policies
drop policy if exists "Events are viewable by everyone." on public.events;
drop policy if exists "Users can insert their own events." on public.events;
drop policy if exists "Users can update their own events." on public.events;
drop policy if exists "Users can delete their own events." on public.events;
drop policy if exists "Admins can delete any event." on public.events;

-- Re-create policies
create policy "Events are viewable by everyone." on public.events
  for select using (true);

create policy "Users can insert their own events." on public.events
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own events." on public.events
  for update using (auth.uid() = user_id);

create policy "Users can delete their own events." on public.events
  for delete using (auth.uid() = user_id);

create policy "Admins can delete any event." on public.events
  for delete using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 3. Fix missing profiles (Backfill profiles for existing users)
insert into public.profiles (id, username, role)
select id, raw_user_meta_data->>'username', 'member'
from auth.users
where id not in (select id from public.profiles);
