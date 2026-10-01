import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { SplitWords } from '../../components/SplitWords';
import { Link } from '../../lib/router';
import { fontsReady } from '../../lib/fonts';
import { useInputModality, type InputModality } from '../../lib/useInputModality';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { useWalkableName, type HeroMessage } from './useWalkableName';
import styles from './Hero.module.css';

const NAME = 'Emir Şeren';

const KEYMAP: Record<string, 'left' | 'right' | 'jump'> = {
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
  ArrowUp: 'jump',
  w: 'jump',
  W: 'jump',
  ' ': 'jump',
};

const Keys = ({ keys }: { keys: string[] }) => (
  <>
    {keys.map((k) => (
      <kbd key={k} className={styles.kbd}>
        {k}
      </kbd>
    ))}
  </>
);

/** Instructions follow the input actually in use, and never promise a control that isn't there. */
function hintFor(message: HeroMessage, modality: InputModality, active: boolean) {
  if (message) return MESSAGES[message];
  if (modality === 'touch') return 'Tap it to jump. Tap ahead to run.';
  if (active) {
    return (
      <>
        <Keys keys={['←', '→']} /> move · <Keys keys={['↑']} /> jump · <Keys keys={['Esc']} /> stop
      </>
    );
  }
  return (
    <>
      {modality === 'keyboard' ? (
        <>
          Press <Keys keys={['Enter']} />, then
        </>
      ) : (
        'Click it, then'
      )}{' '}
      <Keys keys={['←', '→', '↑']} />
    </>
  );
}

const MESSAGES = {
  tittle: 'That’s a tittle — the dot on an i. Well found.',
  fall: 'Out of bounds. Respawning.',
  end: 'End of the name. The rest of the level is below.',
} as const;

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  const modality = useInputModality();
  const touch = modality === 'touch';
  const twoLines = useMediaQuery('(max-width: 760px), (max-aspect-ratio: 4/5)');
  const short = useMediaQuery('(max-height: 720px) and (min-width: 761px)');

  // The markup is the same in both layouts (two word-lines that CSS sets side by side or stacked),
  // so the prerendered HTML never has to reflow when the browser learns the viewport.
  const words = NAME.split(' ');
  const heightRatio = twoLines ? 0.5 : short ? 0.3 : 0.36;

  useEffect(() => {
    let alive = true;
    void fontsReady().then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const { guides, spawn, message, active, setActive, jumpToward, setKey, release } = useWalkableName({
    stageRef,
    nameRef,
    playerRef,
    lineCount: twoLines ? 2 : 1,
    ready,
    reduced,
    maxHeightRatio: heightRatio,
  });

  // Scroll-linked exit: the stage sinks a little and the meta fades as you leave.
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || reduced) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = hero.offsetHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / h));
      hero.style.setProperty('--p', p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // Leaving the hero hands the keyboard back to the page.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !active) return;
    const io = new IntersectionObserver(([e]) => {
      if (e && !e.isIntersecting) stage.blur();
    });
    io.observe(stage);
    return () => io.disconnect();
  }, [active]);

  // The hint's button lives inside the stage; its own keys and focus aren't game input.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Escape') {
      e.currentTarget.blur();
      return;
    }
    const k = KEYMAP[e.key];
    if (!k) return;
    e.preventDefault();
    setKey(k, true, e.repeat);
  };

  const onKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const k = KEYMAP[e.key];
    if (!k) return;
    e.preventDefault();
    setKey(k, false);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    jumpToward(e.clientX - rect.left);
    if (e.pointerType === 'mouse') {
      // Keep focus on the stage so the keyboard works straight after a click.
      e.preventDefault();
      e.currentTarget.focus({ preventScroll: true });
    }
  };

  let letterIndex = 0;

  const hint = hintFor(message, modality, active);

  const stageLabel = touch
    ? 'Playable title. Tap the name to make the square jump, or tap ahead of it to run.'
    : 'Playable title. Left and right arrow keys move, the up arrow or space jumps, Escape stops.';

  const startPlaying = () => {
    // On touch there's no keyboard to hand over, so show what a tap does instead.
    if (touch) jumpToward(null);
    else stageRef.current?.focus({ preventScroll: true });
  };

  return (
    <section
      ref={heroRef}
      id="top"
      data-theme="dark"
      data-chapter="top"
      className={`${styles.hero} ${ready ? styles.ready : ''} ${active ? styles.active : ''}`}
    >
      <div className={`wrap ${styles.inner}`}>
        <div className={`grid ${styles.meta}`}>
          <p className={`mono ${styles.metaA}`}>
            Portfolio
            <br />
            <span className={styles.dim} suppressHydrationWarning>
              Edition {new Date().getFullYear()}
            </span>
          </p>
          <p className={`mono ${styles.metaB}`}>
            Digital Game Design student
            <br />
            <span className={styles.dim}>→ full-stack developer, in progress</span>
          </p>
          <p className={`mono ${styles.metaC}`}>
            Currently building
            <br />
            <span className={styles.dim}>ScoutLab, a scouting tool</span>
          </p>
        </div>

        <div className={`grid ${styles.sky}`}>
          <SplitWords
            as="p"
            self={false}
            className={styles.statement}
            text="Game design taught me how things *should feel.* Software engineering is teaching me how to make them *hold.*"
          />
        </div>

        <div
          ref={stageRef}
          className={styles.stage}
          tabIndex={0}
          role="group"
          aria-roledescription="mini game"
          aria-label={stageLabel}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onPointerDown={onPointerDown}
          onFocus={(e) => e.target === e.currentTarget && setActive(true)}
          onBlur={(e) => {
            if (e.target !== e.currentTarget) return;
            setActive(false);
            release();
          }}
        >
          <div className={styles.guides} aria-hidden="true">
            {guides.map((g, li) => (
              <div key={li}>
                <span className={styles.guide} style={{ top: g.capHeight, '--g': 0 } as CSSProperties}>
                  {li === 0 ? <span className={styles.guideLabel}>cap height</span> : null}
                </span>
                <span className={styles.guide} style={{ top: g.xHeight, '--g': 1 } as CSSProperties}>
                  {li === 0 ? <span className={styles.guideLabel}>x-height</span> : null}
                </span>
                <span
                  className={`${styles.guide} ${styles.baseline}`}
                  style={{ top: g.baseline, '--g': 2 } as CSSProperties}
                >
                  {li === guides.length - 1 ? (
                    <span className={`${styles.guideLabel} ${styles.below}`}>baseline</span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>

          <h1 ref={nameRef} id="hero-title" className={styles.name}>
            <span className="sr-only">{NAME}</span>
            <span aria-hidden="true" className={styles.nameInner} data-name-inner="">
              {words.map((word, li) => (
                <span key={word} className={styles.line} data-line-el="">
                  {li > 0 ? <span className={styles.space} /> : null}
                  {[...word].map((ch, ci) => {
                    const i = letterIndex++;
                    return (
                      <span key={ci} className={styles.mask}>
                        <span
                          className={styles.letter}
                          data-char={ch}
                          data-line={li}
                          data-index={i}
                          style={{ '--i': i } as CSSProperties}
                        >
                          <span className={styles.glyph}>{ch}</span>
                        </span>
                      </span>
                    );
                  })}
                  <span className={styles.probe} data-probe="" />
                </span>
              ))}
            </span>
          </h1>

          <div ref={playerRef} className={styles.player} aria-hidden="true">
            <div className={styles.playerBody} />
          </div>

          {/* The hint stands directly above the square, aligned to its left edge, like a specimen note. */}
          <div
            className={styles.hint}
            data-placed={spawn ? 'true' : 'false'}
            style={
              spawn
                ? ({
                    left: spawn.left,
                    top: spawn.top - spawn.unit * 0.45,
                    maxWidth: `calc(100cqw - ${spawn.left}px - 7rem)`,
                  } as CSSProperties)
                : undefined
            }
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button type="button" className={`hit ${styles.playBtn}`} onClick={startPlaying}>
              The name is walkable.
            </button>
            <p className={`mono ${styles.hintText}`} aria-live="polite">
              {hint}
            </p>
          </div>
        </div>

        <div className={styles.foot}>
          <Link className={`mono hit ${styles.cue}`} to="#practice">
            <span>Scroll</span>
            <span className={styles.cueTrack} aria-hidden="true">
              <span className={styles.cueDot} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
