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

async function fetchInParallel(items) {
  const rows = [];
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      rows[index] = mapPokemon(await fetchJson(items[index].url));
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return rows;
}

const species = await fetchJson(`${POKE_API}/pokemon-species?limit=1`);
const index = await fetchJson(`${POKE_API}/pokemon?limit=${species.count}`);
const pokemon = await fetchInParallel(index.results);

for (let offset = 0; offset < pokemon.length; offset += BATCH_SIZE) {
  const batch = pokemon.slice(offset, offset + BATCH_SIZE);
  await sql`
    insert into public.pokemon (id, name, height, weight, types, abilities, image_url, stats, updated_at)
    select id, name, height, weight, types, abilities, image_url, stats, updated_at
    from jsonb_to_recordset(${sql.json(batch)}) as item(
      id integer,
      name text,
      height integer,
      weight integer,
      types text[],
      abilities text[],
      image_url text,
      stats jsonb,
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
      updated_at = excluded.updated_at
  `;
  console.log(`Imported ${Math.min(offset + batch.length, pokemon.length)} of ${pokemon.length}`);
}

await sql.end();
