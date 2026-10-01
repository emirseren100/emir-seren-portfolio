# Emir Şeren — Portfolio

Personal site of Emir Şeren: Digital Game Design student, full-stack developer in progress.

The idea behind it: game design and software engineering are closer than they look. So the site borrows
from games quietly — in pacing, feedback and small discoveries — instead of dressing up as one.

- **The name is walkable.** The hero title is a level. Each letter's real ink bounds are measured
  (by rasterising the glyph, not trusting font metrics) and turned into platforms for a small square
  you can run and jump with. Letters dip under its weight.
- **Game feel lab.** The square runs on a tiny platformer engine (`src/lib/platformer.ts`) with coyote
  time, jump buffering, variable jump height and squash & stretch. The lab exposes its parameters — and
  changing them changes the square at the top of the page too.
- **Working mockups, not screenshots.** ScoutLab, DevFlow and StockFlow each have an interactive interface
  built in code, running on sample data, plus a case study page with an animated data-model diagram.
- **Experiments.** Boids, a verlet rope and a wave-function-collapse tile generator.

## Stack

React 19, TypeScript, Vite, CSS Modules. No animation or UI libraries — motion is CSS transitions plus a
few `requestAnimationFrame` loops that only run while on screen. Fonts are self-hosted via Fontsource:
Bricolage Grotesque (display/text), Newsreader italic (accents), Geist Mono (labels).

## Scripts

```bash
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
npm run check      # typecheck, lint, unit tests and build in one go

npm run typecheck
npm run lint
npm test           # engine, inventory simulation and tile solver tests
```

Visual QA helpers (need a Chromium binary; set `CHROMIUM_PATH` if it isn't at `/opt/pw-browsers/chromium`):

```bash
npm run qa -- http://localhost:5173        # every route, reduced motion, mobile menu, keyboard order, console errors
npm run og -- http://localhost:5173/       # regenerate public/og.png from the live hero
node scripts/shoot.mjs <url> <name> 1440 900   # single screenshot into scripts/out/
```

## Editing content

All copy lives in two files:

- `src/content/site.ts` — name, email, links, practice text, about/now/toolkit content
- `src/content/projects.ts` — project briefs and case studies

**Before publishing:** `site.email` is a placeholder (`hello@emirseren.dev`). Replace it with a real inbox,
and add any other profiles to `site.links`.

## Structure

```
src/
  content/      all copy and project data
  lib/          engine, router, hooks (in-view, reduced motion, canvas loop), simulations
  components/   nav, curtain transition, reveal primitives, section heads
  sections/     homepage chapters: hero, practice, work, about, toolkit, playground, contact
  visuals/      interactive project mockups and the system diagram
  experiments/  playground canvases (lazy-loaded)
  pages/        home, case study, 404
  styles/       tokens, base, layout/type/motion system
tests/          vitest unit tests
scripts/        screenshot / QA / OG-image tooling
```

## Deploying

It's a static single-page app: deploy `dist/`. Case studies live at `/work/<slug>`, so the host must fall
back to `index.html` for unknown paths. `vercel.json` and `public/_redirects` (Netlify) already do that.

## Accessibility notes

- The playable hero only captures keys while it has focus (click it, or use the “The name is walkable”
  button); Escape or scrolling away hands the keyboard back to the page.
- `prefers-reduced-motion` removes reveals, the drop-in intro and autoplaying mockups; everything stays usable.
- Touch devices get tap-to-jump in the hero and on-screen buttons in the lab.
