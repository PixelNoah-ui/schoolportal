create extension if not exists pgcrypto;

create table if not exists public.assessment_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  class_subject_id uuid not null,
  day_of_week text not null,
  start_time time not null,
  end_time time not null,
  room text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedules_class_subject_id_fkey foreign key (class_subject_id) references public.class_subjects (id) on delete cascade
);

create table if not exists public.course_assessments (
  id uuid primary key default gen_random_uuid(),
  class_subject_id uuid not null,
  assessment_type_id uuid not null,
  semester_id uuid,
  name text not null,
  weight numeric not null default 0,
  max_score numeric not null default 100,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_assessments_class_subject_id_fkey foreign key (class_subject_id) references public.class_subjects (id) on delete cascade,
  constraint course_assessments_assessment_type_id_fkey foreign key (assessment_type_id) references public.assessment_types (id),
  constraint course_assessments_semester_id_fkey foreign key (semester_id) references public.semesters (id)
);

create table if not exists public.course_grade_submissions (
  id uuid primary key default gen_random_uuid(),
  class_subject_id uuid not null,
  semester_id uuid not null,
  teacher_id uuid,
  status text not null default 'draft',
  submitted_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_grade_submissions_class_subject_id_fkey foreign key (class_subject_id) references public.class_subjects (id) on delete cascade,
  constraint course_grade_submissions_semester_id_fkey foreign key (semester_id) references public.semesters (id),
  constraint course_grade_submissions_teacher_id_fkey foreign key (teacher_id) references public.teachers (id)
);

create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  class_subject_id uuid not null,
  assessment_id uuid,
  semester_id uuid,
  score numeric,
  status text not null default 'pending',
  reviewer_id uuid,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_results_student_id_fkey foreign key (student_id) references public.students (id),
  constraint assessment_results_class_subject_id_fkey foreign key (class_subject_id) references public.class_subjects (id),
  constraint assessment_results_assessment_id_fkey foreign key (assessment_id) references public.course_assessments (id),
  constraint assessment_results_semester_id_fkey foreign key (semester_id) references public.semesters (id)
);

create table if not exists public.ranking_policies (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null,
  name text not null default 'Default policy',
  require_all_subjects_complete boolean not null default true,
  allow_makeup_exam boolean not null default true,
  use_latest_valid_score boolean not null default true,
  use_best_valid_score boolean not null default false,
  zero_for_unexcused_absence boolean not null default false,
  exclude_disciplinary boolean not null default true,
  exclude_withdrawn boolean not null default true,
  exclude_suspended boolean not null default true,
  exclude_incomplete boolean not null default true,
  exclude_excused boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ranking_policies_semester_id_fkey foreign key (semester_id) references public.semesters (id)
);

create table if not exists public.ranking_snapshots (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null,
  semester_id uuid not null,
  class_id uuid not null,
  policy_version integer not null default 1,
  generated_at timestamptz not null default now(),
  snapshot_json jsonb not null,
  created_at timestamptz not null default now(),
  constraint ranking_snapshots_academic_year_id_fkey foreign key (academic_year_id) references public.academic_years (id),
  constraint ranking_snapshots_semester_id_fkey foreign key (semester_id) references public.semesters (id),
  constraint ranking_snapshots_class_id_fkey foreign key (class_id) references public.classes (id)
);

create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  class_id uuid not null,
  academic_year_id uuid not null,
  enrolled_at timestamptz not null default now(),
  transferred_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_enrollments_student_id_fkey foreign key (student_id) references public.students (id),
  constraint student_enrollments_class_id_fkey foreign key (class_id) references public.classes (id),
  constraint student_enrollments_academic_year_id_fkey foreign key (academic_year_id) references public.academic_years (id)
);

alter table public.assessment_types enable row level security;
alter table public.schedules enable row level security;
alter table public.course_assessments enable row level security;
alter table public.course_grade_submissions enable row level security;
alter table public.assessment_results enable row level security;
alter table public.ranking_policies enable row level security;
alter table public.ranking_snapshots enable row level security;
alter table public.student_enrollments enable row level security;

create policy if not exists "Admins can manage assessment types"
on public.assessment_types for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy if not exists "Admins can manage schedules"
on public.schedules for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy if not exists "Admins can manage course assessments"
on public.course_assessments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy if not exists "Admins can manage grade submissions"
on public.course_grade_submissions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy if not exists "Admins can manage assessment results"
on public.assessment_results for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy if not exists "Admins can manage ranking policies"
on public.ranking_policies for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy if not exists "Admins can manage ranking snapshots"
on public.ranking_snapshots for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy if not exists "Admins can manage student enrollments"
on public.student_enrollments for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger if not exists assessment_types_updated_at
before update on public.assessment_types
for each row execute function public.handle_updated_at();

create trigger if not exists schedules_updated_at
before update on public.schedules
for each row execute function public.handle_updated_at();

create trigger if not exists course_assessments_updated_at
before update on public.course_assessments
for each row execute function public.handle_updated_at();

create trigger if not exists course_grade_submissions_updated_at
before update on public.course_grade_submissions
for each row execute function public.handle_updated_at();

create trigger if not exists assessment_results_updated_at
before update on public.assessment_results
for each row execute function public.handle_updated_at();

create trigger if not exists ranking_policies_updated_at
before update on public.ranking_policies
for each row execute function public.handle_updated_at();

create trigger if not exists student_enrollments_updated_at
before update on public.student_enrollments
for each row execute function public.handle_updated_at();
