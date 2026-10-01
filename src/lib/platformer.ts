/**
 * A tiny platformer engine.
 *
 * Everything is measured in "units", where one unit is the size of the
 * player square. The renderer decides how many pixels a unit is, so the same
 * feel works on a phone and on a 4K monitor.
 *
 * It implements the handful of tricks that make a jump feel good:
 *  - coyote time      (jump shortly after walking off a ledge)
 *  - jump buffering   (press jump shortly before landing)
 *  - variable height  (release early for a shorter hop)
 *  - squash & stretch (purely visual, but it sells the weight)
 */

export interface FeelParams {
  /** Downward acceleration, units/s². */
  gravity: number;
  /** Peak jump height, in units. Converted to an initial velocity. */
  jumpHeight: number;
  /** Top horizontal speed, units/s. */
  runSpeed: number;
  /** Horizontal acceleration on the ground, units/s². */
  groundAccel: number;
  /** 0–1, how much of the ground acceleration you keep in the air. */
  airControl: number;
  /** Grace period after leaving a ledge, ms. */
  coyoteMs: number;
  /** How early a jump press still counts before landing, ms. */
  bufferMs: number;
  /** 0–1, visual squash & stretch strength. */
  squash: number;
  /** Multiplier applied to upward velocity when jump is released early. */
  jumpCut: number;
}

export const DEFAULT_FEEL: FeelParams = {
  gravity: 95,
  jumpHeight: 4.6,
  runSpeed: 13,
  groundAccel: 120,
  airControl: 0.7,
  coyoteMs: 100,
  bufferMs: 120,
  squash: 0.7,
  jumpCut: 0.45,
};

export interface Solid {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Optional identifier, reported back on landing. */
  id?: string | number;
  /** One-way platforms can be jumped through from below. */
  oneWay?: boolean;
}

export interface Input {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
}

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Size in units (the player is always 1×1, but the lab can change it). */
  size: number;
  grounded: boolean;
  /** Time (ms) the body was last standing on something. */
  lastGroundedAt: number;
  /** Time (ms) jump was last pressed, or -Infinity. */
  jumpPressedAt: number;
  /** True while rising from a jump and the early-release cut is still available. */
  jumping: boolean;
  /** Whether the current airborne phase came from a jump (disables coyote time). */
  jumped: boolean;
  /** Visual scale, eased back to 1 every step. */
  scaleX: number;
  scaleY: number;
  /** Facing direction for the renderer: -1 or 1. */
  facing: -1 | 1;
  standingOn: Solid | null;
}

export type EngineEvent =
  | { type: 'land'; solid: Solid; impact: number }
  | { type: 'jump'; coyote: boolean; buffered: boolean }
  | { type: 'leave'; solid: Solid };

export function createBody(x: number, y: number, size = 1): Body {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    size,
    grounded: false,
    lastGroundedAt: -Infinity,
    jumpPressedAt: -Infinity,
    jumping: false,
    jumped: false,
    scaleX: 1,
    scaleY: 1,
    facing: 1,
    standingOn: null,
  };
}

export function jumpVelocity(p: FeelParams): number {
  return Math.sqrt(2 * p.gravity * p.jumpHeight);
}

/** Register a jump press. Call on keydown / tap, not every frame. */
export function pressJump(body: Body, now: number): void {
  body.jumpPressedAt = now;
}

const overlaps = (ax: number, aw: number, bx: number, bw: number) => ax < bx + bw && ax + aw > bx;

/** Advance the simulation by `dt` seconds. `now` is the current time in ms. */
export function step(
  body: Body,
  input: Input,
  solids: readonly Solid[],
  p: FeelParams,
  dt: number,
  now: number,
): EngineEvent[] {
  const events: EngineEvent[] = [];
  const s = body.size;

  // Horizontal: accelerate toward the target speed.
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir !== 0) body.facing = dir as -1 | 1;
  const target = dir * p.runSpeed;
  const accel = p.groundAccel * (body.grounded ? 1 : p.airControl);
  const dv = target - body.vx;
  const maxDv = accel * dt;
  body.vx += Math.abs(dv) <= maxDv ? dv : Math.sign(dv) * maxDv;

  // Jump: buffered press + coyote window.
  const buffered = now - body.jumpPressedAt <= p.bufferMs;
  const canJump = body.grounded || (!body.jumped && now - body.lastGroundedAt <= p.coyoteMs);
  if (buffered && canJump) {
    const coyote = !body.grounded;
    const wasBuffered = now - body.jumpPressedAt > dt * 1000 + 1;
    body.vy = -jumpVelocity(p);
    body.grounded = false;
    body.jumping = true;
    body.jumped = true;
    body.jumpPressedAt = -Infinity;
    body.standingOn = null;
    body.scaleX = 1 - 0.28 * p.squash;
    body.scaleY = 1 + 0.32 * p.squash;
    events.push({ type: 'jump', coyote, buffered: wasBuffered });
  }

  // Variable jump height: releasing early cuts the ascent.
  if (!input.jumpHeld && body.jumping && body.vy < 0) {
    body.vy *= p.jumpCut;
    body.jumping = false; // only cut once
  }

  body.vy += p.gravity * dt;
  // Terminal velocity keeps tunnelling impossible at sane frame rates.
  body.vy = Math.min(body.vy, 60);

  // --- Move X, resolve against solid (non one-way) blocks.
  body.x += body.vx * dt;
  for (const b of solids) {
    if (b.oneWay) continue;
    if (!overlaps(body.x, s, b.x, b.w) || !overlaps(body.y, s, b.y, b.h)) continue;
    // Small step-up: if we only clip the very top corner, hop onto it.
    const stepUp = body.y + s - b.y;
    if (body.grounded && stepUp > 0 && stepUp <= 0.18) {
      body.y = b.y - s;
      continue;
    }
    if (body.vx > 0) body.x = b.x - s;
    else if (body.vx < 0) body.x = b.x + b.w;
    body.vx = 0;
  }

  // --- Move Y.
  const prevBottom = body.y + s;
  body.y += body.vy * dt;
  const wasGrounded = body.grounded;
  const prevSolid = body.standingOn;
  body.grounded = false;
  body.standingOn = null;

  for (const b of solids) {
    if (!overlaps(body.x, s, b.x, b.w)) continue;
    if (!overlaps(body.y, s, b.y, b.h)) continue;
    if (body.vy >= 0 && prevBottom <= b.y + 0.001) {
      // Landing on top.
      const impact = body.vy;
      body.y = b.y - s;
      body.vy = 0;
      body.grounded = true;
      body.jumping = false;
      body.jumped = false;
      body.standingOn = b;
      if (!wasGrounded) {
        const k = Math.min(1, impact / 40) * p.squash;
        body.scaleX = 1 + 0.38 * k;
        body.scaleY = 1 - 0.34 * k;
        events.push({ type: 'land', solid: b, impact });
      }
    } else if (!b.oneWay && body.vy < 0) {
      // Head bump.
      body.y = b.y + b.h;
      body.vy = 0;
      body.jumping = false;
    } else if (!b.oneWay) {
      // Embedded from the side after a resize: push out the short way.
      const up = body.y + s - b.y;
      const down = b.y + b.h - body.y;
      body.y = up < down ? b.y - s : b.y + b.h;
    }
  }

  if (body.grounded) body.lastGroundedAt = now;
  if (wasGrounded && !body.grounded && prevSolid) events.push({ type: 'leave', solid: prevSolid });

  // Ease visual scale back to rest (frame-rate independent).
  const k = 1 - Math.exp(-dt * 16);
  body.scaleX += (1 - body.scaleX) * k;
  body.scaleY += (1 - body.scaleY) * k;

  return events;
}

/**
 * Runs `step` on a fixed timestep so the feel doesn't change with frame rate.
 * Returns the leftover accumulator to carry into the next frame.
 */
export function stepFixed(
  body: Body,
  input: Input,
  solids: readonly Solid[],
  p: FeelParams,
  frameDt: number,
  now: number,
  acc: number,
  onEvent?: (e: EngineEvent) => void,
): number {
  const h = 1 / 120;
  acc = Math.min(acc + frameDt, 0.1);
  let t = now - acc * 1000;
  while (acc >= h) {
    t += h * 1000;
    const events = step(body, input, solids, p, h, t);
    if (onEvent) for (const e of events) onEvent(e);
    acc -= h;
  }
  return acc;
}

/** Sample the ballistic arc of a full jump, for visualisation. */
export function jumpArc(p: FeelParams, vx: number, samples = 24): Array<[number, number]> {
  const v0 = jumpVelocity(p);
  const tPeak = v0 / p.gravity;
  const total = tPeak * 2;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * total;
    pts.push([vx * t, -(v0 * t - 0.5 * p.gravity * t * t)]);
  }
  return pts;
}
