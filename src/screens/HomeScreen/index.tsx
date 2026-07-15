import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useGameStore, effectiveStreak } from '../../store';
import { SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS, ColorPalette } from '../../constants/theme';
import { useColors, useGlobalStyles } from '../../hooks/useTheme';
import { AdBanner } from '../../components/AdBanner';
import { todayKey } from '../../utils/daily';

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  bgLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: C.text === '#FFFFFF'
      ? 'rgba(255,255,255,0.03)'
      : 'rgba(0,0,0,0.04)',
  },
  logoText: {
    fontSize: FONT_SIZE.displayXL,
    fontWeight: FONT_WEIGHT.bold,
    color: C.text,
    letterSpacing: 8,
    ...SHADOWS.neonBlue,
  },
  logoAccent: {
    fontSize: FONT_SIZE.displayXL,
    fontWeight: FONT_WEIGHT.bold,
    color: C.primary,
    letterSpacing: 8,
    marginTop: -SPACING.md,
    ...SHADOWS.neonBlue,
  },
  tagline: {
    fontSize: FONT_SIZE.caption,
    color: C.textMuted,
    letterSpacing: 4,
    marginTop: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xxxl,
    width: '100%',
  },
  statCard: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE.h2,
    fontWeight: FONT_WEIGHT.bold,
    color: C.primary,
    marginTop: SPACING.xs,
    ...SHADOWS.neonBlue,
  },
  buttonSection: {
    width: '100%',
    gap: SPACING.md,
  },
  settingsButton: {
    marginTop: SPACING.xs,
  },
  dailyButton: {
    height: 56,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: C.warning,
    backgroundColor: 'rgba(255,184,0,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  dailyButtonText: {
    color: C.warning,
    fontSize: FONT_SIZE.bodyLg,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 2,
  },
  streakBadge: {
    backgroundColor: 'rgba(255,184,0,0.18)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 2,
  },
  streakBadgeText: {
    color: C.warning,
    fontSize: FONT_SIZE.bodySm,
    fontWeight: FONT_WEIGHT.bold,
  },
  dailyDoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.success,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: C.primary,
    opacity: 0.3,
    ...SHADOWS.neonBlue,
  },
});

export const HomeScreen = () => {
  const { setGameState, stats, startGame, daily } = useGameStore();
  const streak = effectiveStreak(daily);
  const playedToday = daily.lastPlayedDate === todayKey();
  const C = useColors();
  const gs = useGlobalStyles();
  const styles = useMemo(() => makeStyles(C), [C]);

  const glowAnim = useRef(new Animated.Value(0.6)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[gs.container, { opacity: fadeAnim }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[styles.bgLine, { left: `${(i + 1) * 20}%` as any }]} />
        ))}
      </View>

      <AdBanner
        unitId="ca-app-pub-2672637411464206/9278549209"
        placement="HomeScreen TopBannerAd"
        position="top"
      />

      <View style={styles.content}>
        <View style={{ alignItems: 'center', marginBottom: SPACING.xxxl + SPACING.xl }}>
          <Animated.Text style={[styles.logoText, { opacity: glowAnim }]}>MELODY</Animated.Text>
          <Text style={styles.logoAccent}>RUSH</Text>
          <Text style={styles.tagline}>TAP TO THE BEAT</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[gs.glassCard, styles.statCard]}>
            <Text style={gs.label}>High Score</Text>
            <Text style={styles.statValue}>{stats.highScore.toLocaleString()}</Text>
          </View>
          <View style={[gs.glassCard, styles.statCard]}>
            <Text style={gs.label}>Best Combo</Text>
            <Text style={styles.statValue}>{stats.bestCombo}x</Text>
          </View>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity style={gs.primaryButton} activeOpacity={0.85} onPress={() => startGame('endless')}>
            <Text style={[gs.buttonText, { letterSpacing: 3 }]}>PLAY NOW</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dailyButton} activeOpacity={0.8} onPress={() => startGame('daily')}>
            {playedToday && <View style={styles.dailyDoneDot} />}
            <Text style={styles.dailyButtonText}>DAILY CHALLENGE</Text>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakBadgeText}>🔥 {streak}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={gs.secondaryButton} activeOpacity={0.75} onPress={() => setGameState('stats')}>
            <Text style={[gs.buttonText, { color: C.textSecondary }]}>STATS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[gs.secondaryButton, styles.settingsButton]} activeOpacity={0.75} onPress={() => setGameState('paused')}>
            <Text style={[gs.buttonText, { color: C.textSecondary }]}>SETTINGS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AdBanner
        unitId="ca-app-pub-2672637411464206/5007118973"
        placement="HomeScreen BannerAd"
        position="bottom"
      />

      <View style={styles.bottomBar} pointerEvents="none" />
    </Animated.View>
  );
};
