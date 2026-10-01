import { useEffect, type CSSProperties } from 'react';
import { Reveal } from '../components/Reveal';
import { opticalCamel, SplitWords } from '../components/SplitWords';
import { projects, type Project } from '../content/projects';
import { site } from '../content/site';
import { Link } from '../lib/router';
import { DevFlowVisual } from '../visuals/DevFlowVisual';
import { ScoutLabVisual } from '../visuals/ScoutLabVisual';
import { StockFlowVisual } from '../visuals/StockFlowVisual';
import { SystemDiagram } from '../visuals/SystemDiagram';
import styles from './CaseStudy.module.css';

const VISUALS = {
  scoutlab: ScoutLabVisual,
  devflow: DevFlowVisual,
  stockflow: StockFlowVisual,
};

export default function CaseStudy({ project: p }: { project: Project }) {
  const Visual = VISUALS[p.slug];
  const i = projects.indexOf(p);
  const next = projects[(i + 1) % projects.length]!;

  useEffect(() => {
    document.title = `${p.name} — Case study — ${site.name}`;
  }, [p]);

  return (
    <article className={styles.page} style={{ '--ink': p.ink } as CSSProperties}>
      <header data-theme="dark" data-chapter="case" className={styles.header}>
        <div className="wrap">
          <div className={styles.crumbs}>
            <Link to="/#work" className={`u-link hit ${styles.back}`}>
              ← Index
            </Link>
            <span className={styles.count}>
              Case study {p.index} / {String(projects.length).padStart(2, '0')}
            </span>
          </div>

          <h1 className={styles.name}>
            <SplitWords text={p.name} camel />
          </h1>

          <div className={`grid ${styles.intro}`}>
            <Reveal as="p" className={styles.kind} delay={300}>
              <span className={styles.kindUnit} aria-hidden="true" />
              {p.kind}
            </Reveal>
            <Reveal as="p" className={styles.tagline} delay={380}>
              {p.tagline}
            </Reveal>
            <Reveal as="dl" className={styles.meta} delay={460}>
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
          </div>
        </div>

        <div className={styles.stage}>
          <div className="wrap">
            <Reveal className={styles.stageInner} delay={250}>
              <Visual large />
            </Reveal>
            <p className={styles.stageNote}>Interactive mockup. It runs on sample data — use it.</p>
          </div>
        </div>
      </header>

      <div data-theme="paper" data-chapter="case" className={styles.body}>
        <div className="wrap">
          <Block n="01" label="The problem">
            <Reveal as="p" className={styles.lead}>
              {p.problem}
            </Reveal>
          </Block>

          <Block n="02" label="The approach">
            <Reveal as="p" className={styles.lead}>
              {p.approach}
            </Reveal>
          </Block>

          <Block n="03" label="The system">
            <Reveal className={styles.diagramScroll} mode="fade">
              <div className={styles.diagram}>
                <SystemDiagram system={p.system} />
              </div>
            </Reveal>
            <p className={styles.caption}>{p.system.caption}</p>
          </Block>

          <Block n="04" label="Decisions">
            <ol className={styles.decisions}>
              {p.decisions.map((d, k) => (
                <Reveal as="li" key={d.title} className={styles.decision} delay={k * 100}>
                  <span className={styles.decisionNum}>D{k + 1}</span>
                  <h3 className={styles.decisionTitle}>{d.title}</h3>
                  <p>{d.body}</p>
                </Reveal>
              ))}
            </ol>
          </Block>

          <Block n="05" label="What it taught me">
            <SplitWords as="p" className={styles.quote} text={`“${p.learned}”`} />
          </Block>

          <Block n="06" label="Next">
            <ul className={styles.next}>
              {p.next.map((n, k) => (
                <Reveal as="li" key={n} delay={k * 80}>
                  {n}
                </Reveal>
              ))}
            </ul>
          </Block>
        </div>
      </div>

      <footer data-theme="dark" data-chapter="case" className={styles.footer} style={{ '--next-ink': next.ink } as CSSProperties}>
        <div className="wrap">
          <p className={styles.nextLabel}>Next case study</p>
          <Link to={`/work/${next.slug}`} ink={next.ink} label={`${next.index} — ${next.name}`} className={styles.nextLink}>
            <span className={styles.nextIdx}>{next.index}</span>
            <span className={styles.nextName}>{opticalCamel(next.name)}</span>
            <span className={styles.nextArrow} aria-hidden="true">
              →
            </span>
          </Link>
          <div className={styles.footRow}>
            <Link to="/#work" className="u-link hit">
              Back to all work
            </Link>
            <Link to="/#contact" className="u-link hit">
              Get in touch
            </Link>
          </div>
        </div>
      </footer>
    </article>
  );
}

function Block({ n, label, children }: { n: string; label: string; children: React.ReactNode }) {
  return (
    <section className={`grid ${styles.block}`} aria-label={label}>
      <Reveal mode="none" className={styles.blockHead}>
        <span className={styles.blockNum}>{n}</span>
        <h2 className={styles.blockLabel}>{label}</h2>
      </Reveal>
      <div className={styles.blockBody}>{children}</div>
    </section>
  );
}
