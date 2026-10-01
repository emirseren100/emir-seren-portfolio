import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FEEL,
  createBody,
  jumpArc,
  pressJump,
  step,
  type FeelParams,
  type Input,
  type Solid,
} from '../src/lib/platformer';

const DT = 1 / 120;
const idle: Input = { left: false, right: false, jumpHeld: false };
const ground: Solid = { x: 0, y: 10, w: 10, h: 2, id: 'ground' };

function run(
  body: ReturnType<typeof createBody>,
  frames: number,
  input: Input,
  solids: Solid[],
  p: FeelParams,
  t0: number,
) {
  let t = t0;
  const events = [];
  for (let i = 0; i < frames; i++) {
    t += DT * 1000;
    events.push(...step(body, input, solids, p, DT, t));
  }
  return { t, events };
}

describe('platformer engine', () => {
  it('lands on a platform and reports the impact', () => {
    const body = createBody(2, 0);
    const { events } = run(body, 240, idle, [ground], DEFAULT_FEEL, 0);
    expect(body.grounded).toBe(true);
    expect(body.y).toBeCloseTo(ground.y - 1, 5);
    expect(events.some((e) => e.type === 'land')).toBe(true);
  });

  it('reaches the configured jump height', () => {
    const body = createBody(2, 9);
    let t = run(body, 10, idle, [ground], DEFAULT_FEEL, 0).t;
    pressJump(body, t);
    let minY = body.y;
    for (let i = 0; i < 240; i++) {
      t += DT * 1000;
      step(body, { ...idle, jumpHeld: true }, [ground], DEFAULT_FEEL, DT, t);
      minY = Math.min(minY, body.y);
    }
    expect(9 - minY).toBeGreaterThan(DEFAULT_FEEL.jumpHeight * 0.95);
    expect(9 - minY).toBeLessThan(DEFAULT_FEEL.jumpHeight * 1.05);
  });

  it('cuts the jump short when the button is released early', () => {
    const full = createBody(2, 9);
    const short = createBody(2, 9);
    let t = run(full, 10, idle, [ground], DEFAULT_FEEL, 0).t;
    run(short, 10, idle, [ground], DEFAULT_FEEL, 0);
    pressJump(full, t);
    pressJump(short, t);
    let minFull = 9;
    let minShort = 9;
    for (let i = 0; i < 200; i++) {
      t += DT * 1000;
      step(full, { ...idle, jumpHeld: true }, [ground], DEFAULT_FEEL, DT, t);
      step(short, { ...idle, jumpHeld: i < 6 }, [ground], DEFAULT_FEEL, DT, t);
      minFull = Math.min(minFull, full.y);
      minShort = Math.min(minShort, short.y);
    }
    expect(9 - minShort).toBeLessThan((9 - minFull) * 0.6);
  });

  it('allows a jump within the coyote window after walking off a ledge', () => {
    const attempt = (coyoteMs: number) => {
      const p = { ...DEFAULT_FEEL, coyoteMs };
      const body = createBody(8.5, 9);
      let t = run(body, 10, idle, [ground], p, 0).t;
      // Walk right until we leave the ledge.
      while (body.grounded) {
        t += DT * 1000;
        step(body, { ...idle, right: true }, [ground], p, DT, t);
      }
      // 50ms later, press jump.
      t = run(body, 6, idle, [ground], p, t).t;
      pressJump(body, t);
      t += DT * 1000;
      const events = step(body, { ...idle, jumpHeld: true }, [ground], p, DT, t);
      return events.find((e) => e.type === 'jump');
    };
    expect(attempt(100)).toMatchObject({ type: 'jump', coyote: true });
    expect(attempt(0)).toBeUndefined();
  });

  it('does not let coyote time grant a double jump', () => {
    const body = createBody(2, 9);
    let t = run(body, 10, idle, [ground], DEFAULT_FEEL, 0).t;
    pressJump(body, t);
    t = run(body, 4, idle, [ground], DEFAULT_FEEL, t).t; // released early
    pressJump(body, t);
    t += DT * 1000;
    const events = step(body, idle, [ground], DEFAULT_FEEL, DT, t);
    expect(events.some((e) => e.type === 'jump')).toBe(false);
  });

  it('buffers a jump pressed shortly before landing', () => {
    const attempt = (bufferMs: number) => {
      const p = { ...DEFAULT_FEEL, bufferMs };
      const body = createBody(2, 0);
      let t = 0;
      // Fall until we are ~80ms from touching down.
      while (body.y + 1 < ground.y - body.vy * 0.08) {
        t += DT * 1000;
        step(body, idle, [ground], p, DT, t);
      }
      pressJump(body, t);
      const { events } = run(body, 30, { ...idle, jumpHeld: true }, [ground], p, t);
      return events.some((e) => e.type === 'jump');
    };
    expect(attempt(120)).toBe(true);
    expect(attempt(0)).toBe(false);
  });

  it('blocks horizontal movement against solid walls', () => {
    const wall: Solid = { x: 5, y: 0, w: 1, h: 10 };
    const body = createBody(2, 9);
    run(body, 240, { ...idle, right: true }, [ground, wall], DEFAULT_FEEL, 0);
    expect(body.x).toBeCloseTo(4, 5);
  });

  it('lets bodies pass up through one-way platforms', () => {
    const ledge: Solid = { x: 0, y: 7, w: 10, h: 0.2, oneWay: true };
    const body = createBody(2, 9);
    const t = run(body, 10, idle, [ground, ledge], DEFAULT_FEEL, 0).t;
    pressJump(body, t);
    run(body, 240, { ...idle, jumpHeld: true }, [ground, ledge], DEFAULT_FEEL, t);
    expect(body.grounded).toBe(true);
    expect(body.y).toBeCloseTo(ledge.y - 1, 5);
  });

  it('samples a symmetric jump arc', () => {
    const arc = jumpArc(DEFAULT_FEEL, 10, 20);
    expect(arc[0]?.[1]).toBeCloseTo(0, 5);
    expect(arc[20]?.[1]).toBeCloseTo(0, 5);
    expect(Math.min(...arc.map(([, y]) => y))).toBeCloseTo(-DEFAULT_FEEL.jumpHeight, 5);
  });
});
