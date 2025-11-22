-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin'))
);

-- RLS for Profiles
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Prospects table
create table if not exists public.prospects (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  company_name text,
  google_maps_url text,
  website_url text,
  status text default 'new' check (status in ('new', 'audited', 'contacted', 'converted'))
);

-- RLS for Prospects
alter table public.prospects enable row level security;

drop policy if exists "Prospects are viewable by everyone." on prospects;
create policy "Prospects are viewable by everyone."
  on prospects for select
  using ( true );

drop policy if exists "Everyone can insert prospects." on prospects;
create policy "Everyone can insert prospects."
  on prospects for insert
  with check ( true );

drop policy if exists "Everyone can update prospects." on prospects;
create policy "Everyone can update prospects."
  on prospects for update
  using ( true );

-- Audits table
create table if not exists public.audits (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  prospect_id uuid references public.prospects(id) on delete cascade not null,
  data jsonb,
  score integer,
  pdf_url text,
  status text default 'draft' check (status in ('draft', 'completed'))
);

-- RLS for Audits
alter table public.audits enable row level security;

drop policy if exists "Audits are viewable by everyone." on audits;
create policy "Audits are viewable by everyone."
  on audits for select
  using ( true );

drop policy if exists "Everyone can insert audits." on audits;
create policy "Everyone can insert audits."
  on audits for insert
  with check ( true );

drop policy if exists "Everyone can update audits." on audits;
create policy "Everyone can update audits."
  on audits for update
  using ( true );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
 