import { useSyncExternalStore } from 'react';
import { COARSE } from './useReducedMotion';

/**
 * How the visitor is actually interacting right now — not what the device
 * could do. A touchscreen laptop with a keyboard can be any of the three,
 * so instructions follow the last input that was used.
 */
export type InputModality = 'touch' | 'mouse' | 'keyboard';

const NAV_KEYS = new Set(['Tab', 'Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

let current: InputModality | null = null;
/** Once someone has touched the screen, touch controls stay put even if they then use keys. */
let touchSeen = false;
const listeners = new Set<() => void>();
let attached = false;

function set(next: InputModality) {
  if (next === current) return;
  current = next;
  if (next === 'touch') touchSeen = true;
  // Mirrored onto <html data-input> so CSS (touch-sized sliders, visible canvas buttons) agrees.
  document.documentElement.dataset.input = next;
  listeners.forEach((l) => l());
}

function attach() {
  if (attached || typeof window === 'undefined') return;
  attached = true;
  window.addEventListener(
    'pointerdown',
    (e) => set(e.pointerType === 'touch' || e.pointerType === 'pen' ? 'touch' : 'mouse'),
    { capture: true, passive: true },
  );
  window.addEventListener(
    'keydown',
    (e) => {
      if (NAV_KEYS.has(e.key) && !e.metaKey && !e.ctrlKey) set('keyboard');
    },
    { capture: true },
  );
}

function getSnapshot(): InputModality {
  if (current === null) {
    // First read happens during render: initialise quietly, without notifying anyone.
    current = window.matchMedia(COARSE).matches ? 'touch' : 'mouse';
    document.documentElement.dataset.input = current;
  }
  return current;
}

function subscribe(cb: () => void) {
  attach();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useInputModality(): InputModality {
  return useSyncExternalStore(subscribe, getSnapshot, () => 'mouse');
}

export function useTouchSeen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot() === 'touch' || touchSeen,
    () => false,
  );
}
