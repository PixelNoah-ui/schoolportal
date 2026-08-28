-- Allow authenticated administrators to read dashboard data.
-- Run this after the tables and the profiles table have been created.

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

drop policy if exists "Admins can read students" on public.students;
create policy "Admins can read students"
on public.students for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can read teachers" on public.teachers;
create policy "Admins can read teachers"
on public.teachers for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can read academic years" on public.academic_years;
create policy "Admins can read academic years"
on public.academic_years for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can read semesters" on public.semesters;
create policy "Admins can read semesters"
on public.semesters for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can read subjects" on public.subjects;
create policy "Admins can read subjects"
on public.subjects for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can read class subjects" on public.class_subjects;
create policy "Admins can read class subjects"
on public.class_subjects for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can read grades" on public.grades;
create policy "Admins can read grades"
on public.grades for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can read payments" on public.payments;
create policy "Admins can read payments"
on public.payments for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can read profiles" on public.profiles;
create policy "Admins can read profiles"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());