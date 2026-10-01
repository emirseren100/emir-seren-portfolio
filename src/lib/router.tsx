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
import { settleArrival } from './useInView';
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

/** `/work/devflow/` and `/index.html` are the same pages as `/work/devflow` and `/`. */
export const normalisePath = (path: string) => path.replace(/\/index\.html$/, '/').replace(/(.)\/+$/, '$1');

function splitHref(to: string): { path: string; hash: string } {
  const url = new URL(to, window.location.href);
  return { path: normalisePath(url.pathname), hash: url.hash.slice(1) };
}

export function scrollToId(id: string, smooth = true) {
  const el = document.getElementById(id);
  if (!el) return false;
  const animate = smooth && !prefersReducedMotion();
  el.scrollIntoView({ behavior: animate ? 'smooth' : 'instant' });
  if (animate) afterScroll(settleArrival);
  else settleArrival();
  return true;
}

/** Runs once a smooth scroll has come to rest (with a fallback where `scrollend` is missing). */
function afterScroll(fn: () => void) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    window.removeEventListener('scrollend', finish);
    fn();
  };
  window.addEventListener('scrollend', finish);
  window.setTimeout(finish, 1200);
}

export function RouterProvider({ children, initialPath }: { children: ReactNode; initialPath?: string }) {
  // `initialPath` lets the page be prerendered on the server, where there is no window.
  const [path, setPath] = useState(() => normalisePath(initialPath ?? window.location.pathname));
  const [curtain, setCurtain] = useState<Curtain>({ phase: 'idle', ink: 'var(--ink-2)', label: '' });
  const pending = useRef<{ hash: string; scrollY: number | null } | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    // Initial deep link to a section; otherwise just settle whatever is on screen.
    const hash = window.location.hash.slice(1);
    if (hash) requestAnimationFrame(() => scrollToId(hash, false));
    else settleArrival();
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
      const samePage = nextPath === normalisePath(window.location.pathname);

      if (samePage) {
        if (hash) {
          history.replaceState(history.state, '', `${nextPath}#${hash}`);
          scrollToId(hash);
        } else {
          const animate = !prefersReducedMotion();
          window.scrollTo({ top: 0, behavior: animate ? 'smooth' : 'instant' });
          if (animate) afterScroll(settleArrival);
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
      const nextPath = normalisePath(window.location.pathname);
      const scrollY = typeof e.state?.scrollY === 'number' ? e.state.scrollY : 0;
      const hash = window.location.hash.slice(1);
      if (nextPath === path) {
        // Back/Forward between sections (or a typed #fragment) is an arrival, not a journey.
        if (hash) scrollToId(hash, false);
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
    settleArrival();
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
