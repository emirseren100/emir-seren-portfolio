import { useId, type ReactNode } from 'react';
import { rangeFill } from '../lib/rangeFill';
import styles from './Experiment.module.css';

interface Param {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}

interface Action {
  label: string;
  onClick: () => void;
}

/** One canvas, one parameter. Each experiment exposes the number that matters most. */
export function Experiment({ children, param, action }: { children: ReactNode; param: Param; action?: Action }) {
  const id = useId();
  return (
    <div className={styles.experiment}>
      <div className={styles.canvasBox}>
        {children}
        {action ? (
          <button type="button" className={`hit ${styles.action}`} onClick={action.onClick}>
            {action.label}
          </button>
        ) : null}
      </div>
      <div className={styles.param}>
        <label htmlFor={id}>{param.label}</label>
        <output htmlFor={id}>{param.format(param.value)}</output>
        <input
          id={id}
          type="range"
          className="range"
          min={param.min}
          max={param.max}
          step={param.step}
          value={param.value}
          aria-valuetext={param.format(param.value)}
          onChange={(e) => param.onChange(Number(e.target.value))}
          style={rangeFill(param.value, param.min, param.max)}
        />
      </div>
    </div>
  );
}
