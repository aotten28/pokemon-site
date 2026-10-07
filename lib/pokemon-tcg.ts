export type PokemonCard = {
  id: string;
  name: string;
  imageSmall: string;
  imageLarge: string;
  setName: string;
  setSeries: string;
  releaseDate: string | null;
  releaseYear: string | null;
  rarity: string | null;
  number: string;
  subtypes: string[];
  marketPrice: number | null;
  marketPriceLabel: string | null;
};

// The provider's rarity labels span decades of TCG releases. Higher values are
// shown first; labels not listed here still receive a consistent fallback rank.
const RARITY_RANKS: Record<string, number> = {
  'mega attack rare': 1000,
  'special illustration rare': 950,
  'illustration rare': 900,
  'hyper rare': 880,
  'rare secret': 860,
  'rare rainbow': 840,
  'rare gold': 820,
  'rare ultra': 800,
  'rare shiny gx': 780,
  'rare shining': 760,
  'rare prime': 740,
  'rare legend': 720,
  'rare break': 700,
  'rare ace': 680,
  'rare ace spec': 670,
  'rare prism star': 660,
  'rare holo vstar': 650,
  'rare holo vmax': 640,
  'rare holo v': 630,
  'rare holo gx': 620,
  'rare holo ex': 610,
  'rare holo lv.x': 600,
  'rare holo star': 590,
  'rare holo': 500,
  rare: 400,
  uncommon: 200,
  common: 100,
};

export function rarityRank(rarity: string | null) {
  if (!rarity) return 0;
  const normalized = rarity.trim().toLowerCase();
  if (RARITY_RANKS[normalized] !== undefined) return RARITY_RANKS[normalized];
  if (normalized.includes('secret')) return 850;
  if (normalized.includes('ultra')) return 800;
  if (normalized.includes('illustration')) return 900;
  if (normalized.includes('holo')) return 500;
  return 300;
}

export function sortPokemonCards(cards: PokemonCard[], sort: 'rarity' | 'market') {
  return [...cards].sort((a, b) => {
    if (sort === 'market') {
      const priceDifference = (b.marketPrice ?? -1) - (a.marketPrice ?? -1);
      if (priceDifference !== 0) return priceDifference;
    }

    const rarityDifference = rarityRank(b.rarity) - rarityRank(a.rarity);
    if (rarityDifference !== 0) return rarityDifference;
    return (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '') || a.number.localeCompare(b.number, undefined, { numeric: true });
  });
}
