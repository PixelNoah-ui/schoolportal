begin;

-- Prevent a student score from exceeding its grading component maximum.
create or replace function public.validate_assessment_result_score()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  assessment_max numeric(8,2);
begin
  if new.score is null then
    return new;
  end if;

  select max_score
    into assessment_max
  from public.course_assessments
  where id = new.course_assessment_id;

  if assessment_max is null then
    raise exception 'Assessment % was not found', new.course_assessment_id;
  end if;

  if new.score < 0 or new.score > assessment_max then
    raise exception 'Score must be between 0 and %', assessment_max;
  end if;

  return new;
end;
$$;

drop trigger if exists assessment_results_score_limit
on public.assessment_results;

create trigger assessment_results_score_limit
before insert or update of score, course_assessment_id
on public.assessment_results
for each row
execute function public.validate_assessment_result_score();

-- Keep the combined grading structure at 100 marks or less.
create or replace function public.validate_grading_structure_total()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  structure_total numeric;
begin
  select coalesce(sum(max_score), 0)
    into structure_total
  from public.course_assessments
  where class_subject_id = new.class_subject_id
    and semester_id = new.semester_id
    and id <> new.id;

  if structure_total + new.max_score > 100 then
    raise exception 'Grading structure cannot exceed 100 total marks';
  end if;

  return new;
end;
$$;

drop trigger if exists grading_structure_total_limit
on public.course_assessments;

create trigger grading_structure_total_limit
before insert or update of max_score, class_subject_id, semester_id
on public.course_assessments
for each row
execute function public.validate_grading_structure_total();

commit;
