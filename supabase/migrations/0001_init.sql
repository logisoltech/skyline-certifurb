-- Certifurb: products, customers, CMS staff, orders, wishlist, addresses.
-- Run in the Supabase SQL editor (or via supabase db push).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum (
  'customer',
  'owner',
  'manager',
  'editor',
  'viewer'
);

create type public.user_status as enum ('active', 'pending', 'disabled');

create type public.product_status as enum ('published', 'draft');

create type public.order_status as enum (
  'placed',
  'preparing',
  'dispatched',
  'delivered',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text not null default '',
  role public.user_role not null default 'customer',
  status public.user_status not null default 'active',
  emirate text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create unique index profiles_email_idx on public.profiles (lower(email));
create index profiles_role_status_idx on public.profiles (role, status);

-- ---------------------------------------------------------------------------
-- Settings / activity
-- ---------------------------------------------------------------------------

create table public.settings (
  id int primary key default 1 check (id = 1),
  low_stock_threshold int not null default 3
);

insert into public.settings (id, low_stock_threshold) values (1, 3);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  user_id uuid references public.profiles (id) on delete set null,
  user_name text not null default 'System',
  action text not null,
  detail text not null default ''
);

create index activity_log_at_idx on public.activity_log (at desc);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

create table public.products (
  id text primary key,
  slug text not null,
  title text not null,
  brand text not null,
  processor text not null default '',
  generation int,
  screen numeric,
  touch boolean not null default false,
  two_in_one boolean not null default false,
  condition text not null default 'Good',
  status public.product_status not null default 'draft',
  featured boolean not null default false,
  uses text[] not null default '{}',
  warranty text not null default '6-month warranty',
  images text[] not null default '{}',
  -- denormalized for list/inventory speed
  sku text not null default '',
  ram int,
  ssd int,
  price numeric not null default 0,
  price_max numeric not null default 0,
  stock int not null default 0,
  image text not null default '/dell.png',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index products_slug_idx on public.products (lower(slug));
create index products_status_featured_idx on public.products (status, featured);

create table public.product_variants (
  id text primary key,
  product_id text not null references public.products (id) on delete cascade,
  sku text not null,
  ram int,
  ssd int,
  price numeric not null default 0,
  stock int not null default 0,
  processor text not null default '',
  generation int,
  sort_order int not null default 0
);

create index product_variants_product_id_idx on public.product_variants (product_id);
create unique index product_variants_sku_idx on public.product_variants (lower(sku));

-- ---------------------------------------------------------------------------
-- Customer account data
-- ---------------------------------------------------------------------------

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default 'Home',
  name text not null default '',
  phone text not null default '',
  line1 text not null default '',
  line2 text not null default '',
  city text not null default '',
  emirate text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);

create table public.wishlist_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, slug)
);

create table public.notification_prefs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  order_emails boolean not null default true,
  whatsapp_updates boolean not null default true,
  offers boolean not null default false
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table public.orders (
  id text primary key,
  customer_id uuid references public.profiles (id) on delete set null,
  customer_name text not null default '',
  customer_email text not null default '',
  customer_phone text not null default '',
  placed_at timestamptz not null default now(),
  status public.order_status not null default 'placed',
  payment text not null default 'Cash on Delivery',
  total numeric not null default 0,
  emirate text not null default '',
  sample boolean not null default false
);

create index orders_customer_id_idx on public.orders (customer_id);
create index orders_status_idx on public.orders (status);
create index orders_placed_at_idx on public.orders (placed_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  slug text not null,
  title text not null,
  price numeric not null,
  qty int not null check (qty > 0),
  variant_id text,
  sku text not null default ''
);

create index order_items_order_id_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('owner', 'manager', 'editor', 'viewer')
      and p.status = 'active'
  );
$$;

create or replace function public.has_staff_permission(required text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        (required = 'products:write' and p.role in ('owner', 'manager', 'editor'))
        or (required = 'inventory:write' and p.role in ('owner', 'manager', 'editor'))
        or (required = 'orders:write' and p.role in ('owner', 'manager'))
        or (required = 'users:manage' and p.role = 'owner')
        or required is null
        or required = ''
      )
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text := coalesce(new.raw_user_meta_data->>'role', 'customer');
  meta_name text := coalesce(new.raw_user_meta_data->>'full_name', '');
  meta_phone text := coalesce(new.raw_user_meta_data->>'phone', '');
  meta_status text := coalesce(new.raw_user_meta_data->>'status', 'active');
  staff_count int;
begin
  if meta_role in ('owner', 'manager', 'editor', 'viewer') then
    select count(*) into staff_count
    from public.profiles
    where role in ('owner', 'manager', 'editor', 'viewer');

    if staff_count = 0 then
      meta_role := 'owner';
      meta_status := 'active';
    elsif meta_status is null or meta_status = '' then
      meta_status := 'pending';
      if meta_role = 'owner' and staff_count > 0 then
        meta_role := 'viewer';
      end if;
    end if;
  else
    meta_role := 'customer';
    meta_status := 'active';
  end if;

  insert into public.profiles (id, full_name, email, phone, role, status)
  values (
    new.id,
    meta_name,
    coalesce(new.email, ''),
    meta_phone,
    meta_role::public.user_role,
    meta_status::public.user_status
  );

  if meta_role = 'customer' then
    insert into public.notification_prefs (user_id, offers)
    values (
      new.id,
      coalesce((new.raw_user_meta_data->>'offers')::boolean, false)
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.activity_log enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Profiles
create policy profiles_select_own_or_staff on public.profiles
  for select using (id = auth.uid() or public.is_staff());

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_staff_update on public.profiles
  for update using (public.has_staff_permission('users:manage'));

create policy profiles_staff_delete on public.profiles
  for delete using (public.has_staff_permission('users:manage'));

-- Settings / activity (staff)
create policy settings_staff_all on public.settings
  for all using (public.is_staff())
  with check (public.has_staff_permission('inventory:write') or public.is_staff());

create policy settings_select_staff on public.settings
  for select using (public.is_staff());

create policy activity_select_staff on public.activity_log
  for select using (public.is_staff());

create policy activity_insert_staff on public.activity_log
  for insert with check (public.is_staff());

-- Products: public read published; staff manage
create policy products_public_read on public.products
  for select using (status = 'published' or public.is_staff());

create policy products_staff_insert on public.products
  for insert with check (public.has_staff_permission('products:write'));

create policy products_staff_update on public.products
  for update using (public.has_staff_permission('products:write'));

create policy products_staff_delete on public.products
  for delete using (public.has_staff_permission('products:write'));

create policy variants_public_read on public.product_variants
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_id and (p.status = 'published' or public.is_staff())
    )
  );

create policy variants_staff_insert on public.product_variants
  for insert with check (public.has_staff_permission('products:write'));

create policy variants_staff_update on public.product_variants
  for update using (
    public.has_staff_permission('products:write')
    or public.has_staff_permission('inventory:write')
  );

create policy variants_staff_delete on public.product_variants
  for delete using (public.has_staff_permission('products:write'));

-- Addresses / wishlist / prefs
create policy addresses_own on public.addresses
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy addresses_staff_read on public.addresses
  for select using (public.is_staff());

create policy wishlist_own on public.wishlist_items
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy prefs_own on public.notification_prefs
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Orders
create policy orders_own_read on public.orders
  for select using (customer_id = auth.uid() or public.is_staff());

create policy orders_own_insert on public.orders
  for insert with check (customer_id = auth.uid());

create policy orders_staff_update on public.orders
  for update using (public.has_staff_permission('orders:write'));

create policy order_items_read on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.customer_id = auth.uid() or public.is_staff())
    )
  );

create policy order_items_insert_own on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = auth.uid()
    )
  );

create policy order_items_staff on public.order_items
  for all using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Storage: product images
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy product_images_public_read
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy product_images_staff_insert
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.has_staff_permission('products:write'));

create policy product_images_staff_update
  on storage.objects for update
  using (bucket_id = 'product-images' and public.has_staff_permission('products:write'));

create policy product_images_staff_delete
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.has_staff_permission('products:write'));
