import { useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { DAYS, SKUS, WEEKDAYS, insight, simulate, statusAt } from '../lib/stockSim';
import { rangeFill } from '../lib/rangeFill';
import { useAutoplay, wrap } from '../lib/useAutoplay';
import { Frame } from './Frame';
import styles from './StockFlowVisual.module.css';

const W = 600;
const H = 180;
/** The first day of each week, for gridlines and labels. */
const WEEK_TICKS = [0, 7, 14, 21, 28];
const PAD = { l: 28, r: 12, t: 14, b: 22 };

export function StockFlowVisual({ large = false }: { large?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const sims = useMemo(() => SKUS.map((s, i) => simulate(s, i + 1)), []);
  const { position, setPosition, paused, pause, resume } = useAutoplay(ref, 380, 6);
  const [selected, setSelected] = useState(0);
  const day = wrap(position, DAYS + 1);
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
    pause();
    setSelected(i);
  };

  // Markers live in HTML over the chart: the SVG stretches to fit, and text or squares inside it would too.
  const px = (d: number) => `${(x(d) / W) * 100}%`;
  const py = (v: number) => `${(y(v) / H) * 100}%`;

  return (
    <div ref={ref}>
      <Frame
        app="StockFlow"
        context="Back room · demo data"
        playback={{ paused, onToggle: paused ? resume : pause }}
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

          <div className={styles.chart} aria-hidden="true">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              {WEEK_TICKS.map((d) => (
                <line key={d} x1={x(d)} x2={x(d)} y1={PAD.t} y2={H - PAD.b} className={styles.gridLine} />
              ))}
              <line x1={PAD.l} x2={W - PAD.r} y1={y(sim.sku.reorderAt)} y2={y(sim.sku.reorderAt)} className={styles.reorder} />
              <path d={full} className={styles.future} />
              <path d={area} className={styles.area} />
              <path d={past} className={styles.past} />
              <line x1={x(day)} x2={x(day)} y1={PAD.t} y2={H - PAD.b} className={styles.cursor} />
            </svg>
            {WEEK_TICKS.map((d) => (
              <span key={d} className={styles.tick} style={{ left: px(d) }}>
                W{d / 7 + 1}
              </span>
            ))}
            <span className={styles.tickR} style={{ top: py(sim.sku.reorderAt) }}>
              {sim.sku.reorderAt}
            </span>
            {sim.orders.map((d) => (
              <span
                key={`o${d}`}
                className={`${styles.marker} ${d <= day ? styles.order : styles.pending}`}
                style={{ left: px(d), top: py(0) }}
              />
            ))}
            {sim.arrivals.map((d) => (
              <span
                key={`a${d}`}
                className={`${styles.arrival} ${d <= day ? '' : styles.pending}`}
                style={{ left: px(d), top: py(sim.onHand[d] ?? 0) }}
              />
            ))}
            <span className={styles.cursorDot} style={{ left: px(day), top: py(sim.onHand[day] ?? 0) }} />
          </div>

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
              aria-valuetext={`Day ${day}, ${WEEKDAYS[day % 7]}: ${sim.onHand[day]} on hand`}
              onChange={(e) => {
                pause();
                setPosition(Number(e.target.value));
              }}
              className={`range ${styles.scrubRange}`}
              style={rangeFill(day, 0, DAYS)}
            />
          </div>

          <p className={styles.insight} aria-live={paused ? 'polite' : 'off'}>
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
                    <button type="button" className={`hit ${styles.rowBtn}`} onClick={() => pick(i)} aria-pressed={i === selected}>
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
