// Smoke test: visits every route, scrolls it, and fails on console errors or
// uncaught exceptions. Screenshots land in ./.smoke/.
//   npm run build && npm start   (in another terminal)
//   node scripts/smoke.mjs [baseUrl] [filter]
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:3000';
const filter = process.argv[3] ?? '';
const shots = process.env.SMOKE_DIR ?? '.smoke';
mkdirSync(shots, { recursive: true });

const src = readFileSync('src/demos/registry.ts', 'utf8');
const routes = ['/', '/lab/physics'];
for (const m of src.matchAll(/slug: '([a-z0-9-]+)', category: '([a-z]+)'/g)) routes.push(`/lab/${m[2]}/${m[1]}`);

const IGNORE_URLS = [/\/rive\/login\.riv$/];
const IGNORE = [/Failed to load resource/, /Download the React DevTools/, /GPU stall due to ReadPixels/, /WebGL: INVALID_OPERATION/, /Automatic fallback to software WebGL/];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({
  viewport: process.env.SMOKE_MOBILE ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  reducedMotion: process.env.SMOKE_REDUCED ? 'reduce' : 'no-preference',
  hasTouch: !!process.env.SMOKE_MOBILE,
});
let failed = 0;
for (const r of routes.filter((r) => r.includes(filter))) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && !IGNORE.some((re) => re.test(m.text())) && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  page.on('response', (res) => res.status() >= 400 && !IGNORE_URLS.some((re) => re.test(res.url())) && errors.push(`HTTP ${res.status()} ${res.url()}`));
  try {
    await page.goto(base + r, { waitUntil: 'load', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {}); // busy WebGL pages may never go fully idle in software GL
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${shots}/${r.replace(/\//g, '_') || 'home'}.png` });
    // scroll through the page to trigger ScrollTriggers / lazy things
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 700) {
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(120);
    }
    await page.mouse.move(700, 450);
    // poke interactive stages (click-to-spawn demos etc.)
    const stage = await page.$('.stage');
    if (stage) {
      await stage.scrollIntoViewIfNeeded();
      const b = await stage.boundingBox();
      if (b) await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    }
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${shots}/${r.replace(/\//g, '_')}_scrolled.png` });
  } catch (e) {
    errors.push('NAV ' + e.message.split('\n')[0]);
  }
  console.log(errors.length ? '✗' : '✓', r, errors.length ? '\n   ' + errors.slice(0, 5).join('\n   ') : '');
  if (errors.length) failed++;
  await page.close();
}
await browser.close();
console.log(failed ? `\n${failed} route(s) with errors` : '\nall routes clean');
process.exit(failed ? 1 : 0);
