import type { CSSProperties } from 'react';
import { Reveal } from '../../components/Reveal';
import { SectionHead } from '../../components/SectionHead';
import { SplitWords } from '../../components/SplitWords';
import { now, rules, site, translation } from '../../content/site';
import styles from './About.module.css';

export function About() {
  return (
    <section id="about" data-theme="paper" data-chapter="about" className={styles.section}>
      <div className="wrap">
        <SectionHead index="02" label="About" aside="Game design → software" />

        <SplitWords as="h2" className={styles.title} text="Translation, *not a restart.*" />

        <div className={`grid ${styles.intro}`}>
          <Reveal as="p" className={styles.lead} delay={150}>
            I study Digital Game Design, with full-stack development as my goal.
          </Reveal>
          <Reveal as="p" className={styles.introBody} delay={250}>
            People sometimes ask whether that makes the degree a detour. I don’t think so. A lot of what
            I learned designing games carries over to building software — I’m learning the new names for
            it, and the tools that go with them.
          </Reveal>
        </div>

        <div className={styles.table} role="table" aria-label="Game design skills and their software equivalents">
          <div className={styles.tableHead} role="row">
            <span role="columnheader">In game design</span>
            <span aria-hidden="true" />
            <span role="columnheader">In software</span>
            <span role="columnheader" className={styles.noteHead}>
              What carries over
            </span>
          </div>
          {translation.map((t, i) => (
            <Reveal
              key={t.from}
              mode="none"
              className={styles.row}
              role="row"
              style={{ '--i': i } as CSSProperties}
              rootMargin="0px 0px -18% 0px"
            >
              <span role="cell" className={styles.from}>
                {t.from}
              </span>
              <span className={styles.wire} aria-hidden="true">
                <span className={styles.wireLine} />
                <span className={styles.wireUnit} />
              </span>
              <span role="cell" className={styles.to}>
                {t.to}
              </span>
              <span role="cell" className={styles.note}>
                {t.note}
              </span>
            </Reveal>
          ))}
        </div>
      </div>

      <div id="now" data-chapter="now" className={`wrap ${styles.nowWrap}`}>
        <div className={`grid ${styles.split}`}>
          <div className={styles.rules}>
            <SectionHead index="02.1" label="Rules I work by" />
            {/* Run-in statements rather than another ruled list: the one place on paper that reads as prose. */}
            <Reveal as="ol" className={styles.ruleList}>
              {rules.map((r, i) => (
                <li key={r} className={styles.rule}>
                  <span className={styles.ruleNum}>R{String(i + 1).padStart(2, '0')}</span>
                  {r}
                </li>
              ))}
            </Reveal>
          </div>

          <div className={styles.now}>
            <SectionHead index="02.2" label="Now" aside={site.season} />
            <dl className={styles.nowList}>
              {now.map((n, i) => (
                <Reveal key={n.k} delay={i * 80} className={styles.nowRow}>
                  <dt>{n.k}</dt>
                  <dd>{n.v}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
