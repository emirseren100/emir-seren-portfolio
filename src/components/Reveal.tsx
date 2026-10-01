import {
  useRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { useInView } from '../lib/useInView';

type RevealProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  /** 'rise' (default) fades and lifts; 'fade' only fades; 'none' just toggles .is-in for children. */
  mode?: 'rise' | 'fade' | 'none';
  delay?: number;
  rootMargin?: string;
  children?: ReactNode;
};

/** Adds `.is-in` once the element scrolls into view. Children can key off it. */
export function Reveal({
  as: Tag = 'div',
  mode = 'rise',
  delay = 0,
  rootMargin,
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { rootMargin });
  const cls = [className, inView ? 'is-in' : ''].filter(Boolean).join(' ');
  return (
    <Tag
      ref={ref}
      className={cls || undefined}
      data-reveal={mode === 'none' ? undefined : mode}
      style={{ ...style, '--d': `${delay}ms` } as CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
}
