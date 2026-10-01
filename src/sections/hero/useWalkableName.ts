import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { feelStore } from '../../lib/feelStore';
import {
  createBody,
  pressJump,
  stepFixed,
  type Body,
  type EngineEvent,
  type Input,
  type Solid,
} from '../../lib/platformer';
import { measureLetters, toSolids, type LetterBox, type LineGuides } from './measure';

/** The player square is this fraction of the name's font size. */
const UNIT_RATIO = 0.056;

export type HeroMessage = 'tittle' | 'fall' | 'end' | null;

interface Options {
  stageRef: RefObject<HTMLElement | null>;
  nameRef: RefObject<HTMLElement | null>;
  playerRef: RefObject<HTMLElement | null>;
  /** Changes whenever the letter markup changes (e.g. one line ↔ two lines). */
  layoutKey: string;
  ready: boolean;
  reduced: boolean;
  /** Fit the name to this fraction of the viewport height at most. */
  maxHeightRatio: number;
}

interface Spring {
  y: number;
  v: number;
}

export function useWalkableName({
  stageRef,
  nameRef,
  playerRef,
  layoutKey,
  ready,
  reduced,
  maxHeightRatio,
}: Options) {
  const [guides, setGuides] = useState<LineGuides[]>([]);
  const [message, setMessage] = useState<HeroMessage>(null);
  const [active, setActive] = useState(false);
  const api = useRef<{
    jumpToward: (stageX: number | null) => void;
    setKey: (key: 'left' | 'right' | 'jump', down: boolean, repeat?: boolean) => void;
    release: () => void;
  } | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const name = nameRef.current;
    const player = playerRef.current;
    if (!stage || !name || !player) return;

    const letters = Array.from(name.querySelectorAll<HTMLElement>('[data-char]'));
    const probes = Array.from(name.querySelectorAll<HTMLElement>('[data-probe]'));
    const inners = letters.map((l) => l.firstElementChild as HTMLElement | null);
    const inner = player.firstElementChild as HTMLElement | null;

    let unit = 16;
    let boxes: LetterBox[] = [];
    let solids: Solid[] = [];
    let body: Body = createBody(0, -100);
    const input: Input = { left: false, right: false, jumpHeld: false };
    let target: number | null = null;
    let acc = 0;
    let last = 0;
    let raf = 0;
    let visible = true;
    let frozenUntil = 0;
    let idleHopAt = 0;
    let interacted = false;
    const springs: Spring[] = letters.map(() => ({ y: 0, v: 0 }));
    const seen = new Set<HeroMessage>();
    let messageTimer = 0;

    const say = (m: Exclude<HeroMessage, null>) => {
      if (seen.has(m)) return;
      seen.add(m);
      setMessage(m);
      window.clearTimeout(messageTimer);
      messageTimer = window.setTimeout(() => setMessage(null), 4200);
    };

    /* ---------- Measuring ---------- */

    const ctxKern = document.createElement('canvas').getContext('2d');

    function kern(fontSize: number, family: string, weight: string) {
      // Each letter is its own inline-block (so it can move), which breaks kerning.
      // Put the font's kerning back by measuring each pair.
      if (!ctxKern) return;
      ctxKern.font = `${weight} ${fontSize}px ${family}`;
      letters.forEach((el, i) => {
        const next = letters[i + 1];
        const a = el.dataset.char ?? '';
        const b = next && next.dataset.line === el.dataset.line ? (next.dataset.char ?? '') : '';
        if (!b || a === ' ' || b === ' ') {
          el.style.marginRight = '';
          return;
        }
        const k =
          ctxKern.measureText(a + b).width - ctxKern.measureText(a).width - ctxKern.measureText(b).width;
        el.style.marginRight = Math.abs(k) > 0.01 ? `${(k / fontSize).toFixed(4)}em` : '';
      });
    }

    function fit() {
      const cs = getComputedStyle(name!);
      name!.style.fontSize = '100px';
      kern(100, cs.fontFamily, cs.fontWeight);
      const lines = Array.from(name!.querySelectorAll<HTMLElement>('[data-line-el]'));
      const widest = Math.max(...lines.map((l) => l.offsetWidth), 1);
      const avail = stage!.clientWidth;
      const byWidth = (avail / widest) * 100;
      const byHeight = (window.innerHeight * maxHeightRatio) / (0.82 * lines.length);
      const size = Math.max(40, Math.min(byWidth, byHeight));
      name!.style.fontSize = `${size.toFixed(2)}px`;
      return { size, family: cs.fontFamily, weight: cs.fontWeight };
    }

    function measure() {
      const font = fit();
      unit = Math.max(9, Math.round(font.size * UNIT_RATIO));
      const result = measureLetters(letters, probes, font);
      boxes = result.boxes;
      solids = toSolids(boxes, unit, stage!.clientWidth);
      player!.style.width = `${unit}px`;
      player!.style.height = `${unit}px`;
      setGuides(result.guides);
    }

    const firstBox = () => boxes[0];
    function placeOn(box: LetterBox | undefined, dropFrom?: number) {
      if (!box) return;
      const x = ((box.left + box.right) / 2) / unit - 0.5;
      const y = dropFrom ?? box.top / unit - 1;
      const size = body.size;
      body = createBody(x, y, size);
    }

    function render() {
      player!.style.transform = `translate3d(${(body.x * unit).toFixed(2)}px, ${(body.y * unit).toFixed(2)}px, 0)`;
      if (inner) {
        inner.style.transform = `scale(${body.scaleX.toFixed(3)}, ${body.scaleY.toFixed(3)})`;
      }
      springs.forEach((s, i) => {
        const el = inners[i];
        if (el) el.style.transform = Math.abs(s.y) > 0.05 ? `translate3d(0, ${s.y.toFixed(2)}px, 0)` : '';
      });
    }

    /* ---------- Loop ---------- */

    function onEvent(e: EngineEvent) {
      if (e.type === 'land' && typeof e.solid.id === 'number') {
        const idx = letters.findIndex((l) => Number(l.dataset.index) === e.solid.id);
        const s = springs[idx];
        if (s) s.v += Math.min(e.impact, 40) * unit * 0.22;
        dust(e.impact);
        const box = boxes.find((b) => b.index === e.solid.id);
        if (box?.char === 'i') say('tittle');
        if (box && box === boxes[boxes.length - 1] && interacted) say('end');
      }
    }

    function dust(impact: number) {
      if (reduced || impact < 14) return;
      const n = 4;
      for (let i = 0; i < n; i++) {
        const d = document.createElement('span');
        d.className = 'hero-dust';
        const dir = i < n / 2 ? -1 : 1;
        d.style.left = `${(body.x + 0.5) * unit}px`;
        d.style.top = `${(body.y + 1) * unit}px`;
        d.style.setProperty('--dx', `${dir * (0.6 + Math.random() * 0.9) * unit}px`);
        d.style.setProperty('--dy', `${-(0.2 + Math.random() * 0.5) * unit}px`);
        d.style.setProperty('--s', `${Math.max(2, unit * 0.18)}px`);
        d.addEventListener('animationend', () => d.remove(), { once: true });
        stage!.appendChild(d);
      }
    }

    function settled() {
      const moving =
        !body.grounded ||
        Math.abs(body.vx) > 0.001 ||
        Math.abs(body.scaleX - 1) > 0.002 ||
        Math.abs(body.scaleY - 1) > 0.002;
      const springing = springs.some((s) => Math.abs(s.y) > 0.05 || Math.abs(s.v) > 0.5);
      return !moving && !springing && !input.left && !input.right && target === null;
    }

    function frame(t: number) {
      raf = 0;
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 1 / 60;
      last = t;

      if (t >= frozenUntil) {
        // Pointer auto-walk.
        if (target !== null) {
          const dx = target - body.x;
          input.left = dx < -0.15;
          input.right = dx > 0.15;
          if (!input.left && !input.right) {
            target = null;
          }
        }

        if (idleHopAt && t >= idleHopAt && !interacted && body.grounded) {
          idleHopAt = 0;
          pressJump(body, t);
        }

        acc = stepFixed(body, input, solids, feelStore.get(), dt, t, acc, onEvent);

        const standing = body.standingOn && typeof body.standingOn.id === 'number' ? body.standingOn.id : -1;
        springs.forEach((s, i) => {
          const weight = Number(letters[i]?.dataset.index) === standing ? unit * 0.08 : 0;
          const k = 520;
          const c = 16;
          s.v += (-(s.y - weight) * k - s.v * c) * dt;
          s.y += s.v * dt;
        });

        const stageH = stage!.clientHeight;
        if (body.y * unit > stageH + unit * 6) {
          if (interacted) say('fall');
          target = null;
          const b = firstBox();
          placeOn(b, b ? b.top / unit - 7 : 0);
        }
      }

      render();
      if (visible && (!settled() || t < frozenUntil)) raf = requestAnimationFrame(frame);
      else last = 0;
    }

    const wake = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame);
    };

    /* ---------- Public controls ---------- */

    api.current = {
      jumpToward(stageX) {
        interacted = true;
        if (stageX !== null) target = stageX / unit - 0.5;
        pressJump(body, performance.now());
        input.jumpHeld = true;
        window.setTimeout(() => {
          input.jumpHeld = false;
        }, 160);
        wake();
      },
      setKey(key, down, repeat) {
        interacted = true;
        target = null;
        if (key === 'left') input.left = down;
        if (key === 'right') input.right = down;
        if (key === 'jump') {
          if (down && !repeat) pressJump(body, performance.now());
          input.jumpHeld = down;
        }
        wake();
      },
      release() {
        input.left = input.right = input.jumpHeld = false;
        target = null;
        wake();
      },
    };

    /* ---------- Lifecycle ---------- */

    measure();

    if (ready) {
      const b = firstBox();
      if (reduced) {
        placeOn(b);
      } else {
        // Drop in from above the viewport after the letters have risen.
        const above = -(stage.getBoundingClientRect().top + window.scrollY + unit * 4) / unit;
        placeOn(b, above);
        frozenUntil = performance.now() + 1050;
        idleHopAt = performance.now() + 3600;
      }
      render();
      wake();
    } else {
      player.style.transform = 'translate3d(-200px,-200px,0)';
    }

    const ro = new ResizeObserver(() => {
      const standing = body.standingOn?.id;
      measure();
      const box = boxes.find((bx) => bx.index === standing) ?? (ready ? firstBox() : undefined);
      if (box && ready && body.grounded) placeOn(box);
      render();
      wake();
    });
    ro.observe(stage);

    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible) wake();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
      }
    });
    io.observe(stage);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.clearTimeout(messageTimer);
      api.current = null;
      letters.forEach((l) => (l.style.marginRight = ''));
    };
  }, [stageRef, nameRef, playerRef, layoutKey, ready, reduced, maxHeightRatio]);

  const jumpToward = useCallback((x: number | null) => api.current?.jumpToward(x), []);
  const setKey = useCallback(
    (key: 'left' | 'right' | 'jump', down: boolean, repeat?: boolean) => api.current?.setKey(key, down, repeat),
    [],
  );
  const release = useCallback(() => api.current?.release(), []);

  return { guides, message, active, setActive, jumpToward, setKey, release };
}
