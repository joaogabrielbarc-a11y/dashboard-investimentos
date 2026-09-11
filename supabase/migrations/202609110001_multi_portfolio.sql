-- Pondera V3: secure multi-user, multi-portfolio data model.
-- Apply with the Supabase CLI or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.app_role as enum ('user', 'admin');
create type public.transaction_kind as enum ('buy', 'sell', 'dividend', 'adjustment');
create type public.dividend_status as enum ('declared', 'received', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  display_name text,
  base_currency char(3) not null default 'BRL' check (base_currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  role public.app_role not null default 'user',
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  description text,
  include_in_consolidated boolean not null default true,
  base_currency char(3) not null default 'BRL' check (base_currency ~ '^[A-Z]{3}$'),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);

create table public.asset_classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  portfolio_id uuid not null,
  client_id text not null,
  name text not null check (length(trim(name)) between 1 and 80),
  target_pct numeric(7,4) not null default 0 check (target_pct between 0 and 100),
  tolerance_pct numeric(7,4) not null default 15 check (tolerance_pct between 0 and 100),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, portfolio_id, user_id),
  unique (portfolio_id, client_id),
  unique (portfolio_id, name),
  foreign key (portfolio_id, user_id) references public.portfolios(id, user_id) on delete cascade
);

create table public.segments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  portfolio_id uuid not null,
  asset_class_id uuid,
  class_client_id text not null,
  client_id text not null,
  name text not null check (length(trim(name)) between 1 and 80),
  target_pct numeric(7,4) not null default 0 check (target_pct between 0 and 100),
  tolerance_pct numeric(7,4),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, portfolio_id, user_id),
  unique (portfolio_id, class_client_id, client_id),
  foreign key (portfolio_id, user_id) references public.portfolios(id, user_id) on delete cascade,
  foreign key (asset_class_id, portfolio_id, user_id) references public.asset_classes(id, portfolio_id, user_id) on delete cascade
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  portfolio_id uuid not null,
  ticker citext not null,
  name text,
  class_name text not null,
  segment_name text,
  currency char(3) not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, portfolio_id, user_id),
  unique (portfolio_id, ticker),
  foreign key (portfolio_id, user_id) references public.portfolios(id, user_id) on delete cascade
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  portfolio_id uuid not null,
  asset_id uuid,
  client_id text not null,
  kind public.transaction_kind not null,
  ticker citext not null,
  asset_name text,
  class_name text not null,
  segment_name text,
  trade_date date not null,
  quantity numeric(24,10) not null default 0 check (quantity >= 0),
  unit_price numeric(24,10) not null default 0 check (unit_price >= 0),
  currency char(3) not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  native_total numeric(24,10) check (native_total is null or native_total >= 0),
  fx_rate numeric(24,10) check (fx_rate is null or fx_rate > 0),
  base_total numeric(24,10) check (base_total is null or base_total >= 0),
  fees_native numeric(24,10) not null default 0 check (fees_native >= 0),
  source text not null default 'manual',
  external_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (portfolio_id, client_id),
  foreign key (portfolio_id, user_id) references public.portfolios(id, user_id) on delete cascade,
  foreign key (asset_id, portfolio_id, user_id) references public.assets(id, portfolio_id, user_id) on delete restrict,
  check (
    (kind in ('buy', 'sell') and quantity > 0 and unit_price > 0)
    or (kind in ('dividend', 'adjustment') and coalesce(base_total, native_total, unit_price, 0) >= 0)
  )
);

create table public.dividend_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  portfolio_id uuid not null,
  asset_id uuid,
  ticker citext not null,
  type text not null default 'Provento',
  ex_date date,
  payment_date date,
  amount_per_unit numeric(24,10) not null default 0 check (amount_per_unit >= 0),
  currency char(3) not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  status public.dividend_status not null default 'declared',
  received_transaction_id uuid references public.transactions(id) on delete set null,
  source text not null default 'manual',
  external_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (portfolio_id, user_id) references public.portfolios(id, user_id) on delete cascade,
  foreign key (asset_id, portfolio_id, user_id) references public.assets(id, portfolio_id, user_id) on delete restrict,
  unique (portfolio_id, ticker, type, ex_date, payment_date, amount_per_unit, currency)
);

create index portfolios_user_active_idx on public.portfolios(user_id, archived_at, include_in_consolidated);
create index transactions_portfolio_date_idx on public.transactions(portfolio_id, trade_date, created_at);
create index transactions_user_ticker_idx on public.transactions(user_id, ticker, trade_date);
create index dividend_events_portfolio_payment_idx on public.dividend_events(portfolio_id, payment_date, status);
create index assets_portfolio_class_idx on public.assets(portfolio_id, class_name, segment_name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger portfolios_updated_at before update on public.portfolios for each row execute function public.set_updated_at();
create trigger asset_classes_updated_at before update on public.asset_classes for each row execute function public.set_updated_at();
create trigger segments_updated_at before update on public.segments for each row execute function public.set_updated_at();
create trigger assets_updated_at before update on public.assets for each row execute function public.set_updated_at();
create trigger transactions_updated_at before update on public.transactions for each row execute function public.set_updated_at();
create trigger dividend_events_updated_at before update on public.dividend_events for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do update set email = excluded.email;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_new_user();

create or replace function public.has_role(requested_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = requested_role
  );
$$;

revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.portfolios enable row level security;
alter table public.asset_classes enable row level security;
alter table public.segments enable row level security;
alter table public.assets enable row level security;
alter table public.transactions enable row level security;
alter table public.dividend_events enable row level security;

create policy profiles_self_select on public.profiles for select using (id = (select auth.uid()));
create policy profiles_self_update on public.profiles for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy roles_self_select on public.user_roles for select using (user_id = (select auth.uid()));

create policy portfolios_owner_all on public.portfolios
for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy asset_classes_owner_all on public.asset_classes
for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy segments_owner_all on public.segments
for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy assets_owner_all on public.assets
for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy transactions_owner_all on public.transactions
for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy dividend_events_owner_all on public.dividend_events
for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Atomic compatibility endpoint for the current dashboard ledger. It replaces one
-- portfolio's transaction list only after verifying ownership server-side.
create or replace function public.replace_portfolio_transactions(
  p_portfolio_id uuid,
  p_transactions jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or not exists (
    select 1 from public.portfolios
    where id = p_portfolio_id and user_id = current_user_id and archived_at is null
  ) then
    raise exception 'portfolio_not_found_or_forbidden';
  end if;

  if jsonb_typeof(coalesce(p_transactions, '[]'::jsonb)) <> 'array' then
    raise exception 'transactions_must_be_an_array';
  end if;

  insert into public.transactions (
    user_id, portfolio_id, client_id, kind, ticker, asset_name, class_name,
    segment_name, trade_date, quantity, unit_price, currency, native_total,
    fx_rate, base_total, fees_native, source, external_id, metadata
  )
  select
    current_user_id,
    p_portfolio_id,
    x.client_id,
    x.kind::public.transaction_kind,
    upper(x.ticker),
    nullif(x.asset_name, ''),
    x.class_name,
    nullif(x.segment_name, ''),
    x.trade_date,
    coalesce(x.quantity, 0),
    coalesce(x.unit_price, 0),
    upper(coalesce(x.currency, 'BRL')),
    x.native_total,
    x.fx_rate,
    x.base_total,
    coalesce(x.fees_native, 0),
    coalesce(nullif(x.source, ''), 'dashboard'),
    nullif(x.external_id, ''),
    coalesce(x.metadata, '{}'::jsonb)
  from jsonb_to_recordset(coalesce(p_transactions, '[]'::jsonb)) as x(
    client_id text,
    kind text,
    ticker text,
    asset_name text,
    class_name text,
    segment_name text,
    trade_date date,
    quantity numeric,
    unit_price numeric,
    currency text,
    native_total numeric,
    fx_rate numeric,
    base_total numeric,
    fees_native numeric,
    source text,
    external_id text,
    metadata jsonb
  )
  on conflict (portfolio_id, client_id) do update set
    kind = excluded.kind,
    ticker = excluded.ticker,
    asset_name = excluded.asset_name,
    class_name = excluded.class_name,
    segment_name = excluded.segment_name,
    trade_date = excluded.trade_date,
    quantity = excluded.quantity,
    unit_price = excluded.unit_price,
    currency = excluded.currency,
    native_total = excluded.native_total,
    fx_rate = excluded.fx_rate,
    base_total = excluded.base_total,
    fees_native = excluded.fees_native,
    source = excluded.source,
    external_id = excluded.external_id,
    metadata = excluded.metadata,
    updated_at = now();

  delete from public.transactions t
  where t.portfolio_id = p_portfolio_id
    and t.user_id = current_user_id
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(p_transactions, '[]'::jsonb)) item
      where item ->> 'client_id' = t.client_id
    );
end;
$$;

revoke all on function public.replace_portfolio_transactions(uuid, jsonb) from public;
grant execute on function public.replace_portfolio_transactions(uuid, jsonb) to authenticated;

create or replace function public.replace_portfolio_allocations(
  p_portfolio_id uuid,
  p_classes jsonb,
  p_segments jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or not exists (
    select 1 from public.portfolios
    where id = p_portfolio_id and user_id = current_user_id and archived_at is null
  ) then
    raise exception 'portfolio_not_found_or_forbidden';
  end if;

  insert into public.asset_classes (user_id, portfolio_id, client_id, name, target_pct, tolerance_pct, display_order)
  select current_user_id, p_portfolio_id, x.client_id, x.name,
    coalesce(x.target_pct, 0), coalesce(x.tolerance_pct, 15), coalesce(x.display_order, 0)
  from jsonb_to_recordset(coalesce(p_classes, '[]'::jsonb)) as x(
    client_id text, name text, target_pct numeric, tolerance_pct numeric, display_order integer
  )
  on conflict (portfolio_id, client_id) do update set
    name = excluded.name,
    target_pct = excluded.target_pct,
    tolerance_pct = excluded.tolerance_pct,
    display_order = excluded.display_order,
    updated_at = now();

  delete from public.asset_classes c
  where c.portfolio_id = p_portfolio_id and c.user_id = current_user_id
    and not exists (
      select 1 from jsonb_array_elements(coalesce(p_classes, '[]'::jsonb)) item
      where item ->> 'client_id' = c.client_id
    );

  insert into public.segments (
    user_id, portfolio_id, asset_class_id, class_client_id, client_id,
    name, target_pct, tolerance_pct, display_order
  )
  select current_user_id, p_portfolio_id, c.id, x.class_client_id, x.client_id,
    x.name, coalesce(x.target_pct, 0), x.tolerance_pct, coalesce(x.display_order, 0)
  from jsonb_to_recordset(coalesce(p_segments, '[]'::jsonb)) as x(
    class_client_id text, client_id text, name text, target_pct numeric,
    tolerance_pct numeric, display_order integer
  )
  join public.asset_classes c
    on c.portfolio_id = p_portfolio_id
   and c.user_id = current_user_id
   and c.client_id = x.class_client_id
  on conflict (portfolio_id, class_client_id, client_id) do update set
    asset_class_id = excluded.asset_class_id,
    name = excluded.name,
    target_pct = excluded.target_pct,
    tolerance_pct = excluded.tolerance_pct,
    display_order = excluded.display_order,
    updated_at = now();

  delete from public.segments s
  where s.portfolio_id = p_portfolio_id and s.user_id = current_user_id
    and not exists (
      select 1 from jsonb_array_elements(coalesce(p_segments, '[]'::jsonb)) item
      where item ->> 'class_client_id' = s.class_client_id
        and item ->> 'client_id' = s.client_id
    );
end;
$$;

revoke all on function public.replace_portfolio_allocations(uuid, jsonb, jsonb) from public;
grant execute on function public.replace_portfolio_allocations(uuid, jsonb, jsonb) to authenticated;

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, base_currency) on public.profiles to authenticated;
grant select, insert, update, delete on public.portfolios, public.asset_classes,
  public.segments, public.assets, public.transactions, public.dividend_events to authenticated;
grant select on public.user_roles to authenticated;
