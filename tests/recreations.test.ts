import { describe, expect, it } from 'vitest';
import { analyzeFollows, applyStockFilters, normalizeUsernames } from '../src/lib/recreations';

const products = [
  { id: 1, name: 'Laptop', stock: 3 },
  { id: 2, name: 'Mouse', stock: 0 },
  { id: 3, name: 'Keyboard', stock: 5 },
];

describe('applyStockFilters (StockFlow port)', () => {
  it('keeps insertion order by default', () => {
    expect(applyStockFilters(products, '', 'all', 'default').map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it('searches case-insensitively, then filters by stock', () => {
    expect(applyStockFilters(products, 'O', 'all', 'default').map((p) => p.name)).toEqual(['Laptop', 'Mouse', 'Keyboard']);
    expect(applyStockFilters(products, 'o', 'out-of-stock', 'default').map((p) => p.name)).toEqual(['Mouse']);
    expect(applyStockFilters(products, '', 'in-stock', 'default').map((p) => p.name)).toEqual(['Laptop', 'Keyboard']);
  });

  it('sorts by name and by stock in both directions', () => {
    expect(applyStockFilters(products, '', 'all', 'name-az').map((p) => p.name)).toEqual(['Keyboard', 'Laptop', 'Mouse']);
    expect(applyStockFilters(products, '', 'all', 'name-za').map((p) => p.name)).toEqual(['Mouse', 'Laptop', 'Keyboard']);
    expect(applyStockFilters(products, '', 'all', 'stock-lh').map((p) => p.stock)).toEqual([0, 3, 5]);
    expect(applyStockFilters(products, '', 'all', 'stock-hl').map((p) => p.stock)).toEqual([5, 3, 0]);
  });

  it('never reorders the source array', () => {
    applyStockFilters(products, '', 'all', 'stock-hl');
    expect(products.map((p) => p.id)).toEqual([1, 2, 3]);
  });
});

describe('Follow Clarity port', () => {
  it('normalises usernames: trim, drop @, lowercase, de-duplicate, sort', () => {
    expect(normalizeUsernames([' @Bora.demo', 'ada.demo', 'BORA.demo', '', '@'])).toEqual(['ada.demo', 'bora.demo']);
  });

  it('splits two lists into not-following-back, not-followed-back and mutuals', () => {
    const r = analyzeFollows(['ada', 'bora', 'cem'], ['bora', 'cem', 'deniz']);
    expect(r).toEqual({ notFollowingBack: ['deniz'], iDontFollowBack: ['ada'], mutuals: ['bora', 'cem'] });
  });
});
