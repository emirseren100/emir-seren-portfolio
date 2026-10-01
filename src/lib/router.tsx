import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { prefersReducedMotion } from './useReducedMotion';

/**
 * A deliberately small router: a handful of routes, real URLs,
 * and a curtain transition between pages. Hash links scroll smoothly
 * on the current page, or route home first and then scroll.
 */

export type CurtainPhase = 'idle' | 'cover' | 'reveal';

interface Curtain {
  phase: CurtainPhase;
  ink: string;
  label: string;
}

interface NavigateOptions {
  ink?: string;
  label?: string;
}

interface RouterState {
  path: string;
  navigate: (to: string, opts?: NavigateOptions) => void;
  curtain: Curtain;
}

const RouterContext = createContext<RouterState | null>(null);

const COVER_MS = 620;
const REVEAL_MS = 760;

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function splitHref(to: string): { path: string; hash: string } {
  const url = new URL(to, window.location.href);
  return { path: url.pathname, hash: url.hash.slice(1) };
}

export function scrollToId(id: string, smooth = true) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'instant' });
  return true;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname);
  const [curtain, setCurtain] = useState<Curtain>({ phase: 'idle', ink: 'var(--ink-2)', label: '' });
  const pending = useRef<{ hash: string; scrollY: number | null } | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    // Initial deep link to a section.
    const hash = window.location.hash.slice(1);
    if (hash) requestAnimationFrame(() => scrollToId(hash, false));
  }, []);

  const transition = useCallback(async (apply: () => void, ink: string, label: string) => {
    if (busy.current) return;
    busy.current = true;
    const reduced = prefersReducedMotion();
    if (!reduced) {
      setCurtain({ phase: 'cover', ink, label });
      await wait(COVER_MS);
    }
    apply();
    if (!reduced) {
      // Give the new page a moment to lay out before lifting the curtain.
      await wait(140);
      setCurtain({ phase: 'reveal', ink, label });
      await wait(REVEAL_MS);
    }
    setCurtain({ phase: 'idle', ink, label });
    busy.current = false;
  }, []);

  const navigate = useCallback(
    (to: string, opts?: NavigateOptions) => {
      const { path: nextPath, hash } = splitHref(to);
      const samePage = nextPath === window.location.pathname;

      if (samePage) {
        if (hash) {
          history.replaceState(history.state, '', `${nextPath}#${hash}`);
          scrollToId(hash);
        } else {
          window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
        }
        return;
      }

      // Remember where we were so Back lands in the same place.
      history.replaceState({ ...history.state, scrollY: window.scrollY }, '');

      void transition(() => {
        history.pushState({ scrollY: 0 }, '', to);
        pending.current = { hash, scrollY: 0 };
        setPath(nextPath);
      }, opts?.ink ?? 'var(--ink-2)', opts?.label ?? (nextPath === '/' ? 'Index' : ''));
    },
    [transition],
  );

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const nextPath = window.location.pathname;
      const scrollY = typeof e.state?.scrollY === 'number' ? e.state.scrollY : 0;
      const hash = window.location.hash.slice(1);
      if (nextPath === path) {
        if (hash) scrollToId(hash);
        return;
      }
      void transition(() => {
        pending.current = { hash: scrollY ? '' : hash, scrollY };
        setPath(nextPath);
      }, 'var(--ink-2)', nextPath === '/' ? 'Index' : '');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [path, transition]);

  // After a route change commits, put the scroll position where it belongs.
  useLayoutEffect(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    if (p.hash && scrollToId(p.hash, false)) return;
    window.scrollTo({ top: p.scrollY ?? 0, behavior: 'instant' });
  }, [path]);

  const value = useMemo(() => ({ path, navigate, curtain }), [path, navigate, curtain]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterState {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used inside <RouterProvider>');
  return ctx;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  /** Colour of the page-transition curtain. */
  ink?: string;
  /** Text shown on the curtain while it covers the page. */
  label?: string;
};

export function Link({ to, ink, label, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useRouter();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to, { ink, label });
  };
  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}

/** Matches `/work/:slug`. Returns null for anything else. */
export function matchWork(path: string): string | null {
  const m = /^\/work\/([a-z0-9-]+)\/?$/.exec(path);
  return m?.[1] ?? null;
}
