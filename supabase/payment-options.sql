-- Payment options shown to students.
-- Run this once after rebuild.sql in Supabase.
create table if not exists public.payment_options (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  payment_method text not null check (payment_method in ('bank_transfer', 'mobile_money', 'cash', 'other')),
  account_name text,
  account_number text,
  phone_number text,
  instructions text,
  icon_url text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_options
  add column if not exists icon_url text;

create index if not exists payment_options_active_order_idx
  on public.payment_options (is_active, display_order);

create unique index if not exists payment_options_name_unique_idx
  on public.payment_options (name);

alter table public.payment_options enable row level security;

drop policy if exists payment_options_read on public.payment_options;
drop policy if exists payment_options_admin on public.payment_options;

create policy payment_options_read
  on public.payment_options for select to authenticated
  using (is_active = true or public.is_admin());

create policy payment_options_admin
  on public.payment_options for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.payment_options
  (name, payment_method, account_name, account_number, phone_number, instructions, icon_url, display_order)
values
  ('CBE', 'bank_transfer', 'PIXELNOAH', '1000674781311', null, 'Use the student name as the payment reference.', '/CBE.svg', 1),
  ('Telebirr', 'mobile_money', 'PIXELNOAH', null, '0911355226', 'Include the student name in the payment note.', '/TELE.svg', 2),
  ('Awash Bank', 'bank_transfer', 'PIXELNOAH', '418735347625342354', null, 'Use the student name as the payment reference.', '/AWASH.svg', 3)
on conflict (name) do update set
  payment_method = excluded.payment_method,
  account_name = excluded.account_name,
  account_number = excluded.account_number,
  phone_number = excluded.phone_number,
  instructions = excluded.instructions,
  icon_url = excluded.icon_url,
  display_order = excluded.display_order;
