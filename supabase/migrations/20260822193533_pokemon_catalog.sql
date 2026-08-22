create table if not exists public.pokemon (
  id integer primary key,
  name text not null unique,
  height integer not null check (height >= 0),
  weight integer not null check (weight >= 0),
  types text[] not null check (cardinality(types) between 1 and 2),
  abilities text[] not null,
  image_url text not null,
  stats jsonb not null check (jsonb_typeof(stats) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pokemon is
  'Read-only National Pokedex catalog imported from PokeAPI.';

alter table public.pokemon enable row level security;

revoke all on table public.pokemon from anon, authenticated;
grant select on table public.pokemon to anon, authenticated;

drop policy if exists "Pokemon catalog is publicly readable" on public.pokemon;

create policy "Pokemon catalog is publicly readable"
on public.pokemon
for select
to anon, authenticated
using (true);
