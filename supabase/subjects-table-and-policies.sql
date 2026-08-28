-- Subject admin policies.
-- Run this after the subjects table has been created.

alter table public.subjects enable row level security;

drop policy if exists "Admins can read subjects" on public.subjects;
create policy "Admins can read subjects"
on public.subjects for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can create subjects" on public.subjects;
create policy "Admins can create subjects"
on public.subjects for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update subjects" on public.subjects;
create policy "Admins can update subjects"
on public.subjects for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete subjects" on public.subjects;
create policy "Admins can delete subjects"
on public.subjects for delete to authenticated
using (public.is_admin());
