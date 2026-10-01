import { useCallback, useEffect, useState, type RefObject } from 'react';
import { observe } from './useInView';
import { useReducedMotion } from './useReducedMotion';

/**
 * A position that advances while the element is on screen and not paused.
 * Mockups feel alive without anyone touching them, stop the moment someone takes over
 * (pause, then setPosition), and resume from wherever the visitor left them. With reduced
 * motion they start paused, but a visitor can still press play.
 */
export function useAutoplay(ref: RefObject<Element | null>, intervalMs: number, start = 0) {
  const [position, setPosition] = useState(start);
  const [visible, setVisible] = useState(false);
  const [choice, setChoice] = useState<'paused' | 'playing' | null>(null);
  const reduced = useReducedMotion();
  const paused = choice ? choice === 'paused' : reduced;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observe(el, (e) => setVisible(e.isIntersecting), '0px', 0.25);
  }, [ref]);

  useEffect(() => {
    if (!visible || paused) return;
    const id = window.setInterval(() => setPosition((p) => p + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [visible, paused, intervalMs]);

  const pause = useCallback(() => setChoice('paused'), []);
  const resume = useCallback(() => setChoice('playing'), []);

  return { position, setPosition, paused, pause, resume };
}

/** Wraps a position into 0…n-1, including negative values. */
export const wrap = (position: number, n: number) => ((position % n) + n) % n;
