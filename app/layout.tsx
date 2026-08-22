import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DexLab — Explore Every Pokémon Generation',
  description: 'A beautifully simple, client-driven National Pokédex for discovering Pokémon from every generation.',
  openGraph: {
    title: 'DexLab — Every Pokémon. One adventure.',
    description: 'Explore Pokémon from every generation and build your team of favorites.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DexLab — Every Pokémon. One adventure.',
    description: 'Explore Pokémon from every generation and build your team of favorites.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
