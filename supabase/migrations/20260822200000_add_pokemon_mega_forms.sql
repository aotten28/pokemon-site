alter table public.pokemon
add column if not exists mega_forms jsonb not null default '[]'::jsonb
check (jsonb_typeof(mega_forms) = 'array');

comment on column public.pokemon.mega_forms is
  'Mega Evolution forms imported from PokéAPI, including form artwork and types.';
