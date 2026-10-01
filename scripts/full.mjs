// node scripts/full.mjs <url> <name> <width> <height>
// Scrolls through to trigger reveals, then captures the full page.
import { chromium } from 'playwright-core';
const [url, name, w = '1440', h = '900'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += +h / 2) {
  await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
  await page.waitForTimeout(250);
}
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.waitForTimeout(1500);
await page.screenshot({ path: `scripts/out/${name}.png`, fullPage: true });
console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
await browser.close();
