alter table public.teachers
add column if not exists temporary_password text;

drop policy if exists "Admins can insert teachers" on public.teachers;
create policy "Admins can insert teachers"
on public.teachers for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update teachers" on public.teachers;
create policy "Admins can update teachers"
on public.teachers for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can delete teachers" on public.teachers;
create policy "Admins can delete teachers"
on public.teachers for delete to authenticated
using (public.is_admin());