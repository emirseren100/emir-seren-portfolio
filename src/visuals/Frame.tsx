import type { ReactNode } from 'react';
import styles from './Frame.module.css';

interface Playback {
  paused: boolean;
  onToggle: () => void;
}

interface FrameProps {
  app: string;
  context: string;
  right?: ReactNode;
  /** Pause/play for mockups that update on their own. */
  playback?: Playback;
  children: ReactNode;
  className?: string;
  label: string;
}

/** A quiet application window: no fake browser chrome, just enough to read as software. */
export function Frame({ app, context, right, playback, children, className, label }: FrameProps) {
  return (
    <figure className={`${styles.frame} ${className ?? ''}`} aria-label={label}>
      <div className={styles.bar}>
        <span className={styles.app}>
          <span className={styles.dot} aria-hidden="true" />
          {app}
        </span>
        <span className={styles.context}>{context}</span>
        <span className={styles.right}>
          {right}
          {playback ? (
            <button
              type="button"
              className={`hit ${styles.playback}`}
              onClick={playback.onToggle}
              aria-label={playback.paused ? `Play the ${app} demo` : `Pause the ${app} demo`}
            >
              <span aria-hidden="true" className={styles.playIcon} data-paused={playback.paused} />
            </button>
          ) : null}
        </span>
      </div>
      <div className={styles.body}>{children}</div>
    </figure>
  );
}
