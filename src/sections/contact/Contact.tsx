import { useRef, useState } from 'react';
import { Reveal } from '../../components/Reveal';
import { SectionHead } from '../../components/SectionHead';
import { site } from '../../content/site';
import { useInView } from '../../lib/useInView';
import { Link } from '../../lib/router';
import styles from './Contact.module.css';

export function Contact() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const inView = useInView(titleRef, { rootMargin: '0px 0px -20% 0px' });
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');
  const [hop, setHop] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied('done');
    } catch {
      setCopied('failed');
    }
    window.setTimeout(() => setCopied('idle'), 2200);
  };

  return (
    <section id="contact" data-theme="dark" data-chapter="contact" className={styles.section}>
      <div className="wrap">
        <SectionHead index="04" label="Contact" />

        <h2
          ref={titleRef}
          className={`${styles.title} ${inView ? styles.in : ''}`}
          onPointerEnter={() => setHop(true)}
        >
          <span className={styles.line}>
            <span className={styles.lineInner}>Your</span>
          </span>{' '}
          <span className={styles.line}>
            <span className={styles.lineInner}>
              move
              <span className={styles.unitSlot} aria-hidden="true">
                <span className={styles.unit}>
                  <span
                    className={`${styles.unitInner} ${hop ? styles.hop : ''}`}
                    onAnimationEnd={() => setHop(false)}
                  />
                </span>
              </span>
            </span>
          </span>
        </h2>

        <div className={`grid ${styles.body}`}>
          <Reveal as="p" className={styles.text} delay={300}>
            I’m looking for an internship or junior role on a team that cares about the details — and I’m
            always happy to talk about a project, a game mechanic, or an interface that bugs you.
          </Reveal>

          <Reveal className={styles.reach} delay={420}>
            <p className="label">Write to me</p>
            <div className={styles.emailRow}>
              <a className={`hit ${styles.email}`} href={`mailto:${site.email}`}>
                {site.email}
              </a>
              <button type="button" className={`hit ${styles.copy}`} onClick={copy} aria-live="polite">
                {copied === 'done' ? 'Copied' : copied === 'failed' ? 'Press ⌘C' : 'Copy'}
              </button>
            </div>
            <ul className={styles.links}>
              {site.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noreferrer" className="u-link hit">
                    {l.label} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <footer className={styles.footer}>
          <p className={styles.fCol} suppressHydrationWarning>
            © {new Date().getFullYear()} {site.name}
          </p>
          <p className={styles.fCol}>
            Designed and built by hand. Set in Bricolage Grotesque, Newsreader and Geist Mono.
          </p>
          <p className={styles.fCol}>
            <Link to="#top" className="u-link hit">
              Back to the start ↑
            </Link>
          </p>
        </footer>
      </div>
    </section>
  );
}
