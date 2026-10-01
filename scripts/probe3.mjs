import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const r = await page.evaluate(() => {
  const cv = document.createElement('canvas'); cv.width = 400; cv.height = 400;
  const c = cv.getContext('2d');
  c.font = `560 300px "Bricolage Grotesque Variable"`;
  c.fillStyle = '#000'; c.fillText('E', 20, 350);
  const d = c.getImageData(0, 0, 400, 400).data;
  let top = -1;
  for (let y = 0; y < 400 && top < 0; y++) for (let x = 0; x < 400; x++) if (d[(y * 400 + x) * 4 + 3] > 128) { top = y; break; }
  return { drawnAscent: 350 - top, measured: c.measureText('E').actualBoundingBoxAscent, fontBoxAsc: c.measureText('E').fontBoundingBoxAscent };
});
console.log(r);
// DOM render for comparison
for (const v of ['normal', "'opsz' 96", "'opsz' 14"]) {
  await page.setContent(`<html><body style="margin:0;background:#fff"><link rel=stylesheet href="http://localhost:5173/node_modules/@fontsource-variable/bricolage-grotesque/opsz.css"><div style="position:absolute;top:0;left:20px;font:560 300px 'Bricolage Grotesque Variable';line-height:1;font-variation-settings:${v}">E<span id=p style="display:inline-block;width:0;height:0"></span></div></body></html>`);
  await page.waitForTimeout(800);
  const base = await page.evaluate(() => document.getElementById('p').getBoundingClientRect().top);
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 400, height: 400 } });
  const fs = await import('fs'); fs.writeFileSync('/tmp/claude-0/e.png', buf);
  const { execSync } = await import('child_process');
  const top = execSync(`python3 -c "
from PIL import Image
im=Image.open('/tmp/claude-0/e.png').convert('L')
print(next(y for y in range(400) if any(im.getpixel((x,y))<128 for x in range(400))))"`).toString().trim();
  console.log(v, 'base', base, 'top', top, 'ascent', base - +top);
}
await browser.close();
