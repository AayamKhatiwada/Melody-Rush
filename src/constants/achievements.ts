import { GameStats } from '../types';

// Context available when achievements are evaluated (at game end, after a
// daily run, or after importing a custom song)
export interface AchievementContext {
  stats: GameStats;
  score: number;        // score of the run that just ended (0 outside runs)
  maxCombo: number;     // max combo of the run that just ended
  runGoldenTiles: number; // golden tiles hit in the current run (across continues)
  streak: number;       // current daily challenge streak
  hasCustomSong: boolean;
}

export interface AchievementDef {
  id: string;
  icon: string;
  title: string;
  description: string;
  check: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Combo
  { id: 'combo-25', icon: '⚡', title: 'Warming Up', description: 'Reach a 25x combo', check: c => c.maxCombo >= 25 },
  { id: 'combo-50', icon: '🔗', title: 'Chain Reaction', description: 'Reach a 50x combo', check: c => c.maxCombo >= 50 },
  { id: 'combo-100', icon: '💯', title: 'Century Streak', description: 'Reach a 100x combo', check: c => c.maxCombo >= 100 },
  { id: 'combo-250', icon: '🌀', title: 'Unstoppable', description: 'Reach a 250x combo', check: c => c.maxCombo >= 250 },

  // Score
  { id: 'score-1k', icon: '🎯', title: 'Getting Good', description: 'Score 1,000 in one run', check: c => c.score >= 1000 },
  { id: 'score-5k', icon: '🚀', title: 'High Flyer', description: 'Score 5,000 in one run', check: c => c.score >= 5000 },
  { id: 'score-25k', icon: '👑', title: 'Melody Master', description: 'Score 25,000 in one run', check: c => c.score >= 25000 },

  // Golden tiles
  { id: 'golden-3', icon: '⭐', title: 'Gold Digger', description: 'Hit 3 golden tiles in one run', check: c => c.runGoldenTiles >= 3 },
  { id: 'golden-10', icon: '🌟', title: 'Fever Dream', description: 'Hit 10 golden tiles in one run', check: c => c.runGoldenTiles >= 10 },

  // Volume
  { id: 'games-10', icon: '🎮', title: 'Regular', description: 'Play 10 games', check: c => c.stats.gamesPlayed >= 10 },
  { id: 'games-100', icon: '🏟️', title: 'Veteran', description: 'Play 100 games', check: c => c.stats.gamesPlayed >= 100 },
  { id: 'tiles-1k', icon: '🎹', title: 'Piano Fingers', description: 'Tap 1,000 tiles in total', check: c => c.stats.totalTilesTapped >= 1000 },
  { id: 'tiles-10k', icon: '🎼', title: 'Virtuoso', description: 'Tap 10,000 tiles in total', check: c => c.stats.totalTilesTapped >= 10000 },

  // Daily streaks
  { id: 'streak-3', icon: '🔥', title: 'On a Roll', description: '3-day daily challenge streak', check: c => c.streak >= 3 },
  { id: 'streak-7', icon: '🗓️', title: 'One Full Week', description: '7-day daily challenge streak', check: c => c.streak >= 7 },
  { id: 'streak-30', icon: '🏆', title: 'Iron Will', description: '30-day daily challenge streak', check: c => c.streak >= 30 },

  // Misc
  { id: 'custom-song', icon: '🎵', title: 'DJ Mode', description: 'Import your own song', check: c => c.hasCustomSong },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map(a => [a.id, a]),
);
