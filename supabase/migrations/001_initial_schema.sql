-- ============================================================
-- VoyageDoc — Initial Schema
-- À Bientôt Tour & Travels Ltd
-- Migration: 001_initial_schema.sql
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ─── TRAVELLERS ──────────────────────────────────────────────────────────────
create table public.travellers (
  id            uuid primary key default uuid_generate_v4(),
  first_name    text not null,
  last_name     text not null,
  email         text,
  phone_code    text,
  phone_number  text,
  country       text,
  passport      text,
  dob           date,
  passport_img  text,
  notes         text,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── INVOICES ────────────────────────────────────────────────────────────────
create table public.invoices (
  id              uuid primary key default uuid_generate_v4(),
  invoice_number  text unique not null,
  traveller_id    uuid references public.travellers(id) on delete set null,
  agent_id        uuid references auth.users(id) on delete set null,
  status          text not null default 'draft'
                  check (status in ('draft','sent','paid','cancelled')),
  issue_date      date not null default current_date,
  due_date        date,
  currency        text not null default 'USD',
  subtotal        numeric(12,2) not null default 0,
  discount        numeric(12,2) not null default 0,
  tax_rate        numeric(5,2)  not null default 0,
  total           numeric(12,2) not null default 0,
  notes           text,
  terms           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table public.invoice_items (
  id              uuid primary key default uuid_generate_v4(),
  invoice_id      uuid not null references public.invoices(id) on delete cascade,
  type            text,
  description     text not null,
  traveller_name  text,
  travel_date     date,
  quantity        integer       not null default 1,
  unit_price      numeric(12,2) not null default 0,
  currency        text          not null default 'USD',
  sort_order      integer default 0
);

-- ─── RECEIPTS ────────────────────────────────────────────────────────────────
create table public.receipts (
  id                uuid primary key default uuid_generate_v4(),
  receipt_number    text unique not null,
  invoice_id        uuid references public.invoices(id) on delete set null,
  traveller_id      uuid references public.travellers(id) on delete set null,
  agent_id          uuid references auth.users(id) on delete set null,
  amount_paid       numeric(12,2) not null,
  currency          text not null default 'USD',
  payment_method    text check (payment_method in ('bank_transfer','card','mobile_money','cash')),
  payment_date      date not null default current_date,
  reference_number  text,
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── PROFORMA INVOICES ───────────────────────────────────────────────────────
create table public.proformas (
  id              uuid primary key default uuid_generate_v4(),
  number          text unique not null,
  traveller_id    uuid references public.travellers(id) on delete set null,
  agent_id        uuid references auth.users(id) on delete set null,
  status          text not null default 'draft'
                  check (status in ('draft','sent','approved','rejected','expired')),
  issue_date      date not null default current_date,
  expiry_date     date,
  currency        text not null default 'USD',
  subtotal        numeric(12,2) not null default 0,
  discount        numeric(12,2) not null default 0,
  tax_rate        numeric(5,2)  not null default 0,
  total           numeric(12,2) not null default 0,
  notes           text,
  terms           text,
  converted_to    uuid references public.invoices(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table public.proforma_items (
  id              uuid primary key default uuid_generate_v4(),
  proforma_id     uuid not null references public.proformas(id) on delete cascade,
  type            text,
  description     text not null,
  traveller_name  text,
  travel_date     date,
  quantity        integer       not null default 1,
  unit_price      numeric(12,2) not null default 0,
  currency        text          not null default 'USD',
  sort_order      integer default 0
);

-- ─── QUOTATIONS ──────────────────────────────────────────────────────────────
create table public.quotations (
  id              uuid primary key default uuid_generate_v4(),
  number          text unique not null,
  traveller_id    uuid references public.travellers(id) on delete set null,
  agent_id        uuid references auth.users(id) on delete set null,
  status          text not null default 'draft'
                  check (status in ('draft','sent','approved','rejected','expired')),
  issue_date      date not null default current_date,
  expiry_date     date,
  currency        text not null default 'USD',
  subtotal        numeric(12,2) not null default 0,
  discount        numeric(12,2) not null default 0,
  tax_rate        numeric(5,2)  not null default 0,
  total           numeric(12,2) not null default 0,
  notes           text,
  terms           text,
  converted_to    uuid references public.invoices(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table public.quotation_items (
  id              uuid primary key default uuid_generate_v4(),
  quotation_id    uuid not null references public.quotations(id) on delete cascade,
  type            text,
  description     text not null,
  traveller_name  text,
  travel_date     date,
  quantity        integer       not null default 1,
  unit_price      numeric(12,2) not null default 0,
  currency        text          not null default 'USD',
  sort_order      integer default 0
);

-- ─── DOCUMENT NUMBERING ──────────────────────────────────────────────────────
create table public.sequences (
  key   text primary key,
  year  integer not null,
  last  integer not null default 0
);

insert into public.sequences (key, year, last) values
  ('invoice',   extract(year from now())::integer, 0),
  ('receipt',   extract(year from now())::integer, 0),
  ('proforma',  extract(year from now())::integer, 0),
  ('quotation', extract(year from now())::integer, 0);

create or replace function next_doc_number(doc_key text)
returns text language plpgsql security definer as $$
declare
  yr     integer := extract(year from now())::integer;
  seq    integer;
  prefix text;
begin
  update public.sequences
  set
    last = case when year < yr then 1 else last + 1 end,
    year = yr
  where key = doc_key
  returning last into seq;

  if not found then
    raise exception 'Unknown sequence key: %', doc_key;
  end if;

  prefix := case doc_key
    when 'invoice'   then 'ABT'
    when 'receipt'   then 'REC'
    when 'proforma'  then 'PFI'
    when 'quotation' then 'QT'
    else upper(doc_key)
  end;

  return prefix || '-' || yr || '-' || lpad(seq::text, 4, '0');
end;
$$;

-- ─── UPDATED_AT TRIGGERS ─────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_travellers_updated  before update on public.travellers  for each row execute function set_updated_at();
create trigger trg_invoices_updated    before update on public.invoices    for each row execute function set_updated_at();
create trigger trg_receipts_updated    before update on public.receipts    for each row execute function set_updated_at();
create trigger trg_proformas_updated   before update on public.proformas   for each row execute function set_updated_at();
create trigger trg_quotations_updated  before update on public.quotations  for each row execute function set_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table public.travellers       enable row level security;
alter table public.invoices         enable row level security;
alter table public.invoice_items    enable row level security;
alter table public.receipts         enable row level security;
alter table public.proformas        enable row level security;
alter table public.proforma_items   enable row level security;
alter table public.quotations       enable row level security;
alter table public.quotation_items  enable row level security;
alter table public.sequences        enable row level security;

create or replace function auth_role()
returns text language sql stable as $$
  select coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), 'viewer');
$$;

-- Travellers
create policy "travellers_select" on public.travellers for select using (auth.role() = 'authenticated');
create policy "travellers_insert" on public.travellers for insert with check (auth_role() in ('admin','agent'));
create policy "travellers_update" on public.travellers for update using (auth_role() in ('admin','agent'));
create policy "travellers_delete" on public.travellers for delete using (auth_role() = 'admin');

-- Invoices
create policy "invoices_select"      on public.invoices      for select using (auth.role() = 'authenticated');
create policy "invoices_insert"      on public.invoices      for insert with check (auth_role() in ('admin','agent'));
create policy "invoices_update"      on public.invoices      for update using (auth_role() in ('admin','agent'));
create policy "invoices_delete"      on public.invoices      for delete using (auth_role() = 'admin');
create policy "invoice_items_select" on public.invoice_items for select using (auth.role() = 'authenticated');
create policy "invoice_items_write"  on public.invoice_items for all    using (auth_role() in ('admin','agent'));

-- Receipts
create policy "receipts_select" on public.receipts for select using (auth.role() = 'authenticated');
create policy "receipts_insert" on public.receipts for insert with check (auth_role() in ('admin','agent'));
create policy "receipts_update" on public.receipts for update using (auth_role() in ('admin','agent'));
create policy "receipts_delete" on public.receipts for delete using (auth_role() = 'admin');

-- Proformas
create policy "proformas_select"      on public.proformas      for select using (auth.role() = 'authenticated');
create policy "proformas_insert"      on public.proformas      for insert with check (auth_role() in ('admin','agent'));
create policy "proformas_update"      on public.proformas      for update using (auth_role() in ('admin','agent'));
create policy "proformas_delete"      on public.proformas      for delete using (auth_role() = 'admin');
create policy "proforma_items_select" on public.proforma_items for select using (auth.role() = 'authenticated');
create policy "proforma_items_write"  on public.proforma_items for all    using (auth_role() in ('admin','agent'));

-- Quotations
create policy "quotations_select"      on public.quotations      for select using (auth.role() = 'authenticated');
create policy "quotations_insert"      on public.quotations      for insert with check (auth_role() in ('admin','agent'));
create policy "quotations_update"      on public.quotations      for update using (auth_role() in ('admin','agent'));
create policy "quotations_delete"      on public.quotations      for delete using (auth_role() = 'admin');
create policy "quotation_items_select" on public.quotation_items for select using (auth.role() = 'authenticated');
create policy "quotation_items_write"  on public.quotation_items for all    using (auth_role() in ('admin','agent'));

-- Sequences (admin only)
create policy "sequences_admin" on public.sequences for all using (auth_role() = 'admin');

-- ─── STORAGE ─────────────────────────────────────────────────────────────────
-- After running this SQL, go to Supabase Dashboard → Storage:
-- 1. Create bucket: "passports" → set to Private
-- 2. Add policies on the bucket:
--    SELECT: (auth.role() = 'authenticated')
--    INSERT: (auth.role() = 'authenticated') AND (auth_role() IN ('admin','agent'))
--    DELETE: auth_role() = 'admin'
