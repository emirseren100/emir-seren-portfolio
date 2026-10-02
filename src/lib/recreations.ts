/**
 * Logic ported from the real projects, so the mockups behave like the apps they re-create.
 * Kept here, apart from the components, so it can be unit-tested.
 */

export interface StockProduct {
  id: number;
  name: string;
  stock: number;
}
export type StockFilter = 'all' | 'in-stock' | 'out-of-stock';
export type StockSort = 'default' | 'name-az' | 'name-za' | 'stock-lh' | 'stock-hl';

/** StockFlow's applyFilters(): search, then the stock filter, then sort. */
export function applyStockFilters(products: StockProduct[], search: string, filter: StockFilter, sort: StockSort) {
  const term = search.toLowerCase();
  let list = products.filter((p) => p.name.toLowerCase().includes(term));
  if (filter === 'in-stock') list = list.filter((p) => p.stock > 0);
  else if (filter === 'out-of-stock') list = list.filter((p) => p.stock === 0);
  if (sort === 'name-az') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'name-za') list = [...list].sort((a, b) => b.name.localeCompare(a.name));
  else if (sort === 'stock-lh') list = [...list].sort((a, b) => a.stock - b.stock);
  else if (sort === 'stock-hl') list = [...list].sort((a, b) => b.stock - a.stock);
  return list;
}

/** Follow Clarity's normalizeUsernames(): trim, drop a leading @, lowercase, de-duplicate, sort. */
export function normalizeUsernames(values: string[]) {
  return [...new Set(values.map((v) => v.trim().replace(/^@+/, '').toLowerCase()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Follow Clarity's analyzeFollows(): who doesn't follow back, who you don't follow back, mutuals. */
export function analyzeFollows(followers: string[], following: string[]) {
  const ers = new Set(followers);
  const ing = new Set(following);
  return {
    notFollowingBack: following.filter((u) => !ers.has(u)),
    iDontFollowBack: followers.filter((u) => !ing.has(u)),
    mutuals: followers.filter((u) => ing.has(u)),
  };
}
