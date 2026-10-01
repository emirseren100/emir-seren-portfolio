import { useRef, useState } from 'react';
import { useCanvasLoop, wakeCanvas } from '../lib/useCanvasLoop';
import { prefersReducedMotion } from '../lib/useReducedMotion';
import { TILES, collapseStep, createGrid, solve, weightsWithSpace, type Grid } from '../lib/wfc';
import { Experiment } from './Experiment';

/**
 * Constraints: wave function collapse, one cell at a time. Every edge has to agree with its
 * neighbour; the exposed number is how much the solver favours empty space over pipe.
 */
export default function Tiles() {
  const ref = useRef<HTMLCanvasElement>(null);
  const restart = useRef<() => void>(() => {});
  const [space, setSpace] = useState(1);
  const weights = useRef(weightsWithSpace(space));
  const changeSpace = (v: number) => {
    setSpace(v);
    weights.current = weightsWithSpace(v);
    restart.current();
  };

  useCanvasLoop(ref, () => {
    let grid: Grid = createGrid(1, 1);
    let cell = 24;
    let ox = 0;
    let oy = 0;
    let doneAt = 0;
    let lastStep = 0;
    const reduced = prefersReducedMotion();

    const fresh = (width: number, height: number) => {
      cell = width < 420 ? 22 : 26;
      const cols = Math.max(4, Math.floor((width - 16) / cell));
      const rows = Math.max(3, Math.floor((height - 16) / cell));
      ox = (width - cols * cell) / 2;
      oy = (height - rows * cell) / 2;
      grid = reduced ? solve(cols, rows, Math.random, 10, weights.current) : createGrid(cols, rows);
      doneAt = 0;
    };

    let size = { width: 0, height: 0 };
    restart.current = () => {
      fresh(size.width, size.height);
      wakeCanvas(ref.current);
    };

    return {
      setup({ width, height }) {
        size = { width, height };
        fresh(width, height);
      },
      frame({ ctx, width, height }, _dt, t) {
        if (!reduced && !doneAt && t - lastStep > 16) {
          for (let k = 0; k < 2; k++) {
            if (!collapseStep(grid, Math.random, weights.current)) {
              if (grid.contradiction) fresh(width, height);
              else doneAt = t;
              break;
            }
          }
          lastStep = t;
        }
        if (!reduced && doneAt && t - doneAt > 2600) fresh(width, height);

        ctx.clearRect(0, 0, width, height);
        const recent = new Set(grid.order.slice(-6));
        const half = cell / 2;
        for (let i = 0; i < grid.result.length; i++) {
          const x = ox + (i % grid.cols) * cell;
          const y = oy + Math.floor(i / grid.cols) * cell;
          const id = grid.result[i]!;
          if (id < 0) {
            ctx.fillStyle = 'rgba(236,231,221,0.12)';
            const s = 1 + (grid.options[i]!.length / TILES.length) * 2;
            ctx.fillRect(x + half - s / 2, y + half - s / 2, s, s);
            continue;
          }
          const [top, right, bottom, left] = TILES[id]!.sockets;
          ctx.strokeStyle = recent.has(i) ? '#e8553a' : 'rgba(236,231,221,0.8)';
          ctx.lineWidth = Math.max(2, cell * 0.14);
          ctx.lineCap = 'square';
          ctx.beginPath();
          const cx = x + half;
          const cy = y + half;
          if (top) {
            ctx.moveTo(cx, y);
            ctx.lineTo(cx, cy);
          }
          if (bottom) {
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, y + cell);
          }
          if (left) {
            ctx.moveTo(x, cy);
            ctx.lineTo(cx, cy);
          }
          if (right) {
            ctx.moveTo(cx, cy);
            ctx.lineTo(x + cell, cy);
          }
          ctx.stroke();
          const n = top + right + bottom + left;
          if (n === 1 || n >= 3) {
            ctx.fillStyle = n === 1 ? 'rgba(236,231,221,0.9)' : 'rgba(236,231,221,0.8)';
            const s = cell * (n === 1 ? 0.3 : 0.24);
            ctx.fillRect(x + half - s / 2, y + half - s / 2, s, s);
          }
        }
        return !reduced;
      },
    };
  });

  return (
    <Experiment
      param={{
        label: 'Weight of empty tiles',
        value: space,
        min: 0.2,
        max: 6,
        step: 0.2,
        format: (v) => `×${v.toFixed(1)}`,
        onChange: changeSpace,
      }}
      action={{ label: 'New board', onClick: () => restart.current() }}
    >
      <canvas ref={ref} aria-hidden="true" style={{ cursor: 'pointer' }} onClick={() => restart.current()} />
    </Experiment>
  );
}
