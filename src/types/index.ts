export interface TileData {
  id: string;
  lane: number;
  y: number;
  speed: number;
  type: 'normal' | 'bomb' | 'golden';
  isHit: boolean;
}

export type GameMode = 'endless' | 'daily';

export interface GameSettings {
  musicEnabled: boolean;
  soundEnabled: boolean;
  volume: number;
  vibration: boolean;
  theme: 'dark' | 'light';
  activeSkin?: string;
  customSongName?: string;
  customSongUri?: string;
  customMelody?: string[];
}

export interface GameStats {
  highScore: number;
  bestCombo: number;
  gamesPlayed: number;
  totalTilesTapped: number;
  totalGoldenTiles: number;
  totalPlayTimeMs: number;
}

export interface SongBest {
  name: string;
  highScore: number;
  bestCombo: number;
  plays: number;
}

export interface DailyChallengeState {
  streak: number;
  // YYYY-MM-DD of the last day a daily run was completed
  lastPlayedDate: string;
  bestToday: number;
  bestTodayDate: string;
  // date -> best score for that day (recent days only)
  history: Record<string, number>;
}

export type ConversionStatus = 'idle' | 'converting' | 'success' | 'error';

export interface PendingConversion {
  fileUri: string;
  fileName: string;
}
