import { Reveal } from './Reveal';
import styles from './SectionHead.module.css';

interface Props {
  index: string;
  label: string;
  aside?: string;
}

/** The running head that opens every chapter. */
export function SectionHead({ index, label, aside }: Props) {
  return (
    <Reveal mode="none" className={styles.head}>
      <span className={styles.index}>({index})</span>
      <span className={styles.label}>{label}</span>
      <span className={`rule ${styles.rule}`} aria-hidden="true" />
      {aside ? <span className={styles.aside}>{aside}</span> : null}
    </Reveal>
  );
}
