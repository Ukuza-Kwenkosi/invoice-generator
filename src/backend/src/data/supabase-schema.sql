-- Create the products table
create table public.products (
    id uuid default gen_random_uuid() primary key,
    name text unique not null,
    sizes jsonb not null,
    options text[] default array[]::text[],
    description text,
    order_num integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Temporarily disable RLS for initial data load
alter table public.products disable row level security;
