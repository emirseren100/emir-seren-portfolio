import { describe, expect, it } from 'vitest';
import { DAYS, SKUS, insight, simulate, statusAt } from '../src/lib/stockSim';

describe('stock simulation', () => {
  const sims = SKUS.map((s) => simulate(s));

  it('produces one value per day and never goes negative', () => {
    for (const sim of sims) {
      expect(sim.onHand).toHaveLength(DAYS + 1);
      expect(Math.min(...sim.onHand)).toBeGreaterThanOrEqual(0);
    }
  });

  it('places an order when stock reaches the reorder point, and it arrives after the lead time', () => {
    const coffee = sims[0]!;
    expect(coffee.orders.length).toBeGreaterThan(0);
    const first = coffee.orders[0]!;
    expect(coffee.onHand[first]).toBeLessThanOrEqual(coffee.sku.reorderAt);
    expect(coffee.arrivals[0]).toBe(first + coffee.sku.leadDays);
  });

  it('is deterministic', () => {
    expect(simulate(SKUS[1]!).onHand).toEqual(simulate(SKUS[1]!).onHand);
  });

  it('describes every day in plain language', () => {
    for (const sim of sims) {
      for (let d = 0; d <= DAYS; d++) {
        expect(insight(sim, d)).toMatch(/\w/);
        expect(['OK', 'Low', 'On order', 'Out']).toContain(statusAt(sim, d));
      }
    }
  });
});
