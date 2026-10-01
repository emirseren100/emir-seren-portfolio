import { StrictMode } from 'react';
import { prerender } from 'react-dom/static';
import { App } from './App';
import { projects } from './content/projects';

/** Routes that get real HTML at build time. Everything else is rendered in the browser. */
export const routes = ['/', ...projects.map((p) => `/work/${p.slug}`)];

export const meta: Record<string, { title: string; description: string }> = Object.fromEntries(
  projects.map((p) => [
    `/work/${p.slug}`,
    { title: `${p.name} — Case study — Emir Şeren`, description: `${p.name}: ${p.brief}` },
  ]),
);

/** Renders a route to HTML, waiting for lazy chunks so the markup is complete. */
export async function render(path: string): Promise<string> {
  const { prelude } = await prerender(
    <StrictMode>
      <App initialPath={path} />
    </StrictMode>,
  );
  return new Response(prelude).text();
}
