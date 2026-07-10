import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { setAdShowing } from './adState';

const AD_UNIT_ID = 'ca-app-pub-2672637411464206/5179522099';
const MAX_LOAD_RETRIES = 5;

let interstitialAd: InterstitialAd | null = null;
let loaded = false;
let retryCount = 0;

function createAd() {
  loaded = false;
  interstitialAd = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
    loaded = true;
    retryCount = 0;
  });

  interstitialAd.addAdEventListener(AdEventType.OPENED, () => {
    setAdShowing(true);
  });

  interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
    setAdShowing(false);
    // Preload next ad after this one is closed
    createAd();
    interstitialAd?.load();
  });

  interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
    loaded = false;
    setAdShowing(false);
    if (retryCount >= MAX_LOAD_RETRIES) return;
    retryCount += 1;
    // Retry after a delay
    setTimeout(() => {
      createAd();
      interstitialAd?.load();
    }, 5000);
  });
}

export function preloadInterstitialAd() {
  if (!interstitialAd) createAd();
  if (!loaded) interstitialAd?.load();
}

export function isInterstitialAdLoaded() {
  return loaded;
}

export function showInterstitialAd() {
  if (loaded && interstitialAd) {
    interstitialAd.show();
  }
}
