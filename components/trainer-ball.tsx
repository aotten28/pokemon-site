import type { CSSProperties } from 'react';

export const TRAINER_BALLS = [
  ['poke', 'Poké Ball', '#ed799b', '#ffffff'], ['great', 'Great Ball', '#4d8fd9', '#ffffff'], ['ultra', 'Ultra Ball', '#222735', '#f2cf55'], ['master', 'Master Ball', '#8a5ba6', '#efb3d0'],
  ['premier', 'Premier Ball', '#ffffff', '#ffffff'], ['luxury', 'Luxury Ball', '#22252b', '#1e1e1e'], ['heal', 'Heal Ball', '#f4a6c4', '#f7e6f2'], ['quick', 'Quick Ball', '#3f80d7', '#f5df45'],
  ['dusk', 'Dusk Ball', '#3f6a48', '#253c32'], ['dive', 'Dive Ball', '#6ba8d6', '#ffffff'], ['net', 'Net Ball', '#579fb1', '#f5e0a7'], ['nest', 'Nest Ball', '#7fa65a', '#f5df96'],
  ['repeat', 'Repeat Ball', '#e5a447', '#f8df9a'], ['timer', 'Timer Ball', '#f4f0df', '#f4f0df'], ['friend', 'Friend Ball', '#72af7c', '#fff3d7'], ['love', 'Love Ball', '#ed83a4', '#fff0f3'],
  ['level', 'Level Ball', '#e0a13b', '#fff4d2'], ['lure', 'Lure Ball', '#5e9bd3', '#f5f5f5'], ['moon', 'Moon Ball', '#5669af', '#ececff'], ['heavy', 'Heavy Ball', '#59616d', '#d5d9dd'],
  ['fast', 'Fast Ball', '#e8c142', '#fff4cb'], ['dream', 'Dream Ball', '#be81c4', '#f6e4fc'], ['beast', 'Beast Ball', '#4c6599', '#e7e9ff'], ['cherish', 'Cherish Ball', '#d34d52', '#252631'],
] as const;

export type TrainerBallId = typeof TRAINER_BALLS[number][0];
export const isTrainerBallId = (value: string | null | undefined): value is TrainerBallId => TRAINER_BALLS.some(([id]) => id === value);

export function TrainerBall({ ball = 'poke', size = 76 }: { ball?: TrainerBallId; size?: number }) {
  const item = TRAINER_BALLS.find(([id]) => id === ball) ?? TRAINER_BALLS[0];
  const [, label, top, bottom] = item;
  const style = { '--ball-top': top, '--ball-bottom': bottom } as CSSProperties;
  const markings = (() => {
    switch (ball) {
      case 'great': return <><path d="M18 15h64l-9 24H27z" fill="#d7444e" /><path d="M25 11h50l-5 10H30z" fill="#fff" /></>;
      case 'ultra': return <><path d="M12 10h18l8 32H20zm58 0h18l-8 32H62z" fill="#f0d047" /><path d="M36 9h28l-3 17H39z" fill="#f0d047" /></>;
      case 'master': return <><path d="M16 17q11-14 22 0M62 17q11-14 22 0" fill="none" stroke="#e7a2c7" strokeWidth="8" /><path d="M31 38l8-22 11 15 11-15 8 22" fill="none" stroke="#f2d9ee" strokeWidth="6" /></>;
      case 'premier': return <path d="M12 16q38-22 76 0M23 29q27-11 54 0" fill="none" stroke="#d9505d" strokeWidth="5" />;
      case 'luxury': return <><path d="M13 37L31 12h38l18 25" fill="none" stroke="#d4ad45" strokeWidth="6" /><path d="M22 16h56" stroke="#d4ad45" strokeWidth="5" /></>;
      case 'heal': return <><path d="M16 25q10-14 22 0l12 13 12-13q12-14 22 0" fill="none" stroke="#fff" strokeWidth="7" /><circle cx="50" cy="18" r="5" fill="#bd75b2" /></>;
      case 'quick': return <path d="M9 14l20 6 8 19 13-28 13 28 8-19 20-6-14 26H23z" fill="#f3d34d" />;
      case 'dusk': return <><path d="M10 25l17-14 11 22 12-22 12 22 11-22 17 14" fill="none" stroke="#d3d15b" strokeWidth="7" /><path d="M17 40h66" stroke="#95b959" strokeWidth="5" /></>;
      case 'dive': return <><path d="M12 23q18-13 36 0t40 0" fill="none" stroke="#fff" strokeWidth="7" /><path d="M12 34q18-13 36 0t40 0" fill="none" stroke="#fff" strokeWidth="5" /></>;
      case 'net': return <path d="M10 10l80 37M90 10L10 47M23 7l27 42M77 7L50 49" stroke="#f7dc93" strokeWidth="5" />;
      case 'nest': return <><path d="M11 35q18-28 39 0Q71 7 89 35" fill="none" stroke="#f4dc80" strokeWidth="7" /><path d="M29 12l10 27M50 8v31M71 12L61 39" stroke="#467e45" strokeWidth="5" /></>;
      case 'repeat': return <><path d="M13 14h74v26H13z" fill="#f3d15e" /><path d="M22 15v24m18-24v24m18-24v24m18-24v24" stroke="#df514c" strokeWidth="6" /></>;
      case 'timer': return <><path d="M16 13h68v28H16z" fill="#f2d66b" /><path d="M26 13v28m24-28v28m24-28v28" stroke="#d95754" strokeWidth="7" /><path d="M16 12h68" stroke="#3e81c4" strokeWidth="5" /></>;
      case 'friend': return <><path d="M16 22q16-17 34 0 18-17 34 0" fill="none" stroke="#e55d69" strokeWidth="7" /><path d="M50 9l7 10-7 10-7-10z" fill="#f7d254" /></>;
      case 'love': return <path d="M50 37C13 16 25 4 38 12l12 9 12-9C75 4 87 16 50 37z" fill="#fff" />;
      case 'level': return <><path d="M15 13h18v28H15zm52 0h18v28H67z" fill="#242631" /><path d="M39 11h22v29H39z" fill="#e54d50" /></>;
      case 'lure': return <><path d="M20 10l10 30 20-18 20 18 10-30" fill="none" stroke="#f3c94e" strokeWidth="6" /><circle cx="50" cy="19" r="7" fill="#fff" /></>;
      case 'moon': return <path d="M63 11a17 17 0 1 0 10 28A22 22 0 1 1 63 11z" fill="#f2d66f" />;
      case 'heavy': return <><path d="M12 15h76v25H12z" fill="#313942" /><path d="M29 13v28m42-28v28" stroke="#d9e1e6" strokeWidth="7" /></>;
      case 'fast': return <path d="M12 13h22l8 26 8-26h16l8 26 14-26" fill="none" stroke="#ef534e" strokeWidth="8" />;
      case 'dream': return <><path d="M13 32q12-23 24 0 13-30 26 0 12-23 24 0" fill="none" stroke="#fff" strokeWidth="6" /><circle cx="50" cy="16" r="6" fill="#e7d1fa" /></>;
      case 'beast': return <><path d="M10 14l19 9 11-13 10 19 10-19 11 13 19-9-11 28H21z" fill="#e7eaff" /><path d="M22 14l9 26m47-26l-9 26" stroke="#e24c68" strokeWidth="5" /></>;
      case 'cherish': return <><path d="M12 13h76v27H12z" fill="#2e3039" /><path d="M25 13v27m50-27v27" stroke="#d8b849" strokeWidth="6" /><circle cx="50" cy="24" r="8" fill="#d34d52" /></>;
      default: return null;
    }
  })();
  return <svg className="trainer-ball-svg" style={style} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={label}>
    <defs><clipPath id={`clip-${ball}`}><circle cx="50" cy="50" r="46" /></clipPath><linearGradient id={`top-${ball}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff" stopOpacity=".34" /><stop offset=".4" stopColor="var(--ball-top)" /><stop offset="1" stopColor="#100d14" stopOpacity=".16" /></linearGradient><linearGradient id={`bottom-${ball}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff" stopOpacity=".5" /><stop offset=".65" stopColor="var(--ball-bottom)" /><stop offset="1" stopColor="#100d14" stopOpacity=".14" /></linearGradient><radialGradient id={`shine-${ball}`} cx="30%" cy="18%" r="64%"><stop stopColor="#fff" stopOpacity=".52" /><stop offset=".35" stopColor="#fff" stopOpacity=".08" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient></defs>
    <g clipPath={`url(#clip-${ball})`}><rect x="0" y="48" width="100" height="52" fill={`url(#bottom-${ball})`} /><path d="M0 0h100v48H0z" fill={`url(#top-${ball})`} />
      {markings}
      <ellipse cx="37" cy="23" rx="27" ry="18" fill={`url(#shine-${ball})`} /><path d="M8 57q42 13 84 0" fill="none" stroke="#16121a" strokeOpacity=".14" strokeWidth="3" />
    </g><path d="M4 50h92" stroke="#18141d" strokeWidth="11" /><path d="M7 48h86" stroke="#fff" strokeOpacity=".18" strokeWidth="1.5" /><circle cx="50" cy="50" r="15" fill="#17131b" /><circle cx="50" cy="50" r="11" fill="#fff" stroke="#312735" strokeWidth="2" /><circle cx="47" cy="46" r="4" fill="#fff" fillOpacity=".75" /><circle cx="50" cy="50" r="46" fill="none" stroke="#18141d" strokeWidth="7" /><circle cx="50" cy="50" r="42" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="1.25" />
  </svg>;
}
