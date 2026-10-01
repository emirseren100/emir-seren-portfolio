import { useRouter } from '../lib/router';
import styles from './Curtain.module.css';

/** The page-transition panel. It rises over the page, then lifts away. */
export function Curtain() {
  const { curtain } = useRouter();
  return (
    <div
      className={styles.curtain}
      data-phase={curtain.phase}
      style={{ background: curtain.ink }}
      aria-hidden="true"
    >
      <div className={styles.label}>
        <span className={styles.unit} />
        <span className="mono">{curtain.label}</span>
      </div>
    </div>
  );
}
