'use client';

import Link from 'next/link';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { SiteHeader } from '@/components/site-header';
import { TRAINER_BALLS, TrainerBall, type TrainerBallId, isTrainerBallId } from '@/components/trainer-ball';
import styles from './account.module.css';

type CollectionTab = 'have' | 'want';
type FavoritePokemon = { id: number; name: string; image_url: string; types: string[] };
type SavedCard = {
  card_id: string;
  card_number: string;
  image_large: string;
  image_small: string;
  list_status: CollectionTab;
  market_price: number | null;
  name: string;
  rarity: string | null;
  release_date: string | null;
  release_year: string | null;
  set_name: string;
  set_series: string;
  subtypes: string[];
};

function shuffleForMoodboard<T>(items: T[], shuffleCount: number) {
  if (shuffleCount === 0 || items.length < 2) return items;

  const shuffled = [...items];
  let seed = (shuffleCount * 0x9e3779b1) >>> 0;
  const nextRandom = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextRandom() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [handle, setHandle] = useState<string | null>(null);
  const [partner, setPartner] = useState<{ name: string; image_url: string; types: string[] } | null>(null);
  const [trainerBall, setTrainerBall] = useState<TrainerBallId>('poke');
  const [ballPickerOpen, setBallPickerOpen] = useState(false);
  const [ballSaving, setBallSaving] = useState(false);
  const [ballError, setBallError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [favoritePokemon, setFavoritePokemon] = useState<FavoritePokemon[]>([]);
  const [moodboardShuffle, setMoodboardShuffle] = useState(0);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [collectionTab, setCollectionTab] = useState<CollectionTab>(() => {
    if (typeof window === 'undefined') return 'have';
    const collection = new URLSearchParams(window.location.search).get('collection');
    return collection === 'want' ? 'want' : 'have';
  });
  const [addedToCollection] = useState<CollectionTab | null>(() => {
    if (typeof window === 'undefined') return null;
    const added = new URLSearchParams(window.location.search).get('added');
    return added === 'have' || added === 'want' ? added : null;
  });
  const [collectionError, setCollectionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadAccount = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        window.location.replace('/auth');
        return;
      }

      const [{ data: profile }, { data: savedFavorites }, { data: cards, error: cardsError }] = await Promise.all([
        supabase.from('profiles').select('handle,trainer_ball,partner_pokemon_id').eq('id', authData.user.id).maybeSingle(),
        supabase.from('favorites').select('pokemon_id').order('created_at'),
        supabase.from('user_cards').select('card_id,card_number,image_large,image_small,list_status,market_price,name,rarity,release_date,release_year,set_name,set_series,subtypes').order('created_at', { ascending: false }),
      ]);

      if (active) {
        setUser(authData.user);
        setHandle(profile?.handle ?? null);
        setTrainerBall(isTrainerBallId(profile?.trainer_ball) ? profile.trainer_ball : 'poke');
        if (profile?.partner_pokemon_id) void supabase.from('pokemon').select('name,image_url,types').eq('id', profile.partner_pokemon_id).maybeSingle().then(({ data }) => { if (active) setPartner(data); });
        const favoriteIds = savedFavorites?.map((favorite) => favorite.pokemon_id) ?? [];
        setFavoritesCount(favoriteIds.length);
        if (favoriteIds.length) void supabase.from('pokemon').select('id,name,image_url,types').in('id', favoriteIds).then(({ data }) => { if (active) setFavoritePokemon(data ?? []); });
        setSavedCards(cards ?? []);
        setCollectionError(cardsError ? 'Your card collection could not be loaded. Please refresh and try again.' : null);
        setLoading(false);
      }
    };

    void loadAccount();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSelectedCard(null); setBallPickerOpen(false); }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  if (loading) return <main className="auth-page"><p className="account-loading">Loading your trainer home…</p></main>;

  const haveCards = savedCards.filter((card) => card.list_status === 'have');
  const wantedCards = savedCards.filter((card) => card.list_status === 'want');
  const displayedCards = collectionTab === 'have' ? haveCards : wantedCards;
  const totalCards = savedCards.length;
  const havePercent = totalCards ? Math.round((haveCards.length / totalCards) * 100) : 0;
  const moodCards = shuffleForMoodboard([...haveCards, ...wantedCards].filter((card) => card.image_small || card.image_large), moodboardShuffle).slice(0, 3);
  const moodFavorites = shuffleForMoodboard(favoritePokemon, moodboardShuffle).slice(0, 4);
  const primaryType = partner?.types[0] ?? moodFavorites[0]?.types[0] ?? 'normal';
  const vibePhrases: Record<string, string> = { fire: 'bold-hearted trailblazer', water: 'calm current seeker', grass: 'soft-hearted wanderer', electric: 'bright spark chaser', psychic: 'quiet cosmic thinker', fairy: 'gentle magic maker', dark: 'midnight mystery collector', dragon: 'legend-in-the-making', ghost: 'dreamy after-hours explorer' };
  const vibePhrase = vibePhrases[primaryType] ?? 'one-of-a-kind Pokédex explorer';
  const goToCollection = (tab: CollectionTab) => { setCollectionTab(tab); document.getElementById('collection-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const saveTrainerBall = async (nextBall: TrainerBallId) => {
    if (!user || ballSaving || nextBall === trainerBall) { setBallPickerOpen(false); return; }
    const previous = trainerBall; setTrainerBall(nextBall); setBallSaving(true); setBallError(null);
    const { error } = await supabase.from('profiles').update({ trainer_ball: nextBall }).eq('id', user.id);
    if (error) { setTrainerBall(previous); setBallError('Your ball could not be saved. Please try again.'); }
    else setBallPickerOpen(false);
    setBallSaving(false);
  };

  return <main className={styles.page}>
    <SiteHeader user={user} handle={handle} favoritesCount={favoritesCount} homeHref="/" pokedexHref="/#pokedex" onFavoritesClick={() => window.location.assign('/#pokedex')} />
    <section className="trainer-hero" aria-labelledby="account-title">
      <div className="trainer-hero-grid">
        <div className="trainer-copy">
          <p className="eyebrow"><span /> Trainer home</p>
          <h1 id="account-title">Your Pokédex,<br /><em>@{handle ?? 'trainer'}.</em></h1>
          <p className="trainer-lede">Your trainer profile is ready for the Pokémon, cards, and favorites you’ll collect along the way.</p>
          <div className="trainer-actions"><Link className="primary-button" href="/#pokedex">Browse the Pokédex <span>↓</span></Link><span className="trainer-ready"><i /> Account active</span></div>
        </div>
        <div className="trainer-visual" aria-label="Trainer profile overview">
          <span className="trainer-orbit trainer-orbit-one" /><span className="trainer-orbit trainer-orbit-two" />
          <div className="trainer-number">001</div>
          <div className="trainer-pulse" style={{ '--have-percent': `${havePercent}%` } as React.CSSProperties}><div className="trainer-ball"><TrainerBall ball={trainerBall} size={94} /><b>@{handle ?? 'trainer'}</b><small>{haveCards.length} Have · {wantedCards.length} Wants</small><button className="trainer-customize" onClick={() => setBallPickerOpen(true)}>Customize</button></div></div>
          <button className="trainer-chip chip-handle" onClick={() => setBallPickerOpen(true)}><span>Trainer ball</span><strong>Customize →</strong></button>
          <button className="trainer-chip chip-have" onClick={() => goToCollection('have')}><span>Have cards</span><strong>{haveCards.length} cards →</strong></button>
          <button className="trainer-chip chip-want" onClick={() => goToCollection('want')}><span>Want cards</span><strong>{wantedCards.length} cards →</strong></button>
        </div>
      </div>
      <div className="trainer-stripe" />
    </section>
    <section className="trainer-dashboard">
      <div className="trainer-section-heading"><div><p className="eyebrow"><span /> Profile overview</p><h2>Ready for your next <em>adventure.</em></h2></div><p>Your account details are private and securely tied to your trainer profile.</p></div>
      <div className="trainer-grid">
        <article className="trainer-profile-card"><span className="trainer-card-icon">✦</span><p>Trainer identity</p><h3>@{handle ?? 'trainer'}</h3>{partner ? <><img className="trainer-partner-image" src={partner.image_url} alt=""/><dl><div><dt>Partner</dt><dd>{partner.name}</dd></div><div><dt>Type</dt><dd>{partner.types.join(' / ')}</dd></div></dl><Link href="/account/partner">Change partner →</Link></> : <><p>Find the Pokémon that matches your trainer spirit.</p><Link href="/account/partner">Find your partner →</Link></>}</article>
        <article className="trainer-favorites-card"><div><p className="eyebrow"><span /> Your journey</p><h3>Your cards are<br /><em>ready to collect.</em></h3><p>Open any Pokémon to browse its cards and save the ones you have or want.</p><Link href="/#pokedex">Explore Pokémon <b>→</b></Link></div><span className="trainer-heart">♥</span></article>
      </div>
      <section className="trainer-collection" aria-labelledby="collection-title">
        <div className="trainer-collection-heading">
          <div><p className="eyebrow"><span /> Trainer card binder</p><h2 id="collection-title">Your card <em>collection.</em></h2></div>
          <div className="collection-counts" aria-label="Collection counts"><span><b>{haveCards.length}</b> Have</span><span><b>{wantedCards.length}</b> Wants</span></div>
        </div>
        <div className="collection-tabs" role="tablist" aria-label="Card collection list">
          <button role="tab" aria-selected={collectionTab === 'have'} className={collectionTab === 'have' ? 'active' : ''} onClick={() => setCollectionTab('have')}>Have <b>{haveCards.length}</b></button>
          <button role="tab" aria-selected={collectionTab === 'want'} className={collectionTab === 'want' ? 'active' : ''} onClick={() => setCollectionTab('want')}>Wants <b>{wantedCards.length}</b></button>
        </div>
        {addedToCollection && <p className="collection-success" role="status">Added to your {addedToCollection === 'have' ? 'Have' : 'Wants'} list.</p>}
        {collectionError && <p className="collection-error" role="alert">{collectionError}</p>}
        {displayedCards.length > 0 ? <div className="collection-grid" role="tabpanel">
          {displayedCards.map((card) => <button type="button" className="collection-card" key={card.card_id} onClick={() => setSelectedCard(card)} aria-label={`Enlarge ${card.name} card`}><img src={card.image_small} alt={`${card.name} card`} /><div><p>{card.rarity ?? 'Unclassified'}</p><h3>{card.name}</h3><span>{card.set_name} · #{card.card_number}{card.release_year ? ` · ${card.release_year}` : ''}</span></div></button>)}
        </div> : <div className="collection-empty" role="tabpanel"><strong>{collectionTab === 'have' ? 'Your binder is ready.' : 'Your wish list is ready.'}</strong><p>{collectionTab === 'have' ? 'Save a card you own from any Pokémon card preview to start your collection.' : 'Save the cards you are hunting for and keep them all in one place.'}</p><Link href="/#pokedex">Browse the Pokédex <b>→</b></Link></div>}
      </section>
      <section className="trainer-moodboard" aria-labelledby="moodboard-title">
        <div className="trainer-collection-heading"><div><p className="eyebrow"><span /> Your trainer vibe</p><h2 id="moodboard-title">A little piece of <em>your journey.</em></h2></div><button className="moodboard-shuffle" onClick={() => setMoodboardShuffle((current) => current + 1)}>↻ Shuffle collage</button></div>
        <div className={`moodboard-collage moodboard-variant-${moodboardShuffle % 3}`}>
          <div className="moodboard-paper moodboard-title-card"><span>TRAINER NOTES</span><strong>@{handle ?? 'trainer'}</strong><p>{vibePhrase}</p><TrainerBall ball={trainerBall} size={56} /></div>
          {partner ? <div className="moodboard-paper moodboard-partner"><span>MY PARTNER</span><img src={partner.image_url} alt={partner.name} /><strong>{partner.name}</strong><p>{partner.types.join(' · ')}</p></div> : <div className="moodboard-paper moodboard-empty"><span>YOUR PARTNER</span><strong>Still searching</strong><p>Take the Partner Quiz to give this collage its lead character.</p><Link href="/account/partner">Find your partner →</Link></div>}
          <div className="moodboard-paper moodboard-favorites"><span>FAVORITE FINDS</span>{moodFavorites.length ? <div>{moodFavorites.map((item) => <figure key={item.id}><img src={item.image_url} alt={item.name} /><figcaption>{item.name}</figcaption></figure>)}</div> : <p>Save favorite Pokémon and they’ll appear here as little discoveries.</p>}</div>
          <div className="moodboard-paper moodboard-cards"><span>BINDER PULLS</span>{moodCards.length ? <div>{moodCards.map((card) => <img key={card.card_id} src={card.image_small || card.image_large} alt={`${card.name} card`} />)}</div> : <p>Your saved cards will become the collector’s corner of this board.</p>}</div>
          <span className="moodboard-tape moodboard-tape-one" aria-hidden="true" /><span className="moodboard-tape moodboard-tape-two" aria-hidden="true" /><span className="moodboard-pin" aria-hidden="true">✦</span>
        </div>
      </section>
    </section>
    {selectedCard && <div className="card-preview-backdrop" role="presentation" onMouseDown={() => setSelectedCard(null)}>
      <section className="card-preview" role="dialog" aria-modal="true" aria-labelledby="saved-card-preview-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="close-card-preview" onClick={() => setSelectedCard(null)} aria-label="Close card preview">×</button>
        <img src={selectedCard.image_large} alt={`${selectedCard.name} card`} />
        <div>
          <p className="card-id">{selectedCard.set_series}</p>
          <h3 id="saved-card-preview-title">{selectedCard.name}</h3>
          <p className="card-preview-set">{selectedCard.set_name} <span>#{selectedCard.card_number}</span></p>
          <dl>
            <div><dt>Collection</dt><dd>{selectedCard.list_status === 'have' ? 'Have' : 'Want'}</dd></div>
            <div><dt>Rarity</dt><dd>{selectedCard.rarity ?? 'Unclassified'}</dd></div>
            <div><dt>Released</dt><dd>{selectedCard.release_date ?? selectedCard.release_year ?? 'Unknown'}</dd></div>
            <div><dt>Market value</dt><dd>{selectedCard.market_price !== null ? `$${selectedCard.market_price.toFixed(2)}` : 'Unavailable'}</dd></div>
            {selectedCard.subtypes.length > 0 && <div><dt>Style</dt><dd>{selectedCard.subtypes.join(', ')}</dd></div>}
          </dl>
        </div>
      </section>
    </div>}
    {ballPickerOpen && <div className="card-preview-backdrop trainer-ball-picker-backdrop" role="presentation" onMouseDown={() => setBallPickerOpen(false)}><section className="trainer-ball-picker" role="dialog" aria-modal="true" aria-labelledby="ball-picker-title" onMouseDown={(event) => event.stopPropagation()}><button className="close-card-preview" onClick={() => setBallPickerOpen(false)} aria-label="Close ball picker">×</button><p className="eyebrow"><span /> Trainer style</p><h2 id="ball-picker-title">Choose your Poké Ball</h2><p>Pick the emblem that feels most like your trainer identity.</p>{ballError && <p className="collection-error" role="alert">{ballError}</p>}<div className="trainer-ball-options">{TRAINER_BALLS.map(([id, label]) => <button key={id} className={trainerBall === id ? 'selected' : ''} onClick={() => void saveTrainerBall(id)} disabled={ballSaving} aria-pressed={trainerBall === id}><TrainerBall ball={id} size={54} /><span>{label}</span></button>)}</div></section></div>}
  </main>;
}
