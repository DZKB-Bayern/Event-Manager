-- 1. Ensure Storage Bucket exists and has policies
insert into storage.buckets (id, name, public)
values ('events', 'events', true)
on conflict (id) do nothing;

-- Enable RLS on storage.objects (usually enabled by default, but good to ensure)
alter table storage.objects enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Users can update own objects" on storage.objects;
drop policy if exists "Users can delete own objects" on storage.objects;

-- Create Storage Policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'events' );

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'events' and auth.role() = 'authenticated' );

create policy "Users can update own objects"
  on storage.objects for update
  using ( bucket_id = 'events' and auth.uid() = owner );

create policy "Users can delete own objects"
  on storage.objects for delete
  using ( bucket_id = 'events' and auth.uid() = owner );


-- 2. Fix Table RLS Policies
alter table public.events enable row level security;
alter table public.profiles enable row level security;

-- Drop existing table policies
drop policy if exists "Events are viewable by everyone." on public.events;
drop policy if exists "Users can insert their own events." on public.events;
drop policy if exists "Users can update their own events." on public.events;
drop policy if exists "Users can delete their own events." on public.events;
drop policy if exists "Admins can delete any event." on public.events;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;

-- Create Table Policies
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

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);


-- 3. Fix missing profiles (if any users signed up while trigger was broken)
insert into public.profiles (id, username, role)
select id, raw_user_meta_data->>'username', 'member'
from auth.users
where id not in (select id from public.profiles);
