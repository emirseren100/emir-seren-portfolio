import type { ReactNode } from 'react';
import styles from './Frame.module.css';

interface FrameProps {
  app: string;
  context: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  label: string;
}

/** A quiet application window: no fake browser chrome, just enough to read as software. */
export function Frame({ app, context, right, children, className, label }: FrameProps) {
  return (
    <figure className={`${styles.frame} ${className ?? ''}`} aria-label={label}>
      <div className={styles.bar}>
        <span className={styles.app}>
          <span className={styles.dot} aria-hidden="true" />
          {app}
        </span>
        <span className={styles.context}>{context}</span>
        <span className={styles.right}>{right}</span>
      </div>
      <div className={styles.body}>{children}</div>
    </figure>
  );
}
