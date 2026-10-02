import type { CSSProperties } from 'react';
import { Reveal } from '../../components/Reveal';
import { SectionHead } from '../../components/SectionHead';
import { SplitWords } from '../../components/SplitWords';
import { toolkit } from '../../content/site';
import styles from './Toolkit.module.css';

export function Toolkit() {
  return (
    <section id="toolkit" data-theme="paper" data-chapter="toolkit" className={styles.section}>
      <div className="wrap">
        <SectionHead index="02.3" label="Toolkit" aside="Current skills first" />

        <SplitWords as="h2" className={styles.title} text="What I use now, and what I’m learning next." />

        <div className={styles.columns}>
          {toolkit.map((g, gi) => (
            <Reveal key={g.group} className={styles.group} delay={gi * 90} style={{ '--g': gi } as CSSProperties}>
              <div className={styles.groupHead}>
                <span className={styles.groupIdx}>{String.fromCharCode(65 + gi)}</span>
                <h3 className={styles.groupName}>{g.group}</h3>
                <p className={styles.groupNote}>{g.note}</p>
              </div>
              <ul className={styles.items}>
                {g.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        <Reveal className={`grid ${styles.ai}`} delay={100}>
          <p className={styles.aiLabel}>On AI-assisted development</p>
          <p className={styles.aiText}>
            I use AI tools to explore ideas, debug faster, and <em>learn from the code I’m building.</em>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
