import { NextResponse } from 'next/server';

const REGIONS: Record<string, string> = {
  'generation-i': 'Kanto',
  'generation-ii': 'Johto',
  'generation-iii': 'Hoenn',
  'generation-iv': 'Sinnoh',
  'generation-v': 'Unova',
  'generation-vi': 'Kalos',
  'generation-vii': 'Alola',
  'generation-viii': 'Galar',
  'generation-ix': 'Paldea',
};

// These species debuted in Pokémon Legends: Arceus, despite sharing Gen VIII
// with Pokémon introduced in the Galar games.
const HISUI_POKEMON_IDS = new Set([899, 900, 901, 902, 903, 904, 905]);

type SpeciesResponse = {
  generation?: { name?: string };
  flavor_text_entries?: { flavor_text: string; language: { name: string } }[];
};

export async function GET(_request: Request, { params }: { params: Promise<{ pokemonId: string }> }) {
  const { pokemonId } = await params;
  if (!/^\d+$/.test(pokemonId)) {
    return NextResponse.json({ error: 'Invalid Pokémon number.' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`, {
      next: { revalidate: 86_400 },
    });
    if (!response.ok) throw new Error(`PokeAPI responded with ${response.status}`);

    const species = await response.json() as SpeciesResponse;
    const entry = species.flavor_text_entries?.find((item) => item.language.name === 'en');
    const description = entry?.flavor_text.replace(/\f|\n|\r/g, ' ').replace(/\s+/g, ' ').trim();

    return NextResponse.json({
      region: HISUI_POKEMON_IDS.has(Number(pokemonId)) ? 'Hisui' : (REGIONS[species.generation?.name ?? ''] ?? 'Unknown region'),
      description: description ?? 'No Pokédex description is available for this Pokémon yet.',
    });
  } catch {
    return NextResponse.json({ error: 'Pokédex lore is unavailable right now.' }, { status: 502 });
  }
}
