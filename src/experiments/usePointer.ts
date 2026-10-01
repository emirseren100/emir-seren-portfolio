import { useEffect, useRef, type RefObject } from 'react';
import { wakeCanvas } from '../lib/useCanvasLoop';

export interface PointerState {
  x: number;
  y: number;
  active: boolean;
  down: boolean;
}

/** Tracks the pointer over a canvas, in canvas-local CSS pixels. */
export function usePointer(ref: RefObject<HTMLCanvasElement | null>) {
  const state = useRef<PointerState>({ x: -999, y: -999, active: false, down: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pos = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      state.current.x = e.clientX - r.left;
      state.current.y = e.clientY - r.top;
    };
    const move = (e: PointerEvent) => {
      pos(e);
      state.current.active = true;
      wakeCanvas(el);
    };
    const down = (e: PointerEvent) => {
      pos(e);
      state.current.active = true;
      state.current.down = true;
      wakeCanvas(el);
    };
    const up = (e: PointerEvent) => {
      state.current.down = false;
      if (e.pointerType !== 'mouse') state.current.active = false;
    };
    const leave = () => {
      state.current.active = false;
      state.current.down = false;
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      el.removeEventListener('pointerleave', leave);
    };
  }, [ref]);

  return state;
}
