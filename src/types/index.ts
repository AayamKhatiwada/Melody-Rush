export interface TileData {
  id: string;
  lane: number;
  y: number;
  speed: number;
  type: 'normal' | 'bomb' | 'golden';
  isHit: boolean;
}

export interface GameSettings {
  musicEnabled: boolean;
  soundEnabled: boolean;
  volume: number;
  vibration: boolean;
  theme: 'dark' | 'light';
  customSongName?: string;
  customSongUri?: string;
  customMelody?: string[];
}

export interface GameStats {
  highScore: number;
  bestCombo: number;
}

export type ConversionStatus = 'idle' | 'converting' | 'success' | 'error';

export interface PendingConversion {
  fileUri: string;
  fileName: string;
}
