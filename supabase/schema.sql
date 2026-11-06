-- 라난 찬양팀 워크샵 1부 앱 스키마 (Supabase SQL Editor에서 한 번 실행)
-- 보안 모델: RLS ON + 정책 없음. 모든 접근은 Route Handler(service_role)로만 한다.
create extension if not exists pgcrypto;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null default '라난 찬양팀 워크샵',
  current_step_id uuid,
  revision bigint not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (event_id, name)
);

create table if not exists program_steps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  sort int not null,
  kind text not null,
  title text not null,
  config jsonb not null default '{}'::jsonb,
  state jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','active','done'))
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  color text not null,
  sort int not null default 0,
  name_locked boolean not null default false
);
alter table teams add column if not exists name_locked boolean not null default false;

create table if not exists team_members (
  participant_id uuid primary key references participants(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  sort int not null default 0
);

-- append-only: 수정은 음수 delta 보정 행으로
create table if not exists score_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  step_id uuid references program_steps(id) on delete set null,
  delta int not null,
  reason text not null default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists hum_songs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  title text not null,
  team_id uuid references teams(id) on delete set null,
  sort int not null default 0
);

create table if not exists amen_matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  step_id uuid not null references program_steps(id) on delete cascade,
  sort int not null default 0,
  team_a uuid not null references teams(id) on delete cascade,
  team_b uuid not null references teams(id) on delete cascade,
  player_a uuid references participants(id) on delete set null,
  player_b uuid references participants(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','live','done')),
  meta jsonb not null default '{}'::jsonb
);

create table if not exists amen_traits (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references amen_matches(id) on delete cascade,
  side text not null check (side in ('a','b')),
  speaker_id uuid references participants(id) on delete set null,
  figure text not null default '',
  trait text not null default '',
  ok boolean not null default true,
  dup boolean not null default false,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists word_cards (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  word text not null,
  is_trap boolean not null default false,
  qr_token text not null unique,
  sort int not null default 0
);

create table if not exists card_scans (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references word_cards(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  step_id uuid references program_steps(id) on delete set null,
  round int not null default 0,
  ok boolean not null,
  created_at timestamptz not null default now(),
  unique (card_id, round)
);

create index if not exists idx_steps_event on program_steps(event_id, sort);
create index if not exists idx_score_event on score_events(event_id, created_at);
create index if not exists idx_traits_match on amen_traits(match_id, created_at);

alter table events enable row level security;
alter table participants enable row level security;
alter table program_steps enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table score_events enable row level security;
alter table hum_songs enable row level security;
alter table amen_matches enable row level security;
alter table amen_traits enable row level security;
alter table word_cards enable row level security;
alter table card_scans enable row level security;

-- revision 원자적 증가 (폰/빔/관리자는 이 값 변화로 갱신 여부를 판단)
create or replace function bump_revision(eid uuid) returns bigint
language sql as $$
  update events set revision = revision + 1 where id = eid returning revision;
$$;
revoke all on function bump_revision(uuid) from public, anon, authenticated;
