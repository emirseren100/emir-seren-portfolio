import { useEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import { useAutoplay } from '../lib/useAutoplay';
import { Frame } from './Frame';
import styles from './DevFlowVisual.module.css';

/** The real app's issue statuses, in board order. */
const COLUMNS = ['Backlog', 'To do', 'In progress', 'In review', 'Done'] as const;
const DONE = COLUMNS.length - 1;

type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
interface Issue {
  n: number;
  title: string;
  type: 'task' | 'bug';
  priority: Priority;
  who: string;
}
interface Event {
  id: number;
  who: string;
  text: string;
}
interface State {
  cols: Issue[][];
  next: number;
  tick: number;
  events: Event[];
}
type Action = { type: 'auto' } | { type: 'move'; n: number; dir: -1 | 1 };

/** Sample issues for a fictional "API" project. Initials are made up. */
const POOL: Omit<Issue, 'n'>[] = [
  { title: 'Paginate the issue list', type: 'task', priority: 'Medium', who: 'AK' },
  { title: 'Due date shows the wrong day', type: 'bug', priority: 'High', who: 'MS' },
  { title: 'Add a goal to sprints', type: 'task', priority: 'Low', who: 'EY' },
  { title: 'Validate project keys', type: 'task', priority: 'Medium', who: 'AK' },
  { title: 'Empty state for the board', type: 'task', priority: 'Low', who: 'MS' },
  { title: 'Comment order is reversed', type: 'bug', priority: 'Medium', who: 'EY' },
  { title: 'Filter issues by assignee', type: 'task', priority: 'High', who: 'AK' },
  { title: 'Limit login attempts', type: 'task', priority: 'Urgent', who: 'MS' },
  { title: 'Sort by due date', type: 'task', priority: 'Low', who: 'EY' },
];

const issue = (n: number): Issue => ({ n, ...POOL[(n - 1) % POOL.length]! });

const INITIAL: State = {
  cols: [[issue(8), issue(9)], [issue(6), issue(7)], [issue(4), issue(5)], [issue(3)], [issue(1), issue(2)]],
  next: 10,
  tick: 0,
  events: [
    { id: 2, who: 'MS', text: 'API-3 · In progress → In review' },
    { id: 1, who: 'AK', text: 'API-9 created' },
  ],
};

const log = (s: State, who: string, text: string): Event[] =>
  [{ id: (s.events[0]?.id ?? 0) + 1, who, text }, ...s.events].slice(0, 4);

function move(s: State, n: number, dir: -1 | 1, who: string): State {
  const from = s.cols.findIndex((c) => c.some((i) => i.n === n));
  const to = from + dir;
  if (from < 0 || to < 0 || to > DONE) return s;
  const card = s.cols[from]!.find((i) => i.n === n)!;
  const cols = s.cols.map((c, k) => (k === from ? c.filter((i) => i.n !== n) : k === to ? [...c, card] : c));
  return { ...s, cols, events: log(s, who, `API-${n} · ${COLUMNS[from]} → ${COLUMNS[to]}`) };
}

function reducer(s: State, a: Action): State {
  if (a.type === 'move') return move(s, a.n, a.dir, 'you');
  // Work the board from right to left, one column per tick, so cards keep flowing towards Done.
  for (let k = 0; k < DONE; k++) {
    const col = DONE - 1 - ((s.tick + k) % DONE);
    const card = s.cols[col]![0];
    if (!card) continue;
    let next = move({ ...s, tick: s.tick + k + 1 }, card.n, 1, card.who);
    // Keep the backlog stocked: a new issue arrives as the last one is picked up.
    if (col === 0 && next.cols[0]!.length === 0) {
      next = {
        ...next,
        cols: next.cols.map((c, i) => (i === 0 ? [issue(next.next)] : c)),
        next: next.next + 1,
        events: log(next, 'AK', `API-${next.next} created`),
      };
    }
    return next;
  }
  return s;
}

export function DevFlowVisual({ large = false }: { large?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { position, paused, pause, resume } = useAutoplay(ref, 2600);
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (position > 0) dispatch({ type: 'auto' });
  }, [position]);

  const col = selected === null ? -1 : state.cols.findIndex((c) => c.some((i) => i.n === selected));
  const nudge = (dir: -1 | 1) => {
    if (selected === null) return;
    pause();
    dispatch({ type: 'move', n: selected, dir });
  };

  return (
    <div ref={ref}>
      <Frame
        app="DevFlow"
        context="API · board · sample data"
        right={<span className={styles.live} data-paused={paused}>{paused ? 'paused' : 'live'}</span>}
        playback={{ paused, onToggle: paused ? resume : pause }}
        label="DevFlow re-creation: a Kanban board for a sample project. Issues move from Backlog to Done, and an activity feed records each change."
        className={`${styles.frame} ${large ? styles.large : ''}`}
      >
        <div className={styles.boardScroll} tabIndex={0} aria-label="Board columns">
          <div className={styles.board} style={{ '--ink': 'var(--ink-devflow)' } as CSSProperties}>
            {state.cols.map((cards, k) => {
              const shown = k === DONE ? cards.slice(-2) : cards;
              return (
                <section key={COLUMNS[k]} className={styles.col} aria-label={`${COLUMNS[k]}, ${cards.length} issues`}>
                  <p className={styles.colHead}>
                    {COLUMNS[k]} <span>{cards.length}</span>
                  </p>
                  <ul>
                    {shown.map((i) => (
                      <li key={i.n}>
                        <button
                          type="button"
                          className={styles.card}
                          aria-pressed={selected === i.n}
                          onClick={() => {
                            pause();
                            setSelected(selected === i.n ? null : i.n);
                          }}
                        >
                          <span className={styles.key}>API-{i.n}</span>
                          <span className={styles.title}>{i.title}</span>
                          <span className={styles.meta}>
                            <span className={styles.type} data-type={i.type}>
                              {i.type}
                            </span>
                            <span>{i.priority}</span>
                            <span className={styles.who}>{i.who}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {k === DONE && cards.length > shown.length ? (
                    <p className={styles.more}>+{cards.length - shown.length} earlier</p>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>

        <div className={styles.tools}>
          <span className={styles.hint}>{selected === null ? 'Select an issue to move it' : `API-${selected} selected`}</span>
          <button type="button" className={`hit ${styles.moveBtn}`} onClick={() => nudge(-1)} disabled={col <= 0}>
            <span aria-hidden="true">←</span> Move left
          </button>
          <button type="button" className={`hit ${styles.moveBtn}`} onClick={() => nudge(1)} disabled={col < 0 || col >= DONE}>
            Move right <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className={styles.log}>
          <div className={styles.logHead}>
            <span>Activity</span>
            <span>newest first</span>
          </div>
          <ol aria-live={paused ? 'polite' : 'off'}>
            {state.events.map((e, i) => (
              <li key={e.id} className={styles.event} data-fresh={i === 0}>
                <span className={styles.source} data-you={e.who === 'you'}>
                  {e.who}
                </span>
                <span>{e.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </Frame>
    </div>
  );
}
