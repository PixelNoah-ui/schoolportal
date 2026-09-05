begin;

-- Prevent the combined grading structure from exceeding 100 marks.
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

create constraint trigger grading_structure_total_limit
after insert or update of max_score, class_subject_id, semester_id
on public.course_assessments
deferrable initially deferred
for each row
execute function public.validate_grading_structure_total();

commit;
