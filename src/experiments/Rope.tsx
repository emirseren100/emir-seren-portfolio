import { useRef, useState } from 'react';
import { useCanvasLoop, wakeCanvas } from '../lib/useCanvasLoop';
import { prefersReducedMotion } from '../lib/useReducedMotion';
import { Experiment } from './Experiment';
import { usePointer } from './usePointer';

/** Keeps the 10px end weights fully inside the canvas. */
const EDGE = 7;

interface Pt {
  x: number;
  y: number;
  px: number;
  py: number;
  pinned: boolean;
}

/**
 * Simulation: verlet integration stores where a point was and infers where it's going.
 * The exposed number is how many constraint passes the solver gets each frame —
 * fewer is cheaper and stretchier, which is the trade every physics budget makes.
 */
export default function Rope() {
  const ref = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(ref);
  const [passes, setPasses] = useState(14);
  const passesRef = useRef(passes);
  const kick = useRef(false);
  const changePasses = (v: number) => {
    setPasses(v);
    passesRef.current = v;
    // Nudge the ropes, so the difference is visible straight away.
    kick.current = true;
    wakeCanvas(ref.current);
  };

  useCanvasLoop(ref, () => {
    let ropes: { pts: Pt[]; seg: number }[] = [];
    let grabbed: Pt | null = null;
    const reduced = prefersReducedMotion();

    return {
      setup({ width, height }) {
        const anchors = [0.28, 0.5, 0.72];
        const lengths = [0.5, 0.68, 0.42];
        ropes = anchors.map((ax, i) => {
          const n = 18;
          const len = height * lengths[i]!;
          const seg = len / n;
          const pts: Pt[] = [];
          // Start each rope swung out to one side, so it settles into place on first view
          // (hanging straight down if motion is reduced).
          const swing = reduced ? 0 : (i - 1) * 0.5 + 0.9;
          for (let k = 0; k <= n; k++) {
            const x = width * ax + Math.sin(swing) * k * seg;
            const y = 14 + Math.cos(swing) * k * seg;
            pts.push({ x, y, px: x, py: y, pinned: k === 0 });
          }
          return { pts, seg };
        });
      },
      frame({ ctx, width, height }, dt) {
        const p = pointer.current;
        const g = 900 * dt * dt;

        if (p.down && !grabbed) {
          let best = 26;
          for (const r of ropes)
            for (const pt of r.pts) {
              const d = Math.hypot(pt.x - p.x, pt.y - p.y);
              if (!pt.pinned && d < best) {
                best = d;
                grabbed = pt;
              }
            }
        }
        if (!p.down) grabbed = null;

        if (kick.current) {
          kick.current = false;
          for (const r of ropes) r.pts.forEach((pt, k) => !pt.pinned && (pt.px -= (k / r.pts.length) * 7));
        }

        let energy = 0;
        for (const r of ropes) {
          for (const pt of r.pts) {
            if (pt.pinned) continue;
            const vx = (pt.x - pt.px) * 0.992;
            const vy = (pt.y - pt.py) * 0.992;
            pt.px = pt.x;
            pt.py = pt.y;
            pt.x += vx;
            pt.y += vy + g;
            energy += Math.abs(vx) + Math.abs(vy);
            // A passing pointer brushes the ropes aside.
            if (p.active && !p.down) {
              const dx = pt.x - p.x;
              const dy = pt.y - p.y;
              const d = Math.hypot(dx, dy);
              if (d < 30) {
                pt.x += (dx / (d + 0.01)) * (30 - d) * 0.25;
                pt.y += (dy / (d + 0.01)) * (30 - d) * 0.25;
              }
            }
          }
          if (grabbed) {
            grabbed.x = p.x;
            grabbed.y = p.y;
          }
          for (let it = 0; it < passesRef.current; it++) {
            for (let k = 0; k < r.pts.length - 1; k++) {
              const a = r.pts[k]!;
              const b = r.pts[k + 1]!;
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const d = Math.hypot(dx, dy) || 0.0001;
              const diff = (d - r.seg) / d;
              const wa = a.pinned ? 0 : b.pinned ? 1 : 0.5;
              const wb = b.pinned ? 0 : a.pinned ? 1 : 0.5;
              a.x += dx * diff * wa;
              a.y += dy * diff * wa;
              b.x -= dx * diff * wb;
              b.y -= dy * diff * wb;
            }
          }
          for (const pt of r.pts) {
            pt.x = Math.max(EDGE, Math.min(width - EDGE, pt.x));
            pt.y = Math.min(height - EDGE, pt.y);
          }
        }

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(236,231,221,0.35)';
        ctx.fillRect(width * 0.18, 13, width * 0.64, 1);
        for (const r of ropes) {
          ctx.strokeStyle = 'rgba(236,231,221,0.75)';
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          r.pts.forEach((pt, k) => (k ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
          ctx.stroke();
          const end = r.pts[r.pts.length - 1]!;
          ctx.fillStyle = grabbed && r.pts.includes(grabbed) ? '#e8553a' : 'rgba(236,231,221,0.9)';
          ctx.fillRect(end.x - 5, end.y - 5, 10, 10);
        }
        return energy > 0.05 || p.active;
      },
    };
  });

  return (
    <Experiment
      param={{
        label: 'Solver passes per frame',
        value: passes,
        min: 1,
        max: 30,
        step: 1,
        format: (v) => `${v}`,
        onChange: changePasses,
      }}
    >
      <canvas ref={ref} aria-hidden="true" style={{ touchAction: 'pan-y', cursor: 'grab' }} />
    </Experiment>
  );
}
