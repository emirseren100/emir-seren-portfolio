import { useCallback, useEffect, useState, type RefObject } from 'react';
import { observe } from './useInView';
import { prefersReducedMotion } from './useReducedMotion';

/**
 * Advances a counter while the element is on screen, until the user takes over.
 * Mockups feel alive without anyone touching them, and stop the moment someone does.
 */
export function useAutoplay(ref: RefObject<Element | null>, intervalMs: number) {
  const [tick, setTick] = useState(0);
  const [visible, setVisible] = useState(false);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observe(el, (e) => setVisible(e.isIntersecting), '0px', 0.25);
  }, [ref]);

  useEffect(() => {
    if (!visible || manual || prefersReducedMotion()) return;
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [visible, manual, intervalMs]);

  const takeOver = useCallback(() => setManual(true), []);

  return { tick, visible, manual, takeOver };
}
