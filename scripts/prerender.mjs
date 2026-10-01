// Writes real HTML for each route into dist/, so the content is there before JavaScript runs.
// Runs after `vite build` (client) and `vite build --ssr src/entry-server.tsx` (server bundle).
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dist = 'dist';
const server = 'dist-ssr';
const { render, routes, meta } = await import(pathToFileURL(join(server, 'entry-server.js')).href);
const template = await readFile(join(dist, 'index.html'), 'utf8');

const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

for (const route of routes) {
  const html = await render(route);
  // Replacer functions, so a `$&` or `$'` in page text is never read as a replacement pattern.
  let page = template.replace('<div id="root"></div>', () => `<div id="root" data-prerendered="${route}">${html}</div>`);
  const m = meta[route];
  if (m) {
    page = page
      .replace(/<title>[^<]*<\/title>/, () => `<title>${escape(m.title)}</title>`)
      .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, (_, a, b) => a + escape(m.description) + b)
      .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, (_, a, b) => a + escape(m.title) + b);
  }
  const file = route === '/' ? join(dist, 'index.html') : join(dist, route, 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, page);
  console.log(`prerendered ${route.padEnd(18)} ${(html.length / 1024).toFixed(1)} kB`);
}

await rm(server, { recursive: true, force: true });
