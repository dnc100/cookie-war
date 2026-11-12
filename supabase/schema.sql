create type public.user_role as enum ('BAKER', 'TASTER', 'ADMIN');
create type public.battle_status as enum ('DRAFT', 'OPEN', 'TASTING', 'RESULTS', 'ARCHIVED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  can_bake boolean not null default false,
  can_taste boolean not null default false,
  active_mode public.user_role default 'TASTER',
  role public.user_role not null default 'TASTER',
  created_at timestamptz not null default now()
);

create table public.battles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  genre text not null default 'Cookies',
  theme text,
  judging_criteria jsonb not null default '["Taste", "Texture", "Appearance"]'::jsonb,
  status public.battle_status not null default 'DRAFT',
  submissions_close_at timestamptz not null,
  taste_day_at timestamptz not null,
  results_day_at timestamptz not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.competition_locations (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  name text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table public.battle_participants (
  battle_id uuid not null references public.battles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  location_id uuid references public.competition_locations(id) on delete set null,
  joined_at timestamptz not null default now(),
  location_name text,
  location_address text,
  location_latitude double precision,
  location_longitude double precision,
  allergy_tags jsonb not null default '[]'::jsonb,
  primary key (battle_id, user_id)
);

create table public.submissions (
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

alter table public.profiles enable row level security;
alter table public.battles enable row level security;
alter table public.competition_locations enable row level security;
alter table public.battle_participants enable row level security;
alter table public.submissions enable row level security;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN');
$$;

create policy "Users can read their profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own mode" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins can read all profiles" on public.profiles for select using (public.is_admin());
create policy "Authenticated users can read battles" on public.battles for select using (auth.uid() is not null);
create policy "Admins can create battles" on public.battles for insert with check (public.is_admin());
create policy "Admins can update battles" on public.battles for update using (public.is_admin());
create policy "Admins can delete battles" on public.battles for delete using (public.is_admin());
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

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, role, can_bake, can_taste, active_mode)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'displayName', split_part(new.email, '@', 1)),
    new.email,
    case when new.raw_user_meta_data->>'role' = 'BAKER' then 'BAKER'::public.user_role else 'TASTER'::public.user_role end,
    new.raw_user_meta_data->>'role' = 'BAKER',
    true,
    case when new.raw_user_meta_data->>'role' = 'BAKER' then 'BAKER'::public.user_role else 'TASTER'::public.user_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- After creating your first account, promote it from the Supabase SQL editor:
-- update public.profiles set role = 'ADMIN' where id = 'YOUR_AUTH_USER_UUID';
