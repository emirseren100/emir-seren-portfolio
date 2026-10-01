import { useRef } from 'react';
import { useCanvasLoop, wakeCanvas } from '../lib/useCanvasLoop';
import { prefersReducedMotion } from '../lib/useReducedMotion';
import styles from './UnitField.module.css';

interface Unit {
  x: number;
  y: number;
  vy: number;
  sy: number;
}

/**
 * A field of little squares. Sweep across it and they hop out of the way.
 * Same physics vocabulary as the square at the top of the page, a hundred times over.
 */
export function UnitField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<{ x: number; y: number; active: boolean }>({ x: -999, y: -999, active: false });

  useCanvasLoop(ref, () => {
    let units: Unit[] = [];
    let size = 10;
    let gap = 26;
    let idleAt = 0;
    const reduced = prefersReducedMotion();

    return {
      setup({ width, height }) {
        gap = width < 500 ? 22 : 28;
        size = Math.round(gap * 0.36);
        const cols = Math.floor(width / gap);
        const rows = Math.floor(height / gap);
        const ox = (width - (cols - 1) * gap) / 2;
        const oy = (height - (rows - 1) * gap) / 2;
        units = [];
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) units.push({ x: ox + c * gap, y: oy + r * gap, vy: 0, sy: 0 });
      },
      frame({ ctx, width, height }, dt, t) {
        const p = pointer.current;
        const radius = gap * 3.2;
        let moving = false;

        if (!reduced && !p.active && t > idleAt) {
          // Every so often, one unit hops on its own.
          const u = units[Math.floor(Math.random() * units.length)];
          if (u && u.sy === 0 && u.vy === 0) u.vy = -gap * 9;
          idleAt = t + 600 + Math.random() * 900;
        }

        ctx.clearRect(0, 0, width, height);
        for (const u of units) {
          if (p.active) {
            const d = Math.hypot(u.x - p.x, u.y - p.y);
            if (d < radius && u.sy === 0 && u.vy === 0) u.vy = -gap * 13 * (1 - d / radius) - gap * 2;
          }
          if (u.vy !== 0 || u.sy !== 0) {
            u.vy += gap * 70 * dt;
            u.sy += u.vy * dt;
            if (u.sy >= 0) {
              u.sy = 0;
              u.vy = 0;
            }
            moving = true;
          }
          const h = Math.min(1, -u.sy / (gap * 1.6));
          ctx.fillStyle = h > 0.02 ? `rgba(232, 85, 58, ${0.45 + h * 0.55})` : 'rgba(236, 231, 221, 0.22)';
          const s = size * (1 + h * 0.25);
          ctx.fillRect(u.x - s / 2, u.y + u.sy - s / 2, s, s);
        }
        return moving || p.active || !reduced;
      },
    };
  });

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top, active: true };
    wakeCanvas(ref.current);
  };

  return (
    <canvas
      ref={ref}
      className={styles.field}
      aria-label="A field of small squares that hop away from your pointer."
      role="img"
      onPointerMove={move}
      onPointerDown={move}
      onPointerLeave={() => (pointer.current.active = false)}
      onPointerUp={(e) => e.pointerType !== 'mouse' && (pointer.current.active = false)}
    />
  );
}
