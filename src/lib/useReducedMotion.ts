import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia(QUERY).matches;

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}

const COARSE = '(pointer: coarse)';
function subscribeCoarse(cb: () => void) {
  const mq = window.matchMedia(COARSE);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    subscribeCoarse,
    () => window.matchMedia(COARSE).matches,
    () => false,
  );
}
