import { Fragment, useRef, useState, type CSSProperties } from 'react';
import { Reveal } from '../../components/Reveal';
import { SectionHead } from '../../components/SectionHead';
import { practice } from '../../content/site';
import { useInView } from '../../lib/useInView';
import styles from './Practice.module.css';

export function Practice() {
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const inView = useInView(bodyRef);
  const [hot, setHot] = useState<number | null>(null);

  let wordIndex = 0;
  let noteIndex = 0;
  const notes = practice.body.filter((s): s is { word: string; note: string } => typeof s !== 'string');

  const words = (text: string) =>
    text.split(/(\s+)/).map((part, i) => {
      if (/^\s+$/.test(part) || part === '') return part;
      const idx = wordIndex++;
      return (
        <span key={i} className="w">
          <span className="wi" style={{ '--i': idx } as CSSProperties}>
            {part}
          </span>
        </span>
      );
    });

  return (
    <section id="practice" data-theme="dark" data-chapter="practice" className={styles.section}>
      <div className="wrap">
        <SectionHead index="00" label="Practice" aside="What I build" />

        <div className={`grid ${styles.layout}`}>
          <p ref={bodyRef} className={`split ${styles.body} ${inView ? 'is-in' : ''}`}>
            {practice.body.map((seg, i) => {
              if (typeof seg === 'string') return <Fragment key={i}>{words(seg)}</Fragment>;
              const n = noteIndex++;
              const idx = wordIndex++;
              return (
                <span key={i} className="w">
                  <span className="wi" style={{ '--i': idx } as CSSProperties}>
                    <span
                      className={styles.term}
                      data-hot={hot === n}
                      onPointerEnter={() => setHot(n)}
                      onPointerLeave={() => setHot(null)}
                    >
                      {seg.word}
                      <sup className={styles.sup}>{n + 1}</sup>
                    </span>
                  </span>
                </span>
              );
            })}
          </p>

          <ol className={styles.notes} aria-label="Notes">
            {notes.map((n, i) => (
              <Reveal
                as="li"
                key={n.word}
                delay={500 + i * 90}
                className={styles.note}
                data-hot={hot === i}
                onPointerEnter={() => setHot(i)}
                onPointerLeave={() => setHot(null)}
              >
                <span className={styles.noteNum}>{i + 1}</span>
                <span>{n.note}</span>
              </Reveal>
            ))}
          </ol>

          <Reveal as="p" className={styles.follow} delay={200}>
            {practice.follow}
          </Reveal>

          <Reveal className={styles.picky} delay={300}>
            <p className="label">Things I’ve been told I’m too picky about</p>
            <ul>
              {practice.picky.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
