-- DRUCKA launch update — run AFTER schema.sql in Supabase SQL Editor.

-- Razorpay payment columns + error surface
alter table public.orders
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists last_error text;

create index if not exists orders_razorpay_order_idx on public.orders (razorpay_order_id);

-- Editable Qikink product mapping (managed from the Drucka admin panel)
create table if not exists public.product_map (
  drucka_id text primary key,            -- tshirt | oversized | polo | kids-tshirt | hoodie | mug ...
  product_name text not null,
  qikink_product_id text not null,       -- from Qikink dashboard
  sku_pattern text not null,             -- e.g. MRnHs-{color}-{size}
  print_method text not null default 'DTG',  -- DTG | DTF | Embroidery | Sublimation
  colors jsonb not null default '[]',
  sizes jsonb not null default '[]',
  base_cost integer not null default 0,
  shipping_cost integer not null default 0,
  print_areas jsonb not null default '[]',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.product_map enable row level security;
-- No public policies: only the service-role key (Vercel functions) writes.
-- GET /api/admin/product-map proxies reads to the frontend.

-- Seed with the Drucka catalogue — REPLACE qikink_product_id + sku_pattern
-- with the REAL values from https://creator.qikink.com/dashboard → Products.
insert into public.product_map (drucka_id, product_name, qikink_product_id, sku_pattern, print_method, colors, sizes, base_cost, shipping_cost, print_areas, active) values
  ('tshirt',      'Regular T-Shirt',        'REPLACE_ME', 'MRnHs-{color}-{size}', 'DTG',         '["white","black","navy","red","yellow"]', '["XS","S","M","L","XL","XXL","3XL"]',       359, 49, '["Front","Back","Left chest","Sleeve"]', true),
  ('oversized',   'Oversized T-Shirt',      'REPLACE_ME', 'MOsTs-{color}-{size}', 'DTF',         '["white","black","navy"]',                '["S","M","L","XL","XXL"]',                   419, 49, '["Front","Back"]',                        true),
  ('polo',        'Polo T-Shirt',           'REPLACE_ME', 'MP25-{color}-{size}',  'Embroidery',  '["white","black","navy"]',                '["S","M","L","XL","XXL"]',                   449, 49, '["Left chest"]',                          false),
  ('kids-tshirt', 'Kids T-Shirt',           'REPLACE_ME', 'KRnHs-{color}-{size}', 'DTG',         '["white","black"]',                       '["2Y","4Y","6Y","8Y","10Y","12Y","14Y"]',    269, 49, '["Front","Back"]',                        true),
  ('hoodie',      'Hoodie',                 'REPLACE_ME', 'MHood-{color}-{size}', 'DTF',         '["white","black","navy"]',                '["S","M","L","XL","XXL"]',                   649, 69, '["Front","Back"]',                        true),
  ('mug',         'Photo Mug',              'REPLACE_ME', 'Mug11-{color}',        'Sublimation', '["white"]',                               '["325 ml"]',                                 179, 49, '["Wrap"]',                                true)
on conflict (drucka_id) do nothing;
