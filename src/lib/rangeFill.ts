import type { CSSProperties } from 'react';

/** Style for the shared `.range` slider: how much of the track is filled. */
export const rangeFill = (value: number, min: number, max: number) =>
  ({ '--k': (value - min) / (max - min) }) as CSSProperties;
