-- Target: a clean Supabase development project (auth schema/roles already exist).
-- Run as migration administrator, never as an application user.
begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null check (char_length(btrim(description)) between 1 and 2000),
  city text not null check (char_length(btrim(city)) between 1 and 100),
  rent_cents integer not null check (rent_cents between 0 and 100000000),
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  website text not null check (char_length(website) <= 2048 and website ~ '^https://[^[:space:]]+$'),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.property_sponsors (
  property_id uuid not null references public.properties(id) on delete cascade,
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (property_id, sponsor_id)
);
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete restrict,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index properties_owner_idx on public.properties(owner_id);
create index sponsors_owner_idx on public.sponsors(owner_id);
create index property_sponsors_sponsor_idx on public.property_sponsors(sponsor_id);
create index inquiries_property_idx on public.inquiries(property_id);
create index inquiries_sender_idx on public.inquiries(sender_id);

create function public.set_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function public.set_updated_at() from public;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger properties_updated before update on public.properties for each row execute function public.set_updated_at();
create trigger sponsors_updated before update on public.sponsors for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.properties enable row level security;
alter table public.properties force row level security;
alter table public.sponsors enable row level security;
alter table public.sponsors force row level security;
alter table public.property_sponsors enable row level security;
alter table public.property_sponsors force row level security;
alter table public.inquiries enable row level security;
alter table public.inquiries force row level security;

-- Explicit grants override any project default privileges. No client DELETE grants.
revoke all on public.profiles, public.properties, public.sponsors, public.property_sponsors, public.inquiries from public, anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant select on public.properties, public.sponsors, public.property_sponsors to anon, authenticated;
grant select on public.profiles, public.inquiries to authenticated;
grant insert (id, display_name) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant insert (owner_id, title, description, city, rent_cents) on public.properties to authenticated;
grant update (title, description, city, rent_cents) on public.properties to authenticated;
grant insert (owner_id, name, website) on public.sponsors to authenticated;
grant update (name, website) on public.sponsors to authenticated;
grant insert (property_id, sender_id, message) on public.inquiries to authenticated;
grant all on public.profiles, public.properties, public.sponsors, public.property_sponsors, public.inquiries to service_role;

create policy profile_read_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profile_insert_self on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profile_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy property_public on public.properties for select to anon, authenticated using (approved);
create policy property_owner_read on public.properties for select to authenticated using (owner_id = (select auth.uid()));
create policy property_owner_insert on public.properties for insert to authenticated with check (owner_id = (select auth.uid()) and not approved);
create policy property_owner_update on public.properties for update to authenticated using (owner_id = (select auth.uid()) and not approved) with check (owner_id = (select auth.uid()) and not approved);
create policy sponsor_public on public.sponsors for select to anon, authenticated using (active);
create policy sponsor_owner_read on public.sponsors for select to authenticated using (owner_id = (select auth.uid()));
create policy sponsor_owner_insert on public.sponsors for insert to authenticated with check (owner_id = (select auth.uid()) and not active);
create policy sponsor_owner_update on public.sponsors for update to authenticated using (owner_id = (select auth.uid()) and not active) with check (owner_id = (select auth.uid()) and not active);
create policy partnership_public on public.property_sponsors for select to anon, authenticated using (
  exists (select 1 from public.properties p where p.id = property_id and p.approved)
  and exists (select 1 from public.sponsors s where s.id = sponsor_id and s.active)
);
create policy inquiry_read_self on public.inquiries for select to authenticated using (sender_id = (select auth.uid()));
create policy inquiry_insert_self on public.inquiries for insert to authenticated with check (
  sender_id = (select auth.uid())
  and exists (select 1 from public.properties p where p.id = property_id and p.approved)
);
-- No policies permit client partnership writes, inquiry changes, or administrator escalation.
commit;
