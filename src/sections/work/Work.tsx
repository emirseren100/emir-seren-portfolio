import { SectionHead } from '../../components/SectionHead';
import { SplitWords } from '../../components/SplitWords';
import { Reveal } from '../../components/Reveal';
import { playgroundProject, projects } from '../../content/projects';
import { Link } from '../../lib/router';
import { DevFlowVisual } from '../../visuals/DevFlowVisual';
import { ScoutLabVisual } from '../../visuals/ScoutLabVisual';
import { StockFlowVisual } from '../../visuals/StockFlowVisual';
import { UnitField } from '../../visuals/UnitField';
import { ProjectChapter } from './ProjectChapter';
import styles from './Work.module.css';

const VISUALS = {
  scoutlab: <ScoutLabVisual />,
  devflow: <DevFlowVisual />,
  stockflow: <StockFlowVisual />,
};
const LAYOUTS = ['a', 'b', 'c'] as const;

export function Work() {
  return (
    <section id="work" data-theme="dark" data-chapter="work" className={styles.section}>
      <div className="wrap">
        <SectionHead index="01" label="Selected work" aside="Interactive mockups" />
        <SplitWords as="h2" className={styles.title} text="Three projects and a playground." />
        <Reveal as="p" className={styles.intro} delay={250}>
          All three are personal projects. I designed and built each one, front end to back end, and the
          interfaces below run on sample data — use them.
        </Reveal>

        {projects.map((p, i) => (
          <ProjectChapter key={p.slug} project={p} layout={LAYOUTS[i % LAYOUTS.length]!} visual={VISUALS[p.slug]} />
        ))}

        <article className={styles.teaser} aria-labelledby="project-playground" style={{ '--ink': playgroundProject.ink } as React.CSSProperties}>
          <Reveal mode="none" className={styles.head}>
            <span className={styles.idx}>{playgroundProject.index}</span>
            <h3 id="project-playground" className={styles.name}>
              <Link to="#playground" className={styles.nameLink}>
                <span className={styles.nameUnit} aria-hidden="true" />
                <SplitWords text={playgroundProject.name} self={false} />
              </Link>
            </h3>
            <p className={styles.kind}>{playgroundProject.kind}</p>
            <span className={`rule ${styles.headRule}`} aria-hidden="true" />
          </Reveal>
          <div className={`grid ${styles.teaserBody}`}>
            <Reveal className={styles.teaserText} delay={150}>
              <p className={styles.tagline}>{playgroundProject.tagline}</p>
              <p className={styles.brief}>{playgroundProject.brief}</p>
              <Link to="#playground" className={`hit ${styles.cta}`}>
                <span>Go to the playground</span>
                <span className={`${styles.ctaArrow} ${styles.ctaDown}`} aria-hidden="true">
                  <span />
                </span>
              </Link>
            </Reveal>
            <Reveal className={styles.teaserField} delay={250} mode="fade">
              <UnitField />
            </Reveal>
          </div>
        </article>
      </div>
    </section>
  );
}
