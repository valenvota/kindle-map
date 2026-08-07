// Onboarding is UX state (per device/browser), not user knowledge — so it lives
// in localStorage, not Dexie. One JSON blob under a single key.

export type OnboardingState = {
  /** User has passed the first-run welcome (imported, explored, or skipped). */
  welcomeSeen: boolean;
  /** Example data is currently loaded (drives the "remove sample data" banner). */
  sampleLoaded: boolean;
  /** User has opened a book at least once (a Getting-Started step). */
  openedBook: boolean;
  /** User dismissed the Getting-Started checklist. */
  checklistDismissed: boolean;
};

const KEY = 'km-onboarding';

const DEFAULT_STATE: OnboardingState = {
  welcomeSeen: false,
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
