-- Example SQL for making ranking production-ready on your existing schema
-- Run this in Supabase SQL editor.

alter table public.grades
  add column if not exists status text not null default 'approved'
    check (status in (
      'draft',
      'submitted',
      'pending_review',
      'approved',
      'invalidated',
      'excused_absence',
      'makeup_pending',
      'makeup_submitted',
      'makeup_approved',
      'rejected'
    )),
  add column if not exists attempt_number integer not null default 1,
  add column if not exists is_makeup boolean not null default false,
  add column if not exists is_excused boolean not null default false,
  add column if not exists is_cheating_flagged boolean not null default false,
  add column if not exists reason_code text,
  add column if not exists reviewer_id uuid,
  add column if not exists reviewed_at timestamptz,
  add column if not exists note text,
  add column if not exists source text not null default 'teacher'
    check (source in ('teacher', 'makeup', 'override', 'system')),
  add column if not exists is_final boolean not null default false,
  add column if not exists finalized_at timestamptz;

alter table public.semesters
  add column if not exists status text not null default 'grading_open'
    check (status in ('active', 'grading_open', 'review', 'finalized', 'ranked', 'archived'));

create table if not exists public.grade_review_cases (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  grade_id uuid not null references public.grades(id) on delete cascade,
  case_type text not null check (case_type in ('cheating', 'absent', 'appeal', 'makeup')),
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'approved', 'rejected')),
  reason text not null,
  reviewer_id uuid,
  decision text,
  override_score numeric(5,2),
  created_at timestamptz not null default now()
);

create table if not exists public.academic_standings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  standing_type text not null check (standing_type in ('normal', 'excused', 'withdrawn', 'disciplinary', 'suspended')),
  reason text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ranking_policies (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters(id) on delete cascade,
  require_all_subjects_complete boolean not null default true,
  allow_makeup_exam boolean not null default true,
  use_latest_valid_score boolean not null default true,
  use_best_valid_score boolean not null default false,
  zero_for_unexcused_absence boolean not null default false,
  exclude_disciplinary boolean not null default true,
  exclude_withdrawn boolean not null default true,
  exclude_suspended boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.ranking_snapshots (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  policy_version integer not null default 1,
  generated_at timestamptz not null default now(),
  is_final boolean not null default true,
  snapshot_json jsonb not null,
  created_at timestamptz not null default now()
);

-- A receipt is one financial transaction. Each month it pays for is recorded
-- separately so four-month payments can be filtered and reconciled correctly.
create table if not exists public.payment_month_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  payment_month date not null,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (payment_id, payment_month)
);

create index if not exists idx_grades_status on public.grades(status);
create index if not exists idx_grades_student_semester on public.grades(student_id, semester_id);
create index if not exists idx_academic_standings_active on public.academic_standings(student_id, semester_id, is_active);
create index if not exists idx_ranking_snapshots_class on public.ranking_snapshots(class_id, semester_id);
create index if not exists idx_payment_month_allocations_month on public.payment_month_allocations(payment_month);

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

alter table public.grades enable row level security;
alter table public.semesters enable row level security;
alter table public.grade_review_cases enable row level security;
alter table public.academic_standings enable row level security;
alter table public.ranking_policies enable row level security;
alter table public.ranking_snapshots enable row level security;
alter table public.payment_month_allocations enable row level security;
alter table public.payments enable row level security;

drop policy if exists "Admins can read payments" on public.payments;
create policy "Admins can read payments"
on public.payments for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can update payments" on public.payments;
create policy "Admins can update payments"
on public.payments for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read grades" on public.grades;
create policy "Admins can read grades"
on public.grades for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage grades" on public.grades;
create policy "Admins can manage grades"
on public.grades for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update grades" on public.grades;
create policy "Admins can update grades"
on public.grades for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete grades" on public.grades;
create policy "Admins can delete grades"
on public.grades for delete to authenticated
using (public.is_admin());

drop policy if exists "Admins can read review cases" on public.grade_review_cases;
create policy "Admins can read review cases"
on public.grade_review_cases for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage review cases" on public.grade_review_cases;
create policy "Admins can manage review cases"
on public.grade_review_cases for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update review cases" on public.grade_review_cases;
create policy "Admins can update review cases"
on public.grade_review_cases for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read standings" on public.academic_standings;
create policy "Admins can read standings"
on public.academic_standings for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage standings" on public.academic_standings;
create policy "Admins can manage standings"
on public.academic_standings for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update standings" on public.academic_standings;
create policy "Admins can update standings"
on public.academic_standings for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read ranking policies" on public.ranking_policies;
create policy "Admins can read ranking policies"
on public.ranking_policies for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage ranking policies" on public.ranking_policies;
create policy "Admins can manage ranking policies"
on public.ranking_policies for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update ranking policies" on public.ranking_policies;
create policy "Admins can update ranking policies"
on public.ranking_policies for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read ranking snapshots" on public.ranking_snapshots;
create policy "Admins can read ranking snapshots"
on public.ranking_snapshots for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage ranking snapshots" on public.ranking_snapshots;
create policy "Admins can manage ranking snapshots"
on public.ranking_snapshots for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update ranking snapshots" on public.ranking_snapshots;
create policy "Admins can update ranking snapshots"
on public.ranking_snapshots for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read payment allocations" on public.payment_month_allocations;
create policy "Admins can read payment allocations"
on public.payment_month_allocations for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage payment allocations" on public.payment_month_allocations;
create policy "Admins can manage payment allocations"
on public.payment_month_allocations for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update payment allocations" on public.payment_month_allocations;
create policy "Admins can update payment allocations"
on public.payment_month_allocations for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete payment allocations" on public.payment_month_allocations;
create policy "Admins can delete payment allocations"
on public.payment_month_allocations for delete to authenticated
using (public.is_admin());

drop policy if exists "Students can read own ranking snapshots" on public.ranking_snapshots;
create policy "Students can read own ranking snapshots"
on public.ranking_snapshots for select to authenticated
using (
  snapshot_json->>'student_id' = auth.uid()::text
  or public.is_admin()
);

drop policy if exists "Students can read own grades" on public.grades;
create policy "Students can read own grades"
on public.grades for select to authenticated
using (
  student_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "Students can read own review cases" on public.grade_review_cases;
create policy "Students can read own review cases"
on public.grade_review_cases for select to authenticated
using (
  student_id = auth.uid()
  or public.is_admin()
);

-- Example of a valid ranking policy for a semester
-- insert into public.ranking_policies (
--   semester_id,
--   require_all_subjects_complete,
--   allow_makeup_exam,
--   use_latest_valid_score,
--   use_best_valid_score,
--   zero_for_unexcused_absence,
--   exclude_disciplinary,
--   exclude_withdrawn,
--   exclude_suspended,
--   version
-- ) values (
--   '<semester-id>',
--   true,
--   true,
--   true,
--   false,
--   false,
--   true,
--   true,
--   true,
--   1
-- );
