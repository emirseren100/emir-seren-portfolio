import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const r = await page.evaluate(async () => {
  const fam = '"Bricolage Grotesque Variable"';
  const c = document.createElement('canvas').getContext('2d');
  c.font = `560 300px ${fam}`;
  const cw = c.measureText('Emir Şeren').width;
  const capC = c.measureText('H').actualBoundingBoxAscent;
  const mk = (opsz) => {
    const s = document.createElement('span');
    s.style.cssText = `font: 560 300px ${fam}; font-variation-settings: 'opsz' ${opsz}; white-space:nowrap; position:absolute; letter-spacing:0`;
    s.textContent = 'Emir Şeren';
    document.body.appendChild(s);
    const w = s.offsetWidth; s.remove(); return w;
  };
  return { cw, capC, dom96: mk(96), dom14: mk(14), dom12: mk(12) };
});
console.log(r);
await browser.close();
