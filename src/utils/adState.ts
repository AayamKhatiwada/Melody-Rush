// Shared across ad modules so the App Open ad can avoid showing itself
// right as the app "resumes" from the interstitial/rewarded ad's own overlay closing.
let showingAd = false;

export function setAdShowing(value: boolean) {
  showingAd = value;
}

export function isAdShowing() {
  return showingAd;
}
