// Tile skins: change the look of normal tiles and the hit zone in-game.
// Unlocked either by earning an achievement or by watching a rewarded ad.

export type SkinUnlock =
  | { type: 'free' }
  | { type: 'achievement'; achievementId: string }
  | { type: 'ad' };

export interface TileSkin {
  id: string;
  name: string;
  tileBackground: string;
  accent: string; // border + glow + hit zone color
  unlock: SkinUnlock;
}

export const DEFAULT_SKIN_ID = 'neon-blue';

export const TILE_SKINS: TileSkin[] = [
  {
    id: 'neon-blue',
    name: 'Neon Blue',
    tileBackground: '#0D0D0D',
    accent: '#00C2FF',
    unlock: { type: 'free' },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    tileBackground: '#0A140D',
    accent: '#32FF7E',
    unlock: { type: 'achievement', achievementId: 'combo-50' },
  },
  {
    id: 'magma',
    name: 'Magma',
    tileBackground: '#160B08',
    accent: '#FF6B35',
    unlock: { type: 'achievement', achievementId: 'games-10' },
  },
  {
    id: 'royal',
    name: 'Royal',
    tileBackground: '#100A1E',
    accent: '#8B5CF6',
    unlock: { type: 'achievement', achievementId: 'streak-3' },
  },
  {
    id: 'gold-rush',
    name: 'Gold Rush',
    tileBackground: '#171204',
    accent: '#FFD93D',
    unlock: { type: 'ad' },
  },
  {
    id: 'crimson',
    name: 'Crimson',
    tileBackground: '#170709',
    accent: '#FF4D6D',
    unlock: { type: 'ad' },
  },
];

export const SKIN_MAP: Record<string, TileSkin> = Object.fromEntries(
  TILE_SKINS.map(s => [s.id, s]),
);

export function getSkin(id: string | undefined): TileSkin {
  return (id && SKIN_MAP[id]) || SKIN_MAP[DEFAULT_SKIN_ID];
}
