import { chromium } from 'playwright-core';
const base = process.argv[2] ?? 'http://localhost:5173';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
const errors = [];
const watch = (page, tag) => {
  page.on('console', (m) => m.type() === 'error' && errors.push(`${tag}: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`${tag}: ${e}`));
};

// 1. Every route, desktop + reduced motion
for (const path of ['/', '/work/scoutlab', '/work/devflow', '/work/stockflow', '/nope']) {
  for (const reduced of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    watch(page, `${path}${reduced ? ' (reduced)' : ''}`);
    const res = await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 700) { await page.evaluate((yy) => scrollTo(0, yy), y); await page.waitForTimeout(60); }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    console.log(path, reduced ? 'reduced' : 'motion', 'status', res.status(), 'title:', await page.title(), 'h-overflow', overflow);
    if (reduced && path === '/') { await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(400); await page.screenshot({ path: 'scripts/out/q-reduced.png' }); }
    await ctx.close();
  }
}

// 2. Mobile menu
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  watch(page, 'mobile');
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  console.log('touch hint:', await page.locator('p[aria-live="polite"]').first().textContent());
  await page.tap('button[aria-controls="mobile-menu"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/out/q-menu.png' });
  console.log('menu focus:', await page.evaluate(() => document.activeElement?.textContent));
  await page.tap('#mobile-menu >> text=Playground');
  await page.waitForTimeout(1500);
  console.log('after menu nav, playground top:', Math.round(await page.evaluate(() => document.getElementById('playground').getBoundingClientRect().top)), 'overflow', await page.evaluate(() => document.body.style.overflow));
  // hero tap jump
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('mobile h-overflow', overflow);
  await ctx.close();
}

// 3. Keyboard tab order on home
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  watch(page, 'keyboard');
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const seen = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    seen.push(await page.evaluate(() => {
      const a = document.activeElement;
      return (a?.tagName + ':' + (a?.getAttribute('aria-label')?.slice(0, 20) || a?.textContent?.trim().slice(0, 24))).replace(/\s+/g, ' ');
    }));
    if (i === 12) await page.screenshot({ path: 'scripts/out/q-focus.png' });
  }
  console.log(seen.join(' | '));
  await ctx.close();
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
