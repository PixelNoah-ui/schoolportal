create or replace function public.clear_temporary_passwords()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.password_hash is not null and old.password_hash is distinct from new.password_hash then
    update public.students
    set temporary_password = null
    where profile_id = new.id;

    update public.teachers
    set temporary_password = null
    where profile_id = new.id;
  end if;

  return new;
end;
$$;

create trigger auth_user_password_updated
after update on auth.users
for each row
when (old.encrypted_password is distinct from new.encrypted_password)
execute function public.clear_temporary_passwords();
