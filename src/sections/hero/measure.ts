import type { Solid } from '../../lib/platformer';

export interface LetterBox {
  index: number;
  char: string;
  /** Ink bounds in px, relative to the stage. */
  left: number;
  right: number;
  top: number;
  baseline: number;
}

export interface LineGuides {
  baseline: number;
  xHeight: number;
  capHeight: number;
  left: number;
  right: number;
}

interface Ink {
  ascent: number;
  /** Distance from the pen position to the left edge of the ink (positive = right of pen). */
  left: number;
  /** Distance from the pen position to the right edge of the ink. */
  right: number;
}

const inkCache = new Map<string, Ink>();
let scratch: CanvasRenderingContext2D | null = null;

/**
 * Real ink bounds of a glyph, found by rasterising it and scanning pixels.
 * measureText()'s bounding box is a few percent off for variable fonts,
 * which is the difference between standing on a letter and hovering over it.
 */
export function inkBounds(char: string, font: string, size: number): Ink {
  const key = `${font}|${char}`;
  const hit = inkCache.get(key);
  if (hit) return hit;
  const pad = Math.ceil(size * 0.4);
  const w = Math.ceil(size * 1.4) + pad * 2;
  const h = Math.ceil(size * 1.6);
  const baseline = Math.ceil(size * 1.25);
  if (!scratch) scratch = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const c = scratch;
  if (!c) return { ascent: size * 0.7, left: 0, right: size * 0.5 };
  c.canvas.width = w;
  c.canvas.height = h;
  c.font = font;
  c.textBaseline = 'alphabetic';
  c.fillStyle = '#000';
  c.fillText(char, pad, baseline);
  const data = c.getImageData(0, 0, w, h).data;
  let top = -1;
  let minX = w;
  let maxX = -1;
  for (let y = 0; y < baseline + 1; y++) {
    for (let x = 0; x < w; x++) {
      if ((data[(y * w + x) * 4 + 3] ?? 0) > 110) {
        if (top < 0) top = y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  const ink =
    top < 0
      ? { ascent: 0, left: 0, right: c.measureText(char).width }
      : { ascent: baseline - top, left: minX - pad, right: maxX + 1 - pad };
  inkCache.set(key, ink);
  return ink;
}

/**
 * Measures the ink box of every letter in the name.
 * Offsets (not client rects) are used so in-flight transforms never skew the level.
 */
export function measureLetters(
  letters: HTMLElement[],
  probes: HTMLElement[],
  font: { weight: number | string; size: number; family: string },
): { boxes: LetterBox[]; guides: LineGuides[] } {
  const fontStr = `${font.weight} ${font.size.toFixed(2)}px ${font.family}`;

  const boxes: LetterBox[] = [];
  for (const el of letters) {
    const char = el.dataset.char ?? el.textContent ?? '';
    const line = Number(el.dataset.line ?? 0);
    const probe = probes[line];
    if (!probe || char.trim() === '') continue;
    const baseline = probe.offsetTop;
    const ink = inkBounds(char, fontStr, font.size);
    const x = el.offsetLeft;
    boxes.push({
      index: Number(el.dataset.index ?? boxes.length),
      char,
      left: x + ink.left,
      right: x + ink.right,
      top: baseline - ink.ascent,
      baseline,
    });
  }

  const xm = inkBounds('x', fontStr, font.size).ascent;
  const hm = inkBounds('H', fontStr, font.size).ascent;
  const guides = probes.map((probe, line) => {
    const lineBoxes = letters.filter((l) => Number(l.dataset.line ?? 0) === line);
    const first = lineBoxes[0];
    const last = lineBoxes[lineBoxes.length - 1];
    return {
      baseline: probe.offsetTop,
      xHeight: probe.offsetTop - xm,
      capHeight: probe.offsetTop - hm,
      left: first ? first.offsetLeft : 0,
      right: last ? last.offsetLeft + last.offsetWidth : 0,
    };
  });

  return { boxes, guides };
}

/** Converts letter boxes to solids in unit space. */
export function toSolids(boxes: LetterBox[], unit: number, stageW: number): Solid[] {
  const solids: Solid[] = boxes.map((b) => ({
    id: b.index,
    x: b.left / unit,
    y: b.top / unit,
    w: (b.right - b.left) / unit,
    h: (b.baseline - b.top) / unit,
  }));
  // Invisible walls at the edges of the stage.
  solids.push({ id: 'wall-l', x: -10, y: -200, w: 10, h: 400 });
  solids.push({ id: 'wall-r', x: stageW / unit, y: -200, w: 10, h: 400 });
  return solids;
}
