-- Classes table and admin policies.
-- Run this in the Supabase SQL editor. Existing classes data is preserved.

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade integer not null,
  section text,
  created_at timestamptz not null default now()
);

alter table public.classes add column if not exists name text;
alter table public.classes add column if not exists grade integer;
alter table public.classes add column if not exists section text;
alter table public.classes add column if not exists created_at timestamptz not null default now();

alter table public.classes enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Admins can read classes" on public.classes;
create policy "Admins can read classes"
on public.classes for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can create classes" on public.classes;
create policy "Admins can create classes"
on public.classes for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update classes" on public.classes;
create policy "Admins can update classes"
on public.classes for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete classes" on public.classes;
create policy "Admins can delete classes"
on public.classes for delete to authenticated
using (public.is_admin());
