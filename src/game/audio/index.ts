import { Audio } from 'expo-av';
import { useGameStore } from '../../store';

const NOTE_FILES: Record<string, any> = {
  C4: require('../../assets/sounds/C4.wav'),
  Db4: require('../../assets/sounds/Db4.wav'),
  D4: require('../../assets/sounds/D4.wav'),
  Eb4: require('../../assets/sounds/Eb4.wav'),
  E4: require('../../assets/sounds/E4.wav'),
  F4: require('../../assets/sounds/F4.wav'),
  Gb4: require('../../assets/sounds/Gb4.wav'),
  G4: require('../../assets/sounds/G4.wav'),
  Ab4: require('../../assets/sounds/Ab4.wav'),
  A4: require('../../assets/sounds/A4.wav'),
  Bb4: require('../../assets/sounds/Bb4.wav'),
  B4: require('../../assets/sounds/B4.wav'),
  C5: require('../../assets/sounds/C5.wav'),
  Db5: require('../../assets/sounds/Db5.wav'),
  D5: require('../../assets/sounds/D5.wav'),
  Eb5: require('../../assets/sounds/Eb5.wav'),
  E5: require('../../assets/sounds/E5.wav'),
};

const DEFAULT_MELODY = [
  'E5', 'Eb5', 'E5', 'Eb5', 'E5', 'B4', 'D5', 'C5', 'A4',
  'C4', 'E4', 'A4', 'B4',
  'E4', 'Ab4', 'B4', 'C5',
  'E4', 'E5', 'Eb5', 'E5', 'Eb5', 'E5', 'B4', 'D5', 'C5', 'A4',
  'C4', 'E4', 'A4', 'B4',
  'E4', 'C5', 'B4', 'A4',
];

const BG_MUSIC_VOLUME = 0.25;

class AudioManager {
  private ready = false;

  private loadedNotes: Record<string, Audio.Sound> = {};
  private missSound: Audio.Sound | null = null;
  private gameOverSound: Audio.Sound | null = null;
  private backgroundMusic: Audio.Sound | null = null;
  private loadedBackgroundUri: string | null = null;

  private currentNoteIndex = 0;
  private activeMelody: string[] = DEFAULT_MELODY;
  private customBackgroundUri: string | null = null;

  async init() {
    if (this.ready) return;
    this.ready = true;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { settings } = useGameStore.getState();
      if (settings.customMelody && settings.customMelody.length > 0) {
        this.activeMelody = settings.customMelody;
      }
      if (settings.customSongUri) {
        this.customBackgroundUri = settings.customSongUri;
      }

      const needed = new Set([...DEFAULT_MELODY, ...this.activeMelody]);
      for (const note of needed) {
        if (NOTE_FILES[note]) {
          const { sound } = await Audio.Sound.createAsync(NOTE_FILES[note]);
          this.loadedNotes[note] = sound;
        }
      }

      const { sound: miss } = await Audio.Sound.createAsync(
        require('../../assets/sounds/miss.wav'),
      );
      this.missSound = miss;

      const { sound: go } = await Audio.Sound.createAsync(
        require('../../assets/sounds/gameover.wav'),
      );
      this.gameOverSound = go;
    } catch (e) {
      console.warn('AudioManager init error:', e);
    }
  }

  applyCustomSong(melody: string[], backgroundUri: string) {
    this.activeMelody = melody.length > 0 ? melody : DEFAULT_MELODY;
    this.customBackgroundUri = backgroundUri;
    this.loadedBackgroundUri = null;
    this.currentNoteIndex = 0;
    this.preloadNotes(melody);
  }

  clearCustomSong() {
    this.activeMelody = DEFAULT_MELODY;
    this.customBackgroundUri = null;
    this.loadedBackgroundUri = null;
    this.currentNoteIndex = 0;
  }

  get melody(): string[] {
    return this.activeMelody;
  }

  private async preloadNotes(notes: string[]) {
    for (const note of new Set(notes)) {
      if (!this.loadedNotes[note] && NOTE_FILES[note]) {
        try {
          const { sound } = await Audio.Sound.createAsync(NOTE_FILES[note]);
          this.loadedNotes[note] = sound;
        } catch (_) {}
      }
    }
  }

  async playMusic() {
    const { settings } = useGameStore.getState();
    if (!settings.musicEnabled) return;

    const desiredUri = this.customBackgroundUri ?? null;

    const sourceKey = desiredUri ?? '__default__';
    if (this.loadedBackgroundUri !== sourceKey || !this.backgroundMusic) {
      const old = this.backgroundMusic;
      this.backgroundMusic = null;
      this.loadedBackgroundUri = null;

      if (old) {
        try { await old.stopAsync(); } catch (_) {}
        try { await old.unloadAsync(); } catch (_) {}
      }

      try {
        const source = desiredUri
          ? { uri: desiredUri }
          : require('../../assets/sounds/default_bg.mp3');
        const { sound } = await Audio.Sound.createAsync(source);
        this.backgroundMusic = sound;
        this.loadedBackgroundUri = sourceKey;
        await sound.setIsLoopingAsync(true);
        await sound.setVolumeAsync(BG_MUSIC_VOLUME);
      } catch (e) {
        console.warn('Background music load failed:', e);
        return;
      }
    }

    try {
      await this.backgroundMusic?.setVolumeAsync(BG_MUSIC_VOLUME);
      await this.backgroundMusic?.playAsync();
    } catch (_) {}
  }

  async pauseMusic() {
    try { await this.backgroundMusic?.pauseAsync(); } catch (_) {}
  }

  async resumeMusic() {
    const { settings } = useGameStore.getState();
    if (this.backgroundMusic && settings.musicEnabled) {
      try { await this.backgroundMusic.playAsync(); } catch (_) {}
    }
  }

  async stopMusic() {
    try { await this.backgroundMusic?.stopAsync(); } catch (_) {}
  }

  async playTapSound() {
    // No-op: tile press sound has been removed
  }

  async playMissSound() {
    const { settings } = useGameStore.getState();
    if (!settings.soundEnabled || !this.missSound) return;
    try { await this.missSound.replayAsync(); } catch (_) {}
  }

  async playGameOverSound() {
    this.stopMusic();
    this.currentNoteIndex = 0;
    const { settings } = useGameStore.getState();
    if (!settings.soundEnabled || !this.gameOverSound) return;
    try { await this.gameOverSound.replayAsync(); } catch (_) {}
  }
}

const _key = '__melodyRushAudioManager__';
if (!(global as any)[_key]) {
  (global as any)[_key] = new AudioManager();
}
export const audioManager: AudioManager = (global as any)[_key];
