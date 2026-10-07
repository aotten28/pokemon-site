alter table public.profiles add column partner_pokemon_id integer references public.pokemon(id) on delete set null;
grant update (partner_pokemon_id) on public.profiles to authenticated;
