import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';

const AD_UNIT_ID = 'ca-app-pub-2672637411464206/6806518860';

let rewardedAd: RewardedAd | null = null;
let loaded = false;
let earned = false;
let listeners: Array<() => void> = [];

function createAd() {
  loaded = false;
  earned = false;
  rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
    loaded = true;
    listeners.forEach(fn => fn());
  });

  rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    earned = true;
    listeners.forEach(fn => fn());
  });

  rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
    // Preload next ad after this one is closed
    createAd();
    rewardedAd?.load();
  });

  rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
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
