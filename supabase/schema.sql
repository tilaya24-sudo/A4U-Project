-- Accel4U Website CMS (Supabase PostgreSQL)
-- Run this ONCE in Supabase > SQL Editor before using the website admin panel.
-- It is safe to re-run the CREATE TABLE and CREATE POLICY sections.
-- Do not put service_role keys or database credentials in this website project.

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('admin','editor')),
  created_at timestamptz not null default now()
);
alter table public.site_admins enable row level security;

drop policy if exists "Staff see own membership" on public.site_admins;
create policy "Staff see own membership" on public.site_admins
for select to authenticated using (user_id = (select auth.uid()));
-- No browser-accessible policies for inserting/updating admin membership.
-- Admin privileges are granted manually through Supabase SQL Editor by project owners.

create or replace function public.can_edit_site()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.site_admins
    where user_id = (select auth.uid()) and role in ('admin', 'editor')
  );
$$;
create or replace function public.can_publish_site()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.site_admins
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function public.can_edit_site() from public;
revoke all on function public.can_publish_site() from public;
grant execute on function public.can_edit_site() to authenticated;
grant execute on function public.can_publish_site() to authenticated;

create table if not exists public.site_drafts (
  id text primary key default 'main',
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint draft_only_main check (id = 'main')
);
create table if not exists public.site_published (
  id text primary key default 'main',
  content jsonb not null default '{}'::jsonb,
  published_at timestamptz not null default now(),
  constraint published_only_main check (id = 'main')
);
alter table public.site_drafts enable row level security;
alter table public.site_published enable row level security;

drop policy if exists "Editors can read drafts" on public.site_drafts;
drop policy if exists "Editors can create drafts" on public.site_drafts;
drop policy if exists "Editors can update drafts" on public.site_drafts;
create policy "Editors can read drafts" on public.site_drafts
  for select to authenticated using ((select public.can_edit_site()));
create policy "Editors can create drafts" on public.site_drafts
  for insert to authenticated with check ((select public.can_edit_site()));
create policy "Editors can update drafts" on public.site_drafts
  for update to authenticated using ((select public.can_edit_site())) with check ((select public.can_edit_site()));

drop policy if exists "Anyone can read published website" on public.site_published;
drop policy if exists "Admins can insert published website" on public.site_published;
drop policy if exists "Admins can update published website" on public.site_published;
create policy "Anyone can read published website" on public.site_published
  for select to anon, authenticated using (true);
create policy "Admins can insert published website" on public.site_published
  for insert to authenticated with check ((select public.can_publish_site()));
create policy "Admins can update published website" on public.site_published
  for update to authenticated using ((select public.can_publish_site())) with check ((select public.can_publish_site()));

create table if not exists public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  email text not null check (char_length(email) between 5 and 180 and position('@' in email) > 1),
  job_title text not null default '' check (char_length(job_title) <= 120),
  company text not null check (char_length(company) between 1 and 160),
  industry text not null default '' check (char_length(industry) <= 120),
  country text not null check (char_length(country) between 1 and 100),
  preferred_contact text not null default 'Email' check (preferred_contact in ('Email','Phone','Other')),
  contact_details text not null default '' check (char_length(contact_details) <= 180),
  message text not null check (char_length(message) between 1 and 4000),
  privacy_acknowledged boolean not null default false,
  marketing_opt_in boolean not null default false,
  status text not null default 'new' check (status in ('new','contacted','qualified','closed'))
);
alter table public.lead_submissions enable row level security;

drop policy if exists "Visitors may submit consultations" on public.lead_submissions;
drop policy if exists "Staff can read consultation requests" on public.lead_submissions;
drop policy if exists "Staff can update consultations" on public.lead_submissions;
create policy "Visitors may submit consultations" on public.lead_submissions
  for insert to anon, authenticated
  with check (privacy_acknowledged = true and status = 'new');
create policy "Staff can read consultation requests" on public.lead_submissions
  for select to authenticated using ((select public.can_edit_site()));
create policy "Staff can update consultations" on public.lead_submissions
  for update to authenticated using ((select public.can_edit_site())) with check ((select public.can_edit_site()));

-- Explicit API privileges; RLS further restricts every operation.
grant select on public.site_admins to authenticated;
grant select, insert, update on public.site_drafts to authenticated;
grant select on public.site_published to anon, authenticated;
grant insert, update on public.site_published to authenticated;
grant insert on public.lead_submissions to anon, authenticated;
grant select, update on public.lead_submissions to authenticated;

-- Public assets only: uploaded media is accessible to anyone with its public URL.
-- Never upload confidential documents or internal data to this bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media', 'site-media', true, 50331648,
  array[
    'image/jpeg','image/png','image/webp','image/gif',
    'video/mp4','video/webm',
    'application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain','application/zip','application/x-zip-compressed'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view site media" on storage.objects;
drop policy if exists "Editors can upload site media" on storage.objects;
drop policy if exists "Editors can modify site media" on storage.objects;
drop policy if exists "Editors can delete site media" on storage.objects;
create policy "Anyone can view site media" on storage.objects
  for select to anon, authenticated using (bucket_id = 'site-media');
create policy "Editors can upload site media" on storage.objects
  for insert to authenticated with check (bucket_id = 'site-media' and (select public.can_edit_site()));
create policy "Editors can modify site media" on storage.objects
  for update to authenticated using (bucket_id = 'site-media' and (select public.can_edit_site()))
  with check (bucket_id = 'site-media' and (select public.can_edit_site()));
create policy "Editors can delete site media" on storage.objects
  for delete to authenticated using (bucket_id = 'site-media' and (select public.can_edit_site()));

-- NEXT: Go to Supabase > Authentication > Users and create an admin email account.
-- Grant admin access in SQL Editor (replace the email with your actual auth user's email):
-- insert into public.site_admins (user_id, role)
-- select id, 'admin' from auth.users where email = 'YOUR_ADMIN_EMAIL@EXAMPLE.COM'
-- on conflict (user_id) do update set role = excluded.role;
-- To grant editor-only access, replace 'admin' with 'editor'.
-- IMPORTANT: Do not run the example with a made-up email; it will insert zero rows.
