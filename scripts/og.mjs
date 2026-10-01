// Generates public/og.png from the live hero. Run against `npm run dev` or `npm run preview`.
// node scripts/og.mjs [url]
import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://localhost:5173/';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: 'header, .grain { display: none !important; }' });
await page.waitForTimeout(3200);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('wrote public/og.png');
