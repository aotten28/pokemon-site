'use client';

import { useEffect, useMemo, useState } from 'react';

const API = 'https://pokeapi.co/api/v2';
const TYPES = ['all', 'grass', 'fire', 'water', 'electric', 'bug', 'normal', 'poison', 'ground', 'fairy', 'fighting', 'psychic', 'rock', 'ghost', 'ice', 'dragon'];
const TYPE_COLORS: Record<string, string> = {
  normal: '#a8a77a', fire: '#ee8130', water: '#6390f0', electric: '#f7d02c', grass: '#7ac74c', ice: '#96d9d6', fighting: '#c22e28', poison: '#a33ea1', ground: '#e2bf65', flying: '#a98ff3', psychic: '#f95587', bug: '#a6b91a', rock: '#b6a136', ghost: '#735797', dragon: '#6f35fc', dark: '#705746', steel: '#b7b7ce', fairy: '#d685ad',
};

type Pokemon = {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  abilities: string[];
  image: string;
  stats: { name: string; value: number }[];
};

const padId = (id: number) => `#${String(id).padStart(4, '0')}`;
const titleCase = (value: string) => value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function mapPokemon(data: any): Pokemon {
  return {
    id: data.id,
    name: data.name,
    height: data.height,
    weight: data.weight,
    types: data.types.map((item: any) => item.type.name),
    abilities: data.abilities.map((item: any) => item.ability.name),
    image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
    stats: data.stats.map((item: any) => ({ name: item.stat.name, value: item.base_stat })),
  };
}

export default function Home() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dex-favorites');
    if (saved) setFavorites(JSON.parse(saved));

    async function loadPokemon() {
      try {
        const listResponse = await fetch(`${API}/pokemon?limit=151`);
        const list = await listResponse.json();
        const details = await Promise.all(
          list.results.map((item: { url: string }) => fetch(item.url).then((response) => response.json()))
        );
        setPokemon(details.map(mapPokemon));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadPokemon();
  }, []);

  useEffect(() => {
    if (selected) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [selected]);

  const toggleFavorite = (id: number) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem('dex-favorites', JSON.stringify(next));
      return next;
    });
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return pokemon.filter((item) => {
      const matchesSearch = !needle || item.name.includes(needle) || String(item.id) === needle.replace('#', '');
      const matchesType = type === 'all' || item.types.includes(type);
      const matchesFavorites = !showFavorites || favorites.includes(item.id);
      return matchesSearch && matchesType && matchesFavorites;
    });
  }, [pokemon, query, type, showFavorites, favorites]);

  const featured = pokemon.find((item) => item.id === 25);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Dex home">
          <span className="pokeball" aria-hidden="true"><i /></span>
          <span>Dex<span>Lab</span></span>
        </a>
        <nav aria-label="Primary navigation">
          <a className="active" href="#pokedex">Pokédex</a>
          <button className={showFavorites ? 'nav-favorite active' : 'nav-favorite'} onClick={() => setShowFavorites(!showFavorites)}>
            <span aria-hidden="true">♥</span> Favorites <b>{favorites.length}</b>
          </button>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><span /> Kanto field guide</p>
            <h1>Every Pokémon.<br /><em>One adventure.</em></h1>
            <p className="lede">Explore the original 151, discover their strengths, and build a team of favorites—all in one beautifully simple Pokédex.</p>
            <div className="hero-actions">
              <a className="primary-button" href="#pokedex">Explore the Pokédex <span>↓</span></a>
              <span className="api-note"><i /> Live data from PokéAPI</span>
            </div>
          </div>
          <div className="hero-art" aria-label="Featured Pokémon: Pikachu">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <div className="hero-number">025</div>
            {featured ? <img src={featured.image} alt="Pikachu" /> : <div className="hero-placeholder" />}
            <div className="feature-chip chip-name"><span>Electric mouse</span><strong>Pikachu</strong></div>
            <div className="feature-chip chip-type"><i style={{ background: TYPE_COLORS.electric }} /><span>Type</span><strong>Electric</strong></div>
          </div>
        </div>
        <div className="hero-stripe" />
      </section>

      <section className="dex-section" id="pokedex">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span /> Pokémon index</p>
            <h2>Meet the originals</h2>
          </div>
          <p>{showFavorites ? 'Your saved team, stored on this device.' : 'Browse all 151 Pokémon first discovered in the Kanto region.'}</p>
        </div>

        <div className="controls">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or number..." aria-label="Search Pokémon" />
            <kbd>⌘ K</kbd>
          </label>
          <div className="filter-row" aria-label="Filter by type">
            {TYPES.slice(0, 8).map((item) => (
              <button key={item} className={type === item ? 'filter active' : 'filter'} onClick={() => setType(item)}>{item === 'all' ? 'All types' : titleCase(item)}</button>
            ))}
            <label className="more-types">
              <select value={TYPES.slice(0, 8).includes(type) ? '' : type} onChange={(event) => event.target.value && setType(event.target.value)} aria-label="More Pokémon types">
                <option value="">More types</option>
                {TYPES.slice(8).map((item) => <option value={item} key={item}>{titleCase(item)}</option>)}
              </select>
            </label>
          </div>
        </div>

        {loading && <div className="card-grid" aria-label="Loading Pokémon">{Array.from({ length: 8 }, (_, index) => <div className="skeleton-card" key={index}><span /><i /><b /></div>)}</div>}
        {error && <div className="empty-state"><span>!</span><h3>Wild connection error appeared</h3><p>We couldn’t reach PokéAPI. Check your connection and try refreshing.</p></div>}
        {!loading && !error && filtered.length === 0 && <div className="empty-state"><span>?</span><h3>No Pokémon found</h3><p>Try a different search or type filter.</p></div>}

        {!loading && !error && (
          <div className="card-grid">
            {filtered.map((item) => (
              <article className="pokemon-card" key={item.id} style={{ '--type-color': TYPE_COLORS[item.types[0]] } as React.CSSProperties}>
                <button className={favorites.includes(item.id) ? 'heart saved' : 'heart'} onClick={() => toggleFavorite(item.id)} aria-label={`${favorites.includes(item.id) ? 'Remove' : 'Add'} ${titleCase(item.name)} ${favorites.includes(item.id) ? 'from' : 'to'} favorites`}>♥</button>
                <button className="card-main" onClick={() => setSelected(item)} aria-label={`View ${titleCase(item.name)} details`}>
                  <span className="card-id">{padId(item.id)}</span>
                  <div className="image-well"><span>{String(item.id).padStart(3, '0')}</span><img src={item.image} alt="" loading="lazy" /></div>
                  <h3>{titleCase(item.name)}</h3>
                  <div className="type-list">{item.types.map((itemType) => <span key={itemType} style={{ '--badge': TYPE_COLORS[itemType] } as React.CSSProperties}>{titleCase(itemType)}</span>)}</div>
                  <span className="view-details">View details <b>↗</b></span>
                </button>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && <p className="result-count">Showing <strong>{filtered.length}</strong> of 151 Pokémon</p>}
      </section>

      <footer><a className="brand light" href="#top"><span className="pokeball" aria-hidden="true"><i /></span><span>Dex<span>Lab</span></span></a><p>Made for trainers, powered by <a href="https://pokeapi.co" target="_blank" rel="noreferrer">PokéAPI ↗</a></p><span>Gotta browse ’em all.</span></footer>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onMouseDown={(event) => event.stopPropagation()} style={{ '--type-color': TYPE_COLORS[selected.types[0]] } as React.CSSProperties}>
            <button className="close-modal" onClick={() => setSelected(null)} aria-label="Close details">×</button>
            <div className="detail-visual"><span className="detail-number">{String(selected.id).padStart(3, '0')}</span><img src={selected.image} alt={titleCase(selected.name)} /></div>
            <div className="detail-copy">
              <p className="card-id">{padId(selected.id)}</p>
              <h2 id="detail-title">{titleCase(selected.name)}</h2>
              <div className="type-list large">{selected.types.map((itemType) => <span key={itemType} style={{ '--badge': TYPE_COLORS[itemType] } as React.CSSProperties}>{titleCase(itemType)}</span>)}</div>
              <div className="measurements"><div><span>Height</span><strong>{selected.height / 10} m</strong></div><div><span>Weight</span><strong>{selected.weight / 10} kg</strong></div><div><span>Abilities</span><strong>{selected.abilities.map(titleCase).join(', ')}</strong></div></div>
              <h3>Base stats</h3>
              <div className="stats">{selected.stats.map((stat) => <div key={stat.name}><span>{titleCase(stat.name)}</span><div><i style={{ width: `${Math.min(100, (stat.value / 160) * 100)}%` }} /></div><b>{stat.value}</b></div>)}</div>
              <button className={favorites.includes(selected.id) ? 'favorite-button saved' : 'favorite-button'} onClick={() => toggleFavorite(selected.id)}>♥ {favorites.includes(selected.id) ? 'Saved to favorites' : 'Add to favorites'}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
