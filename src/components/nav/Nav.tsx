import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { chapters, nav, site } from '../../content/site';
import { Link, useRouter } from '../../lib/router';
import styles from './Nav.module.css';

type Tone = 'dark' | 'paper';

/**
 * Navigation reads the page as you scroll: it knows which chapter you're in,
 * flips its tone to match the section underneath it, and steps aside on the
 * way down.
 */
export function Nav() {
  const { path } = useRouter();
  const home = path === '/';
  const [tone, setTone] = useState<Tone>('dark');
  const [chapter, setChapter] = useState('top');
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const [marker, setMarker] = useState<{ x: number; w: number } | null>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let lastY = window.scrollY;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const navLine = 30;
      const readLine = window.innerHeight * 0.42;
      let nextTone: Tone = 'dark';
      let nextChapter = '';
      document.querySelectorAll<HTMLElement>('[data-theme]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= navLine && r.bottom > navLine) nextTone = el.dataset.theme as Tone;
      });
      document.querySelectorAll<HTMLElement>('[data-chapter]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= readLine && r.bottom > readLine) nextChapter = el.dataset.chapter ?? '';
      });
      setTone(nextTone);
      if (nextChapter) setChapter(nextChapter);
      const delta = y - lastY;
      if (Math.abs(delta) > 6) {
        setHidden(delta > 0 && y > window.innerHeight * 0.6);
        lastY = y;
      }
      if (y < 40) setHidden(false);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [path]);

  // The active-link marker: the same square, sliding between links.
  const activeId = home ? nav.find((n) => chapterOwner(chapter) === n.id)?.id : undefined;
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !activeId) {
      setMarker(null);
      return;
    }
    const a = list.querySelector<HTMLElement>(`[data-id="${activeId}"]`);
    if (a) setMarker({ x: a.offsetLeft, w: a.offsetWidth });
  }, [activeId]);

  // Mobile menu: lock scroll, trap focus, close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const menu = menuRef.current;
    const focusables = () =>
      Array.from(menu?.querySelectorAll<HTMLElement>('a, button') ?? []).filter((el) => el.offsetParent);
    window.setTimeout(() => focusables()[0]?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuBtn.current?.focus();
      }
      if (e.key === 'Tab') {
        const els = [menuBtn.current, ...focusables()].filter(Boolean) as HTMLElement[];
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const href = (id: string) => (home ? `#${id}` : `/#${id}`);
  const chapterLabel = home ? (chapters[chapter] ?? '') : 'Case study';
  const chapterIndex = home ? chapterNumber(chapter) : '';

  return (
    <>
      <header
        className={styles.nav}
        data-tone={open ? 'dark' : tone}
        data-hidden={hidden && !open ? 'true' : 'false'}
      >
        <div className={`wrap ${styles.bar}`}>
          <Link to="/" className={styles.mark} aria-label={`${site.name}, back to the start`}>
            <span className={styles.markUnit} aria-hidden="true" />
            <span className={styles.markName}>{site.name}</span>
          </Link>

          <div className={styles.chapter} aria-hidden="true">
            <span key={chapterLabel} className={styles.chapterRoll}>
              {chapterIndex ? <span className={styles.chapterIdx}>{chapterIndex}</span> : null}
              {chapterLabel}
            </span>
          </div>

          <nav aria-label="Primary" className={styles.primary}>
            <ul ref={listRef} className={styles.links}>
              {nav.map((n) => (
                <li key={n.id}>
                  <Link
                    to={href(n.id)}
                    data-id={n.id}
                    className={styles.link}
                    aria-current={activeId === n.id ? 'true' : undefined}
                  >
                    <span className={styles.linkIdx}>{chapterNumber(n.id)}</span>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <span
              className={styles.marker}
              aria-hidden="true"
              style={
                {
                  '--x': `${marker?.x ?? 0}px`,
                  '--w': `${marker?.w ?? 0}px`,
                  opacity: marker ? 1 : 0,
                } as CSSProperties
              }
            />
          </nav>

          <button
            ref={menuBtn}
            type="button"
            className={styles.menuBtn}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className={styles.menuLabel} data-open={open}>
              <span>Menu</span>
              <span>Close</span>
            </span>
            <span className={styles.menuIcon} data-open={open} aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      <div
        id="mobile-menu"
        ref={menuRef}
        className={styles.menu}
        data-open={open}
        aria-hidden={!open}
        inert={!open}
      >
        <nav aria-label="Mobile" className={`wrap ${styles.menuInner}`}>
          <ul className={styles.menuList}>
            {nav.map((n, i) => (
              <li key={n.id} style={{ '--i': i } as CSSProperties}>
                <Link to={href(n.id)} className={styles.menuLink} onClick={() => setOpen(false)}>
                  <span className={styles.menuIdx}>{chapterNumber(n.id)}</span>
                  <span className={styles.menuWord}>{n.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.menuFoot}>
            <a className="mono" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            {site.links.map((l) => (
              <a key={l.href} className="mono" href={l.href} target="_blank" rel="noreferrer">
                {l.label} ↗
              </a>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}

/** Sub-chapters roll up into the nav item they belong to. */
function chapterOwner(chapter: string): string {
  if (chapter === 'toolkit' || chapter === 'now') return 'about';
  return chapter;
}

const CHAPTER_NUMBERS: Record<string, string> = {
  practice: '01',
  work: '02',
  about: '03',
  toolkit: '03',
  now: '03',
  playground: '04',
  contact: '05',
};

function chapterNumber(chapter: string): string {
  return CHAPTER_NUMBERS[chapter] ?? '';
}
