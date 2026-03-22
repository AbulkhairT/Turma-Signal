-- Harden auth->profiles trigger for schema variations.
-- Supports deployments where profiles has text lens/tier and stricter NOT NULL constraints.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_email boolean;
  has_full_name boolean;
  has_lens boolean;
  has_onboarding_completed boolean;
  has_subscription_tier boolean;
  has_created_at boolean;
  has_updated_at boolean;
  cols text[] := array['id'];
  vals text[] := array[format('%L::uuid', new.id::text)];
  updates text[] := array[]::text[];
  sql text;
begin
  select exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='email'
  ) into has_email;
  select exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='full_name'
  ) into has_full_name;
  select exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='lens'
  ) into has_lens;
  select exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='onboarding_completed'
  ) into has_onboarding_completed;
  select exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='subscription_tier'
  ) into has_subscription_tier;
  select exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='created_at'
  ) into has_created_at;
  select exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='updated_at'
  ) into has_updated_at;

  if has_email then
    cols := array_append(cols, 'email');
    vals := array_append(vals, format('%L', new.email));
    updates := array_append(updates, 'email = excluded.email');
  end if;

  if has_full_name then
    cols := array_append(cols, 'full_name');
    vals := array_append(vals, 'null');
  end if;

  if has_lens then
    cols := array_append(cols, 'lens');
    vals := array_append(vals, 'null');
  end if;

  if has_onboarding_completed then
    cols := array_append(cols, 'onboarding_completed');
    vals := array_append(vals, 'false');
  end if;

  if has_subscription_tier then
    cols := array_append(cols, 'subscription_tier');
    vals := array_append(vals, quote_literal('free'));
  end if;

  if has_created_at then
    cols := array_append(cols, 'created_at');
    vals := array_append(vals, 'timezone(''utc'', now())');
  end if;

  if has_updated_at then
    cols := array_append(cols, 'updated_at');
    vals := array_append(vals, 'timezone(''utc'', now())');
    updates := array_append(updates, 'updated_at = timezone(''utc'', now())');
  end if;

  sql := format(
    'insert into public.profiles (%s) values (%s) on conflict (id) do %s',
    array_to_string(cols, ', '),
    array_to_string(vals, ', '),
    case
      when coalesce(array_length(updates, 1), 0) > 0 then 'update set ' || array_to_string(updates, ', ')
      else 'nothing'
    end
  );

  begin
    execute sql;
  exception
    when others then
      raise warning 'handle_new_auth_user failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
