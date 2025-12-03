create table transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_address text not null,
  token_id text not null,
  amount text not null,
  status text default 'pending',
  nonce text
);

-- Optional: RLS policies
alter table transactions enable row level security;

create policy "Public read access"
  on transactions for select
  using ( true );

create policy "Service role insert access"
  on transactions for insert
  with check ( true ); -- Only service role has key anyway usually, but good to verify in dashboard

