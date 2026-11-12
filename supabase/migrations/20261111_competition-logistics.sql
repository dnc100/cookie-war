alter table public.battles add column if not exists genre text not null default 'Cookies';
alter table public.battles add column if not exists judging_criteria jsonb not null default '["Taste", "Texture", "Appearance"]'::jsonb;
alter table public.battles add column if not exists submissions_close_at timestamptz;
alter table public.battles add column if not exists results_day_at timestamptz;
alter table public.profiles add column if not exists email text;
update public.profiles set email = '' where email is null;
alter table public.profiles alter column email set not null;
alter table public.battles alter column status set default 'OPEN';
update public.battles set status = 'OPEN' where status = 'DRAFT';
update public.battles
set submissions_close_at = coalesce(submissions_close_at, taste_day_at - interval '14 days'),
    results_day_at = coalesce(results_day_at, taste_day_at + interval '2 days');
alter table public.battles alter column submissions_close_at set not null;
alter table public.battles alter column results_day_at set not null;

alter table public.profiles add column if not exists can_bake boolean not null default false;
alter table public.profiles add column if not exists can_taste boolean not null default false;
alter table public.profiles add column if not exists active_mode public.user_role;
update public.profiles
set can_bake = can_bake or role = 'BAKER',
    can_taste = can_taste or role in ('BAKER', 'TASTER'),
    active_mode = coalesce(active_mode, role);
alter table public.profiles alter column active_mode set default 'TASTER';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'displayName', split_part(new.email, '@', 1)),
    new.email,
    case when new.raw_user_meta_data->>'role' = 'BAKER' then 'BAKER'::public.user_role else 'TASTER'::public.user_role end
  );
  update public.profiles
  set can_bake = (new.raw_user_meta_data->>'role' = 'BAKER'),
      can_taste = true,
      active_mode = case when new.raw_user_meta_data->>'role' = 'BAKER' then 'BAKER'::public.user_role else 'TASTER'::public.user_role end
  where id = new.id;
  return new;
end;
$$;

create table if not exists public.competition_locations (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  name text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.battle_participants (
  battle_id uuid not null references public.battles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  location_id uuid references public.competition_locations(id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (battle_id, user_id)
);

alter table public.battle_participants add column if not exists location_name text;
alter table public.battle_participants add column if not exists location_address text;
alter table public.battle_participants add column if not exists location_latitude double precision;
alter table public.battle_participants add column if not exists location_longitude double precision;
alter table public.battle_participants add column if not exists allergy_tags jsonb not null default '[]'::jsonb;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  baker_id uuid not null references public.profiles(id) on delete cascade,
  cookie_name text not null,
  recipe text,
  recipe_is_secret boolean not null default true,
  allergy_tags jsonb not null default '[]'::jsonb,
  drop_off_location_id uuid references public.competition_locations(id),
  feedback_questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (battle_id, baker_id)
);

alter table public.competition_locations enable row level security;
alter table public.battle_participants enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "Admins can delete battles" on public.battles;
drop policy if exists "Anyone can read upcoming battles" on public.battles;
drop policy if exists "Authenticated users can read competition locations" on public.competition_locations;
drop policy if exists "Admins can manage competition locations" on public.competition_locations;
drop policy if exists "Users can join battles" on public.battle_participants;
drop policy if exists "Users can read their participation" on public.battle_participants;
drop policy if exists "Users can update their location" on public.battle_participants;
drop policy if exists "Users can leave their competition" on public.battle_participants;
drop policy if exists "Bakers can submit their own entry" on public.submissions;
drop policy if exists "Bakers and admins can read submissions" on public.submissions;
drop policy if exists "Bakers can update their own entry" on public.submissions;
drop policy if exists "Bakers can delete their own entry" on public.submissions;
drop policy if exists "Users can update their own mode" on public.profiles;

create policy "Admins can delete battles" on public.battles for delete using (public.is_admin());
create policy "Anyone can read upcoming battles" on public.battles for select using (status in ('OPEN', 'TASTING'));
create policy "Authenticated users can read competition locations" on public.competition_locations for select using (auth.uid() is not null);
create policy "Admins can manage competition locations" on public.competition_locations for all using (public.is_admin()) with check (public.is_admin());
create policy "Users can join battles" on public.battle_participants for insert with check (auth.uid() = user_id);
create policy "Users can read their participation" on public.battle_participants for select using (auth.uid() = user_id or public.is_admin());
create policy "Users can update their location" on public.battle_participants for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can leave their competition" on public.battle_participants for delete using (auth.uid() = user_id);
create policy "Bakers can submit their own entry" on public.submissions for insert with check (auth.uid() = baker_id);
create policy "Bakers and admins can read submissions" on public.submissions for select using (auth.uid() = baker_id or public.is_admin());
create policy "Bakers can update their own entry" on public.submissions for update using (auth.uid() = baker_id) with check (auth.uid() = baker_id);
create policy "Bakers can delete their own entry" on public.submissions for delete using (auth.uid() = baker_id);
create policy "Users can update their own mode" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
