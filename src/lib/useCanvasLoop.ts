import { useEffect, type RefObject } from 'react';
import { observe } from './useInView';

export interface LoopContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
}

export interface LoopHandlers {
  /** Called on mount and on every resize. */
  setup: (c: LoopContext) => void;
  /** Return false to stop the loop until `wake()` is called. */
  frame: (c: LoopContext, dt: number, t: number) => boolean | void;
}

/**
 * A canvas render loop that sizes itself to its element, respects device pixel ratio,
 * and only runs while the canvas is on screen.
 */
export function useCanvasLoop(
  ref: RefObject<HTMLCanvasElement | null>,
  makeHandlers: () => LoopHandlers,
  deps: unknown[] = [],
): void {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const handlers = makeHandlers();
    const c: LoopContext = { ctx, width: 0, height: 0, dpr: 1 };
    let raf = 0;
    let last = 0;
    let visible = false;
    let sleeping = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      c.dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = rect.width;
      c.height = rect.height;
      canvas.width = Math.round(rect.width * c.dpr);
      canvas.height = Math.round(rect.height * c.dpr);
      ctx.setTransform(c.dpr, 0, 0, c.dpr, 0, 0);
      handlers.setup(c);
      wake();
    };

    const loop = (t: number) => {
      raf = 0;
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 1 / 60;
      last = t;
      const keep = handlers.frame(c, dt, t);
      if (keep === false) {
        sleeping = true;
        last = 0;
        return;
      }
      if (visible) raf = requestAnimationFrame(loop);
      else last = 0;
    };

    const wake = () => {
      sleeping = false;
      if (!raf && visible) raf = requestAnimationFrame(loop);
    };
    (canvas as HTMLCanvasElement & { __wake?: () => void }).__wake = wake;

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const stop = observe(
      canvas,
      (e) => {
        visible = e.isIntersecting;
        if (visible && !sleeping) wake();
        if (visible && sleeping) handlers.frame(c, 0, performance.now());
      },
      '100px',
      0,
    );

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Restart a sleeping loop (e.g. after user input). */
export function wakeCanvas(canvas: HTMLCanvasElement | null) {
  (canvas as (HTMLCanvasElement & { __wake?: () => void }) | null)?.__wake?.();
}
