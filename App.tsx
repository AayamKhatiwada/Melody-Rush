import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const C = useColors();
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.loadingContainer, { backgroundColor: C.background }]}>
      <Text style={[styles.loadingLogo, { color: C.text }]}>MELODY</Text>
      <Text style={[styles.loadingLogoAccent, { color: C.primary }]}>RUSH</Text>
      <Animated.Text style={[styles.loadingLabel, { color: C.textMuted, opacity: pulseAnim }]}>
        LOADING...
      </Animated.Text>
    </View>
  );
}

// Separated so it can call useAudioAnalyzer (must be inside the provider)
function AppInner() {
  const { gameState, loadInitialData, updateSettings, setConversionProgress, setConversionStatus } = useGameStore();
  const C = useColors();
  const { analyze } = useAudioAnalyzer();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      await loadInitialData();
      await audioManager.init();
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
  loadingLogo: {
    fontSize: FONT_SIZE.displayXL,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 8,
    ...SHADOWS.neonBlue,
  },
  loadingLogoAccent: {
    fontSize: FONT_SIZE.displayXL,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 8,
    marginTop: -12,
    ...SHADOWS.neonBlue,
  },
  loadingLabel: {
    fontSize: FONT_SIZE.caption,
    letterSpacing: 4,
    marginTop: 32,
  },
});
