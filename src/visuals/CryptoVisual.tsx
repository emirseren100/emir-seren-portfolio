import { useMemo, useState, type CSSProperties } from 'react';
import { Frame } from './Frame';
import styles from './CryptoVisual.module.css';

const W = 600;
const H = 200;
const RSI_H = 56;
const N = 64;
/** The right gutter keeps the level tags clear of the candles. */
const PAD = { t: 10, b: 10, l: 4, r: 96 };

/** The app's real take-profit multiples (in R) for swing setups, per TP profile. */
const PROFILES = [
  { id: 'normal', label: 'Normal', tp: [1.2, 2.2, 3.5] },
  { id: 'aggressive', label: 'Higher target', tp: [1.45, 2.65, 4.2] },
  { id: 'conservative', label: 'Conservative', tp: [1.0, 1.85, 3.0] },
] as const;

interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
}

/** Deterministic sample candles: the same chart on the server and in every browser. Not real prices. */
function sampleCandles(): Candle[] {
  let seed = 18;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const out: Candle[] = [];
  let c = 100;
  for (let i = 0; i < N; i++) {
    const drift = i < 22 ? -0.35 : i < 40 ? 0.05 : 0.25;
    const o = c;
    c = o + drift + (rand() - 0.5) * 2.6;
    const h = Math.max(o, c) + rand() * 1.1;
    const l = Math.min(o, c) - rand() * 1.1;
    out.push({ o, h, l, c });
  }
  return out;
}

const sma = (v: number[], p: number) => v.map((_, i) => (i < p - 1 ? NaN : v.slice(i - p + 1, i + 1).reduce((a, b) => a + b, 0) / p));

function bollinger(v: number[], p = 20, k = 2) {
  const mid = sma(v, p);
  const sd = v.map((_, i) => {
    if (i < p - 1) return NaN;
    const s = v.slice(i - p + 1, i + 1);
    return Math.sqrt(s.reduce((a, b) => a + (b - mid[i]!) ** 2, 0) / p);
  });
  return { upper: mid.map((m, i) => m + k * sd[i]!), lower: mid.map((m, i) => m - k * sd[i]!) };
}

function rsi(v: number[], p = 14) {
  return v.map((_, i) => {
    if (i < p) return NaN;
    let up = 0;
    let down = 0;
    for (let j = i - p + 1; j <= i; j++) {
      const d = v[j]! - v[j - 1]!;
      if (d > 0) up += d;
      else down -= d;
    }
    return down === 0 ? 100 : 100 - 100 / (1 + up / down);
  });
}

function atr(cs: Candle[], p = 14) {
  const tr = cs.map((c, i) => (i === 0 ? c.h - c.l : Math.max(c.h - c.l, Math.abs(c.h - cs[i - 1]!.c), Math.abs(c.l - cs[i - 1]!.c))));
  return tr.slice(-p).reduce((a, b) => a + b, 0) / p;
}

const path = (v: number[], x: (i: number) => number, y: (n: number) => number) =>
  v
    .map((n, i) => (Number.isNaN(n) ? '' : `${i === 0 || Number.isNaN(v[i - 1]!) ? 'M' : 'L'}${x(i).toFixed(1)},${y(n).toFixed(1)}`))
    .join(' ');

export function CryptoVisual({ large = false }: { large?: boolean }) {
  const [profile, setProfile] = useState<(typeof PROFILES)[number]['id']>('normal');
  const [showSma, setShowSma] = useState(true);
  const [showBands, setShowBands] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const d = useMemo(() => {
    const candles = sampleCandles();
    const closes = candles.map((c) => c.c);
    const entry = closes[N - 1]!;
    const risk = 1.2 * atr(candles);
    const sl = entry - risk;
    const bands = bollinger(closes);
    // Fixed price range across all profiles, so switching profile moves the lines, not the axis.
    const hi = Math.max(...candles.map((c) => c.h), entry + risk * 4.2);
    const lo = Math.min(...candles.map((c) => c.l), sl);
    return { candles, closes, entry, risk, sl, bands, sma21: sma(closes, 21), rsi: rsi(closes), hi, lo };
  }, []);

  const tp = PROFILES.find((p) => p.id === profile)!.tp.map((m) => d.entry + d.risk * m);
  const step = (W - PAD.l - PAD.r) / N;
  const x = (i: number) => PAD.l + step * (i + 0.5);
  const y = (v: number) => PAD.t + ((d.hi - v) / (d.hi - d.lo)) * (H - PAD.t - PAD.b);
  const ry = (v: number) => 4 + ((100 - v) / 100) * (RSI_H - 8);
  const pct = (v: number) => `${(y(v) / H) * 100}%`;
  const shown = hover ?? N - 1;
  const c = d.candles[shown]!;
  const fmt = (v: number) => v.toFixed(2);

  const levels = [
    { k: 'TP3', v: tp[2]!, kind: 'tp' },
    { k: 'TP2', v: tp[1]!, kind: 'tp' },
    { k: 'TP1', v: tp[0]!, kind: 'tp' },
    { k: 'Entry', v: d.entry, kind: 'entry' },
    { k: 'SL', v: d.sl, kind: 'sl' },
  ];

  return (
    <Frame
      app="Technical Analysis"
      context="Sample market · 1h · not real prices"
      right={<span>{hover === null ? 'last candle' : `candle ${hover + 1}`}</span>}
      label="Crypto Technical Analysis re-creation: a candlestick chart of sample data with a moving average, optional Bollinger Bands, RSI, and a long setup whose take-profit levels change with the TP profile."
      className={`${styles.frame} ${large ? styles.large : ''}`}
    >
      <div className={styles.layout} style={{ '--ink': 'var(--ink-crypto)' } as CSSProperties}>
        <div className={styles.chartCol}>
          <p className={styles.ohlc} aria-hidden="true">
            <span>O {fmt(c.o)}</span>
            <span>H {fmt(c.h)}</span>
            <span>L {fmt(c.l)}</span>
            <span data-up={c.c >= c.o}>C {fmt(c.c)}</span>
            <span className={styles.rsiNow}>RSI {Number.isNaN(d.rsi[shown]!) ? '—' : d.rsi[shown]!.toFixed(0)}</span>
          </p>
          <div
            className={styles.chart}
            aria-hidden="true"
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const i = Math.floor((((e.clientX - r.left) / r.width) * W - PAD.l) / step);
              setHover(Math.min(N - 1, Math.max(0, i)));
            }}
            onPointerLeave={() => setHover(null)}
          >
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              {showBands ? (
                <>
                  <path d={path(d.bands.upper, x, y)} className={styles.band} />
                  <path d={path(d.bands.lower, x, y)} className={styles.band} />
                </>
              ) : null}
              {levels.map((l) => (
                <line key={l.k} x1={x(N - 14)} x2={W} y1={y(l.v)} y2={y(l.v)} className={styles.level} data-kind={l.kind} />
              ))}
              {d.candles.map((k, i) => (
                <g key={i} className={styles.candle} data-up={k.c >= k.o} data-hover={i === hover}>
                  <line x1={x(i)} x2={x(i)} y1={y(k.h)} y2={y(k.l)} />
                  <rect
                    x={x(i) - step * 0.32}
                    width={step * 0.64}
                    y={y(Math.max(k.o, k.c))}
                    height={Math.max(0.8, Math.abs(y(k.o) - y(k.c)))}
                  />
                </g>
              ))}
              {showSma ? <path d={path(d.sma21, x, y)} className={styles.sma} /> : null}
            </svg>
            {levels.map((l) => (
              <span key={l.k} className={styles.tag} data-kind={l.kind} style={{ top: pct(l.v) }}>
                {l.k} {fmt(l.v)}
              </span>
            ))}
          </div>
          <div className={styles.rsi} aria-hidden="true">
            <svg viewBox={`0 0 ${W} ${RSI_H}`} preserveAspectRatio="none">
              <line x1={0} x2={W - PAD.r} y1={ry(70)} y2={ry(70)} className={styles.rsiGuide} />
              <line x1={0} x2={W - PAD.r} y1={ry(30)} y2={ry(30)} className={styles.rsiGuide} />
              <path d={path(d.rsi, x, ry)} className={styles.rsiLine} />
            </svg>
            <span className={styles.rsiLabel}>RSI 14</span>
          </div>
        </div>

        <aside className={styles.side}>
          <div className={styles.group} role="group" aria-label="Indicators">
            <p className={styles.groupLabel}>Indicators</p>
            <button type="button" className={`hit ${styles.toggle}`} aria-pressed={showSma} onClick={() => setShowSma((v) => !v)}>
              SMA 21
            </button>
            <button type="button" className={`hit ${styles.toggle}`} aria-pressed={showBands} onClick={() => setShowBands((v) => !v)}>
              Bollinger 20
            </button>
          </div>

          <div className={styles.group} role="group" aria-label="TP profile">
            <p className={styles.groupLabel}>TP profile</p>
            {PROFILES.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`hit ${styles.toggle}`}
                aria-pressed={profile === p.id}
                onClick={() => setProfile(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <dl className={styles.setup} aria-live="polite">
            <div>
              <dt>Setup</dt>
              <dd className={styles.long}>Long · sample</dd>
            </div>
            {levels.map((l) => (
              <div key={l.k}>
                <dt>{l.k}</dt>
                <dd>
                  {fmt(l.v)}
                  {l.kind === 'tp' ? <span> {((l.v - d.entry) / d.risk).toFixed(2)}R</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
      <p className={styles.disclaimer}>Sample data. Not investment advice. Not affiliated with Binance.</p>
    </Frame>
  );
}
