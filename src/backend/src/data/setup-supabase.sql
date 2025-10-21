-- Start a transaction
begin;

-- Disable triggers temporarily
set session_replication_role = 'replica';

-- Recreate the table if it doesn't match our schema
do $$ 
begin
    -- Drop existing policies if they exist
    drop policy if exists "Allow public read access" on public.products;
    drop policy if exists "Allow authenticated users to modify products" on public.products;
    
    -- Truncate the existing table to start fresh
    truncate table public.products;
exception
    when undefined_table then
        -- Create the table if it doesn't exist
        create table public.products (
    id uuid default gen_random_uuid() primary key,
    name text unique not null,
    sizes jsonb not null,
    options text[] default array[]::text[],
    description text,
    order_num integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert product data
insert into public.products (name, sizes, options, description, order_num)
values
    (
        'Carpet Pinboard',
        '[{"size": "1.2m h x 2.4m w", "price": 2136}, {"size": "1.2m h x 1.8m w", "price": 1702}]'::jsonb,
        array['Grey', 'Brown', 'Blue'],
        'Carpet pinboard with Aluminium frame',
        1
    ),
    (
        'Classic Magnetic Steel',
        '[{"size": "1.14m h x 2.4m", "price": 4735}]'::jsonb,
        array['Chalk', 'White'],
        'Steel writing board c/w aluminium chalkrail',
        2
    ),
    (
        'Classic Magnetic Steel - Folding',
        '[{"size": "1.14m h x 3.6m", "price": 14496}, {"size": "1.14m h x 4.8m", "price": 18972}]'::jsonb,
        array['Chalk', 'White'],
        'Classic steel folding writing boards c/w aluminum chalkrail(5 pc set)',
        3
    ),
    (
        'Premium Magnetic',
        '[{"size": "1.2m h x 2.4m", "price": 4039}]'::jsonb,
        array['Chalk', 'White'],
        'Steel writing board with Aluminium frame & Pentray',
        4
    ),
    (
        'Pinboard Fittings',
        '[{"size": "2.4m+", "price": 65}]'::jsonb,
        array[]::text[],
        '',
        5
    ),
    (
        'Classic writing board fittings',
        '[{"size": "2.4m+", "price": 95}]'::jsonb,
        array[]::text[],
        '',
        6
    ),
    (
        'Crating',
        '[{"size": "Standard", "price": 1500}]'::jsonb,
        array[]::text[],
        '',
        7
    ),
    (
        'Fittings',
        '[{"size": "Standard", "price": 65}]'::jsonb,
        array[]::text[],
        '',
        8
    );

-- Enable Row Level Security (RLS)
alter table public.products enable row level security;

-- Create policies for public access
-- Allow anyone to read products
create policy "Allow public read access"
    on public.products
    for select
    to public
    using (true);

-- Allow authenticated users to modify products
create policy "Allow authenticated users to modify products"
    on public.products
    for all
    to authenticated
    using (true)
    with check (true);

-- Create an index on the name column for faster lookups
create index if not exists products_name_idx on public.products (name);

-- Create an index on the order_num column for sorted queries
create index if not exists products_order_num_idx on public.products (order_num);

-- Re-enable triggers
set session_replication_role = 'origin';

-- Commit the transaction
commit;

-- Verify the data
select id, name, sizes, options, description, order_num, created_at
from public.products
order by order_num;
