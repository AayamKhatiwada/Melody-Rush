import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';

const AD_UNIT_ID = 'ca-app-pub-2672637411464206/6806518860';
const MAX_LOAD_RETRIES = 5;

let rewardedAd: RewardedAd | null = null;
let loaded = false;
let earned = false;
let retryCount = 0;
let listeners: Array<() => void> = [];
let closedListeners: Array<(rewardEarned: boolean) => void> = [];

function createAd() {
  loaded = false;
  earned = false;
  rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
    loaded = true;
    retryCount = 0;
    listeners.forEach(fn => fn());
  });

  rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    earned = true;
    listeners.forEach(fn => fn());
  });

  rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
    const rewardEarned = earned;
    // Preload next ad after this one is closed
    createAd();
    rewardedAd?.load();
    // Notify after the ad is fully dismissed so the game only resumes
    // once the user is actually back on screen
    closedListeners.forEach(fn => fn(rewardEarned));
  });

  rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
    if (retryCount >= MAX_LOAD_RETRIES) return;
    retryCount += 1;
    // Retry after a delay
    setTimeout(() => {
      createAd();
      rewardedAd?.load();
    }, 5000);
  });
}

export function preloadRewardedAd() {
  if (!rewardedAd) createAd();
  if (!loaded) rewardedAd?.load();
}

export function isRewardedAdLoaded() {
  return loaded;
}

export function isRewardEarned() {
  return earned;
}

export function showRewardedAd() {
  if (loaded && rewardedAd) {
    rewardedAd.show();
  }
}

export function resetRewardState() {
  earned = false;
}

export function subscribe(fn: () => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter(l => l !== fn);
  };
}

export function subscribeToAdClosed(fn: (rewardEarned: boolean) => void) {
  closedListeners.push(fn);
  return () => {
    closedListeners = closedListeners.filter(l => l !== fn);
  };
}
