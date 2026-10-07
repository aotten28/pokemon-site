import { NextResponse } from 'next/server';
import type { PokemonCard } from '@/lib/pokemon-tcg';

type ProviderCard = {
  id: string;
  name: string;
  images?: { small?: string; large?: string };
  set?: { name?: string; series?: string; releaseDate?: string };
  rarity?: string;
  number?: string;
  subtypes?: string[];
  tcgplayer?: { prices?: Record<string, { market?: number; mid?: number }> };
};
type PriceBook = Record<string, { market?: number; mid?: number }>;

const PAGE_SIZE = 250;

function getMarketPrice(prices: PriceBook | undefined) {
  if (!prices || typeof prices !== 'object') return { value: null, label: null };
  const preferred = ['holofoil', 'reverseHolofoil', 'normal', '1stEditionHolofoil', 'unlimitedHolofoil'];
  for (const label of preferred) {
    const price = prices[label];
    const value = price?.market ?? price?.mid;
    if (typeof value === 'number' && Number.isFinite(value)) return { value, label };
  }
  for (const [label, price] of Object.entries(prices)) {
    const value = price?.market ?? price?.mid;
    if (typeof value === 'number' && Number.isFinite(value)) return { value, label };
  }
  return { value: null, label: null };
}

function mapCard(card: ProviderCard): PokemonCard | null {
  if (!card.id || !card.images?.small || !card.images.large) return null;
  const market = getMarketPrice(card.tcgplayer?.prices);
  const releaseDate = card.set?.releaseDate ?? null;
  return {
    id: card.id,
    name: card.name,
    imageSmall: card.images.small,
    imageLarge: card.images.large,
    setName: card.set?.name ?? 'Unknown set',
    setSeries: card.set?.series ?? 'Pokémon TCG',
    releaseDate,
    releaseYear: releaseDate?.slice(0, 4) ?? null,
    rarity: card.rarity ?? null,
    number: card.number ?? '—',
    subtypes: Array.isArray(card.subtypes) ? card.subtypes : [],
    marketPrice: market.value,
    marketPriceLabel: market.label,
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ pokemonId: string }> }) {
  const { pokemonId } = await params;
  if (!/^\d+$/.test(pokemonId) || Number(pokemonId) < 1) {
    return NextResponse.json({ error: 'Invalid Pokédex number.' }, { status: 400 });
  }

  try {
    const cards: ProviderCard[] = [];
    const apiKey = process.env.POKEMON_TCG_API_KEY;
    let page = 1;
    let totalCount = 0;

    do {
      const url = new URL('https://api.pokemontcg.io/v2/cards');
      url.searchParams.set('q', `nationalPokedexNumbers:${pokemonId}`);
      url.searchParams.set('page', String(page));
      url.searchParams.set('pageSize', String(PAGE_SIZE));
      url.searchParams.set('select', 'id,name,images,set,rarity,number,subtypes,tcgplayer');
      const response = await fetch(url, {
        headers: apiKey ? { 'X-Api-Key': apiKey } : undefined,
        next: { revalidate: 60 * 60 * 12 },
      });

      if (!response.ok) {
        const message = response.status === 429 ? 'The card archive is busy. Please try again in a moment.' : 'The card archive is unavailable right now.';
        return NextResponse.json({ error: message }, { status: response.status === 429 ? 429 : 502 });
      }

      const payload = await response.json() as { data?: ProviderCard[]; totalCount?: number };
      cards.push(...(Array.isArray(payload.data) ? payload.data : []));
      totalCount = payload.totalCount ?? cards.length;
      page += 1;
    } while (cards.length < totalCount);

    const response = NextResponse.json({ cards: cards.map(mapCard).filter((card): card is PokemonCard => card !== null) });
    response.headers.set('Cache-Control', 'public, s-maxage=43200, stale-while-revalidate=86400');
    return response;
  } catch {
    return NextResponse.json({ error: 'The card archive is unavailable right now.' }, { status: 502 });
  }
}
