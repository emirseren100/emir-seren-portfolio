import { useRef } from 'react';
import type { Project } from '../content/projects';
import { useInView } from '../lib/useInView';
import styles from './SystemDiagram.module.css';

const BOX_W = 224;
const ROW_H = 18;
const HEAD_H = 34;
const GAP_X = 300;
const GAP_Y = 210;
const PAD = 24;

/** Entity diagram for a case study. Lines draw in, then boxes settle. */
export function SystemDiagram({ system }: { system: Project['system'] }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { rootMargin: '0px 0px -15% 0px' });

  const boxes = system.entities.map((e) => {
    const h = HEAD_H + e.fields.length * ROW_H + 10;
    return { ...e, x: PAD + e.at[0] * GAP_X, y: PAD + e.at[1] * GAP_Y, w: BOX_W, h };
  });
  const byId = new Map(boxes.map((b) => [b.id, b]));
  const cols = Math.max(...boxes.map((b) => b.at[0])) + 1;
  const rows = Math.max(...boxes.map((b) => b.at[1])) + 1;
  const width = PAD * 2 + (cols - 1) * GAP_X + BOX_W;
  const height = PAD * 2 + (rows - 1) * GAP_Y + Math.max(...boxes.map((b) => b.h));

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      className={`${styles.diagram} ${inView ? styles.in : ''}`}
      role="img"
      aria-label={`Diagram: ${system.entities.map((e) => e.label).join(', ')}.`}
    >
      {system.links.map(([a, b, label], i) => {
        const A = byId.get(a);
        const B = byId.get(b);
        if (!A || !B) return null;
        const x1 = A.x + A.w / 2;
        const y1 = A.y + A.h / 2;
        const x2 = B.x + B.w / 2;
        const y2 = B.y + B.h / 2;
        const len = Math.hypot(x2 - x1, y2 - y1);
        return (
          <g key={i} style={{ ['--len' as string]: len, ['--i' as string]: i }} className={styles.link}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle">
              {label}
            </text>
          </g>
        );
      })}
      {boxes.map((b, i) => (
        <g key={b.id} className={styles.box} style={{ ['--i' as string]: i }}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={3} />
          <line x1={b.x} x2={b.x + b.w} y1={b.y + HEAD_H - 6} y2={b.y + HEAD_H - 6} />
          <rect x={b.x + 12} y={b.y + 12} width={7} height={7} className={styles.mark} />
          <text x={b.x + 27} y={b.y + 20} className={styles.title}>
            {b.label}
          </text>
          {b.fields.map((f, k) => (
            <text key={f} x={b.x + 12} y={b.y + HEAD_H + 10 + k * ROW_H} className={styles.field}>
              {f}
            </text>
          ))}
        </g>
      ))}
    </svg>
  );
}
