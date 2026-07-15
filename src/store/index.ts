import { create } from 'zustand';
import {
  GameSettings, GameStats, GameMode, SongBest, DailyChallengeState, ConversionStatus,
} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACHIEVEMENTS, AchievementContext } from '../constants/achievements';
import { todayKey, yesterdayKey, songKey } from '../utils/daily';

export const PENDING_CONVERSION_KEY = '@melody_rush/pending_conversion';

const DAILY_HISTORY_LIMIT = 60;

export interface RunEndData {
  tilesTapped: number;
  goldenTiles: number;
  playTimeMs: number;
}

interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  gameState: 'idle' | 'playing' | 'paused' | 'gameover' | 'splash' | 'stats';
  gameMode: GameMode;
  settings: GameSettings;
  stats: GameStats;
  songBests: Record<string, SongBest>;
  daily: DailyChallengeState;
  achievements: Record<string, number>; // id -> unlockedAt (epoch ms)
  pendingAchievements: string[];        // newly unlocked, not yet shown
  unlockedSkins: string[];              // ad-unlocked skin ids
  adsRemoved: boolean;

  // Golden tiles across the whole run, surviving ad-continues
  runGoldenTiles: number;

  // Conversion state — lives in the store so it persists across navigation
  conversionStatus: ConversionStatus;
  conversionProgress: number;   // 0-100
  conversionStep: string;
  conversionError: string;
  conversionNoteCount: number;

  setScore: (score: number | ((prev: number) => number)) => void;
  setCombo: (combo: number | ((prev: number) => number)) => void;
  setGameState: (state: GameState['gameState']) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  updateStats: (stats: Partial<GameStats>) => void;
  resetGame: () => void;
  startGame: (mode: GameMode) => void;
  continueGame: () => void;
  recordGameEnd: (run: RunEndData) => void;
  checkAchievements: (extra?: Partial<AchievementContext>) => void;
  clearPendingAchievements: () => void;
  unlockSkin: (skinId: string) => void;
  setAdsRemoved: (removed: boolean) => void;
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
  gamesPlayed: 0,
  totalTilesTapped: 0,
  totalGoldenTiles: 0,
  totalPlayTimeMs: 0,
};

const defaultDaily: DailyChallengeState = {
  streak: 0,
  lastPlayedDate: '',
  bestToday: 0,
  bestTodayDate: '',
  history: {},
};

// Streak is only alive if the last completed daily was today or yesterday
export function effectiveStreak(daily: DailyChallengeState): number {
  if (daily.lastPlayedDate === todayKey() || daily.lastPlayedDate === yesterdayKey()) {
    return daily.streak;
  }
  return 0;
}

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  combo: 0,
  maxCombo: 0,
  gameState: 'splash',
  gameMode: 'endless',
  settings: defaultSettings,
  stats: defaultStats,
  songBests: {},
  daily: defaultDaily,
  achievements: {},
  pendingAchievements: [],
  unlockedSkins: [],
  adsRemoved: false,
  runGoldenTiles: 0,

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
  resetGame: () => set({ score: 0, combo: 0, maxCombo: 0, runGoldenTiles: 0 }),
  startGame: (mode) => {
    const stats = { ...get().stats, gamesPlayed: get().stats.gamesPlayed + 1 };
    AsyncStorage.setItem('stats', JSON.stringify(stats));
    set({
      score: 0, combo: 0, maxCombo: 0, runGoldenTiles: 0,
      gameMode: mode, stats, gameState: 'playing',
    });
  },
  continueGame: () => set({ gameState: 'playing' }),

  // Called whenever a run segment ends (game over or quit). Updates lifetime
  // stats, per-song bests, daily challenge progress, then checks achievements.
  recordGameEnd: (run) => {
    const state = get();
    const { score, maxCombo, gameMode, settings } = state;

    const runGoldenTiles = state.runGoldenTiles + run.goldenTiles;

    const stats: GameStats = {
      ...state.stats,
      highScore: Math.max(state.stats.highScore, score),
      bestCombo: Math.max(state.stats.bestCombo, maxCombo),
      totalTilesTapped: state.stats.totalTilesTapped + run.tilesTapped,
      totalGoldenTiles: state.stats.totalGoldenTiles + run.goldenTiles,
      totalPlayTimeMs: state.stats.totalPlayTimeMs + run.playTimeMs,
    };
    AsyncStorage.setItem('stats', JSON.stringify(stats));

    // Per-song best (endless mode only — daily always uses the default song)
    let songBests = state.songBests;
    if (gameMode === 'endless') {
      const key = songKey(settings.customSongName, settings.customMelody);
      const prev = songBests[key];
      songBests = {
        ...songBests,
        [key]: {
          name: settings.customSongName ?? 'Default Song',
          highScore: Math.max(prev?.highScore ?? 0, score),
          bestCombo: Math.max(prev?.bestCombo ?? 0, maxCombo),
          plays: (prev?.plays ?? 0) + 1,
        },
      };
      AsyncStorage.setItem('songBests', JSON.stringify(songBests));
    }

    // Daily challenge: best-of-day + streak
    let daily = state.daily;
    if (gameMode === 'daily' && score > 0) {
      const today = todayKey();
      let streak = daily.streak;
      if (daily.lastPlayedDate !== today) {
        streak = daily.lastPlayedDate === yesterdayKey() ? daily.streak + 1 : 1;
      }
      const bestToday = daily.bestTodayDate === today ? Math.max(daily.bestToday, score) : score;
      const history = { ...daily.history, [today]: Math.max(daily.history[today] ?? 0, score) };
      // Trim history to the most recent entries
      const keys = Object.keys(history).sort();
      while (keys.length > DAILY_HISTORY_LIMIT) delete history[keys.shift()!];

      daily = { streak, lastPlayedDate: today, bestToday, bestTodayDate: today, history };
      AsyncStorage.setItem('daily', JSON.stringify(daily));
    }

    set({ stats, songBests, daily, runGoldenTiles });
    get().checkAchievements({ score, maxCombo, runGoldenTiles });
  },

  checkAchievements: (extra) => {
    const state = get();
    const ctx: AchievementContext = {
      stats: state.stats,
      score: 0,
      maxCombo: 0,
      runGoldenTiles: 0,
      streak: effectiveStreak(state.daily),
      hasCustomSong: !!state.settings.customSongName,
      ...extra,
    };

    const newlyUnlocked = ACHIEVEMENTS.filter(
      a => !state.achievements[a.id] && a.check(ctx),
    );
    if (newlyUnlocked.length === 0) return;

    const now = Date.now();
    const achievements = { ...state.achievements };
    for (const a of newlyUnlocked) achievements[a.id] = now;
    AsyncStorage.setItem('achievements', JSON.stringify(achievements));

    set({
      achievements,
      pendingAchievements: [...state.pendingAchievements, ...newlyUnlocked.map(a => a.id)],
    });
  },

  clearPendingAchievements: () => set({ pendingAchievements: [] }),

  unlockSkin: (skinId) => set((state) => {
    if (state.unlockedSkins.includes(skinId)) return {};
    const unlockedSkins = [...state.unlockedSkins, skinId];
    AsyncStorage.setItem('unlockedSkins', JSON.stringify(unlockedSkins));
    return { unlockedSkins };
  }),

  setAdsRemoved: (removed) => {
    AsyncStorage.setItem('adsRemoved', JSON.stringify(removed));
    set({ adsRemoved: removed });
  },

  loadInitialData: async () => {
    try {
      const [storedSettings, storedStats, storedSongBests, storedDaily, storedAchievements, storedSkins, storedAdsRemoved] =
        await Promise.all([
          AsyncStorage.getItem('settings'),
          AsyncStorage.getItem('stats'),
          AsyncStorage.getItem('songBests'),
          AsyncStorage.getItem('daily'),
          AsyncStorage.getItem('achievements'),
          AsyncStorage.getItem('unlockedSkins'),
          AsyncStorage.getItem('adsRemoved'),
        ]);
      if (storedSettings) set({ settings: { ...defaultSettings, ...JSON.parse(storedSettings) } });
      // Merge over defaults so installs upgrading from the old 2-field stats work
      if (storedStats) set({ stats: { ...defaultStats, ...JSON.parse(storedStats) } });
      if (storedSongBests) set({ songBests: JSON.parse(storedSongBests) });
      if (storedDaily) set({ daily: { ...defaultDaily, ...JSON.parse(storedDaily) } });
      if (storedAchievements) set({ achievements: JSON.parse(storedAchievements) });
      if (storedSkins) set({ unlockedSkins: JSON.parse(storedSkins) });
      if (storedAdsRemoved) set({ adsRemoved: JSON.parse(storedAdsRemoved) === true });
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
