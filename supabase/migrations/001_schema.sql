-- ============================================================
-- Wandr — database schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Profiles ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  email      text,
  created_at timestamptz default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Trips ─────────────────────────────────────────────────────
create table if not exists public.trips (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  destination text,
  emoji       text default '🌍',
  bg          text default '#dbeafe',
  start_date  date not null,
  end_date    date not null,
  status      text not null default 'planning'
                check (status in ('planning','upcoming','active','completed')),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

-- ── Participants ───────────────────────────────────────────────
create table if not exists public.participants (
  id       uuid primary key default gen_random_uuid(),
  trip_id  uuid not null references public.trips(id) on delete cascade,
  user_id  uuid references auth.users(id) on delete set null,
  name     text not null,
  email    text,
  initials text,
  color    text default '#3b82f6',
  role     text not null default 'member'
             check (role in ('organizer','member')),
  created_at timestamptz default now()
);

-- ── Photos ────────────────────────────────────────────────────
create table if not exists public.photos (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  url          text,
  storage_path text,
  emoji        text default '📸',
  caption      text,
  bg           text default '#dbeafe',
  uploaded_by  uuid references auth.users(id) on delete set null,
  uploaded_at  timestamptz default now()
);

-- ── Plans ─────────────────────────────────────────────────────
create table if not exists public.plans (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  title       text not null,
  description text,
  date        date not null,
  time        text,
  type        text not null default 'activity'
                check (type in ('transport','activity','accommodation','food')),
  created_at  timestamptz default now()
);

-- ── Tickets ───────────────────────────────────────────────────
create table if not exists public.tickets (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  type        text not null default 'flight'
                check (type in ('flight','train','bus','hotel','other')),
  title       text,
  from_place  text,
  to_place    text,
  date        date,
  time        text,
  duration    text,
  passengers  integer default 1,
  status      text not null default 'pending'
                check (status in ('confirmed','pending','cancelled')),
  reference   text,
  created_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.trips       enable row level security;
alter table public.participants enable row level security;
alter table public.photos      enable row level security;
alter table public.plans       enable row level security;
alter table public.tickets     enable row level security;

-- Helper: is the current user a participant on a trip?
create or replace function public.is_participant(trip_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.participants
    where participants.trip_id = $1
      and participants.user_id = auth.uid()
  );
$$;

-- profiles: own row only
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- trips: participants can read; creator can insert/update/delete
create policy "Participants can view trip"
  on public.trips for select
  using (created_by = auth.uid() or public.is_participant(id));

create policy "Creator can insert trip"
  on public.trips for insert
  with check (created_by = auth.uid());

create policy "Creator can update trip"
  on public.trips for update
  using (created_by = auth.uid());

create policy "Creator can delete trip"
  on public.trips for delete
  using (created_by = auth.uid());

-- participants: same trip participants can view; organizer can insert/delete
create policy "Participants can view participants"
  on public.participants for select
  using (public.is_participant(trip_id));

create policy "Organizer can add participant"
  on public.participants for insert
  with check (
    exists (
      select 1 from public.participants p
      where p.trip_id = participants.trip_id
        and p.user_id = auth.uid()
        and p.role = 'organizer'
    )
    or
    exists (
      select 1 from public.trips t
      where t.id = participants.trip_id
        and t.created_by = auth.uid()
    )
  );

create policy "Organizer can remove participant"
  on public.participants for delete
  using (
    exists (
      select 1 from public.participants p
      where p.trip_id = participants.trip_id
        and p.user_id = auth.uid()
        and p.role = 'organizer'
    )
  );

-- photos, plans, tickets: participants can read; participants can insert; uploader/creator can delete
create policy "Participants can view photos"
  on public.photos for select using (public.is_participant(trip_id));
create policy "Participants can add photos"
  on public.photos for insert with check (public.is_participant(trip_id));
create policy "Uploader can delete photo"
  on public.photos for delete using (uploaded_by = auth.uid());

create policy "Participants can view plans"
  on public.plans for select using (public.is_participant(trip_id));
create policy "Participants can add plans"
  on public.plans for insert with check (public.is_participant(trip_id));
create policy "Participants can delete plans"
  on public.plans for delete using (public.is_participant(trip_id));

create policy "Participants can view tickets"
  on public.tickets for select using (public.is_participant(trip_id));
create policy "Participants can add tickets"
  on public.tickets for insert with check (public.is_participant(trip_id));
create policy "Participants can delete tickets"
  on public.tickets for delete using (public.is_participant(trip_id));

-- ============================================================
-- Storage bucket for trip photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'trip-photos' and auth.role() = 'authenticated');

create policy "Anyone can view photos"
  on storage.objects for select
  using (bucket_id = 'trip-photos');

create policy "Uploader can delete their photo"
  on storage.objects for delete
  using (bucket_id = 'trip-photos' and auth.uid()::text = (storage.foldername(name))[1]);
