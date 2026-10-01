// Browser QA: node scripts/qa.mjs [baseUrl]
// Routes × motion settings, viewports and zoom, touch path, keyboard order,
// arrival (hash load, anchor jump, Back/Forward never lands on invisible content), console errors.
import { chromium } from 'playwright-core';

const base = process.argv[2] ?? 'http://localhost:5173';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
const errors = [];
const failures = [];
const watch = (page, tag) => {
  page.on('console', (m) => m.type() === 'error' && errors.push(`${tag}: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`${tag}: ${e}`));
};
const check = (ok, msg) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!ok) failures.push(msg);
};

/** Scrolls the whole page in steps, so lazy content mounts and reveals trigger. */
const scrollThrough = async (page, step, pause) => {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += step) {
    await page.evaluate((yy) => scrollTo(0, yy), y);
    await page.waitForTimeout(pause);
  }
};

/** Revealable content fully inside the viewport that is still hidden. */
const hiddenInView = (page) =>
  page.evaluate(() => {
    const h = innerHeight;
    const els = [...document.querySelectorAll('[data-reveal], .split .wi')];
    return els.filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.height === 0 || r.top < 0 || r.bottom > h) return false;
      const cs = getComputedStyle(el);
      const ty = new DOMMatrix(cs.transform).m42;
      return parseFloat(cs.opacity) < 0.9 || Math.abs(ty) > 2;
    }).length;
  });

// 1. Routes, with and without reduced motion
for (const path of ['/', '/work/scoutlab', '/work/devflow', '/work/stockflow', '/nope']) {
  for (const reduced of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    watch(page, `${path}${reduced ? ' (reduced)' : ''}`);
    const res = await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await scrollThrough(page, 700, 50);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(res.status() === 200 && overflow <= 0, `${path} ${reduced ? 'reduced' : 'motion'} — status ${res.status()}, overflow ${overflow}, “${await page.title()}”`);
    await ctx.close();
  }
}

// 2. Horizontal overflow across viewports, plus 200% zoom (1440 CSS px at 2× = 720 CSS px)
for (const [w, h, dsf, tag] of [[390, 844, 2, '390'], [768, 1024, 2, '768'], [1024, 768, 1, '1024'], [1440, 900, 1, '1440×900'], [1920, 1080, 1, '1920×1080'], [2560, 1440, 1, '2560×1440'], [720, 450, 2, '1440 @ 200% zoom']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf });
  const page = await ctx.newPage();
  watch(page, tag);
  for (const path of ['/', '/work/stockflow']) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await scrollThrough(page, h, 40);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(overflow <= 0, `${tag} ${path} — horizontal overflow ${overflow}px`);
  }
  await ctx.close();
}

// 3. Arrival: hash load, anchor jump, Back/Forward
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  watch(page, 'arrival');
  for (const hash of ['work', 'about', 'toolkit', 'playground', 'contact']) {
    await page.goto(`${base}/#${hash}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(450);
    check((await hiddenInView(page)) === 0, `direct load /#${hash} — nothing hidden in view after 450ms`);
  }
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('nav[aria-label="Primary"] >> text=Contact');
  await page.waitForTimeout(1800);
  check((await hiddenInView(page)) === 0, 'nav anchor jump to Contact — nothing hidden once the scroll settles');
  // The nav steps aside on the way down; a small scroll up brings it back, as for a visitor.
  await page.mouse.wheel(0, -120);
  await page.waitForTimeout(700);
  await page.click('nav[aria-label="Primary"] >> text=Work');
  await page.waitForTimeout(1800);
  await page.locator('text=Read the case study').first().click();
  await page.waitForTimeout(2200);
  check(page.url().endsWith('/work/scoutlab'), `case study route — ${page.url()}`);
  await page.evaluate(() => scrollTo(0, 1600));
  await page.waitForTimeout(800);
  await page.goBack();
  await page.waitForTimeout(1900);
  check((await hiddenInView(page)) === 0, `Back to ${new URL(page.url()).pathname} — restored scroll ${await page.evaluate(() => scrollY)}, nothing hidden`);
  await page.goForward();
  await page.waitForTimeout(1900);
  check((await hiddenInView(page)) === 0, `Forward to ${new URL(page.url()).pathname} — nothing hidden`);
  await ctx.close();
}

// 4. Touch path
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  watch(page, 'touch');
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const hint = await page.locator('#top [aria-live="polite"]').textContent();
  check(/tap/i.test(hint) && !/arrow|click|esc/i.test(hint), `hero hint speaks touch — “${hint}”`);
  const stageLabel = await page.locator('#top [aria-roledescription="mini game"]').getAttribute('aria-label');
  check(!/arrow/i.test(stageLabel), 'hero stage label has no keyboard-only instructions on touch');
  await page.tap('button[aria-controls="mobile-menu"]');
  await page.waitForTimeout(900);
  await page.tap('#mobile-menu >> text=Playground');
  await page.waitForTimeout(1600);
  const top = await page.evaluate(() => document.getElementById('playground').getBoundingClientRect().top);
  check(Math.abs(top - 84) < 40, `mobile menu → Playground lands at ${Math.round(top)}px`);
  await page.locator('text=E.00').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  check((await page.locator('button[aria-label="Jump"]').count()) === 1, 'game feel lab shows touch buttons');
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('a, button, input, [tabindex="0"]')]
      // Visually hidden inputs are operated through their (larger) label.
      .filter((el) => el.offsetParent && !el.closest('[inert]') && getComputedStyle(el).opacity !== '0')
      .map((el) => {
        const r = el.getBoundingClientRect();
        const after = getComputedStyle(el, '::after');
        const pad = el.classList.contains('hit') ? Math.abs(parseFloat(after.top) || 0) * 2 : 0;
        return { el: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 28), h: Math.round(r.height + pad) };
      })
      .filter((t) => t.h < 24),
  );
  check(small.length === 0, `touch targets ≥ 24px tall (incl. hit areas) — ${small.length ? JSON.stringify(small) : 'all fine'}`);
  await ctx.close();
}

// 5. Keyboard: tab order reaches the hero, mockups, lab and contact
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  watch(page, 'keyboard');
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4200);
  const seen = [];
  for (let i = 0; i < 160; i++) {
    await page.keyboard.press('Tab');
    seen.push(
      await page.evaluate(() => {
        const a = document.activeElement;
        const label = a instanceof HTMLInputElement ? a.labels?.[0]?.textContent : null;
        return (a?.getAttribute('aria-label') || label || a?.textContent || a?.tagName || '').trim().slice(0, 30);
      }),
    );
  }
  for (const want of ['The name is walkable.', 'Playable title', 'Pause the ScoutLab demo', 'Game feel lab', 'Gravity', 'How far each bird sees', 'hello@']) {
    check(seen.some((s) => s.includes(want) || s === want), `keyboard reaches “${want}”`);
  }
  const ranges = await page.evaluate(() => [...document.querySelectorAll('input[type=range]')].every((r) => r.labels?.length && r.getAttribute('aria-valuetext')));
  check(ranges, 'every slider has a label and a spoken value');
  await ctx.close();
}

console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'no console errors');
console.log(failures.length ? `${failures.length} FAILURE(S)` : 'all checks passed');
await browser.close();
process.exit(failures.length || errors.length ? 1 : 0);
