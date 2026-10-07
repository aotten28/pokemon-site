'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { sortPokemonCards, type PokemonCard } from '@/lib/pokemon-tcg';
import { SiteHeader } from '@/components/site-header';

const shinyImageUrl = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`;
const BATCH_SIZE = 60;
const DATABASE_PAGE_SIZE = 500;
type CardSort = 'rarity' | 'market';
type CardListStatus = 'have' | 'want';
type CollectionToast = { cardName: string; status: CardListStatus };
type PokemonLore = { pokemonId: number; region: string; description: string };
const TYPES = ['all', 'grass', 'fire', 'water', 'electric', 'bug', 'normal', 'poison', 'ground', 'fairy', 'fighting', 'psychic', 'rock', 'ghost', 'ice', 'dragon', 'flying', 'dark', 'steel'];
const TYPE_COLORS: Record<string, string> = {
  normal: '#a8a77a', fire: '#ee8130', water: '#6390f0', electric: '#f7d02c', grass: '#7ac74c', ice: '#96d9d6', fighting: '#c22e28', poison: '#a33ea1', ground: '#e2bf65', flying: '#a98ff3', psychic: '#f95587', bug: '#a6b91a', rock: '#b6a136', ghost: '#735797', dragon: '#6f35fc', dark: '#705746', steel: '#b7b7ce', fairy: '#d685ad',
};
const PARTNER_MESSAGES = [
  'Ready for the next adventure!',
  'is happy to be by your side.',
  'is keeping watch for new discoveries.',
  'can’t wait to explore the Pokédex.',
];

type Pokemon = {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  abilities: string[];
  image: string;
  stats: { name: string; value: number }[];
  megaForms: MegaForm[];
  primalForm: MegaForm | null;
  terastalForms: MegaForm[];
};

type MegaForm = {
  name: string;
  label: string;
  types: string[];
  image: string;
  shinyImage: string;
};

const PRIMAL_FORMS: Record<string, MegaForm> = {
  kyogre: {
    name: 'kyogre-primal',
    label: 'Primal',
    types: ['water'],
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10077.png',
    shinyImage: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/10077.png',
  },
  groudon: {
    name: 'groudon-primal',
    label: 'Primal',
    types: ['ground', 'fire'],
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10078.png',
    shinyImage: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/10078.png',
  },
};

const TERASTAL_FORMS: Record<string, MegaForm[]> = {
  terapagos: [
    {
      name: 'terapagos-terastal',
      label: 'Terastal',
      types: ['normal'],
      image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10276.png',
      shinyImage: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/10276.png',
    },
    {
      name: 'terapagos-stellar',
      label: 'Stellar',
      types: ['normal'],
      image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10277.png',
      shinyImage: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10277.png',
    },
  ],
};

const padId = (id: number) => `#${String(id).padStart(4, '0')}`;
const titleCase = (value: string) => value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function mapPokemon(data: {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  abilities: string[];
  image_url: string;
  stats: unknown;
  mega_forms: unknown;
}): Pokemon {
  return {
    id: data.id,
    name: data.name,
    height: data.height,
    weight: data.weight,
    types: data.types,
    abilities: data.abilities,
    image: data.image_url,
    stats: Array.isArray(data.stats) ? data.stats as Pokemon['stats'] : [],
    primalForm: PRIMAL_FORMS[data.name] ?? null,
    terastalForms: TERASTAL_FORMS[data.name] ?? [],
    megaForms: Array.isArray(data.mega_forms) ? data.mega_forms.filter((form): form is MegaForm => {
      if (!form || typeof form !== 'object') return false;
      const candidate = form as Partial<MegaForm>;
      return typeof candidate.name === 'string'
        && typeof candidate.label === 'string'
        && Array.isArray(candidate.types)
        && candidate.types.every((item) => typeof item === 'string')
        && typeof candidate.image === 'string'
        && typeof candidate.shinyImage === 'string';
    }) : [],
  };
}

export default function Home() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [shinyPokemon, setShinyPokemon] = useState<number[]>([]);
  const [megaPokemon, setMegaPokemon] = useState<Record<number, string>>({});
  const [primalPokemon, setPrimalPokemon] = useState<number[]>([]);
  const [terastalPokemon, setTerastalPokemon] = useState<Record<number, string>>({});
  const [megaPickerId, setMegaPickerId] = useState<number | null>(null);
  const [teraPickerId, setTeraPickerId] = useState<number | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tcgCards, setTcgCards] = useState<PokemonCard[]>([]);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardSort, setCardSort] = useState<CardSort>('rarity');
  const [selectedTcgCard, setSelectedTcgCard] = useState<PokemonCard | null>(null);
  const [selectedLore, setSelectedLore] = useState<PokemonLore | null>(null);
  const [loreErrorPokemonId, setLoreErrorPokemonId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [handle, setHandle] = useState<string | null>(null);
  const [partnerPokemonId, setPartnerPokemonId] = useState<number | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [favoritePromptOpen, setFavoritePromptOpen] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [pendingFavorites, setPendingFavorites] = useState<number[]>([]);
  const [savedCardLists, setSavedCardLists] = useState<Record<string, CardListStatus>>({});
  const [pendingCardIds, setPendingCardIds] = useState<string[]>([]);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [collectionToast, setCollectionToast] = useState<CollectionToast | null>(null);
  const [partnerMessage, setPartnerMessage] = useState<string | null>(null);
  const [partnerReacting, setPartnerReacting] = useState(false);
  const pendingFavoriteIds = useRef(new Set<number>());
  const pendingCollectionIds = useRef(new Set<string>());
  const partnerReactionTimer = useRef<number | null>(null);
  const partnerReactingRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadPokemon() {
      try {
        const rows: Pokemon[] = [];

        for (let from = 0; ; from += DATABASE_PAGE_SIZE) {
          const { data, error: queryError } = await supabase
            .from('pokemon')
            .select('id,name,height,weight,types,abilities,image_url,stats,mega_forms')
            .order('id')
            .range(from, from + DATABASE_PAGE_SIZE - 1);

          if (queryError) throw queryError;
          rows.push(...data.map(mapPokemon));
          if (data.length < DATABASE_PAGE_SIZE) break;
        }

        if (active) setPokemon(rows);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPokemon();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const updateAuthState = async (nextUser: User | null) => {
      if (!active) return;
      setUser(nextUser);
      setHandle(null);

      if (!nextUser) {
        setPartnerPokemonId(null);
        setFavorites([]);
        setSavedCardLists({});
        setShowFavorites(false);
        setAuthReady(true);
        return;
      }

      const [{ data: profile }, { data: savedFavorites, error: favoritesError }, { data: savedCards, error: savedCardsError }] = await Promise.all([
        supabase.from('profiles').select('handle,partner_pokemon_id').eq('id', nextUser.id).maybeSingle(),
        supabase.from('favorites').select('pokemon_id').order('created_at'),
        supabase.from('user_cards').select('card_id,list_status').order('created_at'),
      ]);

      if (active) {
        setHandle(profile?.handle ?? null);
        setPartnerPokemonId(profile?.partner_pokemon_id ?? null);
        setFavorites(savedFavorites?.map((favorite) => favorite.pokemon_id) ?? []);
        setSavedCardLists(Object.fromEntries((savedCards ?? []).map((card) => [card.card_id, card.list_status])));
        setFavoriteError(favoritesError ? 'Your favorites could not be loaded. Please refresh and try again.' : null);
        setCollectionError(savedCardsError ? 'Your card collection could not be loaded. Please refresh and try again.' : null);
        setAuthReady(true);
      }
    };

    void supabase.auth.getUser().then(({ data }) => updateAuthState(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void updateAuthState(session?.user ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selected || favoritePromptOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [selected, favoritePromptOpen]);

  useEffect(() => () => {
    if (partnerReactionTimer.current !== null) window.clearTimeout(partnerReactionTimer.current);
  }, []);

  useEffect(() => {
    if (!selected) return;

    const controller = new AbortController();
    const loadCards = async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setCardLoading(true);
      setCardError(null);
      setTcgCards([]);
      setCardSort('rarity');

      try {
        const response = await fetch(`/api/cards/${selected.id}`, { signal: controller.signal });
        const payload = await response.json() as { cards?: PokemonCard[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? 'The card archive is unavailable right now.');
        if (!controller.signal.aborted) setTcgCards(Array.isArray(payload.cards) ? payload.cards : []);
      } catch (fetchError: unknown) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        if (!controller.signal.aborted) setCardError(fetchError instanceof Error ? fetchError.message : 'The card archive is unavailable right now.');
      } finally {
        if (!controller.signal.aborted) setCardLoading(false);
      }
    };
    void loadCards();

    return () => controller.abort();
  }, [selected]);

  useEffect(() => {
    if (!selected) return;

    const controller = new AbortController();

    fetch(`/api/pokemon/${selected.id}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Lore request failed');
        return response.json() as Promise<Omit<PokemonLore, 'pokemonId'>>;
      })
      .then((lore) => {
        if (!controller.signal.aborted) setSelectedLore({ ...lore, pokemonId: selected.id });
      })
      .catch((fetchError: unknown) => {
        if (!(fetchError instanceof DOMException && fetchError.name === 'AbortError') && !controller.signal.aborted) setLoreErrorPokemonId(selected.id);
      });

    return () => controller.abort();
  }, [selected]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (favoritePromptOpen) setFavoritePromptOpen(false);
      else if (selectedTcgCard) setSelectedTcgCard(null);
      else if (selected) setSelected(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [favoritePromptOpen, selected, selectedTcgCard]);

  useEffect(() => {
    if (!collectionToast) return;
    const timeout = window.setTimeout(() => setCollectionToast(null), 4_000);
    return () => window.clearTimeout(timeout);
  }, [collectionToast]);

  const toggleFavorite = async (id: number) => {
    if (!user) {
      setFavoritePromptOpen(true);
      return;
    }
    if (pendingFavoriteIds.current.has(id)) return;

    const wasFavorite = favorites.includes(id);
    pendingFavoriteIds.current.add(id);
    setFavoriteError(null);
    setPendingFavorites((current) => [...current, id]);
    setFavorites((current) => wasFavorite ? current.filter((item) => item !== id) : [...current, id]);

    const { error: favoriteMutationError } = wasFavorite
      ? await supabase.from('favorites').delete().eq('user_id', user.id).eq('pokemon_id', id)
      : await supabase.from('favorites').insert({ user_id: user.id, pokemon_id: id });

    if (favoriteMutationError) {
      setFavorites((current) => wasFavorite
        ? current.includes(id) ? current : [...current, id]
        : current.filter((item) => item !== id));
      setFavoriteError('That favorite could not be saved. Please try again.');
    }
    pendingFavoriteIds.current.delete(id);
    setPendingFavorites((current) => current.filter((item) => item !== id));
  };

  const saveCardToCollection = async (card: PokemonCard, status: CardListStatus) => {
    if (!user) {
      setFavoritePromptOpen(true);
      return;
    }
    if (pendingCollectionIds.current.has(card.id)) return;

    const previousStatus = savedCardLists[card.id];
    if (previousStatus === status) return;
    pendingCollectionIds.current.add(card.id);
    setCollectionError(null);
    setPendingCardIds((current) => [...current, card.id]);
    setSavedCardLists((current) => ({ ...current, [card.id]: status }));

    try {
      // Supabase returns a minimal response by default; the local collection
      // state and confirmation toast are updated after a successful write.
      const { error: saveError } = await supabase.from('user_cards').upsert({
        user_id: user.id,
        card_id: card.id,
        list_status: status,
        name: card.name,
        image_small: card.imageSmall,
        image_large: card.imageLarge,
        set_name: card.setName,
        set_series: card.setSeries,
        release_date: card.releaseDate,
        release_year: card.releaseYear,
        rarity: card.rarity,
        card_number: card.number,
        subtypes: card.subtypes,
        market_price: card.marketPrice,
        market_price_label: card.marketPriceLabel,
      }, { onConflict: 'user_id,card_id' });

      if (saveError) throw saveError;

      setSavedCardLists((current) => ({ ...current, [card.id]: status }));
      setCollectionToast({ cardName: card.name, status });
    } catch {
      setSavedCardLists((current) => {
        const next = { ...current };
        if (previousStatus) next[card.id] = previousStatus;
        else delete next[card.id];
        return next;
      });
      setCollectionError('That card could not be saved. Please try again.');
    } finally {
      pendingCollectionIds.current.delete(card.id);
      setPendingCardIds((current) => current.filter((id) => id !== card.id));
    }
  };

  const removeCardFromCollection = async (cardId: string) => {
    if (!user || pendingCollectionIds.current.has(cardId)) return;
    const previousStatus = savedCardLists[cardId];
    if (!previousStatus) return;
    pendingCollectionIds.current.add(cardId);
    setCollectionError(null);
    setPendingCardIds((current) => [...current, cardId]);
    setSavedCardLists((current) => {
      const next = { ...current };
      delete next[cardId];
      return next;
    });

    const { error: removeError } = await supabase.from('user_cards').delete().eq('user_id', user.id).eq('card_id', cardId);
    if (removeError) {
      setSavedCardLists((current) => ({ ...current, [cardId]: previousStatus }));
      setCollectionError('That card could not be removed. Please try again.');
    }
    pendingCollectionIds.current.delete(cardId);
    setPendingCardIds((current) => current.filter((id) => id !== cardId));
  };

  const toggleShiny = (id: number) => {
    setShinyPokemon((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const togglePrimal = (id: number) => {
    setPrimalPokemon((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const selectTerastalForm = (id: number, formName: string | null) => {
    setTerastalPokemon((current) => {
      const next = { ...current };
      if (formName) next[id] = formName;
      else delete next[id];
      return next;
    });
    setTeraPickerId(null);
  };

  const selectMegaForm = (id: number, formName: string | null) => {
    setMegaPokemon((current) => {
      const next = { ...current };
      if (formName) next[id] = formName;
      else delete next[id];
      return next;
    });
    setMegaPickerId(null);
  };

  const toggleSingleMegaForm = (item: Pokemon) => {
    const form = item.megaForms[0];
    if (!form) return;
    selectMegaForm(item.id, megaPokemon[item.id] === form.name ? null : form.name);
  };

  const pokemonById = useMemo(() => new Map(pokemon.map((item) => [item.id, item])), [pokemon]);

  const filteredPokemon = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return pokemon.filter((item) => {
      const matchesSearch = !needle || item.name.includes(needle) || String(item.id) === needle.replace('#', '');
      const matchesType = type === 'all' || item.types.includes(type);
      const matchesFavorites = !showFavorites || favorites.includes(item.id);
      return matchesSearch && matchesType && matchesFavorites;
    });
  }, [pokemon, query, type, showFavorites, favorites]);

  const displayedPokemon = useMemo(() => filteredPokemon.slice(0, visibleCount), [filteredPokemon, visibleCount]);

  const featured = pokemonById.get(partnerPokemonId ?? 25);
  const featuredName = featured ? titleCase(featured.name) : 'Pikachu';
  const featuredTypeColor = TYPE_COLORS[featured?.types[0] ?? 'electric'];
  const sortedTcgCards = useMemo(() => sortPokemonCards(tcgCards, cardSort), [tcgCards, cardSort]);
  const selectedMega = selected?.megaForms.find((form) => form.name === megaPokemon[selected.id]);
  const selectedPrimal = selected?.primalForm && primalPokemon.includes(selected.id) ? selected.primalForm : null;
  const selectedTerastal = selected?.terastalForms.find((form) => form.name === terastalPokemon[selected.id]);
  const selectedIsShiny = selected ? shinyPokemon.includes(selected.id) : false;
  const selectedForm = selectedMega ?? selectedPrimal ?? selectedTerastal;
  const selectedTypes = selectedForm?.types ?? selected?.types ?? [];
  const selectedImage = selected
    ? selectedForm
      ? (selectedIsShiny ? selectedForm.shinyImage : selectedForm.image)
      : (selectedIsShiny ? shinyImageUrl(selected.id) : selected.image)
    : '';
  const selectedImageFallback = selectedForm?.image ?? selected?.image ?? '';
  const selectedHasMultipleMegaForms = (selected?.megaForms.length ?? 0) > 1;

  const retryCards = () => {
    if (!selected) return;
    setSelected({ ...selected });
  };

  const resetPartnerParallax = (target: HTMLElement) => {
    target.style.setProperty('--partner-x', '0px');
    target.style.setProperty('--partner-y', '0px');
  };

  const movePartner = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - .5) * 12;
    const y = ((event.clientY - bounds.top) / bounds.height - .5) * 12;
    event.currentTarget.style.setProperty('--partner-x', `${x.toFixed(1)}px`);
    event.currentTarget.style.setProperty('--partner-y', `${y.toFixed(1)}px`);
  };

  const reactWithPartner = () => {
    if (partnerReactingRef.current) return;
    const message = PARTNER_MESSAGES[Math.floor(Math.random() * PARTNER_MESSAGES.length)];
    setPartnerMessage(`${featuredName} ${message}`);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    partnerReactingRef.current = true;
    setPartnerReacting(true);
    partnerReactionTimer.current = window.setTimeout(() => {
      partnerReactingRef.current = false;
      setPartnerReacting(false);
      partnerReactionTimer.current = null;
    }, 900);
  };

  return (
    <main>
      <SiteHeader user={authReady ? user : undefined} handle={handle} favoritesCount={favorites.length} homeHref="#top" pokedexHref="#pokedex" favoritesActive={showFavorites} onFavoritesClick={() => { setShowFavorites(!showFavorites); setVisibleCount(BATCH_SIZE); }} />

      <section className="hero" id="top">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><span /> National Pokédex</p>
            <h1>Every Pokémon.<br /><em>One adventure.</em></h1>
            <p className="lede">Explore Pokémon from every generation, discover their strengths, and build a team of favorites—all in one beautifully simple Pokédex.</p>
            <div className="hero-actions">
              <a className="primary-button" href="#pokedex">Explore the Pokédex <span>↓</span></a>
              <span className="api-note"><i /> Live data from Supabase</span>
            </div>
          </div>
          <div className="hero-art" aria-label={`Featured Pokémon: ${featuredName}`} style={{ '--partner-color': featuredTypeColor } as React.CSSProperties}>
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <div className="hero-number">{String(featured?.id ?? 25).padStart(3,'0')}</div>
            {featured ? <button className={partnerReacting ? 'hero-partner reacting' : 'hero-partner'} type="button" onClick={reactWithPartner} onPointerMove={movePartner} onPointerLeave={(event) => resetPartnerParallax(event.currentTarget)} aria-label={`Play with ${featuredName}`} aria-describedby={partnerMessage ? 'partner-message' : undefined} disabled={partnerReacting}>
              <img src={featured.image} alt={featuredName} />
              <span className="partner-sparkles" aria-hidden="true"><i /><i /><i /><i /></span>
            </button> : <div className="hero-placeholder" />}
            <div className="feature-chip chip-name"><span>{partnerPokemonId ? 'Trainer partner' : 'Electric mouse'}</span><strong>{featured ? titleCase(featured.name) : 'Pikachu'}</strong></div>
            <div className="feature-chip chip-type"><i style={{ background: TYPE_COLORS[featured?.types[0] ?? 'electric'] }} /><span>Type</span><strong>{featured ? titleCase(featured.types[0]) : 'Electric'}</strong></div>
            {partnerMessage && <p className="partner-message" id="partner-message" role="status" aria-live="polite">{partnerMessage}</p>}
          </div>
        </div>
        <div className="hero-stripe" />
      </section>

      <section className="dex-section" id="pokedex">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span /> Complete Pokémon index</p>
            <h2>Meet every generation</h2>
          </div>
          <p>{showFavorites ? 'Your saved team, synced to your trainer account.' : `Browse all ${pokemon.length || 'known'} Pokémon across the complete National Pokédex.`}</p>
        </div>

        {favoriteError && <p className="favorite-error" role="alert">{favoriteError}</p>}
        {collectionError && <p className="favorite-error" role="alert">{collectionError}</p>}

        <div className="controls">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(BATCH_SIZE); }} placeholder="Search by name or number..." aria-label="Search Pokémon" />
            <kbd>⌘ K</kbd>
          </label>
          <div className="filter-row" aria-label="Filter by type">
            {TYPES.slice(0, 8).map((item) => (
              <button key={item} className={type === item ? 'filter active' : 'filter'} onClick={() => { setType(item); setVisibleCount(BATCH_SIZE); }}>{item === 'all' ? 'All types' : titleCase(item)}</button>
            ))}
            <label className="more-types">
              <select value={TYPES.slice(0, 8).includes(type) ? '' : type} onChange={(event) => { if (event.target.value) { setType(event.target.value); setVisibleCount(BATCH_SIZE); } }} aria-label="More Pokémon types">
                <option value="">More types</option>
                {TYPES.slice(8).map((item) => <option value={item} key={item}>{titleCase(item)}</option>)}
              </select>
            </label>
          </div>
        </div>

        {loading && <div className="card-grid" aria-label="Loading Pokémon">{Array.from({ length: 8 }, (_, index) => <div className="skeleton-card" key={index}><span /><i /><b /></div>)}</div>}
        {error && <div className="empty-state"><span>!</span><h3>Wild connection error appeared</h3><p>We couldn’t reach the Pokédex database. Check your connection and try refreshing.</p></div>}
        {!loading && !error && filteredPokemon.length === 0 && <div className="empty-state"><span>?</span><h3>No Pokémon found</h3><p>Try a different search or type filter.</p></div>}

        {!loading && !error && filteredPokemon.length > 0 && (
          <div className="card-grid">
            {displayedPokemon.map((item) => {
              const activeMega = item.megaForms.find((form) => form.name === megaPokemon[item.id]);
              const activePrimal = item.primalForm && primalPokemon.includes(item.id) ? item.primalForm : null;
              const activeTerastal = item.terastalForms.find((form) => form.name === terastalPokemon[item.id]);
              const isShiny = shinyPokemon.includes(item.id);
              const activeForm = activeMega ?? activePrimal ?? activeTerastal;
              const displayTypes = activeForm?.types ?? item.types;
              const displayImage = activeForm ? (isShiny ? activeForm.shinyImage : activeForm.image) : (isShiny ? shinyImageUrl(item.id) : item.image);
              const imageFallback = activeForm?.image ?? item.image;
              const hasMultipleMegaForms = item.megaForms.length > 1;

              return (
                <article className="pokemon-card" key={item.id} style={{ '--type-color': TYPE_COLORS[displayTypes[0]] } as React.CSSProperties}>
                  <div className="card-actions">
                    {item.megaForms.length > 0 && <div className="mega-control">
                      <button className={activeMega ? 'mega-toggle active' : 'mega-toggle'} onClick={() => hasMultipleMegaForms ? setMegaPickerId((current) => current === item.id ? null : item.id) : toggleSingleMegaForm(item)} aria-pressed={Boolean(activeMega)} aria-expanded={hasMultipleMegaForms ? megaPickerId === item.id : undefined} aria-label={`${activeMega ? 'Change or remove' : 'Show'} Mega Evolution for ${titleCase(item.name)}`}><span aria-hidden="true">◆</span> Mega</button>
                      {hasMultipleMegaForms && megaPickerId === item.id && <div className="mega-picker" role="group" aria-label={`Choose ${titleCase(item.name)} form`}>
                        <button className={!activeMega ? 'active' : ''} onClick={() => selectMegaForm(item.id, null)}>Base</button>
                        {item.megaForms.map((form) => <button className={activeMega?.name === form.name ? 'active' : ''} key={form.name} onClick={() => selectMegaForm(item.id, form.name)}>{form.label.replace('Mega ', '')}</button>)}
                      </div>}
                    </div>}
                    {item.primalForm && <button className={`primal-toggle ${item.name}${activePrimal ? ' active' : ''}`} onClick={() => togglePrimal(item.id)} aria-pressed={Boolean(activePrimal)} aria-label={`${activePrimal ? 'Show regular' : 'Show'} Primal Reversion for ${titleCase(item.name)}`}><span aria-hidden="true">◆</span> Primal</button>}
                    {item.terastalForms.length > 0 && <div className="tera-control">
                      <button className={activeTerastal ? 'tera-toggle active' : 'tera-toggle'} onClick={() => setTeraPickerId((current) => current === item.id ? null : item.id)} aria-pressed={Boolean(activeTerastal)} aria-expanded={teraPickerId === item.id} aria-label={`${activeTerastal ? 'Change or remove' : 'Show'} Terastal forms for ${titleCase(item.name)}`}><span aria-hidden="true">✧</span> Tera</button>
                      {teraPickerId === item.id && <div className="tera-picker" role="group" aria-label={`Choose ${titleCase(item.name)} Terastal form`}>
                        <button className={!activeTerastal ? 'active' : ''} onClick={() => selectTerastalForm(item.id, null)}>Normal</button>
                        {item.terastalForms.map((form) => <button className={activeTerastal?.name === form.name ? 'active' : ''} key={form.name} onClick={() => selectTerastalForm(item.id, form.name)}>{form.label}</button>)}
                      </div>}
                    </div>}
                    <button className={isShiny ? 'shiny-toggle active' : 'shiny-toggle'} onClick={() => toggleShiny(item.id)} aria-pressed={isShiny} aria-label={`${isShiny ? 'Show regular' : 'Show shiny'} ${titleCase(item.name)}`} title={`${isShiny ? 'Show regular' : 'Show shiny'} artwork`}><span aria-hidden="true">✦</span> Shiny</button>
                    <button className={favorites.includes(item.id) ? 'heart saved' : 'heart'} onClick={() => void toggleFavorite(item.id)} disabled={pendingFavorites.includes(item.id)} aria-pressed={favorites.includes(item.id)} aria-label={user ? `${favorites.includes(item.id) ? 'Remove' : 'Add'} ${titleCase(item.name)} ${favorites.includes(item.id) ? 'from' : 'to'} favorites` : `Sign up to save ${titleCase(item.name)} to favorites`}><span className="love-ball mini" aria-hidden="true"><i>♥</i></span></button>
                  </div>
                  <button className="card-main" onClick={() => setSelected(item)} aria-label={`View ${titleCase(item.name)} details`}>
                    <span className="card-id">{padId(item.id)}</span>
                    <div className="image-well"><span>{String(item.id).padStart(3, '0')}</span><img src={displayImage} alt="" loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = imageFallback; }} /></div>
                    <h3>{titleCase(item.name)}{activeForm && <small>{activeForm.label}</small>}</h3>
                    <div className="type-list">{displayTypes.map((itemType) => <span key={itemType} style={{ '--badge': TYPE_COLORS[itemType] } as React.CSSProperties}>{titleCase(itemType)}</span>)}</div>
                    <span className="view-details">View details <b>↗</b></span>
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && filteredPokemon.length > 0 && (
          <div className="load-more-wrap">
            <p className="result-count">Showing <strong>{displayedPokemon.length}</strong> of {filteredPokemon.length} Pokémon</p>
            {visibleCount < filteredPokemon.length && <button className="load-more" onClick={() => setVisibleCount((current) => current + BATCH_SIZE)}>Load more Pokémon</button>}
          </div>
        )}
      </section>

      <footer><a className="brand light" href="#top"><span className="pokeball" aria-hidden="true"><i /></span><span>Dex<span>Lab</span></span></a><p>Made for trainers, powered by <a href="https://supabase.com" target="_blank" rel="noreferrer">Supabase ↗</a></p><span>Gotta browse ’em all.</span></footer>

      {collectionToast && typeof document !== 'undefined' && createPortal(
        <div className="collection-toast" role="status" aria-live="polite">
          <span aria-hidden="true">✓</span>
          <p><strong>{collectionToast.cardName}</strong> added to your {collectionToast.status === 'have' ? 'Have' : 'Want'} list.</p>
          <button onClick={() => setCollectionToast(null)} aria-label="Dismiss collection confirmation">×</button>
        </div>,
        document.body,
      )}

      {favoritePromptOpen && <div className="favorite-gate-backdrop" role="presentation" onMouseDown={() => setFavoritePromptOpen(false)}>
        <section className="favorite-gate" role="dialog" aria-modal="true" aria-labelledby="favorite-gate-title" aria-describedby="favorite-gate-description" onMouseDown={(event) => event.stopPropagation()}>
          <button className="favorite-gate-close" onClick={() => setFavoritePromptOpen(false)} aria-label="Close sign-up prompt" autoFocus>×</button>
          <span className="love-ball favorite-gate-ball" aria-hidden="true"><i>♥</i></span>
          <p className="eyebrow"><span /> Trainer collection</p>
          <h2 id="favorite-gate-title">Keep your discoveries<br /><em>wherever you explore.</em></h2>
          <p id="favorite-gate-description">Create a free trainer account to save favorite Pokémon and cards across your devices.</p>
          <div className="favorite-gate-actions"><a className="primary-button" href="/auth?mode=signup">Create an account <span>→</span></a><a href="/auth?mode=signin">Already a trainer? Sign in</a></div>
        </section>
      </div>}

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onMouseDown={(event) => event.stopPropagation()} style={{ '--type-color': TYPE_COLORS[selectedTypes[0]] } as React.CSSProperties}>
            <button className="close-modal" onClick={() => setSelected(null)} aria-label="Close details">×</button>
            <div className="detail-visual">
              <span className="detail-number">{String(selected.id).padStart(3, '0')}</span>
              <div className="detail-form-actions">
                {selected.megaForms.length > 0 && <div className="mega-control">
                  <button className={selectedMega ? 'mega-toggle active' : 'mega-toggle'} onClick={() => selectedHasMultipleMegaForms ? setMegaPickerId((current) => current === selected.id ? null : selected.id) : toggleSingleMegaForm(selected)} aria-pressed={Boolean(selectedMega)} aria-expanded={selectedHasMultipleMegaForms ? megaPickerId === selected.id : undefined} aria-label={`${selectedMega ? 'Change or remove' : 'Show'} Mega Evolution for ${titleCase(selected.name)}`}><span aria-hidden="true">◆</span> Mega</button>
                  {selectedHasMultipleMegaForms && megaPickerId === selected.id && <div className="mega-picker" role="group" aria-label={`Choose ${titleCase(selected.name)} form`}>
                    <button className={!selectedMega ? 'active' : ''} onClick={() => selectMegaForm(selected.id, null)}>Base</button>
                    {selected.megaForms.map((form) => <button className={selectedMega?.name === form.name ? 'active' : ''} key={form.name} onClick={() => selectMegaForm(selected.id, form.name)}>{form.label.replace('Mega ', '')}</button>)}
                  </div>}
                </div>}
                {selected.primalForm && <button className={`primal-toggle ${selected.name}${selectedPrimal ? ' active' : ''}`} onClick={() => togglePrimal(selected.id)} aria-pressed={Boolean(selectedPrimal)} aria-label={`${selectedPrimal ? 'Show regular' : 'Show'} Primal Reversion for ${titleCase(selected.name)}`}><span aria-hidden="true">◆</span> Primal</button>}
                {selected.terastalForms.length > 0 && <div className="tera-control">
                  <button className={selectedTerastal ? 'tera-toggle active' : 'tera-toggle'} onClick={() => setTeraPickerId((current) => current === selected.id ? null : selected.id)} aria-pressed={Boolean(selectedTerastal)} aria-expanded={teraPickerId === selected.id} aria-label={`${selectedTerastal ? 'Change or remove' : 'Show'} Terastal forms for ${titleCase(selected.name)}`}><span aria-hidden="true">✧</span> Tera</button>
                  {teraPickerId === selected.id && <div className="tera-picker" role="group" aria-label={`Choose ${titleCase(selected.name)} Terastal form`}>
                    <button className={!selectedTerastal ? 'active' : ''} onClick={() => selectTerastalForm(selected.id, null)}>Normal</button>
                    {selected.terastalForms.map((form) => <button className={selectedTerastal?.name === form.name ? 'active' : ''} key={form.name} onClick={() => selectTerastalForm(selected.id, form.name)}>{form.label}</button>)}
                  </div>}
                </div>}
                <button className={selectedIsShiny ? 'shiny-toggle active' : 'shiny-toggle'} onClick={() => toggleShiny(selected.id)} aria-pressed={selectedIsShiny} aria-label={`${selectedIsShiny ? 'Show regular' : 'Show shiny'} ${titleCase(selected.name)}`} title={`${selectedIsShiny ? 'Show regular' : 'Show shiny'} artwork`}><span aria-hidden="true">✦</span> Shiny</button>
              </div>
              <img src={selectedImage} alt={`${titleCase(selected.name)}${selectedForm ? ` ${selectedForm.label}` : ''}${selectedIsShiny ? ' shiny' : ''}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = selectedImageFallback; }} />
            </div>
            <div className="detail-copy">
              <p className="card-id">{padId(selected.id)}</p>
              <h2 id="detail-title">{titleCase(selected.name)}{selectedForm && <small>{selectedForm.label}</small>}</h2>
              <div className="type-list large">{selectedTypes.map((itemType) => <span key={itemType} style={{ '--badge': TYPE_COLORS[itemType] } as React.CSSProperties}>{titleCase(itemType)}</span>)}</div>
              <section className="pokemon-lore" aria-label={`${titleCase(selected.name)} Pokédex description`}>
                <span>Origin region</span>
                <strong>{selectedLore?.pokemonId === selected.id ? selectedLore.region : (loreErrorPokemonId === selected.id ? 'Unavailable' : 'Loading…')}</strong>
                <p>{selectedLore?.pokemonId === selected.id ? selectedLore.description : (loreErrorPokemonId === selected.id ? 'This Pokédex description is unavailable right now.' : 'Loading Pokédex description…')}</p>
              </section>
              <div className="measurements"><div><span>Height</span><strong>{selected.height / 10} m</strong></div><div><span>Weight</span><strong>{selected.weight / 10} kg</strong></div><div><span>Abilities</span><strong>{selected.abilities.map(titleCase).join(', ')}</strong></div></div>
              <h3>Base stats</h3>
              <div className="stats">{selected.stats.map((stat) => <div key={stat.name}><span>{titleCase(stat.name)}</span><div><i style={{ width: `${Math.min(100, (stat.value / 160) * 100)}%` }} /></div><b>{stat.value}</b></div>)}</div>
              <button className={favorites.includes(selected.id) ? 'favorite-button saved' : 'favorite-button'} onClick={() => void toggleFavorite(selected.id)} disabled={pendingFavorites.includes(selected.id)} aria-pressed={favorites.includes(selected.id)}><span className="love-ball small" aria-hidden="true"><i>♥</i></span>{user ? favorites.includes(selected.id) ? 'Saved to favorites' : 'Add to favorites' : 'Sign up to save favorites'}</button>
            </div>
            <section className="card-archive" aria-labelledby="card-archive-title">
              <div className="card-archive-heading">
                <div>
                  <p className="eyebrow"><span /> TCG card archive</p>
                  <h3 id="card-archive-title">{titleCase(selected.name)} through the years</h3>
                  <p>Every matching English card, ordered from rarest to most common.</p>
                </div>
                {!cardLoading && tcgCards.length > 0 && <label className="card-sort">Sort cards
                  <select value={cardSort} onChange={(event) => setCardSort(event.target.value as CardSort)}>
                    <option value="rarity">Official rarity</option>
                    <option value="market">Market value</option>
                  </select>
                </label>}
              </div>

              {cardLoading && <div className="tcg-card-grid tcg-card-grid-loading" aria-label="Loading Pokémon cards">{Array.from({ length: 8 }, (_, index) => <div className="tcg-skeleton" key={index} />)}</div>}
              {!cardLoading && cardError && <div className="card-archive-message error"><strong>Card archive paused</strong><p>{cardError}</p><button onClick={retryCards}>Try again</button></div>}
              {!cardLoading && !cardError && sortedTcgCards.length === 0 && <div className="card-archive-message"><strong>No cards found yet</strong><p>There are no card records for this Pokédex number in the current archive.</p></div>}
              {!cardLoading && !cardError && sortedTcgCards.length > 0 && <div className="tcg-card-grid">
                {sortedTcgCards.map((card) => <button className="tcg-card" key={card.id} onClick={() => setSelectedTcgCard(card)} aria-label={`View ${card.name} from ${card.setName}`}>
                  <img src={card.imageSmall} alt={`${card.name} card`} loading="lazy" />
                  <span className="tcg-card-meta"><b>{card.rarity ?? 'Unclassified'}</b><span>{card.setName} · {card.releaseYear ?? '—'}</span><span>#{card.number}{card.marketPrice !== null ? <em>${card.marketPrice.toFixed(2)}</em> : null}</span></span>
                </button>)}
              </div>}
            </section>

            {selectedTcgCard && <div className="card-preview-backdrop" role="presentation" onMouseDown={() => setSelectedTcgCard(null)}>
              <section className="card-preview" role="dialog" aria-modal="true" aria-labelledby="card-preview-title" onMouseDown={(event) => event.stopPropagation()}>
                <button className="close-card-preview" onClick={() => setSelectedTcgCard(null)} aria-label="Close card preview">×</button>
                <img src={selectedTcgCard.imageLarge} alt={`${selectedTcgCard.name} card`} />
                <div>
                  <p className="card-id">{selectedTcgCard.setSeries}</p>
                  <h3 id="card-preview-title">{selectedTcgCard.name}</h3>
                  <p className="card-preview-set">{selectedTcgCard.setName} <span>#{selectedTcgCard.number}</span></p>
                  <dl>
                    <div><dt>Rarity</dt><dd>{selectedTcgCard.rarity ?? 'Unclassified'}</dd></div>
                    <div><dt>Released</dt><dd>{selectedTcgCard.releaseDate ?? 'Unknown'}</dd></div>
                    <div><dt>Market value</dt><dd>{selectedTcgCard.marketPrice !== null ? `$${selectedTcgCard.marketPrice.toFixed(2)}` : 'Unavailable'}</dd></div>
                    {selectedTcgCard.subtypes.length > 0 && <div><dt>Style</dt><dd>{selectedTcgCard.subtypes.join(', ')}</dd></div>}
                  </dl>
                  {selectedTcgCard.marketPriceLabel && <p className="market-note">Estimated from {titleCase(selectedTcgCard.marketPriceLabel)} pricing.</p>}
                  <div className="card-collection-actions">
                    {savedCardLists[selectedTcgCard.id] ? <>
                      <p>In your <strong>{savedCardLists[selectedTcgCard.id] === 'have' ? 'Have' : 'Wants'}</strong> list</p>
                      <div className="card-collection-button-row">
                        <button className="card-collection-remove" onClick={() => void removeCardFromCollection(selectedTcgCard.id)} disabled={pendingCardIds.includes(selectedTcgCard.id)}>Remove</button>
                        <button className="card-collection-secondary" onClick={() => void saveCardToCollection(selectedTcgCard, savedCardLists[selectedTcgCard.id] === 'have' ? 'want' : 'have')} disabled={pendingCardIds.includes(selectedTcgCard.id)}>Move to {savedCardLists[selectedTcgCard.id] === 'have' ? 'Want' : 'Have'}</button>
                      </div>
                    </> : <>
                      <p>Save this exact card to your trainer collection.</p>
                      <div className="card-collection-button-row">
                        <button className="card-collection-have" onClick={() => void saveCardToCollection(selectedTcgCard, 'have')} disabled={pendingCardIds.includes(selectedTcgCard.id)}>{user ? 'Add to Have' : 'Sign in to add to Have'}</button>
                        <button className="card-collection-secondary" onClick={() => void saveCardToCollection(selectedTcgCard, 'want')} disabled={pendingCardIds.includes(selectedTcgCard.id)}>{user ? 'Add to Want' : 'Sign in to add to Want'}</button>
                      </div>
                    </>}
                  </div>
                </div>
              </section>
            </div>}
          </section>
        </div>
      )}
    </main>
  );
}
