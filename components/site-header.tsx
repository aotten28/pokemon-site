'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const SOLROCK_IMAGE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/338.png';
const LUNATONE_IMAGE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/337.png';
type Theme = 'light' | 'dark';
type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void | Promise<void>) => { finished: Promise<void> };
};

type SiteHeaderProps = {
  user: User | null | undefined;
  handle: string | null;
  favoritesCount: number;
  homeHref: string;
  pokedexHref: string;
  onFavoritesClick: () => void;
  favoritesActive?: boolean;
};

export function SiteHeader({ user, handle, favoritesCount, homeHref, pokedexHref, onFavoritesClick, favoritesActive = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>('light');
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const themeTransitioning = useRef(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('dex-theme');
    const preferredTheme = savedTheme === 'dark' || savedTheme === 'light'
      ? savedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = preferredTheme;
    const syncTheme = window.setTimeout(() => setTheme(preferredTheme), 0);
    return () => window.clearTimeout(syncTheme);
  }, []);

  const applyTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('dex-theme', nextTheme);
  };

  const toggleTheme = () => {
    if (themeTransitioning.current) return;
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    const viewTransitionDocument = document as ViewTransitionDocument;
    const startViewTransition = viewTransitionDocument.startViewTransition;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!startViewTransition || reduceMotion) {
      applyTheme(nextTheme);
      return;
    }

    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const size = Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) * 6);
    const root = document.documentElement;
    root.style.setProperty('--theme-transition-x', `${x}px`);
    root.style.setProperty('--theme-transition-y', `${y}px`);
    root.style.setProperty('--theme-transition-size', `${size}px`);
    root.style.setProperty('--theme-transition-intro-size', `${size * 0.04}px`);
    root.style.setProperty('--theme-transition-intro-offset', `${size * 0.02}px`);
    root.style.setProperty('--theme-transition-bounce-size', `${size * 0.06}px`);
    root.style.setProperty('--theme-transition-bounce-offset', `${size * 0.03}px`);
    root.style.setProperty('--theme-transition-settle-size', `${size * 0.052}px`);
    root.style.setProperty('--theme-transition-settle-offset', `${size * 0.026}px`);
    root.dataset.themeTransition = 'pokemon';
    themeTransitioning.current = true;
    setIsThemeTransitioning(true);

    startViewTransition.call(viewTransitionDocument, () => applyTheme(nextTheme)).finished.finally(() => {
      root.removeAttribute('data-theme-transition');
      ['--theme-transition-x', '--theme-transition-y', '--theme-transition-size', '--theme-transition-intro-size', '--theme-transition-intro-offset', '--theme-transition-bounce-size', '--theme-transition-bounce-offset', '--theme-transition-settle-size', '--theme-transition-settle-offset'].forEach((property) => root.style.removeProperty(property));
      themeTransitioning.current = false;
      setIsThemeTransitioning(false);
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.assign('/');
  };

  const pokedexActive = pathname === '/' && !favoritesActive;
  const accountActive = pathname.startsWith('/account');

  return <header className="topbar">
    <Link className="brand" href={homeHref} aria-label="DexLab home"><span className="pokeball" aria-hidden="true"><i /></span><span>Dex<span>Lab</span></span></Link>
    <nav aria-label="Primary navigation">
      <Link className={pokedexActive ? 'nav-item is-current' : 'nav-item'} href={pokedexHref} aria-current={pokedexActive ? 'page' : undefined}>Pokédex</Link>
      {user ? <button className={favoritesActive ? 'nav-item nav-favorite is-current' : 'nav-item nav-favorite'} onClick={onFavoritesClick} aria-pressed={favoritesActive}>
        <span className="love-ball small" aria-hidden="true"><i>♥</i></span> Favorites <b>{favoritesCount}</b>
      </button> : null}
      {user ? <><Link className={accountActive ? 'nav-item nav-account is-current' : 'nav-item nav-account'} href="/account" aria-label="Open your trainer home" aria-current={accountActive ? 'page' : undefined}>@{handle ?? user.email?.split('@')[0] ?? 'trainer'}</Link><button className="nav-item nav-signout" onClick={signOut}>Sign out</button></> : user === null ? <Link className="nav-item nav-account" href="/auth">Sign in</Link> : null}
      <button className={`theme-toggle ${theme}`} onClick={toggleTheme} disabled={isThemeTransitioning} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-pressed={theme === 'dark'} title={`${theme === 'light' ? 'Lunatone' : 'Solrock'} mode`}>
        <span className="theme-toggle-glow" aria-hidden="true" /><img src={SOLROCK_IMAGE} alt="" aria-hidden="true" /><img src={LUNATONE_IMAGE} alt="" aria-hidden="true" />
      </button>
    </nav>
  </header>;
}
