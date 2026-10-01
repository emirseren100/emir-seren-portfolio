/**
 * Wave function collapse, the small version.
 * Tiles are pipe pieces; each side either has a connection (1) or not (0).
 * Neighbours must agree on their shared edge.
 */

/** Sides in order: top, right, bottom, left. */
export type Sockets = readonly [number, number, number, number];

export interface Tile {
  id: number;
  sockets: Sockets;
  weight: number;
}

const BASE: Array<[Sockets, number]> = [
  [[0, 0, 0, 0], 3.2], // empty
  [[0, 1, 0, 1], 1.4], // horizontal
  [[1, 0, 1, 0], 1.4], // vertical
  [[1, 1, 0, 0], 1], // corners
  [[0, 1, 1, 0], 1],
  [[0, 0, 1, 1], 1],
  [[1, 0, 0, 1], 1],
  [[1, 1, 1, 0], 0.35], // tees
  [[0, 1, 1, 1], 0.35],
  [[1, 0, 1, 1], 0.35],
  [[1, 1, 0, 1], 0.35],
  [[1, 1, 1, 1], 0.2], // cross
  [[1, 0, 0, 0], 0.25], // end caps
  [[0, 1, 0, 0], 0.25],
  [[0, 0, 1, 0], 0.25],
  [[0, 0, 0, 1], 0.25],
];

export const TILES: Tile[] = BASE.map(([sockets, weight], id) => ({ id, sockets, weight }));

export interface Grid {
  cols: number;
  rows: number;
  /** Remaining candidate tile ids per cell. */
  options: number[][];
  /** Collapsed tile id per cell, or -1. */
  result: number[];
  /** Order in which cells collapsed (for animation). */
  order: number[];
  contradiction: boolean;
}

export function createGrid(cols: number, rows: number): Grid {
  const all = TILES.map((t) => t.id);
  const options: number[][] = [];
  for (let i = 0; i < cols * rows; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    // Edges of the board never connect outward.
    options.push(
      all.filter((id) => {
        const s = TILES[id]!.sockets;
        return !(r === 0 && s[0]) && !(c === cols - 1 && s[1]) && !(r === rows - 1 && s[2]) && !(c === 0 && s[3]);
      }),
    );
  }
  return { cols, rows, options, result: new Array(cols * rows).fill(-1), order: [], contradiction: false };
}

const DIRS: Array<[number, number, number, number]> = [
  // dx, dy, my side, their side
  [0, -1, 0, 2],
  [1, 0, 1, 3],
  [0, 1, 2, 0],
  [-1, 0, 3, 1],
];

function propagate(g: Grid, start: number) {
  const stack = [start];
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % g.cols;
    const y = Math.floor(i / g.cols);
    for (const [dx, dy, mine, theirs] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= g.cols || ny >= g.rows) continue;
      const j = ny * g.cols + nx;
      const allowed = new Set(g.options[i]!.map((id) => TILES[id]!.sockets[mine]));
      const before = g.options[j]!.length;
      g.options[j] = g.options[j]!.filter((id) => allowed.has(TILES[id]!.sockets[theirs]!));
      if (g.options[j]!.length === 0) {
        g.contradiction = true;
        return;
      }
      if (g.options[j]!.length < before) stack.push(j);
    }
  }
}

/** Collapses one cell. Returns false when the grid is finished (or stuck). */
export function collapseStep(g: Grid, rand: () => number = Math.random): boolean {
  if (g.contradiction) return false;
  let best = -1;
  let bestEntropy = Infinity;
  for (let i = 0; i < g.result.length; i++) {
    if (g.result[i] !== -1) continue;
    const n = g.options[i]!.length + rand() * 0.1;
    if (n < bestEntropy) {
      bestEntropy = n;
      best = i;
    }
  }
  if (best < 0) return false;
  const opts = g.options[best]!;
  const total = opts.reduce((s, id) => s + TILES[id]!.weight, 0);
  let pick = rand() * total;
  let chosen = opts[0]!;
  for (const id of opts) {
    pick -= TILES[id]!.weight;
    if (pick <= 0) {
      chosen = id;
      break;
    }
  }
  g.options[best] = [chosen];
  g.result[best] = chosen;
  g.order.push(best);
  propagate(g, best);
  return true;
}

export function solve(cols: number, rows: number, rand: () => number = Math.random, attempts = 10): Grid {
  let g = createGrid(cols, rows);
  for (let a = 0; a < attempts; a++) {
    g = createGrid(cols, rows);
    while (collapseStep(g, rand));
    if (!g.contradiction) return g;
  }
  return g;
}

/** Deterministic PRNG for tests and reproducible boards. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
