import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { feelStore, useFeel } from '../lib/feelStore';
import {
  DEFAULT_FEEL,
  createBody,
  jumpArc,
  pressJump,
  stepFixed,
  type Body,
  type FeelParams,
  type Input,
  type Solid,
} from '../lib/platformer';
import { rangeFill } from '../lib/rangeFill';
import { useCanvasLoop, wakeCanvas } from '../lib/useCanvasLoop';
import { useInputModality, useTouchSeen } from '../lib/useInputModality';
import { useCoarsePointer } from '../lib/useReducedMotion';
import styles from './GameFeelLab.module.css';

const LEVEL_W = 40;
const LEVEL_H = 18;
const SPAWN: [number, number] = [2, 12];

const LEVEL: Solid[] = [
  { x: 0, y: 15, w: 13, h: 3 },
  { x: 17, y: 15, w: 23, h: 3 },
  { x: 21, y: 13, w: 3, h: 2 },
  { x: 24, y: 11, w: 3, h: 4 },
  { x: 31, y: 9, w: 1.5, h: 6 },
  { x: 4, y: 11, w: 5.5, h: 0.35, oneWay: true },
  { x: 9.5, y: 7.5, w: 5, h: 0.35, oneWay: true },
  { x: 16, y: 4.5, w: 6, h: 0.35, oneWay: true },
  { x: 33.5, y: 7.5, w: 5, h: 0.35, oneWay: true },
  { x: -1, y: -40, w: 1, h: 60 },
  { x: LEVEL_W, y: -40, w: 1, h: 60 },
];

const PRESETS: Record<string, Partial<FeelParams>> = {
  Floaty: { gravity: 48, jumpHeight: 5.2, runSpeed: 9, airControl: 0.95, groundAccel: 50, squash: 0.35 },
  Default: DEFAULT_FEEL,
  Snappy: { gravity: 150, jumpHeight: 4.2, runSpeed: 16, airControl: 0.85, groundAccel: 260, squash: 0.85 },
  Heavy: { gravity: 190, jumpHeight: 3, runSpeed: 8, airControl: 0.3, groundAccel: 60, squash: 1 },
};

interface Control {
  key: keyof FeelParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  fmt?: (v: number) => string;
}

const CONTROLS: Control[] = [
  { key: 'gravity', label: 'Gravity', min: 30, max: 220, step: 1, unit: 'u/s²' },
  { key: 'jumpHeight', label: 'Jump height', min: 1.5, max: 8, step: 0.1, unit: 'u', fmt: (v) => v.toFixed(1) },
  { key: 'runSpeed', label: 'Run speed', min: 4, max: 26, step: 0.5, unit: 'u/s', fmt: (v) => v.toFixed(1) },
  { key: 'airControl', label: 'Air control', min: 0, max: 1, step: 0.05, unit: '', fmt: (v) => `${Math.round(v * 100)}%` },
  { key: 'coyoteMs', label: 'Coyote time', min: 0, max: 250, step: 5, unit: 'ms' },
  { key: 'bufferMs', label: 'Jump buffer', min: 0, max: 250, step: 5, unit: 'ms' },
  { key: 'squash', label: 'Squash & stretch', min: 0, max: 1, step: 0.05, unit: '', fmt: (v) => `${Math.round(v * 100)}%` },
];

const SPOKEN_UNITS: Record<string, string> = {
  u: 'units',
  'u/s': 'units per second',
  'u/s²': 'units per second squared',
  ms: 'milliseconds',
};

const KEYS: Record<string, 'left' | 'right' | 'jump' | 'reset'> = {
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
  r: 'reset',
  R: 'reset',
};

interface Trail {
  pts: Array<[number, number]>;
  born: number;
}

interface Tag {
  text: string;
  x: number;
  y: number;
  born: number;
}

export default function GameFeelLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const feel = useFeel();
  const [arcs, setArcs] = useState(true);
  const [focused, setFocused] = useState(false);
  const coarse = useCoarsePointer();
  const modality = useInputModality();
  // On-screen buttons whenever touch has been used, even on a touchscreen laptop. Sticky, so pressing
  // a key on a pad button can't unmount the button it's holding down.
  const touchSeen = useTouchSeen();
  const showPad = coarse || touchSeen;
  const arcsRef = useRef(arcs);
  useEffect(() => {
    arcsRef.current = arcs;
    wakeCanvas(canvasRef.current);
  }, [arcs]);
  useEffect(() => {
    wakeCanvas(canvasRef.current);
  }, [feel]);
  const sim = useRef<{ body: Body; input: Input; reset: () => void } | null>(null);
  const idBase = useId();

  useCanvasLoop(canvasRef, () => {
    let body = createBody(SPAWN[0], SPAWN[1]);
    const input: Input = { left: false, right: false, jumpHeld: false };
    let acc = 0;
    let unit = 16;
    const trails: Trail[] = [];
    let current: Trail | null = null;
    const tags: Tag[] = [];
    let lastSample = 0;

    const reset = () => {
      body = createBody(SPAWN[0], SPAWN[1]);
      sim.current!.body = body;
      current = null;
    };
    sim.current = { body, input, reset };

    return {
      setup({ width }) {
        unit = width / LEVEL_W;
      },
      frame({ ctx, width, height }, dt, t) {
        const p = feelStore.get();
        acc = stepFixed(body, input, LEVEL, p, dt, t, acc, (e) => {
          if (e.type === 'jump') {
            current = { pts: [], born: t };
            trails.push(current);
            if (trails.length > 4) trails.shift();
            if (e.coyote) tags.push({ text: 'coyote', x: body.x, y: body.y, born: t });
            else if (e.buffered) tags.push({ text: 'buffered', x: body.x, y: body.y, born: t });
          }
          if (e.type === 'land') current = null;
        });
        if (body.y > LEVEL_H + 3) {
          tags.push({ text: 'respawn', x: SPAWN[0], y: SPAWN[1] - 1.5, born: t });
          reset();
        }
        if (current && t - lastSample > 16) {
          current.pts.push([body.x + 0.5, body.y + 0.5]);
          lastSample = t;
        }

        // ---- draw
        ctx.clearRect(0, 0, width, height);
        const u = unit;

        // grid
        ctx.strokeStyle = 'rgba(236,231,221,0.045)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= LEVEL_W; x += 2) {
          ctx.moveTo(Math.round(x * u) + 0.5, 0);
          ctx.lineTo(Math.round(x * u) + 0.5, height);
        }
        for (let y = 0; y <= LEVEL_H; y += 2) {
          ctx.moveTo(0, Math.round(y * u) + 0.5);
          ctx.lineTo(width, Math.round(y * u) + 0.5);
        }
        ctx.stroke();

        // level
        for (const s of LEVEL) {
          if (s.x < 0 || s.x >= LEVEL_W) continue;
          if (s.oneWay) {
            ctx.fillStyle = 'rgba(236,231,221,0.7)';
            ctx.fillRect(s.x * u, s.y * u, s.w * u, 2);
            ctx.fillStyle = 'rgba(236,231,221,0.12)';
            for (let x = s.x; x < s.x + s.w; x += 0.5) ctx.fillRect(x * u, s.y * u + 4, 1, u * 0.3);
          } else {
            ctx.fillStyle = 'rgba(236,231,221,0.07)';
            ctx.fillRect(s.x * u, s.y * u, s.w * u, s.h * u);
            ctx.fillStyle = 'rgba(236,231,221,0.7)';
            ctx.fillRect(s.x * u, s.y * u, s.w * u, 2);
          }
        }

        // jump trails
        if (arcsRef.current) {
          trails.forEach((tr, i) => {
            const age = trails.length - 1 - i;
            ctx.fillStyle = `rgba(236,231,221,${0.5 - age * 0.11})`;
            tr.pts.forEach(([x, y], k) => {
              if (k % 2) return;
              ctx.fillRect(x * u - 1, y * u - 1, 2, 2);
            });
          });
          // Predicted arc from where you stand.
          if (body.grounded) {
            const dir = body.facing;
            const vx = Math.max(Math.abs(body.vx), p.runSpeed * 0.999) * dir;
            ctx.strokeStyle = 'rgba(232,85,58,0.45)';
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            jumpArc(p, vx, 28).forEach(([ax, ay], k) => {
              const px = (body.x + 0.5 + ax) * u;
              const py = (body.y + 0.5 + ay) * u;
              if (k === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            });
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // player
        const w = u * body.scaleX;
        const h = u * body.scaleY;
        ctx.fillStyle = '#e8553a';
        ctx.fillRect(body.x * u + (u - w) / 2, body.y * u + (u - h), w, h);

        // tags
        ctx.font = `${Math.max(10, u * 0.55)}px "Geist Mono Variable", monospace`;
        ctx.textAlign = 'center';
        for (let i = tags.length - 1; i >= 0; i--) {
          const tg = tags[i]!;
          const age = (t - tg.born) / 1000;
          if (age > 1.1) {
            tags.splice(i, 1);
            continue;
          }
          ctx.fillStyle = `rgba(232,85,58,${1 - age / 1.1})`;
          ctx.fillText(tg.text, (tg.x + 0.5) * u, (tg.y - 0.6 - age * 1.2) * u);
        }

        const idle =
          body.grounded &&
          !input.left &&
          !input.right &&
          Math.abs(body.vx) < 0.001 &&
          Math.abs(body.scaleX - 1) < 0.002 &&
          Math.abs(body.scaleY - 1) < 0.002 &&
          tags.length === 0;
        return !idle;
      },
    };
  });

  const setKey = (k: 'left' | 'right' | 'jump', down: boolean, repeat = false) => {
    const s = sim.current;
    if (!s) return;
    if (k === 'left') s.input.left = down;
    if (k === 'right') s.input.right = down;
    if (k === 'jump') {
      if (down && !repeat) pressJump(s.body, performance.now());
      s.input.jumpHeld = down;
    }
    wakeCanvas(canvasRef.current);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const k = KEYS[e.key];
    if (!k) return;
    e.preventDefault();
    if (k === 'reset') sim.current?.reset();
    else setKey(k, true, e.repeat);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    const k = KEYS[e.key];
    if (!k || k === 'reset') return;
    e.preventDefault();
    setKey(k, false);
  };

  const activePreset = Object.entries(PRESETS).find(([, v]) =>
    Object.entries(v).every(([k, val]) => Math.abs((feel[k as keyof FeelParams] as number) - (val as number)) < 1e-6),
  )?.[0];

  return (
    <div className={styles.lab}>
      <div className={styles.stageCol}>
        <div
          className={styles.stage}
          data-focused={focused}
          tabIndex={0}
          role="group"
          aria-roledescription="playable demo"
          aria-label={
            showPad
              ? 'Game feel lab. Use the move and jump buttons below the level.'
              : 'Game feel lab. Arrow keys or A and D move, the up arrow, W or space jumps, R resets.'
          }
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            const s = sim.current;
            if (s) s.input.left = s.input.right = s.input.jumpHeld = false;
          }}
          onPointerDown={(e) => {
            if (e.pointerType === 'mouse') {
              e.preventDefault();
              e.currentTarget.focus({ preventScroll: true });
            }
          }}
        >
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
          <p className={styles.overlay} aria-hidden="true">
            {focused
              ? '← → move   ↑ / space jump   R reset'
              : showPad
                ? 'Hold the buttons below'
                : modality === 'keyboard'
                  ? 'Focus here, then use the arrow keys'
                  : 'Click to play'}
          </p>
        </div>

        {showPad ? (
          <div className={styles.pad}>
            <HoldButton label="←" ariaLabel="Move left" onHold={(d) => setKey('left', d)} />
            <HoldButton label="→" ariaLabel="Move right" onHold={(d) => setKey('right', d)} />
            <HoldButton label="Jump" ariaLabel="Jump" className={styles.padJump} onHold={(d) => setKey('jump', d)} />
          </div>
        ) : null}
      </div>

      <div className={styles.panel}>
        <div className={styles.presets} role="group" aria-label="Presets">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              type="button"
              className={styles.preset}
              aria-pressed={activePreset === name}
              onClick={() => (name === 'Default' ? feelStore.reset() : feelStore.set({ ...DEFAULT_FEEL, ...PRESETS[name] }))}
            >
              {name}
            </button>
          ))}
        </div>

        <div className={styles.controls}>
          {CONTROLS.map((c) => {
            const v = feel[c.key];
            const id = `${idBase}-${c.key}`;
            return (
              <div key={c.key} className={styles.control}>
                <label htmlFor={id} className={styles.controlLabel}>
                  {c.label}
                </label>
                <output htmlFor={id} className={styles.controlValue}>
                  {c.fmt ? c.fmt(v) : Math.round(v)}
                  {c.unit ? <span> {c.unit}</span> : null}
                </output>
                <input
                  id={id}
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={v}
                  aria-valuetext={`${c.fmt ? c.fmt(v) : Math.round(v)} ${SPOKEN_UNITS[c.unit] ?? ''}`.trim()}
                  onChange={(e) => feelStore.set({ [c.key]: Number(e.target.value) })}
                  className={`range ${styles.controlRange}`}
                  style={rangeFill(v, c.min, c.max)}
                />
              </div>
            );
          })}
        </div>

        <label className={styles.toggle}>
          <input type="checkbox" checked={arcs} onChange={(e) => setArcs(e.target.checked)} />
          <span className={styles.toggleBox} aria-hidden="true" />
          Show jump arcs
        </label>

        <p className={styles.panelNote}>
          These settings drive the square at the top of the page too. Break it, then press Default.
        </p>
      </div>
    </div>
  );
}

interface HoldButtonProps {
  label: string;
  ariaLabel: string;
  className?: string;
  onHold: (down: boolean) => void;
}

/** A touch button that reports press and release, like a gamepad button. */
function HoldButton({ label, ariaLabel, className, onHold }: HoldButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={className}
      onPointerDown={(e) => {
        e.preventDefault();
        onHold(true);
      }}
      onPointerUp={() => onHold(false)}
      onPointerLeave={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
      onContextMenu={(e) => e.preventDefault()}
      // Enter and Space hold the button too, so the pad isn't touch-only.
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault();
          onHold(true);
        }
      }}
      onKeyUp={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onHold(false);
      }}
      onBlur={() => onHold(false)}
    >
      {label}
    </button>
  );
}
