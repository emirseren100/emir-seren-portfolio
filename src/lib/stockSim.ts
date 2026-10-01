/**
 * The tiny inventory simulation behind the StockFlow mockup.
 * Deterministic, so the same month plays out every time.
 */

export interface Sku {
  sku: string;
  name: string;
  start: number;
  rate: number;
  reorderAt: number;
  reorderQty: number;
  leadDays: number;
}

export interface SkuSim {
  sku: Sku;
  onHand: number[];
  pending: boolean[];
  orders: number[];
  arrivals: number[];
  used: number[];
}

export const DAYS = 30;
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SKUS: Sku[] = [
  { sku: 'CF-250', name: 'Coffee beans, 250 g', start: 46, rate: 5, reorderAt: 20, reorderQty: 50, leadDays: 3 },
  { sku: 'OM-1L', name: 'Oat milk, 1 L', start: 52, rate: 7, reorderAt: 24, reorderQty: 60, leadDays: 2 },
  { sku: 'CP-12', name: 'Paper cups, 12 oz', start: 30, rate: 2.2, reorderAt: 10, reorderQty: 30, leadDays: 5 },
  { sku: 'SY-VN', name: 'Vanilla syrup', start: 14, rate: 0.9, reorderAt: 5, reorderQty: 12, leadDays: 6 },
  { sku: 'FL-50', name: 'Paper filters', start: 9, rate: 0.4, reorderAt: 3, reorderQty: 10, leadDays: 4 },
];

function noise(i: number, seed: number) {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function simulate(sku: Sku, seed = 1): SkuSim {
  const onHand: number[] = [sku.start];
  const pending: boolean[] = [false];
  const used: number[] = [0];
  const orders: number[] = [];
  const arrivals: number[] = [];
  let level = sku.start;
  let arrivalDay = -1;

  for (let d = 1; d <= DAYS; d++) {
    if (d === arrivalDay) {
      level += sku.reorderQty;
      arrivals.push(d);
      arrivalDay = -1;
    }
    const weekend = d % 7 === 5 || d % 7 === 6;
    const demand = Math.round(sku.rate * (0.6 + noise(d, seed) * 0.8) * (weekend ? 1.35 : 1));
    const take = Math.min(level, demand);
    level -= take;
    used.push(take);
    if (level <= sku.reorderAt && arrivalDay < 0) {
      orders.push(d);
      arrivalDay = d + sku.leadDays;
    }
    onHand.push(level);
    pending.push(arrivalDay > d);
  }
  return { sku, onHand, pending, orders, arrivals, used };
}

export type Status = 'OK' | 'Low' | 'On order' | 'Out';

export function statusAt(sim: SkuSim, day: number): Status {
  const level = sim.onHand[day] ?? 0;
  if (level <= 0) return 'Out';
  if (sim.pending[day]) return 'On order';
  if (level <= sim.sku.reorderAt) return 'Low';
  return 'OK';
}

/** Average daily usage over the last week, with a sensible floor at the start of the month. */
export function rateAt(sim: SkuSim, day: number): number {
  const from = Math.max(1, day - 6);
  const window = sim.used.slice(from, day + 1);
  if (window.length < 3) return sim.sku.rate;
  return window.reduce((a, b) => a + b, 0) / window.length;
}

/** The sentence StockFlow shows instead of a red cell. */
export function insight(sim: SkuSim, day: number): string {
  const level = sim.onHand[day] ?? 0;
  const rate = Math.max(0.1, rateAt(sim, day));
  const daysLeft = Math.floor(level / rate);
  const { reorderQty, leadDays, reorderAt } = sim.sku;
  if (sim.pending[day]) {
    const arrival = sim.arrivals.find((a) => a > day) ?? day + leadDays;
    return `${reorderQty} arriving ${WEEKDAYS[arrival % 7]} — about ${daysLeft} day${daysLeft === 1 ? '' : 's'} of stock until then.`;
  }
  if (level <= 0) return `Out of stock. Order ${reorderQty} now — earliest delivery in ${leadDays} days.`;
  if (level <= reorderAt)
    return `Order ${reorderQty} today — at the current rate you run out in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`;
  const untilReorder = Math.max(0, Math.floor((level - reorderAt) / rate));
  return `Healthy. Reorder point in about ${untilReorder} day${untilReorder === 1 ? '' : 's'}.`;
}
