import React, {
  createContext, useCallback, useContext, useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/src/legacy';

// ─── WebView HTML ─────────────────────────────────────────────────────────────

const ANALYZER_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>
const NOTE_FREQUENCIES = {
  C4:261.63,Db4:277.18,D4:293.66,Eb4:311.13,E4:329.63,
  F4:349.23,Gb4:369.99,G4:392.0,Ab4:415.3,A4:440.0,
  Bb4:466.16,B4:493.88,C5:523.25,Db5:554.37,D5:587.33,
  Eb5:622.25,E5:659.25
};
const AVAILABLE_NOTES = ['C4','Db4','D4','Eb4','E4','F4','Gb4','G4',
  'Ab4','A4','Bb4','B4','C5','Db5','D5','Eb5','E5'];

function detectPitch(buf, sr) {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  if (Math.sqrt(rms / buf.length) < 0.015) return -1;
  const minLag = Math.floor(sr / 1000);
  const maxLag = Math.min(Math.floor(sr / 80), buf.length - 1);
  let maxC = 0, best = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let c = 0, n = buf.length - lag;
    for (let i = 0; i < n; i++) c += buf[i] * buf[i + lag];
    c /= n;
    if (c > maxC) { maxC = c; best = lag; }
  }
  if (best < 0 || maxC < 0.015) return -1;
  return sr / best;
}

function freqToNote(freq) {
  if (freq <= 0) return null;
  let best = null, bestC = Infinity;
  for (const note of AVAILABLE_NOTES) {
    const c = Math.abs(1200 * Math.log2(freq / NOTE_FREQUENCIES[note]));
    if (c < bestC) { bestC = c; best = note; }
  }
  return bestC < 100 ? best : null;
}

function post(obj) { window.ReactNativeWebView.postMessage(JSON.stringify(obj)); }

function b64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

let cancelled = false;

function onMsg(e) {
  let msg;
  try { msg = JSON.parse(e.data); } catch(_) { return; }
  if (msg.type === 'analyze') analyse(msg.base64);
  else if (msg.type === 'cancel') { cancelled = true; }
}
document.addEventListener('message', onMsg);
window.addEventListener('message', onMsg);

async function analyse(base64) {
  cancelled = false;
  try {
    post({ type: 'progress', pct: 22, step: 'Converting audio data...' });
    let arrayBuf;
    try {
      arrayBuf = b64ToArrayBuffer(base64);
    } catch(e) {
      throw new Error('Failed to read audio bytes: ' + e.message);
    }
    if (cancelled) return;

    post({ type: 'progress', pct: 38, step: 'Decoding audio...' });
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) throw new Error('Web Audio API not supported on this device.');
    const ctx = new AudioCtx();

    let audio;
    try {
      // Use Promise form (supported by all modern Android/iOS WebViews)
      audio = await ctx.decodeAudioData(arrayBuf);
    } catch(e) {
      throw new Error('Could not decode audio file. Make sure it is a valid MP3 or WAV. (' + e.message + ')');
    }
    if (cancelled) return;

    post({ type: 'progress', pct: 55, step: 'Analysing melody...' });
    const samples = audio.getChannelData(0);
    const sr = audio.sampleRate;
    const hop = Math.floor(sr * 0.15);
    const win = Math.min(256, hop);
    const maxI = Math.min(samples.length, sr * 30);
    const totalFrames = Math.max(1, Math.ceil((maxI - win) / hop));
    const melody = [];
    let prev = null;

    for (let i = 0, fi = 0; i + win <= maxI; i += hop, fi++) {
      if (cancelled) return;
      const note = freqToNote(detectPitch(samples.slice(i, i + win), sr));
      if (note && note !== prev) { melody.push(note); prev = note; }
      if (fi % 80 === 0) {
        post({ type: 'progress', pct: 55 + Math.round((fi / totalFrames) * 40),
               step: 'Detecting notes... ' + Math.round(fi / totalFrames * 100) + '%' });
        await new Promise(r => setTimeout(r, 0));
      }
    }

    if (melody.length === 0) {
      throw new Error('No clear melody detected. Try a file with a single prominent instrument.');
    }
    post({ type: 'done', melody });
  } catch (err) {
    post({ type: 'error', message: err.message || 'Audio analysis failed.' });
  }
}

post({ type: 'ready' });
<\/script></body></html>`;

// ─── Context ─────────────────────────────────────────────────────────────────

type ProgressCb = (pct: number, step: string) => void;

interface PendingAnalysis {
  resolve: (melody: string[]) => void;
  reject: (err: Error) => void;
  onProgress: ProgressCb;
}

interface AnalyzerContextValue {
  analyze: (fileUri: string, onProgress: ProgressCb) => Promise<string[]>;
  cancel: () => void;
}

const AnalyzerContext = createContext<AnalyzerContextValue | null>(null);

export function useAudioAnalyzer() {
  const ctx = useContext(AnalyzerContext);
  if (!ctx) throw new Error('useAudioAnalyzer must be used inside AudioAnalyzerProvider');
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AudioAnalyzerProvider({ children }: { children: React.ReactNode }) {
  const webviewRef = useRef<WebView>(null);
  const pendingRef = useRef<PendingAnalysis | null>(null);
  const isReadyRef = useRef(false);
  const readyWaitersRef = useRef<Array<() => void>>([]);

  const waitForReady = useCallback((): Promise<void> => {
    if (isReadyRef.current) return Promise.resolve();
    return new Promise(resolve => { readyWaitersRef.current.push(resolve); });
  }, []);

  const handleMessage = useCallback((e: WebViewMessageEvent) => {
    let msg: any;
    try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }

    if (msg.type === 'ready') {
      isReadyRef.current = true;
      readyWaitersRef.current.forEach(r => r());
      readyWaitersRef.current = [];
      return;
    }

    const p = pendingRef.current;
    if (!p) return;

    if (msg.type === 'progress') {
      p.onProgress(msg.pct, msg.step);
    } else if (msg.type === 'done') {
      pendingRef.current = null;
      p.resolve(msg.melody);
    } else if (msg.type === 'error') {
      pendingRef.current = null;
      p.reject(new Error(msg.message));
    }
  }, []);

  const analyze = useCallback((fileUri: string, onProgress: ProgressCb): Promise<string[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Verify file exists before trying to read it
        onProgress(5, 'Checking audio file...');
        const info = await FileSystem.getInfoAsync(fileUri);
        if (!info.exists) {
          throw new Error('Audio file not found. Please select the file again.');
        }

        // Read the full file as base64 — no size limit so decodeAudioData
        // receives complete (not truncated) audio data
        onProgress(10, 'Reading audio file...');
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: 'base64',
        });

        // Wait for the WebView to finish loading before posting
        onProgress(18, 'Preparing decoder...');
        await waitForReady();

        pendingRef.current = { resolve, reject, onProgress };
        webviewRef.current?.postMessage(JSON.stringify({ type: 'analyze', base64 }));
      } catch (err: any) {
        reject(new Error(err?.message ?? 'Could not read audio file.'));
      }
    });
  }, [waitForReady]);

  const cancel = useCallback(() => {
    webviewRef.current?.postMessage(JSON.stringify({ type: 'cancel' }));
    const p = pendingRef.current;
    pendingRef.current = null;
    p?.reject(new Error('__CANCELLED__'));
  }, []);

  return (
    <AnalyzerContext.Provider value={{ analyze, cancel }}>
      {children}
      <View style={styles.hidden} pointerEvents="none">
        <WebView
          ref={webviewRef}
          source={{ html: ANALYZER_HTML }}
          onMessage={handleMessage}
          javaScriptEnabled
          originWhitelist={['*']}
          scrollEnabled={false}
        />
      </View>
    </AnalyzerContext.Provider>
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
