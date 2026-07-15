import React, { useEffect, useRef, useState } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useGameStore } from '../store';

// Matches the retry convention used by the interstitial/rewarded/app-open ad modules
const MAX_LOAD_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

interface AdBannerProps {
  unitId: string;
  /** Log tag, e.g. "HomeScreen TopBannerAd" */
  placement: string;
  /** Adds edge padding: 'top' clears the camera cutout, 'bottom' the nav gesture area */
  position?: 'top' | 'bottom';
  style?: StyleProp<ViewStyle>;
}

// Shared banner: renders nothing once the user has bought Remove Ads.
// BannerAd has no imperative retry, so a failed load is retried by
// remounting it (via `key`) up to MAX_LOAD_RETRIES times.
export function AdBanner({ unitId, placement, position, style }: AdBannerProps) {
  const adsRemoved = useGameStore(s => s.adsRemoved);
  const [adKey, setAdKey] = useState(0);
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (adsRemoved) return null;

  const handleFailedToLoad = (error: any) => {
    console.warn(`[${placement}]`, error?.code, error?.message);
    if (retryCountRef.current >= MAX_LOAD_RETRIES) return;
    retryCountRef.current += 1;
    timeoutRef.current = setTimeout(() => {
      setAdKey(k => k + 1);
    }, RETRY_DELAY_MS);
  };

  const handleLoaded = () => {
    retryCountRef.current = 0;
  };

  return (
    <View
      style={[
        { alignItems: 'center', width: '100%' },
        position === 'top' && { paddingTop: 36 },
        position === 'bottom' && { paddingBottom: 16 },
        style,
      ]}
    >
      <BannerAd
        key={adKey}
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={handleLoaded}
        onAdFailedToLoad={handleFailedToLoad}
      />
    </View>
  );
}
