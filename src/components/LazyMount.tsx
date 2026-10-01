import { Suspense, useRef, type ReactNode } from 'react';
import { useInView } from '../lib/useInView';

interface Props {
  children: ReactNode;
  className?: string;
  /** How far ahead of the viewport to start loading. */
  margin?: string;
  fallback?: ReactNode;
}

/** Mounts (and therefore downloads) its children only when they're about to be seen. */
export function LazyMount({ children, className, margin = '600px 0px', fallback = null }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { rootMargin: margin });
  return (
    <div ref={ref} className={className}>
      {near ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
    </div>
  );
}
