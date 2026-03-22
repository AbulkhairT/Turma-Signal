-- Signal topic seed data
-- Safe to re-run: upsert on (lens, slug)

insert into public.topics (lens, slug, name)
values
  -- Building
  ('building', 'ai', 'AI'),
  ('building', 'startups', 'Startups'),
  ('building', 'product', 'Product'),
  ('building', 'growth', 'Growth'),
  ('building', 'big-tech', 'Big Tech'),
  ('building', 'saas', 'SaaS'),
  ('building', 'fundraising', 'Fundraising'),

  -- Investing
  ('investing', 'markets', 'Markets'),
  ('investing', 'macro', 'Macro'),
  ('investing', 'earnings', 'Earnings'),
  ('investing', 'ai', 'AI'),
  ('investing', 'crypto', 'Crypto'),
  ('investing', 'startups', 'Startups'),
  ('investing', 'fed', 'Fed'),

  -- Health
  ('health', 'nutrition', 'Nutrition'),
  ('health', 'recovery', 'Recovery'),
  ('health', 'longevity', 'Longevity'),
  ('health', 'strength', 'Strength'),
  ('health', 'fat-loss', 'Fat Loss'),
  ('health', 'muscle-gain', 'Muscle Gain'),
  ('health', 'mental-performance', 'Mental Performance'),
  ('health', 'sleep', 'Sleep'),
  ('health', 'travel-wellness', 'Travel Wellness')
on conflict (lens, slug)
do update set
  name = excluded.name,
  updated_at = timezone('utc', now());
