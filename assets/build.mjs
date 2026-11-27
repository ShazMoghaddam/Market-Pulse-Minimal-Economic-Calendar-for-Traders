/**
 * Build the README banner, the GitHub social preview and the README screenshots.
 *
 * Usage (from the repo root):
 *
 *     npm install
 *     npm run build:assets
 *
 * Writes:
 *   assets/banner.png          2560 x 800, shown at the top of the README
 *   assets/social-preview.png  1280 x 640, upload it in Settings > Social preview
 *   assets/screenshots/*.webp  dark, light and phone views of the live page
 *
 * Every picture is taken from index.html itself. The clock is fixed at midday on
 * a weekday so the sample week always shows a mix of released and upcoming events.
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, devices } from 'playwright';
import { serve, ROOT } from '../scripts/serve.mjs';

const OUT = join(ROOT, 'assets');
const CLOCK = new Date('2026-12-02T12:20:00Z');      // a Wednesday lunchtime
const FONT = `Inter, -apple-system, "Segoe UI", system-ui, sans-serif`;

async function toWebp(page, png) {
  const b64 = await page.evaluate(async src => {
    const img = new Image();
    img.src = `data:image/png;base64,${src}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/webp', 0.9).split(',')[1];
  }, png.toString('base64'));
  return Buffer.from(b64, 'base64');
}

async function main() {
  const { server, base } = await serve();
  const browser = await chromium.launch();
  await mkdir(join(OUT, 'screenshots'), { recursive: true });
  const icon = (await readFile(join(ROOT, 'icon_512.svg'))).toString('base64');

  async function app({ theme = 'dark', device, viewport = { width: 1280, height: 900 }, scale = 2 }) {
    const ctx = await browser.newContext(device
      ? { ...device, colorScheme: theme, timezoneId: 'Europe/London' }
      : { viewport, deviceScaleFactor: scale, colorScheme: theme, timezoneId: 'Europe/London' });
    const p = await ctx.newPage();
    await p.clock.setFixedTime(CLOCK);
    await p.goto(`${base}/index.html`);
    await p.waitForSelector('#loadingOverlay', { state: 'detached' });
    await p.evaluate(() => scrollTo(0, 0));
    await p.waitForTimeout(400);
    return { p, ctx };
  }

  /* 1. Real UI crops: the next-event panel and today's cards */
  const shot = await app({ viewport: { width: 1100, height: 900 } });
  await shot.p.addStyleTag({ content: '.sample-note{display:none!important}' });
  const hero = (await shot.p.locator('#nextEventPanel').screenshot()).toString('base64');
  const today = shot.p.locator('.date-label.today').locator('xpath=../following-sibling::div[1]');
  const cards = (await today.screenshot()).toString('base64');
  await shot.ctx.close();

  async function render(viewport, scale, html, file) {
    const p = await browser.newPage({ viewport, deviceScaleFactor: scale });
    await p.setContent(html);
    await p.waitForTimeout(200);
    await p.screenshot({ path: join(OUT, file) });
    await p.close();
  }

  const shared = `
    html, body { margin: 0; } body { background: #0F1115; font-family: ${FONT}; color: #E6E9EF; -webkit-font-smoothing: antialiased; overflow: hidden; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .eyebrow { letter-spacing: 3.5px; text-transform: uppercase; color: #4A90E2; font-weight: 700; margin: 0 0 16px; }
    .brand { display: flex; align-items: center; gap: 18px; }
    .brand img { border-radius: 20%; }
    .title { font-weight: 700; letter-spacing: -2px; line-height: .95; margin: 0; }
    .sub { color: #9AA4B2; line-height: 1.45; margin: 18px 0 0; }
    .shot { display: block; width: 100%; border-radius: 14px; box-shadow: 0 24px 60px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.06); }
    .glow { position: absolute; inset: 0; background: radial-gradient(circle at 85% 40%, rgba(74,144,226,.16), transparent 55%), radial-gradient(circle at 10% 100%, rgba(255,92,92,.08), transparent 50%); }
  `;

  /* 2. Banner */
  await render({ width: 1280, height: 400 }, 2, `<!doctype html><html><head><meta charset="utf-8"><style>${shared}
    .banner { position: relative; width: 1280px; height: 400px; box-sizing: border-box; padding: 0 56px 0 64px;
      display: grid; grid-template-columns: 1fr 600px; gap: 40px; align-items: center; }
    .eyebrow { font-size: 13px; } .title { font-size: 72px; } .sub { font-size: 19px; }
    .stack { position: relative; display: grid; gap: 12px; max-height: 330px; overflow: hidden;
      -webkit-mask-image: linear-gradient(#000 70%, transparent); mask-image: linear-gradient(#000 70%, transparent); }
  </style></head><body><div class="glow"></div><div class="banner">
    <div>
      <p class="eyebrow mono">Economic calendar · one HTML file</p>
      <div class="brand"><img src="data:image/svg+xml;base64,${icon}" width="76" height="76" alt=""><h1 class="title">Market<br>Pulse</h1></div>
      <p class="sub">Central bank decisions, CPI, jobs and GDP with live countdowns, in your time zone.</p>
    </div>
    <div class="stack"><img class="shot" src="data:image/png;base64,${hero}" alt=""><img class="shot" src="data:image/png;base64,${cards}" alt=""></div>
  </div></body></html>`, 'banner.png');

  /* 3. Social preview */
  await render({ width: 1280, height: 640 }, 1, `<!doctype html><html><head><meta charset="utf-8"><style>${shared}
    .preview { position: relative; width: 1280px; height: 640px; box-sizing: border-box; padding: 56px 64px; }
    .top { display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; }
    .eyebrow { font-size: 15px; } .title { font-size: 88px; } .sub { font-size: 22px; max-width: 470px; text-align: right; }
    .shots { margin-top: 36px; display: grid; gap: 16px;
      -webkit-mask-image: linear-gradient(#000 55%, transparent 92%); mask-image: linear-gradient(#000 55%, transparent 92%); }
    .foot { font-size: 14px; color: #6B7280; letter-spacing: 1px; text-align: right; margin: 14px 0 0; line-height: 1.6; }
  </style></head><body><div class="glow"></div><div class="preview">
    <div class="top">
      <div>
        <p class="eyebrow mono">Economic calendar for traders</p>
        <div class="brand"><img src="data:image/svg+xml;base64,${icon}" width="88" height="88" alt=""><h1 class="title">Market Pulse</h1></div>
      </div>
      <div>
        <p class="sub">Fed, BoE, ECB, CPI, payrolls and GDP with live countdowns.</p>
        <p class="foot mono">github.com/ShazMoghaddam/market-pulse<br>Shaz Moghaddam · London</p>
      </div>
    </div>
    <div class="shots"><img class="shot" src="data:image/png;base64,${cards}" alt=""></div>
  </div></body></html>`, 'social-preview.png');

  /* 4. README screenshots */
  const shots = [
    { name: 'desktop-dark', theme: 'dark', viewport: { width: 1440, height: 900 }, scale: 1 },
    { name: 'desktop-light', theme: 'light', viewport: { width: 1440, height: 900 }, scale: 1 },
    { name: 'phone-dark', theme: 'dark', device: devices['iPhone 13'] },
  ];
  for (const s of shots) {
    const { p, ctx } = await app(s);
    await writeFile(join(OUT, 'screenshots', `${s.name}.webp`), await toWebp(p, await p.screenshot()));
    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log('wrote assets/banner.png, assets/social-preview.png and assets/screenshots/');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
