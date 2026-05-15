import * as FileSystem from 'expo-file-system/src/legacy';

export const AVAILABLE_NOTES = [
  'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4',
  'Ab4', 'A4', 'Bb4', 'B4', 'C5', 'Db5', 'D5', 'Eb5', 'E5',
];

export interface ConversionResult {
  melody: string[];
  songName: string;
  fileUri: string;
  noteCount: number;
}

/**
 * Validates the file extension and copies it to documentDirectory so it
 * survives app restarts. Returns the permanent URI.
 * Actual audio decoding + pitch detection is done by AudioAnalyzerProvider
 * (WebView / Web Audio API) — see AudioAnalyzer.tsx.
 */
export async function prepareAudioFile(
  fileUri: string,
  fileName: string,
): Promise<{ localUri: string; ext: string }> {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext !== 'wav' && ext !== 'mp3') {
    throw new Error(
      `"${ext.toUpperCase()}" files are not supported.\nPlease select an .mp3 or .wav file.`,
    );
  }
  const permanentUri = `${FileSystem.documentDirectory}melody_rush_custom.${ext}`;
  await FileSystem.copyAsync({ from: fileUri, to: permanentUri });
  return { localUri: permanentUri, ext };
}
