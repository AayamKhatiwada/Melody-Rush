import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator, BackHandler } from 'react-native';
import { useGameStore, effectiveStreak } from '../../store';
import { SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS, ColorPalette } from '../../constants/theme';
import { useColors, useGlobalStyles } from '../../hooks/useTheme';
import { AdBanner } from '../../components/AdBanner';
import { isRewardedAdLoaded, showRewardedAd, subscribe, subscribeToAdClosed, preloadRewardedAd, resetRewardState } from '../../utils/rewardedAd';
import { showInterstitialAd } from '../../utils/interstitialAd';
import { ACHIEVEMENT_MAP } from '../../constants/achievements';

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  gameOverLabel: {
    fontSize: FONT_SIZE.displayLg,
    fontWeight: FONT_WEIGHT.bold,
    color: C.error,
    letterSpacing: 6,
    ...SHADOWS.neonRed,
  },
  newHighScoreBadge: {
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderWidth: 1,
    borderColor: C.warning,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  newHighScoreText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.bold,
    color: C.warning,
    letterSpacing: 3,
  },
  scoreCard: {
    width: '100%',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxxl,
  },
  mainScoreRow: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  mainScore: {
    fontSize: FONT_SIZE.displayXL,
    fontWeight: FONT_WEIGHT.bold,
    color: C.text,
    letterSpacing: 2,
    marginTop: SPACING.sm,
  },
  mainScoreGold: {
    color: C.warning,
    ...SHADOWS.neonBlue,
  },
  divider: {
    height: 1,
    backgroundColor: C.glassBorder,
    marginBottom: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: C.glassBorder,
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
  watchAdButton: {
    width: '100%',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.warning,
    backgroundColor: 'rgba(255,184,0,0.10)',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  watchAdText: {
    fontSize: FONT_SIZE.bodyMd,
    fontWeight: FONT_WEIGHT.bold,
    color: C.warning,
    letterSpacing: 2,
  },
  watchAdDisabled: {
    opacity: 0.4,
  },
  achievementToast: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: 'rgba(50,255,126,0.10)',
    borderWidth: 1,
    borderColor: C.success,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  achievementToastIcon: {
    fontSize: FONT_SIZE.h3,
  },
  achievementToastTitle: {
    color: C.success,
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 2,
  },
  achievementToastName: {
    color: C.text,
    fontSize: FONT_SIZE.bodyMd,
    fontWeight: FONT_WEIGHT.semibold,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: C.error,
    opacity: 0.3,
    ...SHADOWS.neonRed,
  },
});

export const ResultScreen = () => {
  const {
    score, maxCombo, stats, setGameState, resetGame, continueGame,
    gameMode, startGame, daily, adsRemoved,
    pendingAchievements, clearPendingAchievements,
  } = useGameStore();
  const C = useColors();
  const gs = useGlobalStyles();
  const styles = useMemo(() => makeStyles(C), [C]);
  const isDaily = gameMode === 'daily';
  const isNewHighScore = score >= stats.highScore && score > 0;
  const streak = effectiveStreak(daily);

  // Snapshot unlocked achievements for this screen, then clear the queue
  const [unlockedNow] = useState(pendingAchievements);
  useEffect(() => {
    if (pendingAchievements.length > 0) clearPendingAchievements();
  }, []);

  const [adLoaded, setAdLoaded] = useState(isRewardedAdLoaded());

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scoreScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!adsRemoved) showInterstitialAd();
    resetRewardState();
    preloadRewardedAd();
    const unsubLoad = subscribe(() => {
      setAdLoaded(isRewardedAdLoaded());
    });
    // Resume only after the ad is dismissed, so the game loop
    // doesn't run (and end) behind the ad
    const unsubClosed = subscribeToAdClosed(rewardEarned => {
      if (rewardEarned) continueGame();
    });
    return () => {
      unsubLoad();
      unsubClosed();
    };
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      resetGame();
      setGameState('idle');
      return true;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 8 }),
      Animated.spring(scoreScale, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 10, delay: 200 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[gs.container, { opacity: fadeAnim }]}>
      <AdBanner
        unitId="ca-app-pub-2672637411464206/9278549209"
        placement="ResultScreen TopBannerAd"
        position="top"
      />

      <View style={styles.content}>
      <Animated.View style={[{ alignItems: 'center', marginBottom: SPACING.xxxl }, { transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.gameOverLabel}>GAME OVER</Text>
        {isNewHighScore && (
          <View style={styles.newHighScoreBadge}>
            <Text style={styles.newHighScoreText}>NEW RECORD</Text>
          </View>
        )}
        {isDaily && streak > 0 && (
          <View style={styles.newHighScoreBadge}>
            <Text style={styles.newHighScoreText}>🔥 {streak}-DAY STREAK</Text>
          </View>
        )}
      </Animated.View>

      {unlockedNow.length > 0 && (
        <Animated.View style={{ width: '100%', transform: [{ translateY: slideAnim }] }}>
          {unlockedNow.map(id => {
            const a = ACHIEVEMENT_MAP[id];
            if (!a) return null;
            return (
              <View key={id} style={styles.achievementToast}>
                <Text style={styles.achievementToastIcon}>{a.icon}</Text>
                <View>
                  <Text style={styles.achievementToastTitle}>ACHIEVEMENT UNLOCKED</Text>
                  <Text style={styles.achievementToastName}>{a.title}</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>
      )}

      <Animated.View style={[gs.glassCard, styles.scoreCard, { transform: [{ scale: scoreScale }] }]}>
        <View style={styles.mainScoreRow}>
          <Text style={gs.label}>Final Score</Text>
          <Text style={[styles.mainScore, isNewHighScore && styles.mainScoreGold]}>
            {score.toLocaleString()}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={gs.label}>Max Combo</Text>
            <Text style={styles.statValue}>{maxCombo}x</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={gs.label}>{isDaily ? "Today's Best" : 'Best Score'}</Text>
            <Text style={styles.statValue}>
              {(isDaily ? daily.bestToday : stats.highScore).toLocaleString()}
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.buttonSection, { transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity
          style={[styles.watchAdButton, !adLoaded && styles.watchAdDisabled]}
          activeOpacity={0.8}
          disabled={!adLoaded}
          onPress={() => showRewardedAd()}
        >
          {!adLoaded && <ActivityIndicator size="small" color={C.warning} />}
          <Text style={styles.watchAdText}>
            {!adLoaded ? 'LOADING AD...' : 'WATCH AD TO CONTINUE'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={gs.primaryButton} activeOpacity={0.85} onPress={() => startGame(gameMode)}>
          <Text style={[gs.buttonText, { letterSpacing: 3 }]}>RETRY</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[gs.secondaryButton, { marginTop: SPACING.xs }]} activeOpacity={0.75} onPress={() => { resetGame(); setGameState('idle'); }}>
          <Text style={[gs.buttonText, { color: C.textSecondary, letterSpacing: 2 }]}>HOME</Text>
        </TouchableOpacity>
      </Animated.View>
      </View>

      <AdBanner
        unitId="ca-app-pub-2672637411464206/8484392611"
        placement="ResultScreen BannerAd"
        position="bottom"
      />

      <View style={styles.bottomAccent} pointerEvents="none" />
    </Animated.View>
  );
};
