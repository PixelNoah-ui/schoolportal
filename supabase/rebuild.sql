-- SchoolPortal clean rebuild for Supabase/Postgres
-- Review and run in a disposable project first. This intentionally destroys public schema objects.
-- It does not delete auth.users or Storage objects.

begin;

-- Destructive cleanup: policies/triggers disappear with their relations. Functions and views need explicit drops.
do $$
declare r record;
begin
  for r in select policyname, schemaname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
  for r in select policyname, schemaname, tablename from pg_policies where schemaname = 'storage' loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
  for r in select schemaname, viewname from pg_views where schemaname = 'public' loop
    execute format('drop view if exists %I.%I cascade', r.schemaname, r.viewname);
  end loop;
  for r in select schemaname, matviewname from pg_matviews where schemaname = 'public' loop
    execute format('drop materialized view if exists %I.%I cascade', r.schemaname, r.matviewname);
  end loop;
  for r in select n.nspname as schema_name, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' loop
    execute format('drop function if exists %I.%I(%s) cascade', r.schema_name, r.proname, r.args);
  end loop;
  for r in select schemaname, tablename from pg_tables where schemaname = 'public' loop
    execute format('drop table if exists %I.%I cascade', r.schemaname, r.tablename);
  end loop;
  for r in select sequence_schema, sequence_name from information_schema.sequences where sequence_schema = 'public' loop
    execute format('drop sequence if exists %I.%I cascade', r.sequence_schema, r.sequence_name);
  end loop;
end $$;

drop type if exists public.user_role cascade;
drop type if exists public.record_status cascade;
drop type if exists public.enrollment_status cascade;
drop type if exists public.submission_status cascade;
drop type if exists public.payment_status cascade;
drop type if exists public.payment_method cascade;
drop type if exists public.attendance_status cascade;

create type public.user_role as enum ('admin', 'teacher', 'student');
create type public.record_status as enum ('draft', 'active', 'archived');
create type public.enrollment_status as enum ('active', 'withdrawn', 'transferred', 'suspended');
create type public.submission_status as enum ('draft', 'submitted', 'approved', 'rejected', 'locked');
create type public.payment_status as enum ('pending', 'approved', 'rejected');
create type public.payment_method as enum ('cash', 'bank_transfer', 'mobile_money', 'card', 'other');
create type public.attendance_status as enum ('present', 'absent', 'late', 'excused');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) between 1 and 160),
  username text not null unique check (username ~ '^[A-Za-z0-9_.-]{3,64}$'),
  email text not null unique,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date not null,
  end_date date not null,
  status public.record_status not null default 'draft',
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);
create unique index academic_years_one_current on public.academic_years (is_current) where is_current;

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  name text not null,
  ordinal smallint not null check (ordinal > 0),
  start_date date not null,
  end_date date not null,
  status public.record_status not null default 'draft',
  unique (academic_year_id, ordinal),
  unique (academic_year_id, name),
  check (end_date > start_date)
);
create index semesters_year_idx on public.semesters(academic_year_id);

create table public.grade_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  level_number integer not null unique check (level_number > 0),
  created_at timestamptz not null default now()
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  phone text,
  bio text,
  department text,
  qualifications text,
  gender text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  student_number text not null unique check (student_number ~ '^[A-Za-z0-9-]{1,40}$'),
  phone text,
  gender text,
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index teachers_profile_idx on public.teachers(profile_id);
create index students_profile_idx on public.students(profile_id);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  grade_level_id uuid not null references public.grade_levels(id) on delete restrict,
  name text not null,
  section text not null check (length(btrim(section)) between 1 and 32),
  homeroom_teacher_id uuid references public.teachers(id) on delete set null,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (academic_year_id, grade_level_id, section)
);
create index classes_year_idx on public.classes(academic_year_id);
create index classes_homeroom_idx on public.classes(homeroom_teacher_id);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete restrict,
  semester_id uuid not null references public.semesters(id) on delete restrict,
  status public.enrollment_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  left_at timestamptz,
  unique (student_id, semester_id),
  check (left_at is null or left_at >= enrolled_at)
);
create index enrollments_class_semester_idx on public.student_enrollments(class_id, semester_id, status);
create index enrollments_student_idx on public.student_enrollments(student_id);

create table public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  teacher_id uuid references public.teachers(id) on delete set null,
  semester_id uuid not null references public.semesters(id) on delete restrict,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (class_id, subject_id, semester_id)
);
create index class_subjects_teacher_idx on public.class_subjects(teacher_id, semester_id, status);
create index class_subjects_class_idx on public.class_subjects(class_id, semester_id);

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  class_subject_id uuid not null references public.class_subjects(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  room text,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index schedules_course_day_idx on public.schedules(class_subject_id, day_of_week, start_time);

create table public.assessment_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.course_assessments (
  id uuid primary key default gen_random_uuid(),
  class_subject_id uuid not null references public.class_subjects(id) on delete restrict,
  semester_id uuid not null references public.semesters(id) on delete restrict,
  assessment_type_id uuid references public.assessment_types(id) on delete set null,
  name text not null,
  max_score numeric(8,2) not null check (max_score > 0),
  weight numeric(8,4) not null default 1 check (weight >= 0),
  order_number integer not null default 1 check (order_number > 0),
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (class_subject_id, semester_id, order_number),
  unique (class_subject_id, semester_id, name)
);
create index course_assessments_semester_idx on public.course_assessments(semester_id, class_subject_id);

create table public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_assessment_id uuid not null references public.course_assessments(id) on delete cascade,
  score numeric(8,2),
  status public.submission_status not null default 'draft',
  entered_by uuid references public.profiles(id) on delete set null,
  entered_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  unique (student_id, course_assessment_id),
  check (score is null or score >= 0)
);
create index assessment_results_student_idx on public.assessment_results(student_id, status);
create index assessment_results_assessment_idx on public.assessment_results(course_assessment_id);

create table public.course_grade_submissions (
  id uuid primary key default gen_random_uuid(),
  class_subject_id uuid not null references public.class_subjects(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  status public.submission_status not null default 'draft',
  submitted_by uuid references public.profiles(id) on delete set null,
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  unique (class_subject_id, semester_id)
);

-- Transitional table for current teacher-score and ranking clients. Migrate these callers to
-- assessment_results, then drop this table. It is intentionally constrained and RLS-protected.
create table public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_subject_id uuid not null references public.class_subjects(id) on delete restrict,
  semester_id uuid not null references public.semesters(id) on delete restrict,
  score numeric(8,2) not null check (score >= 0),
  is_final boolean not null default false,
  status public.submission_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, class_subject_id, semester_id)
);
create index grades_course_idx on public.grades(class_subject_id, semester_id);
create index grades_student_idx on public.grades(student_id, semester_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  status public.payment_status not null default 'pending',
  payment_method public.payment_method not null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  rejection_reason text,
  note text,
  proof_path text,
  created_at timestamptz not null default now(),
  check ((status = 'rejected' and rejection_reason is not null) or status <> 'rejected')
);
create index payments_student_idx on public.payments(student_id, created_at desc);
create index payments_review_idx on public.payments(status, created_at desc);
create table public.payment_month_allocations (
  payment_id uuid not null references public.payments(id) on delete cascade,
  payment_month date not null,
  primary key (payment_id, payment_month),
  check (payment_month = date_trunc('month', payment_month)::date)
);
create index payment_month_lookup_idx on public.payment_month_allocations(payment_month);

create table public.academic_standings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  standing text not null,
  reason text,
  rank integer check (rank is null or rank > 0),
  calculated_at timestamptz not null default now(),
  unique (student_id, semester_id)
);

-- Reserved normalized attendance model. No current page/API uses it yet.
create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  class_subject_id uuid references public.class_subjects(id) on delete set null,
  semester_id uuid not null references public.semesters(id) on delete restrict,
  session_date date not null,
  recorded_by uuid references public.teachers(id) on delete set null,
  unique (class_id, class_subject_id, session_date)
);
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status public.attendance_status not null,
  note text,
  unique (session_id, student_id)
);

-- Updated timestamps.
create or replace function public.set_updated_at() returns trigger
language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger teachers_updated_at before update on public.teachers for each row execute function public.set_updated_at();
create trigger students_updated_at before update on public.students for each row execute function public.set_updated_at();
create trigger grades_updated_at before update on public.grades for each row execute function public.set_updated_at();

-- Server-controlled role lookup. SECURITY DEFINER avoids recursive profiles RLS checks.
create or replace function public.current_user_role() returns public.user_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select public.current_user_role() = 'admin'::public.user_role $$;
create or replace function public.is_teacher_of(p_class_subject_id uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.class_subjects cs join public.teachers t on t.id = cs.teacher_id where cs.id = p_class_subject_id and t.profile_id = auth.uid() and cs.status = 'active') $$;
create or replace function public.current_student_id() returns uuid
language sql stable security definer set search_path = public
as $$ select id from public.students where profile_id = auth.uid() $$;

-- Academic-year activation is atomic and also protected by the partial unique index.
create or replace function public.activate_academic_year(p_id uuid) returns void
language plpgsql security definer set search_path = public
as $$ begin
  if not public.is_admin() then raise exception 'admin required'; end if;
  update public.academic_years set is_current = false, status = 'draft' where is_current;
  update public.academic_years set is_current = true, status = 'active' where id = p_id;
  if not found then raise exception 'academic year not found'; end if;
end $$;

-- RLS
alter table public.profiles enable row level security;
alter table public.academic_years enable row level security;
alter table public.semesters enable row level security;
alter table public.grade_levels enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.student_enrollments enable row level security;
alter table public.class_subjects enable row level security;
alter table public.schedules enable row level security;
alter table public.assessment_types enable row level security;
alter table public.course_assessments enable row level security;
alter table public.assessment_results enable row level security;
alter table public.course_grade_submissions enable row level security;
alter table public.grades enable row level security;
alter table public.payments enable row level security;
alter table public.payment_month_allocations enable row level security;
alter table public.academic_standings enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;

create policy profiles_select on public.profiles for select using (
  id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.students s
    join public.student_enrollments se on se.student_id = s.id and se.status = 'active'
    join public.class_subjects cs on cs.class_id = se.class_id
    where s.profile_id = profiles.id and public.is_teacher_of(cs.id)
  )
);
create policy profiles_admin_write on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));

-- Read catalogs are available to authenticated users; only admins mutate them.
create policy academic_years_read on public.academic_years for select to authenticated using (true);
create policy academic_years_admin on public.academic_years for all using (public.is_admin()) with check (public.is_admin());
create policy semesters_read on public.semesters for select to authenticated using (true);
create policy semesters_admin on public.semesters for all using (public.is_admin()) with check (public.is_admin());
create policy grade_levels_read on public.grade_levels for select to authenticated using (true);
create policy grade_levels_admin on public.grade_levels for all using (public.is_admin()) with check (public.is_admin());
create policy subjects_read on public.subjects for select to authenticated using (true);
create policy subjects_admin on public.subjects for all using (public.is_admin()) with check (public.is_admin());
create policy assessment_types_read on public.assessment_types for select to authenticated using (true);
create policy assessment_types_admin on public.assessment_types for all using (public.is_admin()) with check (public.is_admin());

create policy teachers_read on public.teachers for select to authenticated using (public.is_admin() or profile_id = auth.uid() or public.current_user_role() = 'teacher');
create policy teachers_admin on public.teachers for all using (public.is_admin()) with check (public.is_admin());
create policy teachers_self_update on public.teachers for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy students_read on public.students for select to authenticated using (public.is_admin() or profile_id = auth.uid() or public.current_user_role() = 'teacher');
create policy students_admin on public.students for all using (public.is_admin()) with check (public.is_admin());

create policy classes_read on public.classes for select to authenticated using (
  public.is_admin()
  or exists (select 1 from public.student_enrollments se where se.class_id = classes.id and se.student_id = public.current_student_id() and se.status = 'active')
  or exists (select 1 from public.class_subjects cs where cs.class_id = classes.id and public.is_teacher_of(cs.id))
);
create policy classes_admin on public.classes for all using (public.is_admin()) with check (public.is_admin());
create policy enrollments_admin on public.student_enrollments for all using (public.is_admin()) with check (public.is_admin());
create policy enrollments_student_read on public.student_enrollments for select to authenticated using (student_id = public.current_student_id());
create policy enrollments_teacher_read on public.student_enrollments for select to authenticated using (exists (select 1 from public.class_subjects cs where cs.class_id = student_enrollments.class_id and public.is_teacher_of(cs.id)));

create policy class_subjects_read on public.class_subjects for select to authenticated using (
  public.is_admin()
  or public.is_teacher_of(id)
  or exists (select 1 from public.student_enrollments se where se.class_id = class_subjects.class_id and se.student_id = public.current_student_id() and se.semester_id = class_subjects.semester_id and se.status = 'active')
);
create policy class_subjects_admin on public.class_subjects for all using (public.is_admin()) with check (public.is_admin());
create policy schedules_read on public.schedules for select to authenticated using (
  public.is_admin()
  or public.is_teacher_of(class_subject_id)
  or exists (select 1 from public.class_subjects cs join public.student_enrollments se on se.class_id = cs.class_id and se.semester_id = cs.semester_id where cs.id = schedules.class_subject_id and se.student_id = public.current_student_id() and se.status = 'active')
);
create policy schedules_admin on public.schedules for all using (public.is_admin()) with check (public.is_admin());
create policy schedules_teacher on public.schedules for update using (public.is_teacher_of(class_subject_id)) with check (public.is_teacher_of(class_subject_id));

create policy course_assessments_read on public.course_assessments for select to authenticated using (
  public.is_admin()
  or public.is_teacher_of(class_subject_id)
  or exists (select 1 from public.class_subjects cs join public.student_enrollments se on se.class_id = cs.class_id and se.semester_id = course_assessments.semester_id where cs.id = course_assessments.class_subject_id and se.student_id = public.current_student_id() and se.status = 'active')
);
create policy course_assessments_admin on public.course_assessments for all using (public.is_admin()) with check (public.is_admin());
create policy course_assessments_teacher on public.course_assessments for all using (public.is_teacher_of(class_subject_id)) with check (public.is_teacher_of(class_subject_id));
create policy results_student_read on public.assessment_results for select to authenticated using (student_id = public.current_student_id());
create policy results_teacher on public.assessment_results for select to authenticated using (exists (select 1 from public.course_assessments ca where ca.id = course_assessment_id and public.is_teacher_of(ca.class_subject_id)));
create policy results_teacher_write on public.assessment_results for insert to authenticated with check (exists (select 1 from public.course_assessments ca join public.student_enrollments se on se.semester_id = ca.semester_id and se.student_id = assessment_results.student_id join public.class_subjects cs on cs.id = ca.class_subject_id and cs.class_id = se.class_id where ca.id = course_assessment_id and public.is_teacher_of(ca.class_subject_id) and se.status = 'active'));
create policy results_teacher_update on public.assessment_results for update to authenticated using (exists (select 1 from public.course_assessments ca where ca.id = course_assessment_id and public.is_teacher_of(ca.class_subject_id)) and status <> 'locked') with check (status <> 'locked');
create policy results_admin on public.assessment_results for all using (public.is_admin()) with check (public.is_admin());

create policy submissions_read on public.course_grade_submissions for select to authenticated using (public.is_admin() or public.is_teacher_of(class_subject_id));
create policy submissions_teacher on public.course_grade_submissions for all using (public.is_teacher_of(class_subject_id)) with check (public.is_teacher_of(class_subject_id));
create policy submissions_admin on public.course_grade_submissions for all using (public.is_admin()) with check (public.is_admin());

create policy grades_student_read on public.grades for select to authenticated using (student_id = public.current_student_id());
create policy grades_teacher on public.grades for all using (public.is_teacher_of(class_subject_id)) with check (public.is_teacher_of(class_subject_id));
create policy grades_admin on public.grades for all using (public.is_admin()) with check (public.is_admin());

create policy payments_student_read on public.payments for select to authenticated using (student_id = public.current_student_id());
create policy payments_student_insert on public.payments for insert to authenticated with check (student_id = public.current_student_id());
create policy payments_admin on public.payments for all using (public.is_admin()) with check (public.is_admin());
create policy allocations_student_read on public.payment_month_allocations for select to authenticated using (exists (select 1 from public.payments p where p.id = payment_id and p.student_id = public.current_student_id()));
create policy allocations_student_insert on public.payment_month_allocations for insert to authenticated with check (exists (select 1 from public.payments p where p.id = payment_id and p.student_id = public.current_student_id()));
create policy allocations_admin on public.payment_month_allocations for all using (public.is_admin()) with check (public.is_admin());

create policy standings_student_read on public.academic_standings for select to authenticated using (student_id = public.current_student_id() or public.is_admin());
create policy standings_admin on public.academic_standings for all using (public.is_admin()) with check (public.is_admin());
create policy attendance_teacher_read on public.attendance_sessions for select to authenticated using (public.is_admin() or recorded_by in (select id from public.teachers where profile_id = auth.uid()));
create policy attendance_admin on public.attendance_sessions for all using (public.is_admin()) with check (public.is_admin());
create policy attendance_records_teacher on public.attendance_records for all using (exists (select 1 from public.attendance_sessions s where s.id = session_id and (public.is_admin() or s.recorded_by in (select id from public.teachers where profile_id = auth.uid())))) with check (exists (select 1 from public.attendance_sessions s where s.id = session_id and (public.is_admin() or s.recorded_by in (select id from public.teachers where profile_id = auth.uid()))));
create policy attendance_records_student_read on public.attendance_records for select to authenticated using (student_id = public.current_student_id());

-- Private payment proof bucket. Create it in the dashboard/CLI if it does not already exist.
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update set public = false;
drop policy if exists payment_proofs_student_upload on storage.objects;
drop policy if exists payment_proofs_student_read on storage.objects;
drop policy if exists payment_proofs_admin_read on storage.objects;
create policy payment_proofs_student_upload on storage.objects for insert to authenticated with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = public.current_student_id()::text);
create policy payment_proofs_student_read on storage.objects for select to authenticated using (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = public.current_student_id()::text);
create policy payment_proofs_admin_read on storage.objects for select to authenticated using (bucket_id = 'payment-proofs' and public.is_admin());

commit;

-- Required application follow-up before production cutover:
-- * Replace metadata-first role checks with profiles/current_user_role().
-- * Make enrollment queries authoritative and add semester_id to all assignment calls.
-- * Migrate teacher-scores and rankings from grades to assessment_results.
-- * Add server-side transactional provisioning and compensating Storage cleanup.
-- * Add signed-URL generation for admin/student payment proof viewing.
