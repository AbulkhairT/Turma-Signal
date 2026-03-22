-- Fix auth signup failures caused by profile-trigger exceptions.
-- This migration makes profile creation best-effort so auth signup is never blocked
-- by downstream profile row issues.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do update
      set email = excluded.email,
          updated_at = timezone('utc', now());
  exception
    when others then
      -- Never block auth.users insert.
      -- App onboarding/preferences upserts can create/fix profile rows later.
      raise warning 'handle_new_auth_user failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
