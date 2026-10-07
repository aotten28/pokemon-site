create table public.user_cards (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id text not null,
  list_status text not null check (list_status in ('have', 'want')),
  name text not null,
  image_small text not null,
  image_large text not null,
  set_name text not null,
  set_series text not null,
  release_date text,
  release_year text,
  rarity text,
  card_number text not null,
  subtypes text[] not null default '{}',
  market_price numeric,
  market_price_label text,
  created_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

comment on table public.user_cards is
  'Private Pokémon TCG cards saved by a trainer as owned or wanted.';

create index user_cards_user_status_created_at_idx
on public.user_cards (user_id, list_status, created_at desc);

alter table public.user_cards enable row level security;

revoke all on table public.user_cards from public, anon, authenticated;
grant select, insert, update, delete on table public.user_cards to authenticated;

create policy "Users can read their own cards"
on public.user_cards
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add their own cards"
on public.user_cards
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own cards"
on public.user_cards
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can remove their own cards"
on public.user_cards
for delete
to authenticated
using ((select auth.uid()) = user_id);
