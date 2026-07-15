import React, { useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, BackHandler,
} from 'react-native';
import { useGameStore, effectiveStreak } from '../../store';
import {
  SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, ColorPalette,
} from '../../constants/theme';
import { useColors, useGlobalStyles } from '../../hooks/useTheme';
import { AdBanner } from '../../components/AdBanner';
import { ACHIEVEMENTS } from '../../constants/achievements';

function formatPlayTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  return `${hours}h ${totalMinutes % 60}m`;
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: { marginBottom: SPACING.xxl },
  title: {
    fontSize: FONT_SIZE.h1,
    fontWeight: FONT_WEIGHT.bold,
    color: C.text,
    letterSpacing: 5,
  },
  titleUnderline: {
    marginTop: SPACING.sm,
    width: 40,
    height: 2,
    backgroundColor: C.primary,
    borderRadius: RADIUS.full,
  },
  section: { marginBottom: SPACING.xxl },
  sectionLabel: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.bold,
    color: C.textMuted,
    letterSpacing: 3,
    marginBottom: SPACING.md,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE.h2,
    fontWeight: FONT_WEIGHT.bold,
    color: C.primary,
    marginTop: SPACING.xs,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.xl,
  },
  streakValue: {
    fontSize: FONT_SIZE.displayLg,
    fontWeight: FONT_WEIGHT.bold,
    color: C.warning,
  },
  streakLabel: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.bodySm,
    marginTop: 2,
  },
  dailyHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.glassBorder,
  },
  dailyHistoryDate: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.bodySm,
  },
  dailyHistoryScore: {
    color: C.text,
    fontSize: FONT_SIZE.bodySm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  songCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  songName: {
    color: C.text,
    fontSize: FONT_SIZE.bodyMd,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.xs,
  },
  songStatsRow: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  songStat: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.bodySm,
  },
  songStatValue: {
    color: C.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  emptyText: {
    color: C.textMuted,
    fontSize: FONT_SIZE.bodySm,
    fontStyle: 'italic',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  achievementLocked: {
    opacity: 0.45,
  },
  achievementIcon: {
    fontSize: FONT_SIZE.h2,
    width: 36,
    textAlign: 'center',
  },
  achievementTitle: {
    color: C.text,
    fontSize: FONT_SIZE.bodyMd,
    fontWeight: FONT_WEIGHT.semibold,
  },
  achievementDesc: {
    color: C.textMuted,
    fontSize: FONT_SIZE.caption,
    marginTop: 1,
  },
  achievementDone: {
    marginLeft: 'auto',
    color: C.success,
    fontSize: FONT_SIZE.bodyMd,
    fontWeight: FONT_WEIGHT.bold,
  },
  progressText: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.bodySm,
    marginBottom: SPACING.md,
  },
  backButton: { width: '100%', marginTop: SPACING.sm },
});

export const StatsScreen = () => {
  const { stats, songBests, daily, achievements, setGameState } = useGameStore();
  const C = useColors();
  const gs = useGlobalStyles();
  const styles = useMemo(() => makeStyles(C), [C]);
  const streak = effectiveStreak(daily);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setGameState('idle');
      return true;
    });
    return () => sub.remove();
  }, []);

  const recentDailies = useMemo(
    () => Object.entries(daily.history).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 7),
    [daily.history],
  );

  const songs = useMemo(
    () => Object.values(songBests).sort((a, b) => b.highScore - a.highScore),
    [songBests],
  );

  const unlockedCount = ACHIEVEMENTS.filter(a => achievements[a.id]).length;

  return (
    <Animated.View style={[gs.container, { opacity: fadeAnim }]}>
      <AdBanner
        unitId="ca-app-pub-2672637411464206/9278549209"
        placement="StatsScreen TopBannerAd"
        position="top"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>STATS</Text>
          <View style={styles.titleUnderline} />
        </View>

        {/* ── Overview ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OVERVIEW</Text>
          <View style={styles.statGrid}>
            <View style={[gs.glassCard, styles.statCard]}>
              <Text style={gs.label}>High Score</Text>
              <Text style={styles.statValue}>{stats.highScore.toLocaleString()}</Text>
            </View>
            <View style={[gs.glassCard, styles.statCard]}>
              <Text style={gs.label}>Best Combo</Text>
              <Text style={styles.statValue}>{stats.bestCombo}x</Text>
            </View>
            <View style={[gs.glassCard, styles.statCard]}>
              <Text style={gs.label}>Games Played</Text>
              <Text style={styles.statValue}>{stats.gamesPlayed.toLocaleString()}</Text>
            </View>
            <View style={[gs.glassCard, styles.statCard]}>
              <Text style={gs.label}>Tiles Tapped</Text>
              <Text style={styles.statValue}>{stats.totalTilesTapped.toLocaleString()}</Text>
            </View>
            <View style={[gs.glassCard, styles.statCard]}>
              <Text style={gs.label}>Golden Tiles</Text>
              <Text style={styles.statValue}>{stats.totalGoldenTiles.toLocaleString()}</Text>
            </View>
            <View style={[gs.glassCard, styles.statCard]}>
              <Text style={gs.label}>Play Time</Text>
              <Text style={styles.statValue}>{formatPlayTime(stats.totalPlayTimeMs)}</Text>
            </View>
          </View>
        </View>

        {/* ── Daily challenge ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DAILY CHALLENGE</Text>
          <View style={[gs.glassCard, styles.streakCard]}>
            <View>
              <Text style={styles.streakValue}>🔥 {streak}</Text>
              <Text style={styles.streakLabel}>
                {streak > 0 ? 'day streak — keep it going!' : 'Play today to start a streak'}
              </Text>
            </View>
          </View>
          {recentDailies.length > 0 && (
            <View style={[gs.glassCard, { padding: SPACING.lg, marginTop: SPACING.md }]}>
              {recentDailies.map(([date, best]) => (
                <View key={date} style={styles.dailyHistoryRow}>
                  <Text style={styles.dailyHistoryDate}>{date}</Text>
                  <Text style={styles.dailyHistoryScore}>{best.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Per-song bests ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SONG BESTS</Text>
          {songs.length === 0 && (
            <Text style={styles.emptyText}>Play a game to record your first song best.</Text>
          )}
          {songs.map(song => (
            <View key={song.name + song.plays} style={[gs.glassCard, styles.songCard]}>
              <Text style={styles.songName} numberOfLines={1}>{song.name}</Text>
              <View style={styles.songStatsRow}>
                <Text style={styles.songStat}>
                  Best <Text style={styles.songStatValue}>{song.highScore.toLocaleString()}</Text>
                </Text>
                <Text style={styles.songStat}>
                  Combo <Text style={styles.songStatValue}>{song.bestCombo}x</Text>
                </Text>
                <Text style={styles.songStat}>
                  Plays <Text style={styles.songStatValue}>{song.plays}</Text>
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Achievements ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
          <Text style={styles.progressText}>
            {unlockedCount} / {ACHIEVEMENTS.length} unlocked
          </Text>
          {ACHIEVEMENTS.map(a => {
            const unlocked = !!achievements[a.id];
            return (
              <View
                key={a.id}
                style={[gs.glassCard, styles.achievementRow, !unlocked && styles.achievementLocked]}
              >
                <Text style={styles.achievementIcon}>{unlocked ? a.icon : '🔒'}</Text>
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.achievementTitle}>{a.title}</Text>
                  <Text style={styles.achievementDesc}>{a.description}</Text>
                </View>
                {unlocked && <Text style={styles.achievementDone}>✓</Text>}
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[gs.secondaryButton, styles.backButton]}
          activeOpacity={0.75}
          onPress={() => setGameState('idle')}
        >
          <Text style={[gs.buttonText, { color: C.textSecondary, letterSpacing: 3 }]}>BACK</Text>
        </TouchableOpacity>
      </ScrollView>

      <AdBanner
        unitId="ca-app-pub-2672637411464206/5007118973"
        placement="StatsScreen BannerAd"
        position="bottom"
      />
    </Animated.View>
  );
};
