import React, { useEffect, useMemo, useRef } from 'react';
import {
  View, Text, Switch, StyleSheet, TouchableOpacity,
  Animated, ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameStore, PENDING_CONVERSION_KEY } from '../../store';
import {
  SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS, ColorPalette,
} from '../../constants/theme';
import { prepareAudioFile } from '../../utils/audioConverter';
import { useAudioAnalyzer } from '../../utils/AudioAnalyzer';
import { audioManager } from '../../game/audio';
import { useColors, useGlobalStyles } from '../../hooks/useTheme';

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  const C = useColors();
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={[barStyles.track, { backgroundColor: C.elevated }]}>
      <Animated.View
        style={[
          barStyles.fill,
          { backgroundColor: C.primary },
          {
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    width: '100%',
    height: 4,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: '100%',
    borderRadius: RADIUS.full,
    ...SHADOWS.neonBlue,
  },
});

// ─── Dynamic styles ───────────────────────────────────────────────────────────

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: { marginBottom: SPACING.xxxl },
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  settingLabel: {
    color: C.text,
    fontSize: FONT_SIZE.bodyLg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  settingSubLabel: {
    color: C.textMuted,
    fontSize: FONT_SIZE.caption,
    marginTop: 2,
  },
  customSongCard: { padding: SPACING.xl },
  customSongDescription: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.bodySm,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  formatHint: {
    backgroundColor: `${C.primary}18`,
    borderWidth: 1,
    borderColor: `${C.primary}40`,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xl,
  },
  formatHintText: {
    color: C.primary,
    fontSize: FONT_SIZE.caption,
    letterSpacing: 0.5,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${C.primary}18`,
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.neonBlue,
  },
  browseIcon: { fontSize: FONT_SIZE.bodyLg, color: C.primary },
  browseText: {
    color: C.primary,
    fontSize: FONT_SIZE.bodySm,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 2,
  },
  convertingBlock: { gap: SPACING.md },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convertingLabel: {
    color: C.text,
    fontSize: FONT_SIZE.bodyMd,
    fontWeight: FONT_WEIGHT.semibold,
  },
  progressPct: {
    color: C.primary,
    fontSize: FONT_SIZE.bodyMd,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1,
  },
  convertingStep: {
    color: C.primary,
    fontSize: FONT_SIZE.caption,
    letterSpacing: 0.5,
    minHeight: 16,
  },
  convertingSubLabel: {
    color: C.textMuted,
    fontSize: FONT_SIZE.caption,
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  cancelButton: {
    alignSelf: 'center',
    marginTop: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: `${C.error}66`,
    backgroundColor: `${C.error}10`,
  },
  cancelText: {
    color: C.error,
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 2,
  },
  successBlock: { gap: SPACING.sm },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  successDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.success,
  },
  successTitle: {
    color: C.success,
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 2,
  },
  songName: {
    color: C.text,
    fontSize: FONT_SIZE.bodyLg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  noteCountText: {
    color: C.textMuted,
    fontSize: FONT_SIZE.bodySm,
    marginBottom: SPACING.md,
  },
  successActions: { flexDirection: 'row', gap: SPACING.md },
  reImportButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: `${C.primary}18`,
    borderWidth: 1,
    borderColor: C.primary,
  },
  reImportText: {
    color: C.primary,
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1.5,
  },
  clearButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: `${C.error}12`,
    borderWidth: 1,
    borderColor: `${C.error}50`,
  },
  clearText: {
    color: C.error,
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1.5,
  },
  errorBlock: { gap: SPACING.md },
  errorTitle: {
    color: C.error,
    fontSize: FONT_SIZE.bodyMd,
    fontWeight: FONT_WEIGHT.bold,
  },
  errorMsg: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.bodySm,
    lineHeight: 18,
  },
  backButton: { width: '100%', marginTop: SPACING.sm },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export const SettingsScreen = () => {
  const {
    settings, updateSettings, setGameState,
    conversionStatus, conversionProgress, conversionStep,
    conversionError, conversionNoteCount,
    setConversionProgress, setConversionStatus, resetConversion,
  } = useGameStore();

  const { analyze, cancel } = useAudioAnalyzer();
  const C = useColors();
  const gs = useGlobalStyles();
  const styles = useMemo(() => makeStyles(C), [C]);
  const isPicking = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
    ]).start();
  }, []);

  useEffect(() => {
    if (conversionStatus === 'idle' && settings.customSongName) {
      setConversionStatus('success', { noteCount: settings.customMelody?.length ?? 0 });
    }
  }, []);

  const runConversion = async (fileUri: string, fileName: string) => {
    setConversionProgress(0, 'Preparing...');
    await AsyncStorage.setItem(PENDING_CONVERSION_KEY, JSON.stringify({ fileUri, fileName }));

    try {
      setConversionProgress(2, 'Saving file...');
      const { localUri } = await prepareAudioFile(fileUri, fileName);

      const melody = await analyze(localUri, (pct, step) => setConversionProgress(pct, step));

      updateSettings({
        customSongName: fileName,
        customSongUri: localUri,
        customMelody: melody,
      });
      audioManager.applyCustomSong(melody, localUri);
      setConversionStatus('success', { noteCount: melody.length });
    } catch (err: any) {
      if (err?.message === '__CANCELLED__') {
        resetConversion();
      } else {
        setConversionStatus('error', { error: err?.message ?? 'Conversion failed. Please try another file.' });
      }
    } finally {
      await AsyncStorage.removeItem(PENDING_CONVERSION_KEY);
    }
  };

  const handleBrowse = async () => {
    if (isPicking.current || conversionStatus === 'converting') return;
    isPicking.current = true;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/*'],
        copyToCacheDirectory: true,
      });
      isPicking.current = false;
      if (result.canceled) return;
      await runConversion(result.assets[0].uri, result.assets[0].name);
    } catch (err: any) {
      isPicking.current = false;
      setConversionStatus('error', { error: err?.message ?? 'Could not open file picker.' });
    }
  };

  const handleCancel = async () => {
    cancel();
    await AsyncStorage.removeItem(PENDING_CONVERSION_KEY);
  };

  const handleClear = async () => {
    if (settings.customSongUri) {
      try {
        const { deleteAsync } = await import('expo-file-system/src/legacy');
        await deleteAsync(settings.customSongUri, { idempotent: true });
      } catch (_) {}
    }
    updateSettings({ customSongName: undefined, customSongUri: undefined, customMelody: undefined });
    audioManager.clearCustomSong();
    resetConversion();
  };

  const songName = settings.customSongName ?? '';

  return (
    <Animated.View style={[gs.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>SETTINGS</Text>
          <View style={styles.titleUnderline} />
        </Animated.View>

        {/* ── Appearance ── */}
        <Animated.View style={[styles.section, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionLabel}>APPEARANCE</Text>

          <View style={[gs.glassCard, styles.settingRow]}>
            <View>
              <Text style={styles.settingLabel}>
                {settings.theme === 'light' ? '☀️  Light Mode' : '🌙  Dark Mode'}
              </Text>
              <Text style={styles.settingSubLabel}>
                {settings.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              </Text>
            </View>
            <Switch
              value={settings.theme === 'light'}
              onValueChange={val => updateSettings({ theme: val ? 'light' : 'dark' })}
              trackColor={{ false: C.elevated, true: C.primary }}
              thumbColor={C.switchThumb}
              ios_backgroundColor={C.elevated}
            />
          </View>
        </Animated.View>

        {/* ── Audio toggles ── */}
        <Animated.View style={[styles.section, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionLabel}>AUDIO</Text>

          <View style={[gs.glassCard, styles.settingRow]}>
            <View>
              <Text style={styles.settingLabel}>Music</Text>
              <Text style={styles.settingSubLabel}>Background track</Text>
            </View>
            <Switch
              value={settings.musicEnabled}
              onValueChange={val => updateSettings({ musicEnabled: val })}
              trackColor={{ false: C.elevated, true: C.primary }}
              thumbColor={C.switchThumb}
              ios_backgroundColor={C.elevated}
            />
          </View>

          <View style={[gs.glassCard, styles.settingRow]}>
            <View>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Text style={styles.settingSubLabel}>Tap and miss sounds</Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={val => updateSettings({ soundEnabled: val })}
              trackColor={{ false: C.elevated, true: C.primary }}
              thumbColor={C.switchThumb}
              ios_backgroundColor={C.elevated}
            />
          </View>

          <View style={[gs.glassCard, styles.settingRow]}>
            <View>
              <Text style={styles.settingLabel}>Vibration</Text>
              <Text style={styles.settingSubLabel}>Haptic feedback on tap</Text>
            </View>
            <Switch
              value={settings.vibration}
              onValueChange={val => updateSettings({ vibration: val })}
              trackColor={{ false: C.elevated, true: C.primary }}
              thumbColor={C.switchThumb}
              ios_backgroundColor={C.elevated}
            />
          </View>
        </Animated.View>

        {/* ── Custom Song ── */}
        <Animated.View style={[styles.section, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionLabel}>CUSTOM PIANO SONG</Text>

          <View style={[gs.glassCard, styles.customSongCard]}>
            <Text style={styles.customSongDescription}>
              Import a song from your device and Melody Rush will detect its melody and play it as piano notes while you tap.
            </Text>

            <View style={styles.formatHint}>
              <Text style={styles.formatHintText}>Supported: .MP3 · .WAV</Text>
            </View>

            {conversionStatus === 'idle' && (
              <TouchableOpacity style={styles.browseButton} onPress={handleBrowse} activeOpacity={0.8}>
                <Text style={styles.browseIcon}>♪</Text>
                <Text style={styles.browseText}>BROWSE AUDIO FILE</Text>
              </TouchableOpacity>
            )}

            {conversionStatus === 'converting' && (
              <View style={styles.convertingBlock}>
                <View style={styles.progressHeader}>
                  <Text style={styles.convertingLabel}>Converting to piano…</Text>
                  <Text style={styles.progressPct}>{conversionProgress}%</Text>
                </View>
                <ProgressBar progress={conversionProgress} />
                <Text style={styles.convertingStep}>{conversionStep}</Text>
                <Text style={styles.convertingSubLabel}>
                  You can navigate away — conversion continues in the background
                </Text>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.8}>
                  <Text style={styles.cancelText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            )}

            {conversionStatus === 'success' && (
              <View style={styles.successBlock}>
                <View style={styles.successHeader}>
                  <View style={styles.successDot} />
                  <Text style={styles.successTitle}>MELODY EXTRACTED</Text>
                </View>
                <Text style={styles.songName} numberOfLines={1}>{songName}</Text>
                <Text style={styles.noteCountText}>{conversionNoteCount} piano notes detected</Text>

                <View style={styles.successActions}>
                  <TouchableOpacity style={styles.reImportButton} onPress={handleBrowse} activeOpacity={0.8}>
                    <Text style={styles.reImportText}>CHANGE SONG</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.clearButton} onPress={handleClear} activeOpacity={0.8}>
                    <Text style={styles.clearText}>REMOVE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {conversionStatus === 'error' && (
              <View style={styles.errorBlock}>
                <Text style={styles.errorTitle}>Conversion Failed</Text>
                <Text style={styles.errorMsg}>{conversionError}</Text>
                <TouchableOpacity style={styles.browseButton} onPress={handleBrowse} activeOpacity={0.8}>
                  <Text style={styles.browseText}>TRY ANOTHER FILE</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[gs.secondaryButton, styles.backButton]}
          activeOpacity={0.75}
          onPress={() => setGameState('splash')}
        >
          <Text style={[gs.buttonText, { color: C.textSecondary, letterSpacing: 3 }]}>
            BACK
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
};
