import { describe, expect, it } from 'vitest';
import { TILES, mulberry32, solve } from '../src/lib/wfc';

describe('wave function collapse', () => {
  it('fills every cell with edges that agree', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const g = solve(12, 8, mulberry32(seed));
      expect(g.contradiction).toBe(false);
      for (let y = 0; y < g.rows; y++) {
        for (let x = 0; x < g.cols; x++) {
          const t = TILES[g.result[y * g.cols + x]!]!;
          expect(t).toBeDefined();
          if (x + 1 < g.cols) expect(t.sockets[1]).toBe(TILES[g.result[y * g.cols + x + 1]!]!.sockets[3]);
          if (y + 1 < g.rows) expect(t.sockets[2]).toBe(TILES[g.result[(y + 1) * g.cols + x]!]!.sockets[0]);
        }
      }
    }
  });

  it('never connects pipes off the edge of the board', () => {
    const g = solve(10, 6, mulberry32(7));
    for (let x = 0; x < g.cols; x++) {
      expect(TILES[g.result[x]!]!.sockets[0]).toBe(0);
      expect(TILES[g.result[(g.rows - 1) * g.cols + x]!]!.sockets[2]).toBe(0);
    }
    for (let y = 0; y < g.rows; y++) {
      expect(TILES[g.result[y * g.cols]!]!.sockets[3]).toBe(0);
      expect(TILES[g.result[y * g.cols + g.cols - 1]!]!.sockets[1]).toBe(0);
    }
  });
});
