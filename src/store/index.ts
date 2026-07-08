import { create } from 'zustand';
import { GameSettings, GameStats, ConversionStatus } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PENDING_CONVERSION_KEY = '@melody_rush/pending_conversion';

interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  gameState: 'idle' | 'playing' | 'paused' | 'gameover' | 'splash';
  settings: GameSettings;
  stats: GameStats;

  // Conversion state — lives in the store so it persists across navigation
  conversionStatus: ConversionStatus;
  conversionProgress: number;   // 0-100
  conversionStep: string;
  conversionError: string;
  conversionNoteCount: number;

  setScore: (score: number | ((prev: number) => number)) => void;
  setCombo: (combo: number | ((prev: number) => number)) => void;
  setGameState: (state: 'idle' | 'playing' | 'paused' | 'gameover' | 'splash') => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  updateStats: (stats: Partial<GameStats>) => void;
  resetGame: () => void;
  continueGame: () => void;
  loadInitialData: () => Promise<void>;

  setConversionProgress: (progress: number, step: string) => void;
  setConversionStatus: (status: ConversionStatus, opts?: { error?: string; noteCount?: number }) => void;
  resetConversion: () => void;
}

const defaultSettings: GameSettings = {
  musicEnabled: true,
  soundEnabled: true,
  volume: 1,
  vibration: true,
  theme: 'dark',
};

const defaultStats: GameStats = {
  highScore: 0,
  bestCombo: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  combo: 0,
  maxCombo: 0,
  gameState: 'splash',
  settings: defaultSettings,
  stats: defaultStats,

  conversionStatus: 'idle',
  conversionProgress: 0,
  conversionStep: '',
  conversionError: '',
  conversionNoteCount: 0,

  setScore: (scoreOrUpdater) => set((state) => {
    const newScore = typeof scoreOrUpdater === 'function' ? scoreOrUpdater(state.score) : scoreOrUpdater;
    return { score: newScore };
  }),
  setCombo: (comboOrUpdater) => set((state) => {
    const newCombo = typeof comboOrUpdater === 'function' ? comboOrUpdater(state.combo) : comboOrUpdater;
    const newMaxCombo = Math.max(state.maxCombo, newCombo);
    return { combo: newCombo, maxCombo: newMaxCombo };
  }),
  setGameState: (gameState) => set({ gameState }),
  updateSettings: (newSettings) => set((state) => {
    const settings = { ...state.settings, ...newSettings };
    AsyncStorage.setItem('settings', JSON.stringify(settings));
    return { settings };
  }),
  updateStats: (newStats) => set((state) => {
    const stats = { ...state.stats, ...newStats };
    AsyncStorage.setItem('stats', JSON.stringify(stats));
    return { stats };
  }),
  resetGame: () => set({ score: 0, combo: 0, maxCombo: 0 }),
  continueGame: () => set({ gameState: 'playing' }),
  loadInitialData: async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('settings');
      const storedStats = await AsyncStorage.getItem('stats');
      if (storedSettings) set({ settings: JSON.parse(storedSettings) });
      if (storedStats) set({ stats: JSON.parse(storedStats) });
    } catch (e) {
      console.error('Failed to load initial data', e);
    }
  },

  setConversionProgress: (progress, step) => set({
    conversionStatus: 'converting',
    conversionProgress: progress,
    conversionStep: step,
  }),
  setConversionStatus: (status, opts) => set({
    conversionStatus: status,
    conversionError: opts?.error ?? '',
    conversionNoteCount: opts?.noteCount ?? 0,
    ...(status !== 'converting' ? { conversionProgress: status === 'success' ? 100 : 0, conversionStep: '' } : {}),
  }),
  resetConversion: () => set({
    conversionStatus: 'idle',
    conversionProgress: 0,
    conversionStep: '',
    conversionError: '',
    conversionNoteCount: 0,
  }),
}));
