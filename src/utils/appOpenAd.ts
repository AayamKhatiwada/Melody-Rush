import { AppState, AppStateStatus } from 'react-native';
import { AppOpenAd, AdEventType } from 'react-native-google-mobile-ads';
import { isAdShowing, setAdShowing } from './adState';
import { useGameStore } from '../store';

const AD_UNIT_ID = 'ca-app-pub-2672637411464206/2291458703';
const MAX_LOAD_RETRIES = 5;

let appOpenAd: AppOpenAd | null = null;
let loaded = false;
let isShowingAppOpenAd = false;
let appState: AppStateStatus = AppState.currentState;
let showOnLoad = false;
let retryCount = 0;

function createAd() {
  loaded = false;
  appOpenAd = AppOpenAd.createForAdRequest(AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
    loaded = true;
    retryCount = 0;
    console.warn('[AppOpenAd] loaded');
    if (showOnLoad) {
      showOnLoad = false;
      showAppOpenAd();
    }
  });

  appOpenAd.addAdEventListener(AdEventType.OPENED, () => {
    isShowingAppOpenAd = true;
    setAdShowing(true);
  });

  appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
    isShowingAppOpenAd = false;
    setAdShowing(false);
    // Preload the next one so it's ready for the next resume
    createAd();
    appOpenAd?.load();
  });

  appOpenAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
    loaded = false;
    isShowingAppOpenAd = false;
    setAdShowing(false);
    console.warn('[AppOpenAd] failed to load', error?.code, error?.message);
    if (retryCount >= MAX_LOAD_RETRIES) return;
    retryCount += 1;
    setTimeout(() => {
      createAd();
      appOpenAd?.load();
    }, 5000);
  });
}

export function preloadAppOpenAd() {
  if (!appOpenAd) createAd();
  if (!loaded) appOpenAd?.load();
}

export function showAppOpenAd() {
  if (useGameStore.getState().adsRemoved) return;
  if (!loaded || !appOpenAd) {
    console.warn('[AppOpenAd] show skipped: not loaded');
    return;
  }
  if (isShowingAppOpenAd || isAdShowing()) {
    console.warn('[AppOpenAd] show skipped: another ad is showing');
    return;
  }
  appOpenAd.show().catch((err: any) => console.warn('[AppOpenAd] show() rejected', err));
}

// Preloads (if needed) and shows as soon as the ad finishes loading.
// Used for the initial cold-start app open ad.
export function showAppOpenAdOnColdStart() {
  if (useGameStore.getState().adsRemoved) return;
  if (loaded) {
    showAppOpenAd();
    return;
  }
  showOnLoad = true;
  preloadAppOpenAd();
}

// Shows automatically whenever the app is brought back to the foreground,
// e.g. switching back from another app or the home screen.
export function initAppOpenAdOnResume() {
  const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (appState.match(/inactive|background/) && nextState === 'active') {
      showAppOpenAd();
    }
    appState = nextState;
  });
  return () => sub.remove();
}
