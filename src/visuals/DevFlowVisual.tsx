import { useRef, useState, type CSSProperties } from 'react';
import { useAutoplay } from '../lib/useAutoplay';
import { Frame } from './Frame';
import styles from './DevFlowVisual.module.css';

const STATES = ['Idea', 'Building', 'Review', 'Shipped'] as const;

const TASKS = [
  { id: 41, title: 'Radar axes per role', branch: 'feat/role-axes', files: 6 },
  { id: 42, title: 'Batch socket updates', branch: 'perf/batch-events', files: 3 },
  { id: 43, title: 'Fuzzy command search', branch: 'feat/palette-fuzzy', files: 4 },
];

function describe(step: number) {
  const task = TASKS[Math.floor(step / STATES.length) % TASKS.length]!;
  const state = step % STATES.length;
  const minutes = 9 * 60 + 12 + step * 23;
  const time = `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const detail = [
    'created from a note',
    `branch ${task.branch}`,
    `review requested · ${task.files} files`,
    'merged · checks passed',
  ][state]!;
  const transition = state === 0 ? 'new task' : `${STATES[state - 1]!.toLowerCase()} → ${STATES[state]!.toLowerCase()}`;
  return { task, state, time, detail, transition };
}

export function DevFlowVisual({ large = false }: { large?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { tick, takeOver } = useAutoplay(ref, 2400);
  const [manual, setManual] = useState(0);
  // Start a few steps in, so the event log already has some history.
  const step = tick + manual + 5;
  const now = describe(step);
  const log = Array.from({ length: Math.min(5, step + 1) }, (_, i) => ({ step: step - i, ...describe(step - i) }));

  const advance = () => {
    takeOver();
    setManual((m) => m + 1);
  };

  return (
    <div ref={ref}>
      <Frame
        app="DevFlow"
        context="Flow · this week"
        right={<kbd className={styles.kbd}>⌘K</kbd>}
        label="DevFlow interface: a task moving through idea, building, review and shipped, with an event log underneath."
        className={`${styles.frame} ${large ? styles.large : ''}`}
      >
        <div className={styles.flow} style={{ '--ink': 'var(--ink-devflow)', '--s': now.state } as CSSProperties}>
          <ol className={styles.track}>
            {STATES.map((s, i) => (
              <li key={s} className={styles.node} data-state={i < now.state ? 'past' : i === now.state ? 'now' : 'next'}>
                <span className={styles.nodeMark} aria-hidden="true" />
                <span className={styles.nodeLabel}>{s}</span>
              </li>
            ))}
          </ol>
          <div className={styles.rail} aria-hidden="true">
            <span className={styles.railFill} />
          </div>
          <div className={styles.cardLane}>
            <div className={styles.card} key={now.task.id} aria-live="polite">
              <span className={styles.cardId}>#{now.task.id}</span>
              <span className={styles.cardTitle}>{now.task.title}</span>
              <span className={styles.cardState}>{STATES[now.state]}</span>
            </div>
          </div>
          <button type="button" className={styles.advance} onClick={advance}>
            Advance task <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className={styles.log}>
          <div className={styles.logHead}>
            <span>Event log</span>
            <span>append-only</span>
          </div>
          <ol>
            {log.map((e, i) => (
              <li key={e.step} className={styles.event} data-fresh={i === 0}>
                <span className={styles.time}>{e.time}</span>
                <span className={styles.evTask}>#{e.task.id}</span>
                <span className={styles.evTransition}>{e.transition}</span>
                <span className={styles.evDetail}>{e.detail}</span>
              </li>
            ))}
          </ol>
        </div>
      </Frame>
    </div>
  );
}
