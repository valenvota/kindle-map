// Onboarding is UX state (per device/browser), not user knowledge — so it lives
// in localStorage, not Dexie. One JSON blob under a single key.
//
// Note: there is deliberately no "welcomeSeen" flag. Which onboarding screen to
// show is derived from the actual data (empty DB → welcome, has books → app) plus
// an ephemeral in-app override for Back/next navigation — see App.tsx. That keeps
// Welcome always reachable and never traps the user.

export type OnboardingState = {
  /** Example data is currently loaded (drives the "remove sample data" banner). */
  sampleLoaded: boolean;
  /** User has opened a book at least once (a Getting-Started step). */
  openedBook: boolean;
  /** User dismissed the Getting-Started checklist. */
  checklistDismissed: boolean;
};

const KEY = 'km-onboarding';

const DEFAULT_STATE: OnboardingState = {
  sampleLoaded: false,
  openedBook: false,
  checklistDismissed: false,
};

export function readOnboarding(): OnboardingState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function writeOnboarding(state: OnboardingState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}
