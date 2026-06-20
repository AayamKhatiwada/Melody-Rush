import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useGameStore } from '../../store';
import { SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS, ColorPalette } from '../../constants/theme';
import { useColors, useGlobalStyles } from '../../hooks/useTheme';
import { BannerAd, BannerAdSize, useRewardedAd } from 'react-native-google-mobile-ads';

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  container: {
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
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.bold,
    color: C.warning,
    letterSpacing: 2,
  },
  watchAdDisabled: {
    opacity: 0.4,
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
  const { score, maxCombo, stats, setGameState, resetGame, continueGame, adContinueUsed } = useGameStore();
  const C = useColors();
  const gs = useGlobalStyles();
  const styles = useMemo(() => makeStyles(C), [C]);
  const isNewHighScore = score >= stats.highScore && score > 0;

  const { isLoaded, isEarnedReward, load, show } = useRewardedAd(
    adContinueUsed ? null : 'ca-app-pub-2672637411464206/6806518860',
    { requestNonPersonalizedAdsOnly: true },
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scoreScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 8 }),
      Animated.spring(scoreScale, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 10, delay: 200 }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!adContinueUsed) load();
  }, [adContinueUsed]);

  useEffect(() => {
    if (isEarnedReward) continueGame();
  }, [isEarnedReward]);

  return (
    <Animated.View style={[gs.container, styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[{ alignItems: 'center', marginBottom: SPACING.xxxl }, { transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.gameOverLabel}>GAME OVER</Text>
        {isNewHighScore && (
          <View style={styles.newHighScoreBadge}>
            <Text style={styles.newHighScoreText}>NEW RECORD</Text>
          </View>
        )}
      </Animated.View>

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
            <Text style={gs.label}>Best Score</Text>
            <Text style={styles.statValue}>{stats.highScore.toLocaleString()}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.buttonSection, { transform: [{ translateY: slideAnim }] }]}>
        {!adContinueUsed && (
          <TouchableOpacity
            style={[styles.watchAdButton, !isLoaded && styles.watchAdDisabled]}
            activeOpacity={0.8}
            disabled={!isLoaded}
            onPress={() => show()}
          >
            {!isLoaded && <ActivityIndicator size="small" color={C.warning} />}
            <Text style={styles.watchAdText}>
              {!isLoaded ? 'LOADING AD...' : 'WATCH AD TO CONTINUE'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={gs.primaryButton} activeOpacity={0.85} onPress={() => { resetGame(); setGameState('playing'); }}>
          <Text style={[gs.buttonText, { letterSpacing: 3 }]}>RETRY</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[gs.secondaryButton, { marginTop: SPACING.xs }]} activeOpacity={0.75} onPress={() => { resetGame(); setGameState('idle'); }}>
          <Text style={[gs.buttonText, { color: C.textSecondary, letterSpacing: 2 }]}>HOME</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={{ position: 'absolute', bottom: 30, alignItems: 'center', width: '100%' }}>
        <BannerAd
          unitId="ca-app-pub-2672637411464206/8484392611"
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>

      <View style={styles.bottomAccent} pointerEvents="none" />
    </Animated.View>
  );
};
