// Visual review helper: node scripts/shoot.mjs <url> <name> [width] [height] [scrollY|#id] [waitMs] [fullPage]
import { chromium } from 'playwright-core';

const [url = 'http://localhost:5173/', name = 'shot', w = '1440', h = '900', scroll = '0', wait = '2600', full = ''] =
  process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'networkidle' });
if (scroll.startsWith('#')) {
  await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ behavior: 'instant' }), scroll.slice(1));
} else if (+scroll) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), +scroll);
}
await page.waitForTimeout(+wait);
await page.screenshot({ path: `scripts/out/${name}.png`, fullPage: !!full });
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
await browser.close();
