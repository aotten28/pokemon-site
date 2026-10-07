import postgres from 'postgres';

const POKE_API = 'https://pokeapi.co/api/v2';
const BATCH_SIZE = 100;
const CONCURRENCY = 20;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const databasePassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl || !databasePassword) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD.');
}

const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
const sql = postgres({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: databasePassword,
  ssl: 'require',
  max: 1,
  prepare: false,
});

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
  return response.json();
}

function mapPokemon(data) {
  return {
    id: data.id,
    name: data.name,
    height: data.height,
    weight: data.weight,
    types: data.types.map((item) => item.type.name),
    abilities: data.abilities.map((item) => item.ability.name),
    image_url: data.sprites.other['official-artwork'].front_default ?? data.sprites.front_default,
    stats: data.stats.map((item) => ({ name: item.stat.name, value: item.base_stat })),
    updated_at: new Date().toISOString(),
  };
}

async function fetchInParallel(items, mapper = (data) => data) {
  const rows = [];
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      rows[index] = mapper(await fetchJson(items[index].url));
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return rows;
}

const species = await fetchJson(`${POKE_API}/pokemon-species?limit=1`);
const index = await fetchJson(`${POKE_API}/pokemon?limit=${species.count}`);
const basePokemon = await fetchInParallel(index.results, mapPokemon);
const formIndex = await fetchJson(`${POKE_API}/pokemon-form?limit=100000`);
const pokemonForms = await fetchInParallel(formIndex.results);
const megaFormDetails = pokemonForms.filter((form) => form.is_mega);
const megaFormPokemon = await fetchInParallel(megaFormDetails.map((form) => form.pokemon));
const megaFormsBySpecies = new Map();

function resourceId(url) {
  return Number(url.split('/').filter(Boolean).at(-1));
}

function formatMegaLabel(name, speciesName) {
  const suffix = name.startsWith(`${speciesName}-`) ? name.slice(speciesName.length + 1) : name;
  return suffix.split('-').map((part) => part === 'x' || part === 'y' ? part.toUpperCase() : `${part[0].toUpperCase()}${part.slice(1)}`).join(' ');
}

for (let index = 0; index < megaFormDetails.length; index += 1) {
  const mega = megaFormPokemon[index];
  const speciesId = resourceId(mega.species.url);
  const artwork = mega.sprites.other['official-artwork'];
  const megaForm = {
    name: mega.name,
    label: formatMegaLabel(mega.name, mega.species.name),
    types: mega.types.map((item) => item.type.name),
    image: artwork.front_default ?? mega.sprites.front_default,
    shinyImage: artwork.front_shiny ?? mega.sprites.front_shiny ?? artwork.front_default ?? mega.sprites.front_default,
  };
  const current = megaFormsBySpecies.get(speciesId) ?? [];
  current.push(megaForm);
  megaFormsBySpecies.set(speciesId, current);
}

const pokemon = basePokemon.map((item) => ({ ...item, mega_forms: megaFormsBySpecies.get(item.id) ?? [] }));

for (let offset = 0; offset < pokemon.length; offset += BATCH_SIZE) {
  const batch = pokemon.slice(offset, offset + BATCH_SIZE);
  await sql`
    insert into public.pokemon (id, name, height, weight, types, abilities, image_url, stats, mega_forms, updated_at)
    select id, name, height, weight, types, abilities, image_url, stats, mega_forms, updated_at
    from jsonb_to_recordset(${sql.json(batch)}) as item(
      id integer,
      name text,
      height integer,
      weight integer,
      types text[],
      abilities text[],
      image_url text,
      stats jsonb,
      mega_forms jsonb,
      updated_at timestamptz
    )
    on conflict (id) do update set
      name = excluded.name,
      height = excluded.height,
      weight = excluded.weight,
      types = excluded.types,
      abilities = excluded.abilities,
      image_url = excluded.image_url,
      stats = excluded.stats,
      mega_forms = excluded.mega_forms,
      updated_at = excluded.updated_at
  `;
  console.log(`Imported ${Math.min(offset + batch.length, pokemon.length)} of ${pokemon.length}`);
}

await sql.end();
