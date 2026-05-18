-- Create transactions table
create table if not exists public.transactions (
  transaction_id bigint generated always as identity not null,
  user_id bigint not null,
  amount numeric(10,2) not null,
  status text not null,
  payment_reference text not null,
  object jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  constraint transactions_pkey primary key (transaction_id)
) tablespace pg_default;

alter table public.transactions
  add constraint transactions_user_id_fkey foreign key (user_id) references public.users(user_id);

create index if not exists idx_transactions_user_id on public.transactions (user_id);
create index if not exists idx_transactions_status on public.transactions (status);
create index if not exists idx_transactions_created_at on public.transactions (created_at);
