import type { CSSProperties, ReactNode } from 'react';
import { Reveal } from '../../components/Reveal';
import { SplitWords } from '../../components/SplitWords';
import type { Project } from '../../content/projects';
import { Link } from '../../lib/router';
import styles from './Work.module.css';

interface Props {
  project: Project;
  layout: 'a' | 'b' | 'c';
  visual: ReactNode;
}

export function ProjectChapter({ project: p, layout, visual }: Props) {
  const to = `/work/${p.slug}`;
  const curtain = { ink: p.ink, label: `${p.index} — ${p.name}` };

  return (
    <article
      className={styles.chapter}
      data-layout={layout}
      style={{ '--ink': p.ink } as CSSProperties}
      aria-labelledby={`project-${p.slug}`}
    >
      <Reveal mode="none" className={styles.head}>
        <span className={styles.idx}>{p.index}</span>
        <h3 id={`project-${p.slug}`} className={styles.name}>
          <Link to={to} {...curtain} className={styles.nameLink}>
            <span className={styles.nameUnit} aria-hidden="true" />
            <SplitWords text={p.name} self={false} />
          </Link>
        </h3>
        <p className={styles.kind}>{p.kind}</p>
        <span className={`rule ${styles.headRule}`} aria-hidden="true" />
      </Reveal>

      <div className={`grid ${styles.body}`}>
        <Reveal className={styles.visual} delay={120}>
          {visual}
        </Reveal>

        <div className={styles.info}>
          <Reveal as="p" className={styles.tagline} delay={160}>
            {p.tagline}
          </Reveal>
          <Reveal as="p" className={styles.brief} delay={240}>
            {p.brief}
          </Reveal>
          <Reveal as="dl" className={styles.meta} delay={320}>
            {p.meta.map((m) => (
              <div key={m.k}>
                <dt>{m.k}</dt>
                <dd>{m.v}</dd>
              </div>
            ))}
            <div>
              <dt>Stack</dt>
              <dd>{p.stack.join(', ')}</dd>
            </div>
          </Reveal>
          <Reveal delay={400}>
            <Link to={to} {...curtain} className={styles.cta}>
              <span>Read the case study</span>
              <span className={styles.ctaArrow} aria-hidden="true">
                <span />
              </span>
            </Link>
          </Reveal>
        </div>
      </div>
    </article>
  );
}
