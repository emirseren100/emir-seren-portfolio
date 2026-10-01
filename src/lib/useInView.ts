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
    const stop = observe(
      el,
      (entry) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) stop();
      },
      rootMargin,
      threshold,
    );
    return stop;
  }, [ref, once, rootMargin, threshold]);

  return inView;
}
