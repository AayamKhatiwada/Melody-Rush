// Remove-ads in-app purchase, built on expo-iap.
//
// Play Console setup required before this works in production:
//   1. Create an in-app product with id "remove_ads" (one-time, non-consumable)
//   2. Publish the app to a testing track and add license testers
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
} from 'expo-iap';
import { useGameStore } from '../store';

export const REMOVE_ADS_SKU = 'remove_ads';

let connected = false;
let purchaseSub: { remove: () => void } | null = null;
let errorSub: { remove: () => void } | null = null;
let priceListeners: Array<(price: string | null) => void> = [];
let errorListeners: Array<(message: string) => void> = [];
let cachedPrice: string | null = null;

function grantRemoveAds() {
  useGameStore.getState().setAdsRemoved(true);
}

export async function initIap(): Promise<void> {
  if (connected) return;
  try {
    await initConnection();
    connected = true;

    purchaseSub = purchaseUpdatedListener(async (purchase) => {
      if (purchase.productId !== REMOVE_ADS_SKU) return;
      grantRemoveAds();
      try {
        await finishTransaction({ purchase, isConsumable: false });
      } catch (e) {
        console.warn('[IAP] finishTransaction failed', e);
      }
    });

    errorSub = purchaseErrorListener((error) => {
      console.warn('[IAP] purchase error', error.code, error.message);
      // "User cancelled" isn't worth surfacing
      if (String(error.code).toLowerCase().includes('cancel')) return;
      errorListeners.forEach(fn => fn(error.message ?? 'Purchase failed.'));
    });

    // Re-grant entitlement if the local flag was lost (reinstall, new device)
    await restoreRemoveAds().catch(() => {});

    const products = await fetchProducts({ skus: [REMOVE_ADS_SKU], type: 'in-app' });
    const product = products?.find(p => p.id === REMOVE_ADS_SKU) ?? products?.[0];
    cachedPrice = product?.displayPrice ?? null;
    priceListeners.forEach(fn => fn(cachedPrice));
  } catch (e) {
    console.warn('[IAP] init failed (billing unavailable?)', e);
  }
}

export function getRemoveAdsPrice(): string | null {
  return cachedPrice;
}

export function subscribeToPrice(fn: (price: string | null) => void) {
  priceListeners.push(fn);
  return () => {
    priceListeners = priceListeners.filter(l => l !== fn);
  };
}

export function subscribeToPurchaseError(fn: (message: string) => void) {
  errorListeners.push(fn);
  return () => {
    errorListeners = errorListeners.filter(l => l !== fn);
  };
}

// Fire-and-forget: the result arrives via purchaseUpdatedListener
export async function buyRemoveAds(): Promise<void> {
  if (!connected) await initIap();
  if (!connected) throw new Error('Billing is not available on this device.');
  await requestPurchase({
    request: {
      google: { skus: [REMOVE_ADS_SKU] },
      apple: { sku: REMOVE_ADS_SKU },
    },
    type: 'in-app',
  });
}

export async function restoreRemoveAds(): Promise<boolean> {
  if (!connected) await initIap();
  if (!connected) return false;
  const purchases = await getAvailablePurchases();
  const owned = purchases?.some(p => p.productId === REMOVE_ADS_SKU) ?? false;
  if (owned) grantRemoveAds();
  return owned;
}

export function teardownIap() {
  purchaseSub?.remove();
  errorSub?.remove();
  purchaseSub = null;
  errorSub = null;
  if (connected) {
    connected = false;
    endConnection().catch(() => {});
  }
}
