// node scripts/tour.mjs <url> <prefix> <width> <height> [stepFraction]
// Scrolls the page in viewport steps, screenshotting each one (reveals trigger naturally).
import { chromium } from 'playwright-core';

const [url = 'http://localhost:5173/', prefix = 'tour', w = '1440', h = '900', frac = '1'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
let i = 0;
for (let y = 0; y < total; y += +h * +frac) {
  await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `scripts/out/${prefix}-${String(i++).padStart(2, '0')}.png` });
}
console.log('shots', i, 'height', total);
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
await browser.close();
