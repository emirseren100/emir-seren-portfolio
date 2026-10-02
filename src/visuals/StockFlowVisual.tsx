import { useState, type FormEvent } from 'react';
import { applyStockFilters, type StockFilter, type StockProduct, type StockSort } from '../lib/recreations';
import { Frame } from './Frame';
import styles from './StockFlowVisual.module.css';

/** The same seed data as the real app. */
const SEED: StockProduct[] = [
  { id: 1, name: 'Laptop', stock: 3 },
  { id: 2, name: 'Mouse', stock: 0 },
  { id: 3, name: 'Keyboard', stock: 5 },
];

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'in-stock', label: 'In stock' },
  { value: 'out-of-stock', label: 'Out of stock' },
] as const satisfies ReadonlyArray<{ value: StockFilter; label: string }>;

const SORTS = [
  { value: 'default', label: 'Default' },
  { value: 'name-az', label: 'Name (A–Z)' },
  { value: 'name-za', label: 'Name (Z–A)' },
  { value: 'stock-lh', label: 'Stock low–high' },
  { value: 'stock-hl', label: 'Stock high–low' },
] as const satisfies ReadonlyArray<{ value: StockSort; label: string }>;

/**
 * A re-creation of StockFlow's dashboard in this site's visual language. The behaviour follows
 * the original vanilla JavaScript — same seed, same filters, same validation messages — but it
 * keeps its state in memory, so nothing is written to the visitor's storage.
 */
export function StockFlowVisual({ large = false }: { large?: boolean }) {
  const [products, setProducts] = useState(SEED);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [sort, setSort] = useState<StockSort>('default');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');

  const visible = applyStockFilters(products, search, filter, sort);
  const inStock = products.filter((p) => p.stock > 0).length;

  const change = (pid: number, by: number) =>
    setProducts((list) => list.map((p) => (p.id === pid ? { ...p, stock: Math.max(0, p.stock + by) } : p)));
  const remove = (pid: number) => setProducts((list) => list.filter((p) => p.id !== pid));

  const closeForm = () => {
    setAdding(false);
    setName('');
    setQty('');
    setError('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const raw = qty.trim();
    const stock = Number(raw);
    if (n === '') return setError('Product name is required.');
    if (raw === '' || Number.isNaN(stock) || stock < 0) return setError('Please enter a valid stock quantity.');
    setProducts((list) => [...list, { id: Math.max(0, ...list.map((p) => p.id)) + 1, name: n, stock }]);
    closeForm();
  };

  return (
    <Frame
      app="StockFlow"
      context="Inventory · sample data"
      right={<span>{products.length} products</span>}
      label="StockFlow re-creation: an inventory dashboard with stock counters, search, a stock filter, sorting, and products you can add, adjust and delete."
      className={`${styles.frame} ${large ? styles.large : ''}`}
    >
      <dl className={styles.stats}>
        <div>
          <dt>Total products</dt>
          <dd>{products.length}</dd>
        </div>
        <div>
          <dt>In stock</dt>
          <dd>{inStock}</dd>
        </div>
        <div>
          <dt>Out of stock</dt>
          <dd data-zero={products.length - inStock === 0}>{products.length - inStock}</dd>
        </div>
      </dl>

      <div className={styles.controls}>
        <label className={styles.search}>
          <span className={styles.sr}>Search products</span>
          <input type="search" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label className={styles.select}>
          <span className={styles.sr}>Filter by stock</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value as StockFilter)}>
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.select}>
          <span className={styles.sr}>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as StockSort)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={styles.add} onClick={() => setAdding(true)} aria-expanded={adding}>
          Add product
        </button>
      </div>

      {adding ? (
        <form className={styles.form} onSubmit={submit} noValidate>
          <label>
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </label>
          <label>
            <span>Stock</span>
            <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" />
          </label>
          <div className={styles.formActions}>
            <button type="submit" className={styles.add}>
              Save
            </button>
            <button type="button" className={`hit ${styles.ghost}`} onClick={closeForm}>
              Cancel
            </button>
          </div>
          <p className={styles.error} role="alert">
            {error}
          </p>
        </form>
      ) : null}

      <ul className={styles.list} aria-label="Products">
        {visible.length === 0 ? <li className={styles.empty}>No products found.</li> : null}
        {visible.map((p) => (
          <li key={p.id} className={styles.row}>
            <span className={styles.name}>{p.name}</span>
            <span className={styles.status} data-out={p.stock === 0}>
              {p.stock > 0 ? 'In stock' : 'Out of stock'}
            </span>
            <span className={styles.count}>Stock: {p.stock}</span>
            <span className={styles.actions}>
              <button type="button" className={`hit ${styles.step}`} onClick={() => change(p.id, 1)} aria-label={`Add one ${p.name}`}>
                +
              </button>
              <button
                type="button"
                className={`hit ${styles.step}`}
                onClick={() => change(p.id, -1)}
                aria-label={`Remove one ${p.name}`}
              >
                −
              </button>
              <button type="button" className={`hit ${styles.ghost}`} onClick={() => remove(p.id)} aria-label={`Delete ${p.name}`}>
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
