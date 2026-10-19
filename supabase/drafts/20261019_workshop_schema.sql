-- DRAFT ONLY: not applied to any Supabase project.
--
-- This schema is additive. It does not modify or depend on existing Crack SQL
-- tables, policies, functions, payment flows, or user records.
--
-- Before promotion, create a CLI-generated migration with
--   supabase migration new workshop_schema
-- then copy this reviewed SQL into that generated migration file.

create table public.workshop_events (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  description text,
  timezone text not null default 'Asia/Kolkata',
  starts_at timestamptz,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  capacity integer check (capacity is null or capacity > 0),
  price_paise integer not null check (price_paise > 0),
  currency char(3) not null default 'INR' check (currency = upper(currency)),
  status text not null default 'draft'
    check (status in ('draft', 'open', 'closed', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check (registration_closes_at is null or registration_opens_at is null or registration_closes_at >= registration_opens_at)
);

create table public.workshop_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id bigint not null references public.workshop_events(id) on delete restrict,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  email text not null check (email = lower(email)),
  phone_e164 text not null check (phone_e164 ~ '^\\+[1-9][0-9]{7,14}$'),
  sql_level text not null check (sql_level in ('new', 'beginner', 'working')),
  learning_goal text,
  status text not null default 'payment_pending'
    check (status in ('payment_pending', 'paid', 'cancelled', 'refunded')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'paid' or paid_at is not null),
  check (paid_at is null or status in ('paid', 'refunded'))
);

create table public.workshop_orders (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.workshop_registrations(id) on delete restrict,
  provider text not null default 'razorpay' check (provider = 'razorpay'),
  provider_order_id text not null unique,
  receipt text not null unique,
  amount_paise integer not null check (amount_paise > 0),
  currency char(3) not null default 'INR' check (currency = upper(currency)),
  status text not null default 'created'
    check (status in ('created', 'authorized', 'paid', 'failed', 'expired', 'refunded')),
  provider_payment_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'paid' or paid_at is not null),
  check (paid_at is null or status in ('paid', 'refunded'))
);

create table public.workshop_payment_events (
  id bigint generated always as identity primary key,
  provider text not null default 'razorpay' check (provider = 'razorpay'),
  provider_event_id text not null unique,
  event_type text not null,
  order_id uuid references public.workshop_orders(id) on delete set null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  payload jsonb not null check (jsonb_typeof(payload) = 'object')
);

create index workshop_registrations_event_created_idx
  on public.workshop_registrations (event_id, created_at desc);
create unique index workshop_registrations_event_email_unique
  on public.workshop_registrations (event_id, lower(email));
create index workshop_orders_registration_created_idx
  on public.workshop_orders (registration_id, created_at desc);
create index workshop_orders_open_status_idx
  on public.workshop_orders (status, created_at desc)
  where status in ('created', 'authorized');
create index workshop_payment_events_order_received_idx
  on public.workshop_payment_events (order_id, received_at desc);

alter table public.workshop_events enable row level security;
alter table public.workshop_registrations enable row level security;
alter table public.workshop_orders enable row level security;
alter table public.workshop_payment_events enable row level security;

alter table public.workshop_events force row level security;
alter table public.workshop_registrations force row level security;
alter table public.workshop_orders force row level security;
alter table public.workshop_payment_events force row level security;

-- No browser-facing RLS policies are intentionally created. The Data API is
-- denied, and dedicated Edge Functions access these tables using server-only
-- credentials after input and signature validation.
revoke all on table public.workshop_events from anon, authenticated;
revoke all on table public.workshop_registrations from anon, authenticated;
revoke all on table public.workshop_orders from anon, authenticated;
revoke all on table public.workshop_payment_events from anon, authenticated;
revoke all on sequence public.workshop_events_id_seq from anon, authenticated;
revoke all on sequence public.workshop_payment_events_id_seq from anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.workshop_events to service_role;
grant select, insert, update, delete on table public.workshop_registrations to service_role;
grant select, insert, update, delete on table public.workshop_orders to service_role;
grant select, insert, update, delete on table public.workshop_payment_events to service_role;
grant usage, select on sequence public.workshop_events_id_seq to service_role;
grant usage, select on sequence public.workshop_payment_events_id_seq to service_role;
