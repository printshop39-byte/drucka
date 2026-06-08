# DRUCKA — Supabase Schema

Order storage for DRUCKA. Orders are written when a customer clicks
**Place Order via WhatsApp**; the admin dashboard and Track Order page read them.

The app is **null-safe**: if Supabase env vars are missing, orders simply aren't
saved (WhatsApp still opens), admin shows sample data, and tracking stays manual.

---

## 1. Create the project

1. Go to https://supabase.com → New project. Pick a name, region, and a database password.
2. Once created, open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Put both in `.env.local` (and in Vercel env vars for production).

---

## 2. Create the `orders` table

Open **SQL Editor** in Supabase and run:

```sql
-- Orders table
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_ref       text unique not null,
  customer_name   text not null,
  customer_phone  text not null,
  customer_email  text,
  customer_address text not null,
  customer_city   text not null,
  customer_pincode text not null,
  items           jsonb not null,
  subtotal        numeric not null,
  shipping        numeric not null,
  discount        numeric not null,
  total           numeric not null,
  payment_method  text default 'UPI',
  status          text default 'New',
  whatsapp_sent   boolean default false,
  created_at      timestamptz default now()
);

-- Helpful index for looking up by reference (track-order page)
create index if not exists orders_order_ref_idx on public.orders (order_ref);
```

---

## 3. Row Level Security (RLS) policies

The anon key is public, so lock the table down with RLS. For this front-end-only
phase we allow:
- **insert** from anyone (so customers can place orders), and
- **select** from anyone (so admin/track-order can read).

```sql
alter table public.orders enable row level security;

-- Anyone can create an order (place order flow)
create policy "anon insert orders"
  on public.orders for insert
  to anon
  with check (true);

-- Anyone can read orders (admin dashboard + track-order lookup)
create policy "anon select orders"
  on public.orders for select
  to anon
  using (true);

-- Allow updating order status from the admin dashboard (front-end phase).
-- REQUIRED for the admin status dropdown to work.
create policy "anon update orders"
  on public.orders for update
  to anon
  using (true)
  with check (true);
```

> ⚠️ Security note: with public select, anyone with the anon key could read all
> orders. That's acceptable for an early MVP, but **before real production** you
> should move reads behind real auth (Supabase Auth) and restrict `select` to
> authenticated admins. Updating `status` should also be admin-only.

Later, to let only signed-in admins update status:

```sql
create policy "admin update status"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);
```

---

## 4. `items` jsonb shape

Each element of the `items` array looks like:

```json
{
  "id": "tshirt",
  "name": "Premium T-Shirt",
  "size": "M",
  "qty": 1,
  "price": 699,
  "meta": "Custom image (rotated 85°)",
  "designImageUrl": "https://res.cloudinary.com/dpbi7cyi8/image/upload/.../drucka-designs/abc.png",
  "rotation": 85,
  "designSize": 120,
  "position": "c",
  "text": "Happy Birthday"
}
```

---

## 5. Status values

`status` is a free-text column; the app uses these values:

`New` · `In Design Review` · `Printing` · `Ready to Ship` · `Delivered`

(New orders default to `New`.)
