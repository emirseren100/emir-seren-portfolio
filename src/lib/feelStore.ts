import { useSyncExternalStore } from 'react';
import { DEFAULT_FEEL, type FeelParams } from './platformer';

/**
 * The hero square and the Game Feel Lab share one set of parameters,
 * so tuning the lab changes how the name at the top of the page plays.
 */
let current: FeelParams = { ...DEFAULT_FEEL };
const listeners = new Set<() => void>();

export const feelStore = {
  get: () => current,
  set(patch: Partial<FeelParams>) {
    current = { ...current, ...patch };
    listeners.forEach((l) => l());
  },
  reset() {
    current = { ...DEFAULT_FEEL };
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useFeel(): FeelParams {
  return useSyncExternalStore(feelStore.subscribe, feelStore.get, feelStore.get);
}
