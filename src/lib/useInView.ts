import { useEffect, useState, type RefObject } from 'react';

interface Options {
  /** Stop observing after the first time the element enters. */
  once?: boolean;
  rootMargin?: string;
  threshold?: number;
}

/**
 * Observers are shared per option set, so a page with fifty reveals
 * still only creates a couple of IntersectionObservers.
 */
const pools = new Map<
  string,
  { io: IntersectionObserver; callbacks: Map<Element, (entry: IntersectionObserverEntry) => void> }
>();

function getPool(rootMargin: string, threshold: number) {
  const key = `${rootMargin}|${threshold}`;
  let pool = pools.get(key);
  if (!pool) {
    const callbacks = new Map<Element, (entry: IntersectionObserverEntry) => void>();
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => callbacks.get(e.target)?.(e)),
      { rootMargin, threshold },
    );
    pool = { io, callbacks };
    pools.set(key, pool);
  }
  return pool;
}

/* ---------- Arrival ---------- */

let instantUntil = 0;

/** Reveal hooks that want to know about arrivals. Other observer consumers are left alone. */
const settleable = new Map<Element, () => void>();

/**
 * Call after any jump that lands somewhere new without the visitor scrolling there:
 * first load, a route change, Back/Forward, an instant anchor jump. Everything already
 * on screen resolves to its final state immediately instead of animating in from nothing —
 * including content in the bottom margin the observers normally wait for.
 */
export function settleArrival() {
  if (typeof window === 'undefined') return;
  instantUntil = performance.now() + 400;
  requestAnimationFrame(() => {
    // All reads first, then all writes: one layout instead of one per element.
    const h = window.innerHeight;
    const due: Array<() => void> = [];
    settleable.forEach((settle, el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < h && r.width + r.height > 0) due.push(settle);
    });
    due.forEach((settle) => settle());
  });
}

/** Skip the transition for this element's reveal; the attribute is removed once it has applied. */
function revealInstantly(el: Element) {
  el.setAttribute('data-instant', '');
  window.setTimeout(() => el.removeAttribute('data-instant'), 250);
}

export function observe(
  el: Element,
  cb: (entry: IntersectionObserverEntry) => void,
  rootMargin = '0px 0px -12% 0px',
  threshold = 0,
): () => void {
  const pool = getPool(rootMargin, threshold);
  pool.callbacks.set(el, cb);
  pool.io.observe(el);
  return () => {
    pool.io.unobserve(el);
    pool.callbacks.delete(el);
  };
}

export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { once = true, rootMargin = '0px 0px -12% 0px', threshold = 0 }: Options = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let shown = false;
    const enter = () => {
      if (shown) return;
      shown = true;
      if (performance.now() < instantUntil) revealInstantly(el);
      setInView(true);
      if (once) stop();
    };
    const unobserve = observe(
      el,
      (entry) => {
        if (entry.isIntersecting) return enter();
        shown = false;
        setInView(false);
      },
      rootMargin,
      threshold,
    );
    settleable.set(el, enter);
    const stop = () => {
      unobserve();
      settleable.delete(el);
    };
    return stop;
  }, [ref, once, rootMargin, threshold]);

  return inView;
}
