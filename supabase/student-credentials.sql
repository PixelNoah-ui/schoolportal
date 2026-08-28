alter table public.students
add column if not exists temporary_password text;

drop policy if exists "Admins can insert students" on public.students;
create policy "Admins can insert students"
on public.students for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update students" on public.students;
create policy "Admins can update students"
on public.students for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can delete students" on public.students;
create policy "Admins can delete students"
on public.students for delete to authenticated
using (public.is_admin());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles for update to authenticated
using (public.is_admin())
with check (public.is_admin());