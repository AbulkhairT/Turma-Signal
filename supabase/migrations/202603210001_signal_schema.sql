-- Signal V1 core schema
-- Idempotent where practical for Supabase/Postgres

create extension if not exists pgcrypto;

-- ===== Enums =====
do $$
begin
  if not exists (select 1 from pg_type where typname = 'lens_type') then
    create type public.lens_type as enum ('building', 'investing', 'health');
  end if;

  if not exists (select 1 from pg_type where typname = 'subscription_tier_type') then
    create type public.subscription_tier_type as enum ('free', 'premium');
  end if;

  if not exists (select 1 from pg_type where typname = 'processing_status_type') then
    create type public.processing_status_type as enum ('running', 'succeeded', 'failed');
  end if;

  if not exists (select 1 from pg_type where typname = 'signal_status_type') then
    create type public.signal_status_type as enum ('draft', 'published', 'archived');
  end if;
end $$;

-- ===== Utility triggers =====
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ===== Core user profile =====
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  lens public.lens_type,
  onboarding_completed boolean not null default false,
  subscription_tier public.subscription_tier_type not null default 'free',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is 'One row per auth user with onboarding state and preferences.';
comment on column public.profiles.subscription_tier is 'Billing tier used for feed gating (free/premium).';

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ===== Topics =====
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  lens public.lens_type not null,
  slug text not null,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (lens, slug)
);

comment on table public.topics is 'Selectable topics per lens. Lens-scoped unique slugs.';

create trigger trg_topics_updated_at
before update on public.topics
for each row execute function public.set_updated_at();

-- ===== User topic preferences =====
create table if not exists public.user_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, topic_id)
);

comment on table public.user_topics is 'User-selected topics used for personalized feed filtering.';

-- ===== Signals and content graph =====
create table if not exists public.story_clusters (
  id uuid primary key default gen_random_uuid(),
  lens public.lens_type not null,
  cluster_key text,
  title text,
  summary text,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_story_clusters_updated_at
before update on public.story_clusters
for each row execute function public.set_updated_at();

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  source text,
  source_article_id text,
  url text not null,
  title text,
  author text,
  published_at timestamptz,
  content text,
  metadata jsonb not null default '{}'::jsonb,
  ingested_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.articles is 'Raw ingested articles from external news providers.';

create trigger trg_articles_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

create table if not exists public.article_topics (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  confidence numeric(5,4),
  created_at timestamptz not null default timezone('utc', now()),
  unique (article_id, topic_id)
);

create table if not exists public.cluster_articles (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid not null references public.story_clusters(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (cluster_id, article_id)
);

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  lens public.lens_type not null,
  topic_id uuid references public.topics(id) on delete set null,
  story_cluster_id uuid references public.story_clusters(id) on delete set null,
  title text not null,
  what_happened text,
  why_it_matters text,
  what_happens_next text,
  what_you_should_do text,
  confidence text,
  status public.signal_status_type not null default 'draft',
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.signals is 'Shared signal pool generated by lens/topic; published rows are user-visible.';

create trigger trg_signals_updated_at
before update on public.signals
for each row execute function public.set_updated_at();

-- ===== User interaction tables =====
create table if not exists public.saved_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_id uuid not null references public.signals(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, signal_id)
);

comment on table public.saved_signals is 'User bookmarks for later reading.';

create table if not exists public.user_signal_impressions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_id uuid not null references public.signals(id) on delete cascade,
  seen_at timestamptz not null default timezone('utc', now()),
  context jsonb not null default '{}'::jsonb
);

comment on table public.user_signal_impressions is 'Tracks delivery/show events for analytics and quality loops.';

-- ===== Pipeline run logging =====
create table if not exists public.processing_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null,
  status public.processing_status_type not null default 'running',
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_processing_runs_updated_at
before update on public.processing_runs
for each row execute function public.set_updated_at();

-- ===== Indexes (optimized for feed + joins) =====
create index if not exists idx_profiles_lens on public.profiles(lens);
create index if not exists idx_topics_lens_slug on public.topics(lens, slug);
create index if not exists idx_user_topics_user_id on public.user_topics(user_id);
create index if not exists idx_user_topics_topic_id on public.user_topics(topic_id);

create index if not exists idx_signals_published_lens on public.signals(status, lens, published_at desc);
create index if not exists idx_signals_topic_published on public.signals(topic_id, published_at desc);
create index if not exists idx_signals_cluster on public.signals(story_cluster_id);

create index if not exists idx_saved_signals_user_created on public.saved_signals(user_id, created_at desc);
create index if not exists idx_saved_signals_signal on public.saved_signals(signal_id);

create index if not exists idx_impressions_user_seen on public.user_signal_impressions(user_id, seen_at desc);
create index if not exists idx_impressions_signal_seen on public.user_signal_impressions(signal_id, seen_at desc);

create index if not exists idx_article_topics_article on public.article_topics(article_id);
create index if not exists idx_article_topics_topic on public.article_topics(topic_id);
create index if not exists idx_cluster_articles_cluster on public.cluster_articles(cluster_id);
create index if not exists idx_cluster_articles_article on public.cluster_articles(article_id);
create index if not exists idx_articles_source_id on public.articles(source, source_article_id);
create index if not exists idx_articles_published_at on public.articles(published_at desc);
create index if not exists idx_processing_runs_type_started on public.processing_runs(run_type, started_at desc);

-- ===== Auto-create profile on auth user creation =====
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- ===== RLS =====
alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.user_topics enable row level security;
alter table public.saved_signals enable row level security;
alter table public.user_signal_impressions enable row level security;
alter table public.signals enable row level security;
alter table public.story_clusters enable row level security;
alter table public.articles enable row level security;
alter table public.article_topics enable row level security;
alter table public.cluster_articles enable row level security;
alter table public.processing_runs enable row level security;

-- Profiles: users can read/update their own row
DO $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_own') then
    create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_own') then
    create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_insert_own') then
    create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
  end if;
end $$;

-- Topics: publicly readable, not publicly writable
DO $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='topics' and policyname='topics_select_public') then
    create policy topics_select_public on public.topics for select using (true);
  end if;
end $$;

-- User topics: own rows only
DO $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_topics' and policyname='user_topics_select_own') then
    create policy user_topics_select_own on public.user_topics for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_topics' and policyname='user_topics_insert_own') then
    create policy user_topics_insert_own on public.user_topics for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_topics' and policyname='user_topics_delete_own') then
    create policy user_topics_delete_own on public.user_topics for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Saved signals: own rows only
DO $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='saved_signals' and policyname='saved_signals_select_own') then
    create policy saved_signals_select_own on public.saved_signals for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='saved_signals' and policyname='saved_signals_insert_own') then
    create policy saved_signals_insert_own on public.saved_signals for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='saved_signals' and policyname='saved_signals_delete_own') then
    create policy saved_signals_delete_own on public.saved_signals for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Impressions: own rows only
DO $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_signal_impressions' and policyname='impressions_select_own') then
    create policy impressions_select_own on public.user_signal_impressions for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_signal_impressions' and policyname='impressions_insert_own') then
    create policy impressions_insert_own on public.user_signal_impressions for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- Signals: published rows are readable by everyone; no public write access
DO $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='signals' and policyname='signals_select_published') then
    create policy signals_select_published on public.signals for select
      using (status = 'published' and published_at is not null);
  end if;
end $$;

-- Internal tables: service role only (no public/auth policies)
