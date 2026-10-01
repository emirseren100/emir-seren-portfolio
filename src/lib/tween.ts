import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './useReducedMotion';

export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Tweens an array of numbers toward `target`. Used for morphing charts. */
export function useTweenedArray(target: number[], duration = 700): number[] {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const current = useRef(target);

  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      current.current = target;
      return;
    }
    from.current = current.current;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = easeOutExpo(Math.min(1, (t - start) / duration));
      const next = target.map((v, i) => (from.current[i] ?? v) + (v - (from.current[i] ?? v)) * k);
      current.current = next;
      setValue(next);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.join(','), duration, reduced]);

  return reduced ? target : value;
}
