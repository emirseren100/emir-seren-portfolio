import { useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { DAYS, SKUS, WEEKDAYS, insight, simulate, statusAt } from '../lib/stockSim';
import { useAutoplay } from '../lib/useAutoplay';
import { Frame } from './Frame';
import styles from './StockFlowVisual.module.css';

const W = 600;
const H = 180;
const PAD = { l: 28, r: 12, t: 14, b: 22 };

export function StockFlowVisual({ large = false }: { large?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const sims = useMemo(() => SKUS.map((s, i) => simulate(s, i + 1)), []);
  const { tick, manual, takeOver } = useAutoplay(ref, 380);
  const [manualDay, setManualDay] = useState(12);
  const [selected, setSelected] = useState(0);
  const day = manual ? manualDay : (tick + 6) % (DAYS + 1);
  const sliderId = useId();

  const sim = sims[selected]!;
  const max = Math.max(...sim.onHand, sim.sku.reorderAt) * 1.1;
  const x = (d: number) => PAD.l + (d / DAYS) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const line = (upTo: number) =>
    sim.onHand
      .slice(0, upTo + 1)
      .map((v, d) => `${d === 0 ? 'M' : 'L'}${x(d).toFixed(1)},${y(v).toFixed(1)}`)
      .join(' ');
  const full = line(DAYS);
  const past = line(day);
  const area = `${past} L${x(day).toFixed(1)},${y(0)} L${x(0)},${y(0)} Z`;

  const pick = (i: number) => {
    takeOver();
    setManualDay(day);
    setSelected(i);
  };

  return (
    <div ref={ref}>
      <Frame
        app="StockFlow"
        context="Back room · demo data"
        right={
          <span>
            {WEEKDAYS[day % 7]} · day {String(day).padStart(2, '0')} / {DAYS}
          </span>
        }
        label="StockFlow interface: a month of stock levels for a small café, with reorder points and deliveries."
        className={`${styles.frame} ${large ? styles.large : ''}`}
      >
        <div className={styles.top} style={{ '--ink': 'var(--ink-stock)' } as CSSProperties}>
          <div className={styles.chartHead}>
            <div>
              <p className={styles.skuName}>{sim.sku.name}</p>
              <p className={styles.skuCode}>
                {sim.sku.sku} · reorder at {sim.sku.reorderAt} · lead {sim.sku.leadDays}d
              </p>
            </div>
            <p className={styles.level}>
              {sim.onHand[day]}
              <span>on hand</span>
            </p>
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} aria-hidden="true" preserveAspectRatio="none">
            {[0, 7, 14, 21, 28].map((d) => (
              <g key={d}>
                <line x1={x(d)} x2={x(d)} y1={PAD.t} y2={H - PAD.b} className={styles.gridLine} />
                <text x={x(d)} y={H - 6} className={styles.tick}>
                  W{d / 7 + 1}
                </text>
              </g>
            ))}
            <line x1={PAD.l} x2={W - PAD.r} y1={y(sim.sku.reorderAt)} y2={y(sim.sku.reorderAt)} className={styles.reorder} />
            <text x={PAD.l - 6} y={y(sim.sku.reorderAt) + 3} className={styles.tickR}>
              {sim.sku.reorderAt}
            </text>
            <path d={full} className={styles.future} />
            <path d={area} className={styles.area} />
            <path d={past} className={styles.past} />
            {sim.orders.map((d) => (
              <rect key={`o${d}`} x={x(d) - 3} y={H - PAD.b - 3} width={6} height={6} className={d <= day ? styles.order : styles.orderFuture} />
            ))}
            {sim.arrivals.map((d) => (
              <path
                key={`a${d}`}
                d={`M${x(d)},${y(sim.onHand[d] ?? 0) - 8} l-4,6 h8 z`}
                className={d <= day ? styles.arrival : styles.orderFuture}
              />
            ))}
            <line x1={x(day)} x2={x(day)} y1={PAD.t} y2={H - PAD.b} className={styles.cursor} />
            <rect x={x(day) - 3.5} y={y(sim.onHand[day] ?? 0) - 3.5} width={7} height={7} className={styles.cursorDot} />
          </svg>

          <div className={styles.scrub}>
            <label htmlFor={sliderId} className={styles.scrubLabel}>
              Day
            </label>
            <input
              id={sliderId}
              type="range"
              min={0}
              max={DAYS}
              value={day}
              onChange={(e) => {
                takeOver();
                setManualDay(Number(e.target.value));
              }}
              className={styles.range}
              style={{ '--k': day / DAYS } as CSSProperties}
            />
          </div>

          <p className={styles.insight} aria-live="polite">
            {insight(sim, day)}
          </p>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">SKU</th>
              <th scope="col">Item</th>
              <th scope="col">On hand</th>
              <th scope="col" className={styles.hideSm}>
                Reorder at
              </th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {sims.map((s, i) => {
              const status = statusAt(s, day);
              const level = s.onHand[day] ?? 0;
              const peak = Math.max(...s.onHand);
              return (
                <tr key={s.sku.sku} data-active={i === selected}>
                  <td>
                    <button type="button" className={styles.rowBtn} onClick={() => pick(i)} aria-pressed={i === selected}>
                      {s.sku.sku}
                    </button>
                  </td>
                  <td className={styles.item}>{s.sku.name}</td>
                  <td>
                    <span className={styles.qty}>
                      <span className={styles.bar}>
                        <span style={{ width: `${(level / peak) * 100}%` }} />
                      </span>
                      {level}
                    </span>
                  </td>
                  <td className={styles.hideSm}>{s.sku.reorderAt}</td>
                  <td>
                    <span className={styles.status} data-status={status}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Frame>
    </div>
  );
}
