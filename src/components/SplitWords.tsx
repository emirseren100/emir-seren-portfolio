import { Fragment, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { useInView } from '../lib/useInView';

interface Token {
  text: string;
  em: boolean;
}

/** Splits a string into words. `*wrapped words*` are set in the italic serif. */
export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  let em = false;
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    let word = raw;
    const opens = word.startsWith('*');
    if (opens) word = word.slice(1);
    const closes = word.endsWith('*') || /\*[.,;:!?’)]*$/.test(word);
    if (closes) word = word.replace(/\*(?=[.,;:!?’)]*$)/, '');
    const isEm = em || opens;
    out.push({ text: word, em: isEm });
    if (opens) em = true;
    if (closes) em = false;
  }
  return out;
}

/** Wraps each capital that follows a lowercase letter, so CSS can give the join some air. */
export function opticalCamel(word: string): ReactNode {
  const parts = word.split(/(?<=[a-zçğıöşü])(?=[A-ZÇĞİÖŞÜ])/);
  if (parts.length < 2) return word;
  return parts.map((part, i) =>
    i === 0 ? part : (
      <span key={i} className="camel">
        {part}
      </span>
    ),
  );
}

interface SplitWordsProps {
  text: string;
  as?: ElementType;
  className?: string;
  /** Base delay in ms. */
  delay?: number;
  /** Index offset, to continue a stagger from a previous block. */
  start?: number;
  /** Observe its own visibility. Set false when a parent controls `.is-in`. */
  self?: boolean;
  /** Open up lower→Upper joins (ScoutLab, DevFlow) that collide at tight display tracking. */
  camel?: boolean;
  id?: string;
  children?: ReactNode;
}

export function SplitWords({
  text,
  as: Tag = 'span',
  className,
  delay = 0,
  start = 0,
  self = true,
  camel = false,
  id,
  children,
}: SplitWordsProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { rootMargin: '0px 0px -8% 0px' });
  const tokens = tokenize(text);
  const cls = ['split', className, self && inView ? 'is-in' : ''].filter(Boolean).join(' ');

  return (
    <Tag ref={ref} id={id} className={cls} style={{ '--d': `${delay}ms` } as CSSProperties}>
      {tokens.map((t, i) => {
        const inner = (
          <span className="w">
            <span className="wi" style={{ '--i': i + start } as CSSProperties}>
              {t.em ? <em>{t.text}</em> : camel ? opticalCamel(t.text) : t.text}
            </span>
          </span>
        );
        return (
          <Fragment key={i}>
            {inner}
            {i < tokens.length - 1 ? ' ' : null}
          </Fragment>
        );
      })}
      {children}
    </Tag>
  );
}
