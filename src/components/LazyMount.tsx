import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useInView } from '../lib/useInView';

interface Props {
  children: ReactNode;
  className?: string;
  /** How far ahead of the viewport to start loading. */
  margin?: string;
  fallback?: ReactNode;
}

/** Shared idle signal: once the page has settled, everything deferred mounts anyway. */
let idleReached = false;
const idleListeners = new Set<() => void>();
function onIdle(cb: () => void) {
  if (idleReached) {
    cb();
    return () => {};
  }
  idleListeners.add(cb);
  if (idleListeners.size === 1) {
    const ric = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 200));
    window.setTimeout(() => {
      ric(() => {
        idleReached = true;
        idleListeners.forEach((l) => l());
        idleListeners.clear();
      });
    }, 3500);
  }
  return () => idleListeners.delete(cb);
}

/**
 * Mounts (and therefore downloads) its children when they're about to be seen,
 * or once the page is idle — so keyboard users tabbing ahead never skip them.
 */
export function LazyMount({ children, className, margin = '600px 0px', fallback = null }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { rootMargin: margin });
  const [idle, setIdle] = useState(false);
  useEffect(() => onIdle(() => setIdle(true)), []);
  const show = near || idle;
  return (
    <div ref={ref} className={className}>
      {show ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
    </div>
  );
}
