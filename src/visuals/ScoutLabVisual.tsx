import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { useAutoplay } from '../lib/useAutoplay';
import { useTweenedArray } from '../lib/tween';
import { Frame } from './Frame';
import styles from './ScoutLabVisual.module.css';

const AXES = ['Prog. passes', 'Key passes', 'Dribbles', 'Pass %', 'Tackles', 'Interceptions', 'Aerials', 'xA'];

/** Fictional, anonymised scouting profiles. Percentiles vs. central midfielders. */
const PLAYERS = [
  { id: 'SL-0142', profile: 'Deep playmaker', age: 21, foot: 'L', values: [88, 62, 41, 91, 58, 72, 35, 55], zone: [1.6, 2.0] },
  { id: 'SL-0087', profile: 'Box-to-box', age: 23, foot: 'R', values: [64, 55, 70, 74, 81, 66, 62, 49], zone: [2.6, 1.7] },
  { id: 'SL-0311', profile: 'Ball winner', age: 20, foot: 'R', values: [42, 30, 38, 79, 93, 88, 71, 22], zone: [1.2, 1.4] },
  { id: 'SL-0209', profile: 'Creative eight', age: 22, foot: 'L', values: [76, 90, 84, 68, 37, 41, 28, 86], zone: [3.4, 2.3] },
];

const COLS = 8;
const ROWS = 5;

function heat(zone: number[], seed: number): number[] {
  const [cx = 2, cy = 2] = zone;
  const cells: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const d = Math.hypot((c / (COLS - 1)) * 4.4 - cx, (r / (ROWS - 1)) * 4 - cy);
      const noise = (Math.sin((c + 1) * 12.9898 + (r + 1) * 78.233 + seed) * 43758.5453) % 1;
      cells.push(Math.max(0, Math.min(1, 1.15 - d * 0.42 + Math.abs(noise) * 0.18)));
    }
  }
  return cells;
}

function polygon(values: number[], r: number, c: number) {
  return values
    .map((v, i) => {
      const a = (i / values.length) * Math.PI * 2 - Math.PI / 2;
      const rr = (v / 100) * r;
      return `${(c + Math.cos(a) * rr).toFixed(2)},${(c + Math.sin(a) * rr).toFixed(2)}`;
    })
    .join(' ');
}

export function ScoutLabVisual({ large = false }: { large?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { tick, takeOver } = useAutoplay(ref, 3200);
  const [picked, setPicked] = useState<number | null>(null);
  const active = picked ?? tick % PLAYERS.length;
  const [compare, setCompare] = useState(0);
  const compareIdx = picked === null ? (active + PLAYERS.length - 1) % PLAYERS.length : compare;

  const player = PLAYERS[active]!;
  const other = PLAYERS[compareIdx]!;
  const values = useTweenedArray(player.values, 800);
  const heatTarget = useMemo(() => heat(player.zone, active), [player.zone, active]);
  const cells = useTweenedArray(heatTarget, 900);

  const size = 300;
  const c = size / 2;
  const r = size / 2 - 46;

  const select = (i: number) => {
    takeOver();
    if (i !== active) setCompare(active);
    setPicked(i);
  };

  return (
    <div ref={ref}>
      <Frame
        app="ScoutLab"
        context="Shortlist · Central midfield · U23"
        right={<span>per 90 · percentile vs role</span>}
        label="ScoutLab interface: a shortlist of four anonymised midfielders and a radar chart comparing them."
        className={`${styles.frame} ${large ? styles.large : ''}`}
      >
        <div className={styles.layout} style={{ '--ink': 'var(--ink-scout)' } as CSSProperties}>
          <div className={styles.radarWrap}>
            <svg viewBox={`0 0 ${size} ${size}`} className={styles.radar} role="img" aria-label={`Radar for ${player.id}, ${player.profile}`}>
              {[0.25, 0.5, 0.75, 1].map((k) => (
                <polygon
                  key={k}
                  points={polygon(AXES.map(() => k * 100), r, c)}
                  className={k === 1 ? styles.ringOuter : styles.ring}
                />
              ))}
              {AXES.map((label, i) => {
                const a = (i / AXES.length) * Math.PI * 2 - Math.PI / 2;
                const x2 = c + Math.cos(a) * r;
                const y2 = c + Math.sin(a) * r;
                const lx = c + Math.cos(a) * (r + 22);
                const ly = c + Math.sin(a) * (r + 22);
                return (
                  <g key={label}>
                    <line x1={c} y1={c} x2={x2} y2={y2} className={styles.spoke} />
                    <text
                      x={lx}
                      y={ly}
                      className={styles.axis}
                      textAnchor={Math.abs(Math.cos(a)) < 0.2 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end'}
                      dominantBaseline="middle"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
              <polygon points={polygon(other.values, r, c)} className={styles.ghost} />
              <polygon points={polygon(values, r, c)} className={styles.shape} />
              {values.map((v, i) => {
                const a = (i / values.length) * Math.PI * 2 - Math.PI / 2;
                const rr = (v / 100) * r;
                return <rect key={i} x={c + Math.cos(a) * rr - 2.5} y={c + Math.sin(a) * rr - 2.5} width={5} height={5} className={styles.vertex} />;
              })}
            </svg>
            <div className={styles.legend}>
              <span>
                <i className={styles.swatch} /> {player.id}
              </span>
              <span>
                <i className={styles.swatchGhost} /> {other.id}
              </span>
            </div>
          </div>

          <div className={styles.side}>
            <p className={styles.sideLabel}>Shortlist</p>
            <ul className={styles.list}>
              {PLAYERS.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={styles.row}
                    data-active={i === active}
                    aria-pressed={i === active}
                    onClick={() => select(i)}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && select(i)}
                  >
                    <span className={styles.rowId}>{p.id}</span>
                    <span className={styles.rowProfile}>{p.profile}</span>
                    <span className={styles.rowMeta}>
                      {p.age} · {p.foot}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className={styles.pitch} aria-hidden="true">
              <div className={styles.cells}>
                {cells.map((v, i) => (
                  <span key={i} style={{ opacity: 0.08 + v * 0.8 } as CSSProperties} />
                ))}
              </div>
              <span className={styles.half} />
              <span className={styles.circle} />
              <span className={styles.boxL} />
              <span className={styles.boxR} />
            </div>
            <p className={styles.caption}>Touch map · last 10 matches</p>
          </div>
        </div>
      </Frame>
    </div>
  );
}
