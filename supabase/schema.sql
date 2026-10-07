-- NeoZap Phase 1 schema: multi-tenant business data with Row Level Security.
-- Apply this file in the Supabase SQL editor or via the CLI (`supabase db query -f supabase/schema.sql`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'appointment_status'
      and n.nspname = 'public'
  ) then
    create type public.appointment_status as enum (
      'scheduled',
      'confirmed',
      'completed',
      'cancelled',
      'no_show'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  business_name text not null,
  tax_id text,
  currency text not null default 'EUR',
  created_at timestamptz not null default timezone('utc', now()),
  constraint profiles_full_name_not_blank check (char_length(trim(full_name)) > 0),
  constraint profiles_business_name_not_blank check (char_length(trim(business_name)) > 0),
  constraint profiles_currency_format check (currency ~ '^[A-Z]{3}$')
);

comment on table public.profiles is 'Business owners. The profile id is the tenant (business) id.';
comment on column public.profiles.id is 'Matches auth.users.id. Used as business_id on tenant-owned tables.';
comment on column public.profiles.tax_id is 'Optional fiscal identifier (for example NIF / VAT number).';
comment on column public.profiles.currency is 'ISO 4217 currency code used for prices and invoices.';

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  avg_frequency_days integer,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint clients_full_name_not_blank check (char_length(trim(full_name)) > 0),
  constraint clients_avg_frequency_days_positive check (
    avg_frequency_days is null or avg_frequency_days > 0
  ),
  constraint clients_email_format check (
    email is null or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  )
);

comment on table public.clients is 'Customers belonging to a single business tenant.';
comment on column public.clients.avg_frequency_days is 'Rolling average days between visits for this client.';

create unique index if not exists clients_business_id_email_unique
  on public.clients (business_id, lower(email))
  where email is not null;

create index if not exists clients_business_id_full_name_idx
  on public.clients (business_id, full_name);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  duration_minutes integer not null,
  price numeric(12, 2) not null,
  tax_rate numeric(5, 4) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint services_name_not_blank check (char_length(trim(name)) > 0),
  constraint services_duration_minutes_positive check (duration_minutes > 0),
  constraint services_price_non_negative check (price >= 0),
  constraint services_tax_rate_range check (tax_rate >= 0 and tax_rate <= 1)
);

comment on table public.services is 'Bookable offerings owned by a business tenant.';
comment on column public.services.tax_rate is 'VAT / sales tax as a decimal fraction (0.23 = 23%).';

create unique index if not exists services_business_id_name_unique
  on public.services (business_id, lower(name));

create index if not exists services_business_id_idx
  on public.services (business_id);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  total_price numeric(12, 2) not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint appointments_time_range check (end_time > start_time),
  constraint appointments_total_price_non_negative check (total_price >= 0)
);

comment on table public.appointments is 'Scheduled visits linking a client and a service within one tenant.';

create index if not exists appointments_business_id_start_time_idx
  on public.appointments (business_id, start_time);

create index if not exists appointments_client_id_idx
  on public.appointments (client_id);

create index if not exists appointments_service_id_idx
  on public.appointments (service_id);

-- ---------------------------------------------------------------------------
-- Tenant integrity: appointments must reference clients/services of the same business
-- ---------------------------------------------------------------------------

create or replace function public.enforce_appointment_same_tenant()
returns trigger
language plpgsql
as $$
declare
  client_business uuid;
  service_business uuid;
begin
  select business_id into client_business
  from public.clients
  where id = new.client_id;

  select business_id into service_business
  from public.services
  where id = new.service_id;

  if client_business is null then
    raise exception 'Client % does not exist', new.client_id;
  end if;

  if service_business is null then
    raise exception 'Service % does not exist', new.service_id;
  end if;

  if client_business <> new.business_id or service_business <> new.business_id then
    raise exception 'Appointments must use a client and service that belong to the same business';
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_same_tenant on public.appointments;

create trigger appointments_same_tenant
before insert or update of business_id, client_id, service_id
on public.appointments
for each row
execute procedure public.enforce_appointment_same_tenant();

-- ---------------------------------------------------------------------------
-- Auth hook: create a profile when a business owner signs up
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, business_name, tax_id, currency)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Owner'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'business_name'), ''), 'My Business'),
    nullif(trim(new.raw_user_meta_data ->> 'tax_id'), ''),
    coalesce(nullif(upper(trim(new.raw_user_meta_data ->> 'currency')), ''), 'EUR')
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    business_name = excluded.business_name,
    tax_id = excluded.tax_id,
    currency = excluded.currency;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;

alter table public.profiles force row level security;
alter table public.clients force row level security;
alter table public.services force row level security;
alter table public.appointments force row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.clients from anon, authenticated;
revoke all on public.services from anon, authenticated;
revoke all on public.appointments from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;

-- Profiles: each owner can only access their own row.
drop policy if exists "Owners can read own profile" on public.profiles;
create policy "Owners can read own profile"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists "Owners can update own profile" on public.profiles;
create policy "Owners can update own profile"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Clients
drop policy if exists "Owners can read own clients" on public.clients;
create policy "Owners can read own clients"
on public.clients
for select
to authenticated
using (business_id = (select auth.uid()));

drop policy if exists "Owners can insert own clients" on public.clients;
create policy "Owners can insert own clients"
on public.clients
for insert
to authenticated
with check (business_id = (select auth.uid()));

drop policy if exists "Owners can update own clients" on public.clients;
create policy "Owners can update own clients"
on public.clients
for update
to authenticated
using (business_id = (select auth.uid()))
with check (business_id = (select auth.uid()));

drop policy if exists "Owners can delete own clients" on public.clients;
create policy "Owners can delete own clients"
on public.clients
for delete
to authenticated
using (business_id = (select auth.uid()));

-- Services
drop policy if exists "Owners can read own services" on public.services;
create policy "Owners can read own services"
on public.services
for select
to authenticated
using (business_id = (select auth.uid()));

drop policy if exists "Owners can insert own services" on public.services;
create policy "Owners can insert own services"
on public.services
for insert
to authenticated
with check (business_id = (select auth.uid()));

drop policy if exists "Owners can update own services" on public.services;
create policy "Owners can update own services"
on public.services
for update
to authenticated
using (business_id = (select auth.uid()))
with check (business_id = (select auth.uid()));

drop policy if exists "Owners can delete own services" on public.services;
create policy "Owners can delete own services"
on public.services
for delete
to authenticated
using (business_id = (select auth.uid()));

-- Appointments
drop policy if exists "Owners can read own appointments" on public.appointments;
create policy "Owners can read own appointments"
on public.appointments
for select
to authenticated
using (business_id = (select auth.uid()));

drop policy if exists "Owners can insert own appointments" on public.appointments;
create policy "Owners can insert own appointments"
on public.appointments
for insert
to authenticated
with check (business_id = (select auth.uid()));

drop policy if exists "Owners can update own appointments" on public.appointments;
create policy "Owners can update own appointments"
on public.appointments
for update
to authenticated
using (business_id = (select auth.uid()))
with check (business_id = (select auth.uid()));

drop policy if exists "Owners can delete own appointments" on public.appointments;
create policy "Owners can delete own appointments"
on public.appointments
for delete
to authenticated
using (business_id = (select auth.uid()));
