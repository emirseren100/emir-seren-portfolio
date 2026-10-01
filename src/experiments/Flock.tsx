import { useRef } from 'react';
import { useCanvasLoop } from '../lib/useCanvasLoop';
import { prefersReducedMotion } from '../lib/useReducedMotion';
import { usePointer } from './usePointer';

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Three rules — separation, alignment, cohesion — and a pointer they'd rather avoid. */
export default function Flock() {
  const ref = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(ref);

  useCanvasLoop(ref, () => {
    let boids: Boid[] = [];
    const reduced = prefersReducedMotion();
    return {
      setup({ width, height }) {
        const n = Math.round(Math.min(90, (width * height) / 2600));
        if (boids.length === n) return;
        boids = Array.from({ length: n }, () => {
          const a = Math.random() * Math.PI * 2;
          return { x: Math.random() * width, y: Math.random() * height, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 };
        });
      },
      frame({ ctx, width, height }, dt) {
        const p = pointer.current;
        const step = reduced && !p.active ? 0 : dt;
        const maxSpeed = 95;
        for (const b of boids) {
          let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, n = 0;
          for (const o of boids) {
            if (o === b) continue;
            const dx = o.x - b.x;
            const dy = o.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > 50 * 50) continue;
            n++;
            ax += o.vx;
            ay += o.vy;
            cx += o.x;
            cy += o.y;
            if (d2 < 16 * 16) {
              sx -= dx / (d2 + 1) * 120;
              sy -= dy / (d2 + 1) * 120;
            }
          }
          if (n) {
            b.vx += ((ax / n - b.vx) * 1.2 + (cx / n - b.x) * 0.9 + sx * 10) * step;
            b.vy += ((ay / n - b.vy) * 1.2 + (cy / n - b.y) * 0.9 + sy * 10) * step;
          }
          if (p.active) {
            const dx = b.x - p.x;
            const dy = b.y - p.y;
            const d = Math.hypot(dx, dy);
            if (d < 90) {
              b.vx += (dx / (d + 1)) * 900 * step;
              b.vy += (dy / (d + 1)) * 900 * step;
            }
          }
          const sp = Math.hypot(b.vx, b.vy) || 1;
          const target = Math.min(maxSpeed, Math.max(45, sp));
          b.vx = (b.vx / sp) * target;
          b.vy = (b.vy / sp) * target;
          b.x += b.vx * step;
          b.y += b.vy * step;
          if (b.x < -10) b.x += width + 20;
          if (b.x > width + 10) b.x -= width + 20;
          if (b.y < -10) b.y += height + 20;
          if (b.y > height + 10) b.y -= height + 20;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        for (const b of boids) {
          const sp = Math.hypot(b.vx, b.vy) || 1;
          const near = p.active && Math.hypot(b.x - p.x, b.y - p.y) < 90;
          ctx.strokeStyle = near ? '#e8553a' : 'rgba(236,231,221,0.75)';
          ctx.beginPath();
          ctx.moveTo(b.x - (b.vx / sp) * 7, b.y - (b.vy / sp) * 7);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        return !reduced || p.active;
      },
    };
  });

  return <canvas ref={ref} aria-hidden="true" style={{ touchAction: 'pan-y' }} />;
}
