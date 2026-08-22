import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DexLab — Explore the Original 151 Pokémon',
  description: 'A beautifully simple, client-driven Pokédex for discovering the original 151 Pokémon.',
  openGraph: {
    title: 'DexLab — Every Pokémon. One adventure.',
    description: 'Explore the original 151 Pokémon and build your team of favorites.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DexLab — Every Pokémon. One adventure.',
    description: 'Explore the original 151 Pokémon and build your team of favorites.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
