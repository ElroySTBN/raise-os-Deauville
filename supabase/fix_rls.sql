-- FORCE ENABLE RLS (Just in case)
alter table public.prospects enable row level security;
alter table public.audits enable row level security;

-- DROP ALL EXISTING POLICIES FOR PROSPECTS
drop policy if exists "Prospects are viewable by authenticated users." on prospects;
drop policy if exists "Authenticated users can insert prospects." on prospects;
drop policy if exists "Authenticated users can update prospects." on prospects;
drop policy if exists "Prospects are viewable by everyone." on prospects;
drop policy if exists "Everyone can insert prospects." on prospects;
drop policy if exists "Everyone can update prospects." on prospects;

-- CREATE PUBLIC POLICIES FOR PROSPECTS
create policy "Enable read access for all users"
on public.prospects for select
using (true);

create policy "Enable insert access for all users"
on public.prospects for insert
with check (true);

create policy "Enable update access for all users"
on public.prospects for update
using (true);

-- DROP ALL EXISTING POLICIES FOR AUDITS
drop policy if exists "Audits are viewable by authenticated users." on audits;
drop policy if exists "Authenticated users can insert audits." on audits;
drop policy if exists "Authenticated users can update audits." on audits;
drop policy if exists "Audits are viewable by everyone." on audits;
drop policy if exists "Everyone can insert audits." on audits;
drop policy if exists "Everyone can update audits." on audits;

-- CREATE PUBLIC POLICIES FOR AUDITS
create policy "Enable read access for all users"
on public.audits for select
using (true);

create policy "Enable insert access for all users"
on public.audits for insert
with check (true);

create policy "Enable update access for all users"
on public.audits for update
using (true);
