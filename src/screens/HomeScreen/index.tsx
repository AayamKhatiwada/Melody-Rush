import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useGameStore } from '../../store';
import { SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS, ColorPalette } from '../../constants/theme';
import { useColors, useGlobalStyles } from '../../hooks/useTheme';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  container: {
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
  const { setGameState, stats } = useGameStore();
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
    <Animated.View style={[gs.container, styles.container, { opacity: fadeAnim }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[styles.bgLine, { left: `${(i + 1) * 20}%` as any }]} />
        ))}
      </View>

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
        <TouchableOpacity style={gs.primaryButton} activeOpacity={0.85} onPress={() => setGameState('playing')}>
          <Text style={[gs.buttonText, { letterSpacing: 3 }]}>PLAY NOW</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[gs.secondaryButton, styles.settingsButton]} activeOpacity={0.75} onPress={() => setGameState('paused')}>
          <Text style={[gs.buttonText, { color: C.textSecondary }]}>SETTINGS</Text>
        </TouchableOpacity>
      </View>

      <View style={{ position: 'absolute', bottom: 30, alignItems: 'center', width: '100%' }}>
        <BannerAd
          unitId="ca-app-pub-2672637411464206/5007118973"
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdFailedToLoad={(error) => console.warn('[HomeScreen BannerAd]', error.code, error.message)}
        />
      </View>

      <View style={styles.bottomBar} pointerEvents="none" />
    </Animated.View>
  );
};
