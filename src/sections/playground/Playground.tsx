import { lazy, type CSSProperties } from 'react';
import { LazyMount } from '../../components/LazyMount';
import { Reveal } from '../../components/Reveal';
import { SectionHead } from '../../components/SectionHead';
import { SplitWords } from '../../components/SplitWords';
import styles from './Playground.module.css';

const GameFeelLab = lazy(() => import('../../experiments/GameFeelLab'));
const Flock = lazy(() => import('../../experiments/Flock'));
const Rope = lazy(() => import('../../experiments/Rope'));
const Tiles = lazy(() => import('../../experiments/Tiles'));

const NOTES = [
  {
    term: 'Coyote time',
    body: 'A few frames of grace after you run off a ledge, where jump still works. Players never notice it. They notice when it’s gone.',
  },
  {
    term: 'Jump buffering',
    body: 'Press jump a moment before you land and it still counts. Without it, the game feels like it’s ignoring you.',
  },
  {
    term: 'Squash & stretch',
    body: 'Pure illusion — the hitbox never changes shape. But it’s what makes a square feel like it has weight.',
  },
];

export function Playground() {
  return (
    <section id="playground" data-theme="dark" data-chapter="playground" className={styles.section}>
      <div className="wrap">
        <SectionHead index="04" label="Playground" aside="Experiments, small on purpose" />

        <div className={`grid ${styles.intro}`}>
          <SplitWords as="h2" className={styles.title} text="Small things, *built properly.*" />
          <Reveal as="p" className={styles.lead} delay={200}>
            Game design taught me that how something feels is a set of numbers someone chose. This is where I
            choose them on purpose.
          </Reveal>
        </div>

        <div className={styles.labHead}>
          <Reveal as="p" className={styles.labIdx}>
            E.00
          </Reveal>
          <Reveal as="h3" className={styles.labTitle} delay={80}>
            Game feel lab
          </Reveal>
          <Reveal as="p" className={styles.labLead} delay={160}>
            The square from the top of the page runs on a tiny physics engine I wrote for this site. These
            are its settings. Change them, and it changes up there too.
          </Reveal>
        </div>

        <LazyMount className={styles.lab} fallback={<div className={styles.labFallback} />}>
          <GameFeelLab />
        </LazyMount>

        <ol className={`grid ${styles.notes}`}>
          {NOTES.map((n, i) => (
            <Reveal as="li" key={n.term} delay={i * 90} className={styles.note}>
              <h4 className={styles.noteTerm}>{n.term}</h4>
              <p>{n.body}</p>
            </Reveal>
          ))}
        </ol>

        <div className={styles.shelf}>
          {[
            {
              idx: 'E.01',
              title: 'Flock',
              note: 'Three rules — keep apart, match speed, stay close — and a pointer they avoid.',
              hint: 'Move through it',
              el: <Flock />,
            },
            {
              idx: 'E.02',
              title: 'Rope',
              note: 'Verlet integration: remember where a point was, and its velocity takes care of itself.',
              hint: 'Grab the ends',
              el: <Rope />,
            },
            {
              idx: 'E.03',
              title: 'Tiles',
              note: 'Wave function collapse, the small version. Every edge has to agree with its neighbour.',
              hint: 'Watch it solve',
              el: <Tiles buttonClassName={styles.itemAction} />,
            },
          ].map((e, i) => (
            <Reveal as="figure" key={e.title} className={styles.item} delay={i * 110} style={{ '--i': i } as CSSProperties}>
              <LazyMount className={styles.canvasBox} fallback={null}>
                {e.el}
              </LazyMount>
              <figcaption className={styles.caption}>
                <span className={styles.itemIdx}>{e.idx}</span>
                <span className={styles.itemTitle}>{e.title}</span>
                <span className={styles.itemHint}>{e.hint}</span>
                <span className={styles.itemNote}>{e.note}</span>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
