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

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.academic_years enable row level security;
alter table public.semesters enable row level security;
alter table public.class_subjects enable row level security;
alter table public.grades enable row level security;
alter table public.grade_review_cases enable row level security;
alter table public.academic_standings enable row level security;
alter table public.ranking_policies enable row level security;
alter table public.ranking_snapshots enable row level security;
alter table public.payments enable row level security;
alter table public.payment_month_allocations enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select to authenticated
using ((select auth.uid()) = id or public.is_admin());

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

drop policy if exists "Admins can insert students" on public.students;
create policy "Admins can insert students"
on public.students for insert to authenticated
with check (public.is_admin());
drop policy if exists "Admins can update students" on public.students;
create policy "Admins can update students"
on public.students for update to authenticated
using (public.is_admin())
with check (public.is_admin());
drop policy if exists "Admins can delete students" on public.students;
create policy "Admins can delete students"
on public.students for delete to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert teachers" on public.teachers;
drop policy if exists "Admins can update teachers" on public.teachers;
drop policy if exists "Admins can delete teachers" on public.teachers;
create policy "Admins can insert teachers"
on public.teachers for insert to authenticated
with check (public.is_admin());
create policy "Admins can update teachers"
on public.teachers for update to authenticated
using (public.is_admin())
with check (public.is_admin());
create policy "Admins can delete teachers"
on public.teachers for delete to authenticated
using (public.is_admin());

drop policy if exists "Admins can read academic years" on public.academic_years;
create policy "Admins can read academic years"
on public.academic_years for select to authenticated
using (public.is_admin());
drop policy if exists "Admins can manage academic years" on public.academic_years;
create policy "Admins can manage academic years"
on public.academic_years for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage class subjects" on public.class_subjects;
create policy "Admins can manage class subjects"
on public.class_subjects for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage grades" on public.grades;
create policy "Admins can manage grades"
on public.grades for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read standings" on public.academic_standings;
drop policy if exists "Admins can manage standings" on public.academic_standings;
create policy "Admins can read standings"
on public.academic_standings for select to authenticated
using (public.is_admin());
create policy "Admins can manage standings"
on public.academic_standings for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage rankings" on public.ranking_policies;
create policy "Admins can manage rankings"
on public.ranking_policies for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage ranking snapshots" on public.ranking_snapshots;
create policy "Admins can manage ranking snapshots"
on public.ranking_snapshots for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage payments" on public.payments;
drop policy if exists "Admins can manage payment allocations" on public.payment_month_allocations;
create policy "Admins can manage payments"
on public.payments for all to authenticated
using (public.is_admin())
with check (public.is_admin());
create policy "Admins can manage payment allocations"
on public.payment_month_allocations for all to authenticated
using (public.is_admin())
with check (public.is_admin());
