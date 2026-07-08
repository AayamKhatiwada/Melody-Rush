import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds from 'react-native-google-mobile-ads';
import * as FileSystem from 'expo-file-system/src/legacy';
import { useGameStore, PENDING_CONVERSION_KEY } from './src/store';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { audioManager } from './src/game/audio';
import { FONT_SIZE, FONT_WEIGHT, SHADOWS } from './src/constants/theme';
import { useColors } from './src/hooks/useTheme';
import { AudioAnalyzerProvider, useAudioAnalyzer } from './src/utils/AudioAnalyzer';

function LoadingScreen() {
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;
  const dotAnims = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    // Logo entrance
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();

    // Pulsing glow on the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Expanding rings
    const ringLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, { toValue: 1, duration: 1600, useNativeDriver: true }),
          ]),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    ringLoop(ring1Anim, 0).start();
    ringLoop(ring2Anim, 800).start();

    // Staggered loading dots
    const dotLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    dotAnims.forEach((a, i) => dotLoop(a, i * 200).start());
  }, []);

  const ringScale1 = ring1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.2] });
  const ringOpacity1 = ring1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.3, 0] });
  const ringScale2 = ring2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.2] });
  const ringOpacity2 = ring2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.3, 0] });

  return (
    <View style={[styles.loadingContainer, { backgroundColor: '#0A0A0A' }]}>
      {/* Expanding rings behind icon */}
      <View style={styles.iconWrapper}>
        <Animated.View
          style={[
            styles.ring,
            { borderColor: '#00C2FF', transform: [{ scale: ringScale1 }], opacity: ringOpacity1 },
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            { borderColor: '#00C2FF', transform: [{ scale: ringScale2 }], opacity: ringOpacity2 },
          ]}
        />
        {/* Music note icon */}
        <Animated.View
          style={[
            styles.iconCircle,
            { backgroundColor: '#00C2FF18', borderColor: '#00C2FF40', opacity: pulseAnim },
          ]}
        >
          <Text style={styles.musicNote}>♫</Text>
        </Animated.View>
      </View>

      {/* Logo text */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <Text style={styles.loadingLogo}>MELODY</Text>
        <Text style={styles.loadingLogoAccent}>RUSH</Text>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dotsRow}>
        {dotAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { backgroundColor: '#00C2FF', opacity: anim }]}
          />
        ))}
      </View>
    </View>
  );
}

// Separated so it can call useAudioAnalyzer (must be inside the provider)
function AppInner() {
  const { gameState, loadInitialData, updateSettings, setConversionProgress, setConversionStatus } = useGameStore();
  const C = useColors();
  const { analyze } = useAudioAnalyzer();
  const [isReady, setIsReady] = useState(false);

  // Global fallback: screens register their own back handlers (which run
  // first, since they are added later), but if none handles the press,
  // go home instead of letting Android close the app. Only on the home
  // screen does back keep its default exit behavior.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const { gameState, setGameState, resetGame } = useGameStore.getState();
      if (gameState === 'splash' || gameState === 'idle') return false;
      resetGame();
      setGameState('idle');
      return true;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    async function init() {
      await loadInitialData();
      await audioManager.init();
      await mobileAds().initialize();
      setIsReady(true);

      // Resume any conversion that was interrupted by the app closing
      try {
        const raw = await AsyncStorage.getItem(PENDING_CONVERSION_KEY);
        if (!raw) return;
        const { fileUri, fileName } = JSON.parse(raw) as { fileUri: string; fileName: string };
        const info = await FileSystem.getInfoAsync(fileUri);
        if (!info.exists) {
          await AsyncStorage.removeItem(PENDING_CONVERSION_KEY);
          return;
        }

        setConversionProgress(0, 'Resuming interrupted conversion…');
        try {
          const melody = await analyze(fileUri, (pct, step) => setConversionProgress(pct, step));
          updateSettings({ customSongName: fileName, customSongUri: fileUri, customMelody: melody });
          audioManager.applyCustomSong(melody, fileUri);
          setConversionStatus('success', { noteCount: melody.length });
        } catch (err: any) {
          if (err?.message !== '__CANCELLED__') {
            setConversionStatus('error', { error: err?.message ?? 'Conversion failed.' });
          }
        } finally {
          await AsyncStorage.removeItem(PENDING_CONVERSION_KEY);
        }
      } catch (_) {}
    }
    init();
  }, []);

  if (!isReady) return <LoadingScreen />;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar style={C.text === '#FFFFFF' ? 'light' : 'dark'} hidden />
      {(gameState === 'splash' || gameState === 'idle') && <HomeScreen />}
      {gameState === 'playing' && <GameScreen />}
      {gameState === 'gameover' && <ResultScreen />}
      {gameState === 'paused' && <SettingsScreen />}
    </View>
  );
}

export default function App() {
  return (
    <AudioAnalyzerProvider>
      <AppInner />
    </AudioAnalyzerProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicNote: {
    fontSize: 44,
    color: '#00C2FF',
    ...SHADOWS.neonBlue,
  },
  loadingLogo: {
    fontSize: FONT_SIZE.displayXL,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 8,
    color: '#FFFFFF',
    ...SHADOWS.neonBlue,
  },
  loadingLogoAccent: {
    fontSize: FONT_SIZE.displayXL,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 8,
    marginTop: -12,
    color: '#00C2FF',
    ...SHADOWS.neonBlue,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
