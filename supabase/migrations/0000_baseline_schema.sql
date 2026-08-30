create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  username text,
  email text,
  role text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid,
  name text not null,
  grade integer not null,
  section text,
  created_at timestamptz not null default now(),
  constraint classes_academic_year_id_fkey foreign key (academic_year_id) references public.academic_years (id)
);

create table if not exists public.students (
  id uuid primary key,
  profile_id uuid not null,
  class_id uuid,
  phone text,
  date_of_birth date,
  temporary_password text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_profile_id_fkey foreign key (profile_id) references public.profiles (id)
);

create table if not exists public.teachers (
  id uuid primary key,
  profile_id uuid not null,
  phone text,
  temporary_password text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teachers_profile_id_fkey foreign key (profile_id) references public.profiles (id)
);

create table if not exists public.academic_years (
  id uuid primary key,
  name text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null,
  subject_id uuid not null,
  teacher_id uuid,
  created_at timestamptz not null default now(),
  constraint class_subjects_class_id_fkey foreign key (class_id) references public.classes (id),
  constraint class_subjects_subject_id_fkey foreign key (subject_id) references public.subjects (id),
  constraint class_subjects_teacher_id_fkey foreign key (teacher_id) references public.teachers (id)
);

create table if not exists public.semesters (
  id uuid primary key,
  academic_year_id uuid not null,
  name text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  status text not null default 'grading_open',
  constraint semesters_academic_year_id_fkey foreign key (academic_year_id) references public.academic_years (id)
);

create table if not exists public.grades (
  id uuid primary key,
  student_id uuid not null,
  class_subject_id uuid not null,
  semester_id uuid not null,
  score numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'approved',
  attempt_number integer not null default 1,
  is_makeup boolean not null default false,
  is_excused boolean not null default false,
  is_cheating_flagged boolean not null default false,
  reason_code text,
  reviewer_id uuid,
  reviewed_at timestamptz,
  note text,
  source text not null default 'teacher',
  is_final boolean not null default false,
  finalized_at timestamptz,
  constraint grades_student_id_fkey foreign key (student_id) references public.students (id),
  constraint grades_class_subject_id_fkey foreign key (class_subject_id) references public.class_subjects (id),
  constraint grades_semester_id_fkey foreign key (semester_id) references public.semesters (id)
);

create table if not exists public.grade_review_cases (
  id uuid primary key,
  student_id uuid not null,
  grade_id uuid not null,
  case_type text not null,
  status text not null default 'open',
  reason text not null,
  reviewer_id uuid,
  decision text,
  override_score numeric,
  created_at timestamptz not null default now(),
  constraint grade_review_cases_student_id_fkey foreign key (student_id) references public.students (id),
  constraint grade_review_cases_grade_id_fkey foreign key (grade_id) references public.grades (id)
);

create table if not exists public.academic_standings (
  id uuid primary key,
  student_id uuid not null,
  semester_id uuid not null,
  standing_type text not null,
  reason text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint academic_standings_student_id_fkey foreign key (student_id) references public.students (id),
  constraint academic_standings_semester_id_fkey foreign key (semester_id) references public.semesters (id)
);

create table if not exists public.ranking_policies (
  id uuid primary key,
  semester_id uuid not null,
  require_all_subjects_complete boolean not null default true,
  allow_makeup_exam boolean not null default true,
  use_latest_valid_score boolean not null default true,
  use_best_valid_score boolean not null default false,
  zero_for_unexcused_absence boolean not null default false,
  exclude_disciplinary boolean not null default true,
  exclude_withdrawn boolean not null default true,
  exclude_suspended boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  constraint ranking_policies_semester_id_fkey foreign key (semester_id) references public.semesters (id)
);

create table if not exists public.ranking_snapshots (
  id uuid primary key,
  class_id uuid not null,
  semester_id uuid not null,
  policy_version integer not null default 1,
  generated_at timestamptz,
  is_final boolean not null default true,
  snapshot_json jsonb not null,
  created_at timestamptz not null default now(),
  constraint ranking_snapshots_class_id_fkey foreign key (class_id) references public.classes (id),
  constraint ranking_snapshots_semester_id_fkey foreign key (semester_id) references public.semesters (id)
);

create table if not exists public.payments (
  id uuid primary key,
  student_id uuid not null,
  amount numeric not null,
  payment_month date not null,
  status text not null default 'pending',
  payment_method text,
  proof_path text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  rejection_reason text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_student_id_fkey foreign key (student_id) references public.students (id)
);

create table if not exists public.payment_month_allocations (
  id uuid primary key,
  payment_id uuid not null,
  payment_month date not null,
  amount numeric not null,
  created_at timestamptz not null default now(),
  constraint payment_month_allocations_payment_id_fkey foreign key (payment_id) references public.payments (id)
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

create trigger students_updated_at
before update on public.students
for each row execute function public.handle_updated_at();

create trigger teachers_updated_at
before update on public.teachers
for each row execute function public.handle_updated_at();

create trigger grades_updated_at
before update on public.grades
for each row execute function public.handle_updated_at();

create trigger payments_updated_at
before update on public.payments
for each row execute function public.handle_updated_at();
