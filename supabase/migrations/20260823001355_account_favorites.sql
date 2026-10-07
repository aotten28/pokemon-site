create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  pokemon_id integer not null references public.pokemon (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, pokemon_id)
);

comment on table public.favorites is
  'Private Pokémon favorites owned by an authenticated account.';

create index favorites_pokemon_id_idx on public.favorites (pokemon_id);

alter table public.favorites enable row level security;

revoke all on table public.favorites from public, anon, authenticated;
grant select, insert, delete on table public.favorites to authenticated;

create policy "Users can read their own favorites"
on public.favorites
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add their own favorites"
on public.favorites
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can remove their own favorites"
on public.favorites
for delete
to authenticated
using ((select auth.uid()) = user_id);
